const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");
const { confirmTossPayment } = require("../payments/tossClient");

const db = admin.firestore();

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "*";

  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.confirmChargePayment = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method Not Allowed",
      });
    }

    let txRef = null;

    try {
      const uid = await getUidFromRequest(req);

      const { paymentKey, orderId, amount } = req.body;
      const parsedAmount = Number(amount);

      if (
        !paymentKey ||
        !orderId ||
        !Number.isInteger(parsedAmount) ||
        parsedAmount <= 0
      ) {
        return res.status(400).json({
          error: "Missing or invalid payment data",
        });
      }

      const txSnapshot = await db
        .collection("transactions")
        .where("orderId", "==", orderId)
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (txSnapshot.empty) {
        return res.status(404).json({
          error: "Transaction not found",
        });
      }

      const txDoc = txSnapshot.docs[0];
      txRef = db.collection("transactions").doc(txDoc.id);

      const txDataBefore = txDoc.data();

      if (txDataBefore.status === "approved") {
        return res.status(200).json({
          message: "Payment already confirmed",
          txId: txDoc.id,
          orderId,
          amount: txDataBefore.amount,
          alreadyProcessed: true,
        });
      }

      if (txDataBefore.status === "rejected") {
        return res.status(409).json({
          error: "Transaction is already rejected",
          rejectReason: txDataBefore.rejectReason || null,
        });
      }

      if (txDataBefore.status === "processing") {
        return res.status(409).json({
          error: "Transaction is already processing",
        });
      }

      if (txDataBefore.status !== "pending") {
        return res.status(409).json({
          error: "Transaction is not pending",
          currentStatus: txDataBefore.status || null,
        });
      }

      if (Number(txDataBefore.amount) !== parsedAmount) {
        await txRef.update({
          status: "rejected",
          rejectedAt: new Date(),
          rejectReason: "Amount mismatch",
          paymentKey,
          tossError: null,
        });

        return res.status(400).json({
          error: "Amount mismatch",
        });
      }

      await txRef.update({
        status: "processing",
        processingAt: new Date(),
        paymentKey,
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
        const latestTxDoc = await transaction.get(txRef);

        if (!userDoc.exists) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }

        if (!latestTxDoc.exists) {
          const error = new Error("Transaction not found");
          error.statusCode = 404;
          throw error;
        }

        const latestTxData = latestTxDoc.data();

        if (latestTxData.status === "approved") {
          return;
        }

        if (latestTxData.status !== "processing") {
          const error = new Error("Transaction is not processing");
          error.statusCode = 409;
          throw error;
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {
          balance: 0,
          locked: 0,
        };

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
          tossError: null,
          toss: {
            paymentKey,
            orderId,
            method: tossResult.method || null,
            orderName: tossResult.orderName || null,
            totalAmount: tossResult.totalAmount || parsedAmount,
            approvedAt: tossResult.approvedAt || null,
          },
        });
      });

      return res.status(200).json({
        message: "Payment confirmed and wallet charged",
        txId: txDoc.id,
        orderId,
        amount: parsedAmount,
        alreadyProcessed: false,
      });
    } catch (error) {
      console.error("confirmChargePayment error:", error);

      if (txRef) {
        try {
          const latestTxDoc = await txRef.get();

          if (latestTxDoc.exists) {
            const latestTxData = latestTxDoc.data();

            if (
              latestTxData.status === "pending" ||
              latestTxData.status === "processing"
            ) {
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