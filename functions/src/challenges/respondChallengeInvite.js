const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.respondChallengeInvite = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { invitationId, action } = req.body;

      if (!invitationId || !action) {
        return res.status(400).json({
          error: "invitationId and action are required",
        });
      }

      if (!["accepted", "rejected"].includes(action)) {
        return res.status(400).json({
          error: "action must be accepted or rejected",
        });
      }

      const invitationRef = db.collection("invitations").doc(invitationId);

      await db.runTransaction(async (transaction) => {
        const invitationDoc = await transaction.get(invitationRef);

        if (!invitationDoc.exists) {
          const error = new Error("Invitation not found");
          error.statusCode = 404;
          throw error;
        }

        const invitationData = invitationDoc.data();

        if (invitationData.toUid !== uid) {
          const error = new Error("Forbidden");
          error.statusCode = 403;
          throw error;
        }

        if (invitationData.status !== "pending") {
          const error = new Error("Invitation already processed");
          error.statusCode = 409;
          throw error;
        }

        if (action === "rejected") {
          transaction.update(invitationRef, {
            status: "rejected",
            respondedAt: new Date(),
          });
          return;
        }

        const challengeRef = db.collection("challenges").doc(invitationData.challengeId);
        const userRef = db.collection("users").doc(uid);
        const lockTxRef = db.collection("transactions").doc();

        const [challengeDoc, userDoc] = await Promise.all([
          transaction.get(challengeRef),
          transaction.get(userRef),
        ]);

        if (!challengeDoc.exists) {
          const error = new Error("Challenge not found");
          error.statusCode = 404;
          throw error;
        }

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        const challengeData = challengeDoc.data();
        const userData = userDoc.data();

        if (challengeData.status !== "RECRUITING") {
          const error = new Error("Challenge is not accepting members");
          error.statusCode = 400;
          throw error;
        }

        const participants = Array.isArray(challengeData.participants)
          ? challengeData.participants
          : [];

        const alreadyParticipant = participants.some(
          (participant) => participant.userId === uid
        );

        if (alreadyParticipant) {
          const error = new Error("User is already participating");
          error.statusCode = 409;
          throw error;
        }

        const stakePerUser = Number(challengeData.stakePerUser || 0);
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        if (!Number.isInteger(stakePerUser) || stakePerUser <= 0) {
          const error = new Error("Invalid challenge stake amount");
          error.statusCode = 400;
          throw error;
        }

        if (wallet.balance < stakePerUser) {
          const error = new Error("Insufficient balance");
          error.statusCode = 400;
          throw error;
        }

        const updatedParticipants = [
          ...participants,
          {
            userId: uid,
            joinedAt: new Date(),
            status: "ACTIVE",
          },
        ];

        transaction.update(userRef, {
          wallet: {
            balance: Number(wallet.balance || 0) - stakePerUser,
            locked: Number(wallet.locked || 0) + stakePerUser,
          },
          updatedAt: new Date(),
        });

        transaction.set(lockTxRef, {
          txId: lockTxRef.id,
          userId: uid,
          challengeId: challengeRef.id,
          amount: stakePerUser,
          type: "challenge_lock",
          status: "done",
          description: "그룹 챌린지 초대 수락 시 참가비 잠금",
          createdAt: new Date(),
        });

        transaction.update(challengeRef, {
          participants: updatedParticipants,
          updatedAt: new Date(),
        });

        transaction.update(invitationRef, {
          status: "accepted",
          respondedAt: new Date(),
        });
      });

      return res.status(200).json({
        message: `Invitation ${action} successfully`,
        invitationId,
        action,
      });
    } catch (error) {
      console.error("respondChallengeInvite error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });