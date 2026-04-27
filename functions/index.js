const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

// triggers
const { onUserCreated } = require("./src/triggers/onUserCreated");
const { onVerificationUpload } = require("./src/triggers/onVerificationUpload");

// users
const { updateUserProfile } = require("./src/users/updateUserProfile");

// goals
const { createGoal } = require("./src/goals/createGoal");
const { updateGoalStatus } = require("./src/goals/updateGoalStatus");
const { finishGoal } = require("./src/goals/finishGoal");

// challenges
const { createChallenge } = require("./src/challenges/createChallenge");
const { respondChallengeInvite } = require("./src/challenges/respondChallengeInvite");
const { inviteChallengeMember } = require("./src/challenges/inviteChallengeMember");
const { getMyInvitations } = require("./src/challenges/getMyInvitations");

//wallet
const { createChargeOrder } = require("./src/wallet/createChargeOrder");
const { confirmChargePayment } = require("./src/wallet/confirmChargePayment");
const { getWallet } = require("./src/wallet/getWallet");
const { walletLock } = require("./src/wallet/walletLock");
const { walletUnlock } = require("./src/wallet/walletUnlock");
// const { walletDistribute } = require("./src/wallet/walletDistribute");

// verifications
const { createVerification } = require("./src/verifications/createVerification");

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
exports.createChallenge = createChallenge;
exports.respondChallengeInvite = respondChallengeInvite;
exports.inviteChallengeMember = inviteChallengeMember;
exports.getMyInvitations = getMyInvitations;
exports.createVerification = createVerification;
exports.onVerificationUpload = onVerificationUpload;

// exports.walletDistribute = walletDistribute;
