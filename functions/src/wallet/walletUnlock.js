const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.walletUnlock = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { amount, goalId = null, challengeId = null, description = "포인트 반환" } = req.body;

      const parsedAmount = Number(amount);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const userRef = db.collection("users").doc(uid);
      const txRef = db.collection("transactions").doc();

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        if (wallet.locked < parsedAmount) {
          const error = new Error("Insufficient locked balance");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(userRef, {
          wallet: {
            balance: wallet.balance + parsedAmount,
            locked: wallet.locked - parsedAmount,
          },
          updatedAt: new Date(),
        });

        transaction.set(txRef, {
          txId: txRef.id,
          userId: uid,
          amount: parsedAmount,
          type: "unlock",
          status: "done",
          goalId,
          challengeId,
          description,
          createdAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Points unlocked successfully",
        amount: parsedAmount,
      });
    } catch (error) {
      console.error("walletUnlock error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });