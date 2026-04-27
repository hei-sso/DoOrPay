const admin = require("firebase-admin");

async function getUidFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (err) {
    const error = new Error("Invalid token");
    error.statusCode = 401;
    throw error;
  }
}

module.exports = { getUidFromRequest };

// async function getUidFromRequest(req) {
//   return req.headers["x-test-uid"] || "x-test-uid";
// }

module.exports = { getUidFromRequest };