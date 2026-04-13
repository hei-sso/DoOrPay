const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

// triggers
const { onUserCreated } = require("./src/triggers/onUserCreated");

// users
const { updateUserProfile } = require("./src/users/updateUserProfile");

// goals
const { createGoal } = require("./src/goals/createGoal");
const { updateGoalStatus } = require("./src/goals/updateGoalStatus");
const { finishGoal } = require("./src/goals/finishGoal");

//wallet
const { createChargeOrder } = require("./src/wallet/createChargeOrder");
const { confirmChargePayment } = require("./src/wallet/confirmChargePayment");
const { getWallet } = require("./src/wallet/getWallet");
const { walletLock } = require("./src/wallet/walletLock");
const { walletUnlock } = require("./src/wallet/walletUnlock");
// const { walletDistribute } = require("./src/wallet/walletDistribute");

// health check
exports.checkHealth = functions.https.onRequest((req, res) => {
  res.status(200).send("OK");
});

// exports
exports.onUserCreated = onUserCreated;
exports.updateUserProfile = updateUserProfile;
exports.finishGoal = finishGoal;
exports.createGoal = createGoal;
exports.createChargeOrder = createChargeOrder;
exports.confirmChargePayment = confirmChargePayment;
exports.getWallet = getWallet;
exports.walletLock = walletLock;
exports.walletUnlock = walletUnlock;
exports.updateGoalStatus = updateGoalStatus;
// exports.walletDistribute = walletDistribute;