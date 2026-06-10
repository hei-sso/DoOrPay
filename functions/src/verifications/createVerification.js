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

      // 1. 프론트엔드가 보내는 파라미터 (targetId, type, imageUrl)
      // 프론트는 targetType이 아니라 'type'이라는 이름으로 보냅니다.
      const { targetId, type, imageUrl } = req.body;

      if (!targetId || !imageUrl) {
        return res.status(400).json({
          error: "targetId and imageUrl are required",
        });
      }

      // 프론트가 group으로 보내도 백엔드는 challenge로 정규화해서 처리
      let resolvedType = type;
      if (resolvedType === "group") {
        resolvedType = "challenge";
      }

      if (resolvedType && !["goal", "challenge"].includes(resolvedType)) {
        return res.status(400).json({
          error: "type must be goal, group, or challenge",
        });
      }

      // type이 안 넘어왔을 경우 DB를 뒤져서 찾는 기존 방어 로직 (유지)
      if (!resolvedType) {
        const goalDoc = await db.collection("goals").doc(targetId).get();

        if (goalDoc.exists) {
          resolvedType = "goal";
        } else {
          const challengeDoc = await db.collection("challenges").doc(targetId).get();

          if (challengeDoc.exists) {
            resolvedType = "challenge";
          } else {
            return res.status(403).json({
              error: "Invalid targetId or not a valid type",
            });
          }
        }
      }

      // 2. [핵심] 프론트엔드가 준 다운로드 링크(imageUrl)에서 진짜 파일 경로(storagePath) 추출하기
      // Firebase Storage URL 규칙을 이용해 '/o/' 뒤에 있는 경로를 뽑아냅니다.
      let storagePath = null;
      if (imageUrl && imageUrl.includes("/o/")) {
        const encodedPath = imageUrl.split("/o/")[1].split("?")[0];
        storagePath = decodeURIComponent(encodedPath); 
        // 결과 예시: "verifications/uid/targetId/12345.jpg"
      }

      if (!storagePath) {
        return res.status(400).json({ error: "Invalid image URL format" });
      }

      // 3. 문서 생성 및 저장
      const verificationRef = db.collection("verifications").doc();

      await verificationRef.set({
        id: verificationRef.id,
        userId: uid,
        targetId,
        type: resolvedType,
        targetType: resolvedType,
        imageUrl: imageUrl,       // 프론트가 준 다운로드 링크
        storagePath: storagePath, // AI가 파일을 찾을 수 있는 진짜 스토리지 경로!
        status: "pending",        // 이 상태로 저장되면 새로운 트리거가 감지하고 AI를 돌립니다.
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Verification created successfully",
        verificationId: verificationRef.id,
        type: resolvedType,
        status: "pending",
      });
    } catch (error) {
      console.error("createVerification error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });