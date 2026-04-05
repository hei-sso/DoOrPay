const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// 초기화 안전장치
if (!admin.apps.length) {
  admin.initializeApp();
}

const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const db = getFirestore();

exports.updateUserProfile = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const { nickname, phone, birth } = req.body;

      await db.collection("users").doc(uid).set({
        nickname: nickname || "",
        phone: phone || "",
        birth: birth || "",
        updatedAt: Timestamp.now(),
      }, { merge: true });

      return res.status(200).json({ message: "Profile updated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });