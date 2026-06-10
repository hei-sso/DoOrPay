const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createChallenge = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);

      const {
        title,
        description,
        stakeAmount,
        startDate,
        endDate,
        emoji,
      } = req.body;

      const parsedStakeAmount = Number(stakeAmount);

      if (!title || !Number.isInteger(parsedStakeAmount) || parsedStakeAmount <= 0) {
        return res.status(400).json({
          error: "title and valid stakeAmount are required",
        });
      }

      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if (startDate && Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ error: "Invalid startDate" });
      }

      if (endDate && Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ error: "Invalid endDate" });
      }

      if (parsedStartDate && parsedEndDate && parsedStartDate >= parsedEndDate) {
        return res.status(400).json({ error: "Invalid date range" });
      }

      const userRef = db.collection("users").doc(uid);
      const challengeRef = db.collection("challenges").doc();
      const memberRef = challengeRef.collection("members").doc(uid);
      const txRef = db.collection("transactions").doc();

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };
        const nickname = userData.nickname || "";

        if (Number(wallet.balance || 0) < parsedStakeAmount) {
          const error = new Error("Insufficient balance");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(userRef, {
          wallet: {
            balance: Number(wallet.balance || 0) - parsedStakeAmount,
            locked: Number(wallet.locked || 0) + parsedStakeAmount,
          },
          updatedAt: new Date(),
        });

        transaction.set(challengeRef, {
          challengeId: challengeRef.id,
          title: title.trim(),
          description: description ? description.trim() : "",
          creatorId: uid,
          status: "recruiting",
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          totalStake: parsedStakeAmount,
          stakeAmount: parsedStakeAmount,
          memberIds: [uid],
          emoji: emoji || "🔥",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        transaction.set(memberRef, {
          nickname,
          role: "leader",
          status: "joined",
          stakeAmount: parsedStakeAmount,
          failCount: 0,
          stakedAt: new Date(),
          joinedAt: new Date(),
        });

        transaction.set(txRef, {
          txId: txRef.id,
          userId: uid,
          type: "stake",
          amount: parsedStakeAmount,
          status: "approved",
          referenceId: challengeRef.id,
          challengeId: challengeRef.id,
          description: "그룹 챌린지 생성 시 참가비 예치",
          createdAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Challenge created successfully",
        challengeId: challengeRef.id,
        stakeAmount: parsedStakeAmount,
      });
    } catch (error) {
      console.error("createChallenge error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });
