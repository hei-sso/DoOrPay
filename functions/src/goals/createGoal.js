const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const db = getFirestore();

exports.createGoal = functions
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

      const { title, description, stakeAmount, startDate, endDate } = req.body;

      if (!title || !stakeAmount || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const goalRef = db.collection("goals").doc();

      await goalRef.set({
        goalId: goalRef.id,
        userId: uid,
        title,
        description: description || "",
        stakeAmount,
        status: "active",
        startDate,
        endDate,
        createdAt: Timestamp.now(),
      });

      return res.status(200).json({ message: "Goal created" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });