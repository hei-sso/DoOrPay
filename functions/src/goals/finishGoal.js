const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.finishGoal = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { goalId, result } = req.body;

      if (!goalId || !result) {
        return res.status(400).json({
          error: "goalId and result are required",
        });
      }

      if (!["success", "fail"].includes(result)) {
        return res.status(400).json({
          error: "Invalid result value",
        });
      }

      const goalRef = db.collection("goals").doc(goalId);
      const userRef = db.collection("users").doc(uid);

      await db.runTransaction(async (transaction) => {
        const goalDoc = await transaction.get(goalRef);
        const userDoc = await transaction.get(userRef);

        if (!goalDoc.exists) {
          const error = new Error("Goal not found");
          error.statusCode = 404;
          throw error;
        }

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        const goalData = goalDoc.data();
        const userData = userDoc.data();


        if (goalData.userId !== uid) {
          const error = new Error("Forbidden");
          error.statusCode = 403;
          throw error;
        }

        if (goalData.status !== "ongoing") {
          const error = new Error("Goal is not finishable");
          error.statusCode = 400;
          throw error;
        }

        const stakeAmount = Number(goalData.stakeAmount || 0);
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        if (Number(wallet.locked || 0) < stakeAmount) {
          const error = new Error("Insufficient locked balance");
          error.statusCode = 400;
          throw error;
        }

        if (result === "success") {
          transaction.update(userRef, {
            wallet: {
              balance: Number(wallet.balance || 0) + stakeAmount,
              locked: Number(wallet.locked || 0) - stakeAmount,
            },
            updatedAt: new Date(),
          });

          const unlockTxRef = db.collection("transactions").doc();
          transaction.set(unlockTxRef, {
            txId: unlockTxRef.id,
            userId: uid,
            amount: stakeAmount,
            type: "reward",
            status: "approved",
            referenceId: goalId,
            goalId,
            description: "목표 성공 포인트 반환",
            createdAt: new Date(),
          });
        }

        if (result === "fail") {
          transaction.update(userRef, {
            wallet: {
              balance: Number(wallet.balance || 0),
              locked: Number(wallet.locked || 0) - stakeAmount,
            },
            updatedAt: new Date(),
          });

          const penaltyTxRef = db.collection("transactions").doc();
          transaction.set(penaltyTxRef, {
            txId: penaltyTxRef.id,
            userId: uid,
            amount: stakeAmount,
            type: "stake",
            status: "approved",
            referenceId: goalId,
            goalId,
            description: "목표 실패 예치금 차감",
            createdAt: new Date(),
          });
        }

        transaction.update(goalRef, {
          status: result,
          finishedAt: new Date(),
          updatedAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Goal finished successfully",
        goalId,
        result,
      });
    } catch (error) {
      console.error("finishGoal error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });