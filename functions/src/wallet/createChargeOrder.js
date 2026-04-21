const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createChargeOrder = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { amount } = req.body;

      const parsedAmount = Number(amount);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const orderId = `charge_${uid.slice(0, 6)}_${Date.now()}`;
      const txRef = db.collection("transactions").doc();

      await txRef.set({
        txId: txRef.id,
        userId: uid,
        amount: parsedAmount,
        type: "deposit_request",
        status: "pending",
        provider: "toss",
        orderId,
        paymentKey: null,
        description: "포인트 충전 요청",
        createdAt: new Date(),
        processingAt: null,
        approvedAt: null,
        rejectedAt: null,
        rejectReason: null,
        tossError: null,
      });

      return res.status(200).json({
        message: "Charge order created",
        txId: txRef.id,
        orderId,
        amount: parsedAmount,
        orderName: `포인트 충전 ${parsedAmount}원`,
      });
    } catch (error) {
      console.error("createChargeOrder error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });