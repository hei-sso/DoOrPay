async function verifyImage({
  imageUrl,
  verificationId,
  userId,
  targetId,
  targetType,
}) {
  console.log("[verifyImage] placeholder run:", {
    imageUrl,
    verificationId,
    userId,
    targetId,
    targetType,
  });

  return {
    passed: true,
    aiScore: 0.95,
    reason: null,
  };
}

module.exports = { verifyImage };