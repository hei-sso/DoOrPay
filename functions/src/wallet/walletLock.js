const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.walletLock = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      console.log("[walletLock] method:", req.method);
      console.log("[walletLock] query:", req.query);
      console.log("[walletLock] body:", req.body);

      const uid = await getUidFromRequest(req);
      console.log("[walletLock] resolved uid:", uid);

      const {
        amount,
        goalId = null,
        challengeId = null,
        description = "포인트 잠금",
      } = req.body;

      const parsedAmount = Number(amount);
      console.log("[walletLock] parsedAmount:", parsedAmount);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const userRef = db.collection("users").doc(uid);
      const txRef = db.collection("transactions").doc();

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        console.log("[walletLock] userDoc.exists:", userDoc.exists);

        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        console.log("[walletLock] current wallet:", wallet);

        if (wallet.balance < parsedAmount) {
          const error = new Error("Insufficient balance");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(userRef, {
          wallet: {
            balance: wallet.balance - parsedAmount,
            locked: wallet.locked + parsedAmount,
          },
          updatedAt: new Date(),
        });

        transaction.set(txRef, {
          txId: txRef.id,
          userId: uid,
          amount: parsedAmount,
          type: "stake",
          status: "approved",
          referenceId: goalId || challengeId || null,
          goalId,
          challengeId,
          description,
          createdAt: new Date(),
        });
      });

      return res.status(200).json({
        message: "Points locked successfully",
        amount: parsedAmount,
      });
    } catch (error) {
      console.error("walletLock error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });