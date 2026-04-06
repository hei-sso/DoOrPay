const admin = require("firebase-admin");

async function getUidFromRequest(req) {
    const testMode = true;
    if (testMode) {
    return "v7HuyWuyEGnSHbmUDQFKVRSL3FFX";
  }
   
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);

  return decodedToken.uid;
}

module.exports = { getUidFromRequest };