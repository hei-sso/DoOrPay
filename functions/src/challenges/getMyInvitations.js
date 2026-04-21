const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.getMyInvitations = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);

      const snapshot = await db
        .collection("invitations")
        .where("toUid", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      const invitations = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          invitationId: doc.id,
          challengeId: data.challengeId || null,
          challengeTitle: data.challengeTitle || "",
          fromUid: data.fromUid || "",
          fromNickname: data.fromNickname || "",
          toUid: data.toUid || "",
          status: data.status || "pending",
          type: data.type || "challenge",
          createdAt: data.createdAt || null,
          respondedAt: data.respondedAt || null,
        };
      });

      return res.status(200).json({
        invitations,
      });
    } catch (error) {
      console.error("getMyInvitations error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });