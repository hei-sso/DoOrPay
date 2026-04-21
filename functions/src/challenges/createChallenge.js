const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createChallenge = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { title, description, stakeAmount, startDate, endDate } = req.body;

      const parsedStakeAmount = Number(stakeAmount);

      if (!title || !Number.isInteger(parsedStakeAmount) || parsedStakeAmount <= 0) {
        return res.status(400).json({
          error: "title and valid stakeAmount are required",
        });
      }

      let parsedStartDate = null;
      let parsedEndDate = null;

      if (startDate) {
        parsedStartDate = new Date(startDate);
        if (Number.isNaN(parsedStartDate.getTime())) {
          return res.status(400).json({ error: "Invalid startDate" });
        }
      }

      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({ error: "Invalid endDate" });
        }
      }

      if (parsedStartDate && parsedEndDate && parsedStartDate >= parsedEndDate) {
        return res.status(400).json({ error: "Invalid date range" });
      }

      const userRef = db.collection("users").doc(uid);
      const challengeRef = db.collection("challenges").doc();
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

        if (wallet.balance < parsedStakeAmount) {
          const error = new Error("Insufficient balance");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(userRef, {
          wallet: {
            balance: wallet.balance - parsedStakeAmount,
            locked: (wallet.locked || 0) + parsedStakeAmount,
          },
          updatedAt: new Date(),
        });

        transaction.set(challengeRef, {
          id: challengeRef.id,
          title: title.trim(),
          description: description ? description.trim() : "",
          creatorId: uid,
          stakePerUser: parsedStakeAmount,
          participants: [
            {
              userId: uid,
              joinedAt: new Date(),
              status: "ACTIVE",
            },
          ],
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          status: "RECRUITING",
          createdAt: new Date(),
        });

        transaction.set(txRef, {
          txId: txRef.id,
          userId: uid,
          challengeId: challengeRef.id,
          amount: parsedStakeAmount,
          type: "challenge_lock",
          status: "done",
          description: "그룹 챌린지 생성 시 참가비 잠금",
          createdAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Challenge created successfully",
        challengeId: challengeRef.id,
        stakePerUser: parsedStakeAmount,
      });
    } catch (error) {
      console.error("createChallenge error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });