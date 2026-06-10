const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createGoal = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);

      const {
        title,
        stakeAmount,
        startDate,
        endDate,
        emoji,
      } = req.body;

      const parsedStakeAmount = Number(stakeAmount);
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (
        !title ||
        !Number.isInteger(parsedStakeAmount) ||
        parsedStakeAmount <= 0 ||
        !startDate ||
        !endDate
      ) {
        return res.status(400).json({
          error: "Missing or invalid required fields",
        });
      }

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      if (start >= end) {
        return res.status(400).json({ error: "Invalid date range" });
      }

      const goalRef = db.collection("goals").doc();
      const userRef = db.collection("users").doc(uid);
      const lockTxRef = db.collection("transactions").doc();

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };

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

        transaction.set(goalRef, {
          goalId: goalRef.id,
          userId: uid,
          userNickname: userData.nickname || "",
          title: title.trim(),
          stakeAmount: parsedStakeAmount,
          startDate: start,
          endDate: end,
          status: "ongoing",
          failCount: 0,
          emoji: emoji || "💧",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        transaction.set(lockTxRef, {
          txId: lockTxRef.id,
          userId: uid,
          goalId: goalRef.id,
          amount: parsedStakeAmount,
          type: "stake",
          status: "approved",
          referenceId: goalRef.id,
          description: "목표 생성 시 참가비 예치",
          createdAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Goal created and stake locked",
        goalId: goalRef.id,
        type: "goal",
        stakeAmount: parsedStakeAmount,
      });
    } catch (error) {
      console.error("createGoal error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });