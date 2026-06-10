// src/verifications/createVerification.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createVerification = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);

      // 프론트엔드가 보내는 파라미터
      // type은 "goal" 또는 "group"으로 받음
      const { targetId, type, imageUrl } = req.body;

      if (!targetId || !imageUrl) {
        return res.status(400).json({
          error: "targetId and imageUrl are required",
        });
      }

      let resolvedType = type;

      // 프론트 기준에 맞춰 goal / group만 허용
      if (resolvedType && !["goal", "group"].includes(resolvedType)) {
        return res.status(400).json({
          error: "type must be goal or group",
        });
      }

      // type이 안 넘어왔을 경우 DB에서 자동 판별
      if (!resolvedType) {
        const goalDoc = await db.collection("goals").doc(targetId).get();

        if (goalDoc.exists && goalDoc.data().type === "goal") {
          resolvedType = "goal";
        } else {
          const challengeDoc = await db.collection("challenges").doc(targetId).get();

          if (challengeDoc.exists && challengeDoc.data().type === "group") {
            resolvedType = "group";
          } else {
            return res.status(403).json({
              error: "Invalid targetId or not a valid type",
            });
          }
        }
      }

      // Firebase Storage URL에서 storagePath 추출
      let storagePath = null;

      if (imageUrl && imageUrl.includes("/o/")) {
        const encodedPath = imageUrl.split("/o/")[1].split("?")[0];
        storagePath = decodeURIComponent(encodedPath);
      }

      if (!storagePath) {
        return res.status(400).json({
          error: "Invalid image URL format",
        });
      }

      const verificationRef = db.collection("verifications").doc();

      await verificationRef.set({
        id: verificationRef.id,
        userId: uid,
        targetId,
        targetType: resolvedType,
        imageUrl,
        storagePath,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Verification created successfully",
        verificationId: verificationRef.id,
        targetType: resolvedType,
        status: "pending",
      });
    } catch (error) {
      console.error("createVerification error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });