const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");
const { confirmTossPayment } = require("../payments/tossClient");

const db = admin.firestore();

exports.confirmChargePayment = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    let txDoc = null;

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

      txDoc = txSnapshot.docs[0];
      const txRef = db.collection("transactions").doc(txDoc.id);

      await db.runTransaction(async (transaction) => {
        const txDocInside = await transaction.get(txRef);

        if (!txDocInside.exists) {
          const error = new Error("Transaction not found");
          error.statusCode = 404;
          throw error;
        }

        const txData = txDocInside.data();

        if (txData.status === "processing") {
          const error = new Error("Transaction is already processing");
          error.statusCode = 409;
          throw error;
        }

        if (txData.status !== "pending") {
          const error = new Error("Transaction is not pending");
          error.statusCode = 409;
          throw error;
        }

        if (txData.amount !== parsedAmount) {
          transaction.update(txRef, {
            status: "rejected",
            rejectedAt: new Date(),
            rejectReason: "Amount mismatch",
            paymentKey: paymentKey || null,
            tossError: null,
          });

          const error = new Error("Amount mismatch");
          error.statusCode = 400;
          throw error;
        }

        transaction.update(txRef, {
          status: "processing",
          processingAt: new Date(),
          paymentKey: paymentKey || null,
        });
      });

      let tossResult;
      try {
        tossResult = await confirmTossPayment({
          paymentKey,
          orderId,
          amount: parsedAmount,
        });
      } catch (error) {
        await txRef.update({
          status: "rejected",
          rejectedAt: new Date(),
          rejectReason: error.message || "Toss confirm failed",
          tossError: error.details || null,
        });

        return res.status(error.statusCode || 500).json({
          error: error.message || "Toss confirm failed",
          details: error.details || null,
        });
      }

      const userRef = db.collection("users").doc(uid);

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const txDocInside = await transaction.get(txRef);

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        if (!txDocInside.exists) {
          const error = new Error("Transaction not found");
          error.statusCode = 404;
          throw error;
        }

        const latestTxData = txDocInside.data();

        if (latestTxData.status !== "processing") {
          const error = new Error("Transaction is not processing");
          error.statusCode = 409;
          throw error;
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || { balance: 0, locked: 0 };

        transaction.update(userRef, {
          wallet: {
            balance: Number(wallet.balance || 0) + parsedAmount,
            locked: Number(wallet.locked || 0),
          },
          updatedAt: new Date(),
        });

        transaction.update(txRef, {
          type: "deposit",
          status: "approved",
          approvedAt: new Date(),
          rejectedAt: null,
          rejectReason: null,
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

      if (txDoc) {
        try {
          const txRef = db.collection("transactions").doc(txDoc.id);
          const latestTxDoc = await txRef.get();

          if (latestTxDoc.exists) {
            const latestTxData = latestTxDoc.data();

            if (latestTxData.status === "pending" || latestTxData.status === "processing") {
              await txRef.update({
                status: "rejected",
                rejectedAt: new Date(),
                rejectReason: error.message || "Internal Server Error",
              });
            }
          }
        } catch (updateError) {
          console.error("failed to update transaction status:", updateError);
        }
      }

      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
        details: error.details || null,
      });
    }
  });