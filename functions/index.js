const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// triggers
const { onUserCreated } = require("./triggers/onUserCreated");

// users
const { updateUserProfile } = require("./users/updateUserProfile");

// goals
const { createGoal } = require("./goals/createGoal");

// health check
exports.checkHealth = functions.https.onRequest((req, res) => {
  res.status(200).send("OK");
});

// exports
exports.onUserCreated = onUserCreated;
exports.updateUserProfile = updateUserProfile;
exports.createGoal = createGoal;