const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");
const { confirmTossPayment } = require("../payments/tossClient");

const db = admin.firestore();

exports.confirmChargePayment = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { paymentKey, orderId, amount } = req.body;

      const parsedAmount = Number(amount);

      if (!paymentKey || !orderId || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Missing or invalid payment data" });
      }

      const txSnapshot = await db
        .collection("transactions")
        .where("orderId", "==", orderId)
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (txSnapshot.empty) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const txDoc = txSnapshot.docs[0];
      const txData = txDoc.data();

      if (txData.status !== "pending") {
        return res.status(409).json({ error: "Transaction is not pending" });
      }

      if (txData.amount !== parsedAmount) {
        return res.status(400).json({ error: "Amount mismatch" });
      }

      const tossResult = await confirmTossPayment({
        paymentKey,
        orderId,
        amount: parsedAmount,
      });

      const userRef = db.collection("users").doc(uid);
      const txRef = db.collection("transactions").doc(txDoc.id);

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const txDocInside = await transaction.get(txRef);

        if (!userDoc.exists) {
          throw new Error("User not found");
        }

        const latestTxData = txDocInside.data();

        if (latestTxData.status !== "pending") {
          throw new Error("Transaction already processed");
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        transaction.update(userRef, {
          wallet: {
            balance: wallet.balance + parsedAmount,
            locked: wallet.locked || 0,
          },
          updatedAt: new Date(),
        });

        transaction.update(txRef, {
          status: "paid",
          paymentKey,
          approvedAt: new Date(),
          toss: {
            method: tossResult.method || null,
            orderName: tossResult.orderName || null,
            totalAmount: tossResult.totalAmount || parsedAmount,
            approvedAt: tossResult.approvedAt || null,
          },
        });
      });

      return res.status(200).json({
        message: "Payment confirmed and wallet charged",
        amount: parsedAmount,
      });
    } catch (error) {
      console.error("confirmChargePayment error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
        details: error.details || null,
      });
    }
  });