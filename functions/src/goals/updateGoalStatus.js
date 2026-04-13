const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

const ALLOWED_STATUS = ["active", "paused"];

exports.updateGoalStatus = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { goalId, status } = req.body;

      if (!goalId || !status) {
        return res.status(400).json({ error: "goalId and status are required" });
      }

      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const goalRef = db.collection("goals").doc(goalId);
      const goalDoc = await goalRef.get();

      if (!goalDoc.exists) {
        return res.status(404).json({ error: "Goal not found" });
      }

      const goalData = goalDoc.data();

      if (goalData.userId !== uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await goalRef.update({
        status,
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Goal status updated",
        goalId,
        status,
      });
    } catch (error) {
      console.error("updateGoalStatus error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });