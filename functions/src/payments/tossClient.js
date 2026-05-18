const functions = require("firebase-functions/v1");
const { defineString } = require("firebase-functions/params");

const TOSS_SECRET_KEY = defineString("TOSS_SECRET_KEY");

async function confirmTossPayment({ paymentKey, orderId, amount }) {
  const secretKey =
    process.env.TOSS_SECRET_KEY || TOSS_SECRET_KEY.value();

  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is not configured");
  }

  const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Toss payment confirm failed");
    error.details = data;
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

module.exports = { confirmTossPayment };