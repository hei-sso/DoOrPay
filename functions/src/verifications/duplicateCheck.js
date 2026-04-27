const admin = require("firebase-admin");

const db = admin.firestore();

async function checkDuplicateImage({ imageUrl, verificationId, userId }) {
  console.log("[checkDuplicateImage] placeholder run:", {
    imageUrl,
    verificationId,
    userId,
  });

  const fakePHash = `phash_${verificationId}`;

  const snapshot = await db
    .collection("verifications")
    .where("userId", "==", userId)
    .where("status", "==", "approved")
    .limit(20)
    .get();

  const duplicateFound = snapshot.docs.some((doc) => {
    const data = doc.data();

    return (
      data.id !== verificationId &&
      data.pHash &&
      data.pHash === fakePHash
    );
  });

  return {
    passed: !duplicateFound,
    duplicateScore: duplicateFound ? 0.98 : 0.02,
    pHash: fakePHash,
    reason: duplicateFound ? "Duplicate image suspected" : null,
  };
}

module.exports = { checkDuplicateImage };