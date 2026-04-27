const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const { verifyImage } = require("../verifications/imageVerification");
const { checkDuplicateImage } = require("../verifications/duplicateCheck");

const db = admin.firestore();

exports.onVerificationUpload = functions
  .region("asia-northeast3")
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name || "";
    const contentType = object.contentType || "";
    const bucketName = object.bucket;

    if (!filePath.startsWith("verifications/")) {
      return null;
    }

    if (!contentType.startsWith("image/")) {
      console.log("[onVerificationUpload] skipped non-image file:", filePath);
      return null;
    }

    const match = filePath.match(/^verifications\/([^/]+)\/([^/]+)\/(.+)$/);

    if (!match) {
      console.error("[onVerificationUpload] invalid path:", filePath);
      return null;
    }

    const [, uidFromPath, verificationId] = match;
    const verificationRef = db.collection("verifications").doc(verificationId);
    const imageUrl = `gs://${bucketName}/${filePath}`;

    let verificationData;

    try {
      /**
       * 1단계:
       * pending 상태인 문서만 processing으로 변경
       * 중복 트리거 실행 방지
       */
      const canProcess = await db.runTransaction(async (transaction) => {
        const verificationDoc = await transaction.get(verificationRef);

        if (!verificationDoc.exists) {
          console.error(
            "[onVerificationUpload] verification not found:",
            verificationId
          );
          return false;
        }

        const data = verificationDoc.data();

        if (data.userId !== uidFromPath) {
          transaction.update(verificationRef, {
            status: "rejected",
            rejectReason: "Upload path user mismatch",
            rejectedAt: new Date(),
            processedAt: new Date(),
            updatedAt: new Date(),
          });

          return false;
        }

        if (data.status !== "pending") {
          console.log("[onVerificationUpload] skip non-pending verification:", {
            verificationId,
            status: data.status,
          });
          return false;
        }

        transaction.update(verificationRef, {
          imageUrl,
          storagePath: filePath,
          status: "processing",
          updatedAt: new Date(),
        });

        verificationData = data;
        return true;
      });

      if (!canProcess) {
        return null;
      }

      /**
       * 2단계:
       * AI / 중복 검사 실행
       */
      const [imageResult, duplicateResult] = await Promise.all([
        verifyImage({
          imageUrl,
          verificationId,
          userId: verificationData.userId,
          targetId: verificationData.targetId,
          targetType: verificationData.targetType,
        }),
        checkDuplicateImage({
          imageUrl,
          verificationId,
          userId: verificationData.userId,
        }),
      ]);

      const rejectReasons = [];

      if (imageResult?.passed === false) {
        rejectReasons.push(imageResult.reason || "Image verification failed");
      }

      if (duplicateResult?.passed === false) {
        rejectReasons.push(
          duplicateResult.reason || "Duplicate image suspected"
        );
      }

      const isApproved = rejectReasons.length === 0;

      /**
       * 3단계:
       * processing 상태인 문서만 최종 상태로 변경
       * 이미 approved/rejected 된 문서 재처리 방지
       */
      await db.runTransaction(async (transaction) => {
        const latestDoc = await transaction.get(verificationRef);

        if (!latestDoc.exists) {
          throw new Error("Verification not found during final update");
        }

        const latestData = latestDoc.data();

        if (latestData.status !== "processing") {
          console.log("[onVerificationUpload] skip final update:", {
            verificationId,
            currentStatus: latestData.status,
          });
          return;
        }

        transaction.update(verificationRef, {
          status: isApproved ? "approved" : "rejected",
          pHash: duplicateResult?.pHash || null,
          aiScore: Number(imageResult?.aiScore ?? 0),
          duplicateScore: Number(duplicateResult?.duplicateScore ?? 0),
          rejectReason: isApproved ? null : rejectReasons.join(" | "),
          approvedAt: isApproved ? new Date() : null,
          rejectedAt: isApproved ? null : new Date(),
          processedAt: new Date(),
          updatedAt: new Date(),
        });
      });

      console.log("[onVerificationUpload] completed:", {
        verificationId,
        status: isApproved ? "approved" : "rejected",
      });

      return null;
    } catch (error) {
      console.error("[onVerificationUpload] error:", error);

      try {
        await db.runTransaction(async (transaction) => {
          const latestDoc = await transaction.get(verificationRef);

          if (!latestDoc.exists) {
            return;
          }

          const latestData = latestDoc.data();

          if (latestData.status === "approved" || latestData.status === "rejected") {
            return;
          }

          transaction.update(verificationRef, {
            status: "rejected",
            rejectReason: error.message || "Verification processing failed",
            rejectedAt: new Date(),
            processedAt: new Date(),
            updatedAt: new Date(),
          });
        });
      } catch (updateError) {
        console.error(
          "[onVerificationUpload] failed to update error state:",
          updateError
        );
      }

      return null;
    }
  });