const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
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

      if (!["accepted", "declined"].includes(action)) {
        return res.status(400).json({
          error: "action must be accepted or declined",
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

        const challengeRef = db.collection("challenges").doc(invitationData.challengeId);
        const memberRef = challengeRef.collection("members").doc(uid);
        const memberDoc = await transaction.get(memberRef);

        if (action === "declined") {
          transaction.update(invitationRef, {
            status: "declined",
            respondedAt: new Date(),
          });

          if (memberDoc.exists) {
            transaction.set(memberRef, {
              status: "rejected",
              rejectedAt: new Date(),
            }, { merge: true });
          }
          return;
        }

        const userRef = db.collection("users").doc(uid);
        const lockTxRef = db.collection("transactions").doc();

        const challengeDoc = await transaction.get(challengeRef);
        const userDoc = await transaction.get(userRef);

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

        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          if (!["invited", "rejected"].includes(memberData.status)) {
            const error = new Error("User is already participating");
            error.statusCode = 409;
            throw error;
          }
        }

        const challengeData = challengeDoc.data();
        const userData = userDoc.data();

        if (challengeData.status !== "recruiting") {
          const error = new Error("Challenge is not accepting members");
          error.statusCode = 400;
          throw error;
        }

        const stakeAmount = Number(challengeData.stakeAmount || 0);
        const wallet = userData.wallet || { balance: 0, locked: 0 };
        const nickname = userData.nickname || "";

        if (!Number.isInteger(stakeAmount) || stakeAmount <= 0) {
          const error = new Error("Invalid challenge stake amount");
          error.statusCode = 400;
          throw error;
        }

        if (Number(wallet.balance || 0) < stakeAmount) {
          const error = new Error("Insufficient balance");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(userRef, {
          wallet: {
            balance: Number(wallet.balance || 0) - stakeAmount,
            locked: Number(wallet.locked || 0) + stakeAmount,
          },
          updatedAt: new Date(),
        });

        transaction.set(memberRef, {
          nickname,
          role: "member",
          status: "joined",
          stakeAmount,
          failCount: 0,
          stakedAt: new Date(),
          joinedAt: new Date(),
          invitationId,
        }, { merge: true });

        transaction.update(challengeRef, {
          memberIds: FieldValue.arrayUnion(uid),
          totalStake: FieldValue.increment(stakeAmount),
          updatedAt: new Date(),
        });

        transaction.set(lockTxRef, {
          txId: lockTxRef.id,
          userId: uid,
          type: "stake",
          amount: stakeAmount,
          status: "approved",
          referenceId: challengeRef.id,
          challengeId: challengeRef.id,
          description: "그룹 챌린지 초대 수락 시 참가비 예치",
          createdAt: new Date(),
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
