const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

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

      await db.collection("users").doc(uid).update({
        username: nickname || "",
        phone: phone || "",
        birth: birth || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ message: "Profile updated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });