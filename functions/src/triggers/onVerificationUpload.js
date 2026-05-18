// src/triggers/onVerificationUpload.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { runVerificationPipeline } = require("../utils/imageVerificationPipeline");
<<<<<<< HEAD
const { sendVerificationNotification } = require("../utils/fcmService");
const { validateObjectMetadata, isHeicFile, convertHeicToJpeg } = require("../utils/imageValidator");
=======
>>>>>>> 818171d8f34cdef947aaed621b2fad09ebddb085

const db = admin.firestore();

// 이름은 그대로! 작동 방식만 DB 문서 생성 감지(onCreate)로 변경
exports.onVerificationUpload = functions
  .region("asia-northeast3")
  .firestore.document("verifications/{docId}")
  .onCreate(async (snap, context) => {
    const verificationId = context.params.docId;
    const data = snap.data();

    // 1. 방금 생성된 인증 문서가 pending 상태인지 확인
    if (data.status !== "pending") return null;

    const verificationRef = snap.ref;

    try {
      // 2. 프론트엔드가 로딩 화면을 보여줄 수 있도록 processing으로 상태 변경
      await verificationRef.update({
        status: "processing",
        updatedAt: new Date(),
      });

<<<<<<< HEAD
      const bucketName = admin.storage().bucket().name;
      let filePath = data.storagePath;

      // 3. 엣지 케이스 사전 검증 (RAW 차단, 파일 크기, MIME 타입)
      const objectMetadata = {
        contentType: data.contentType || "",
        size: data.fileSize || 0,
        name: filePath,
      };
      const validation = validateObjectMetadata(objectMetadata);
      if (!validation.valid) {
        console.warn(`[onVerificationUpload] 파일 검증 실패: ${validation.reason}`);
        await verificationRef.update({
          status: "rejected",
          rejectReason: validation.reason,
          rejectedAt: new Date(),
          updatedAt: new Date(),
        });
        if (data.userId) {
          await sendVerificationNotification(data.userId, "rejected", [validation.reason]);
        }
        return null;
      }

      // 4. HEIC/HEIF → JPEG 자동 변환
      if (isHeicFile(objectMetadata)) {
        console.log(`[onVerificationUpload] HEIC 감지, JPEG 변환 시작`);
        const { convertedPath } = await convertHeicToJpeg(filePath, bucketName);
        filePath = convertedPath; // 이후 파이프라인은 변환된 파일로 처리
      }

      // 5. gs:// URI 생성 후 AI 파이프라인 가동
      const imageUri = `gs://${bucketName}/${filePath}`;
      const finalVerdict = await runVerificationPipeline({
        docId: verificationId,
        filePath,
        imageUri,
      });

      // 6. AI 결과를 파싱해서 DB에 최종 업데이트
      const finalStatus = (finalVerdict?.status || "REJECTED").toLowerCase();
      const isApproved = finalStatus === "approved";
      const failReasons = finalVerdict?.failReasons ?? [];
      const rejectReason = isApproved ? null : (failReasons[0] || "AI Pipeline rejected");
=======
      // 3. 버킷 이름 가져와서 AI(Vision API)가 읽을 수 있는 gs:// 링크 만들기
      const bucketName = admin.storage().bucket().name;
      const imageUri = `gs://${bucketName}/${data.storagePath}`;

      // 4. AI 파이프라인 엔진 가동!
      const finalVerdict = await runVerificationPipeline({
        docId: verificationId,
        filePath: data.storagePath,
        imageUri: imageUri
      });

      // 5. AI 결과를 파싱해서 DB에 최종 업데이트
      const finalStatus = (finalVerdict?.status || "REJECTED").toLowerCase();
      const isApproved = finalStatus === "approved";
      const rejectReason = isApproved ? null : (finalVerdict?.reason || "AI Pipeline rejected");
>>>>>>> 818171d8f34cdef947aaed621b2fad09ebddb085

      await verificationRef.update({
        status: finalStatus,
        rejectReason: rejectReason,
<<<<<<< HEAD
        failReasons: failReasons,
=======
>>>>>>> 818171d8f34cdef947aaed621b2fad09ebddb085
        aiConfidence: Number(finalVerdict?.confidence ?? 0),
        approvedAt: isApproved ? new Date() : null,
        rejectedAt: isApproved ? null : new Date(),
        processedAt: new Date(),
        updatedAt: new Date(),
      });

<<<<<<< HEAD
      // 7. FCM 푸시 알림 전송
      if (data.userId) {
        await sendVerificationNotification(data.userId, finalStatus, failReasons);
      }

=======
>>>>>>> 818171d8f34cdef947aaed621b2fad09ebddb085
      console.log(`[onVerificationUpload] 인증 완료: ${verificationId} -> ${finalStatus}`);
      return null;

    } catch (error) {
      console.error("[onVerificationUpload] 시스템 에러:", error);

      // 무한 로딩 방지용 에러 처리
      await verificationRef.update({
        status: "rejected",
        rejectReason: "백엔드 시스템 에러: " + error.message,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      });
      return null;
    }
  });