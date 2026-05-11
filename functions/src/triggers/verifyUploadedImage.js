/**
 * verifyUploadedImage.js
 * functions/src/triggers/verifyUploadedImage.js
 *
 * Firebase Storage에 이미지가 업로드되면 자동으로 검증 파이프라인 실행
 *
 * 트리거 경로: challenges/{challengeId}/{fileName}
 *
 * 또는 HTTP로 수동 호출도 가능 (하단 exports.verifyImageHttp 참고)
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { runVerificationPipeline } = require("../utils/imageVerificationPipeline");

const db = admin.firestore();

// Storage 트리거 (자동)
// 이미지 업로드되면 자동으로 검증 시작
exports.verifyUploadedImage = functions
  .region("asia-northeast3")
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name; // 예: "challenges/abc123/photo.jpg"

    // challenges/ 경로만 처리
    if (!filePath || !filePath.startsWith("challenges/")) return;

    // 파일 경로에서 challengeId 추출
    const parts = filePath.split("/");
    if (parts.length < 3) return;
    const challengeId = parts[1];

    console.log(`[verifyUploadedImage] 트리거 challengeId=${challengeId}`);

    // Firestore verification 문서 생성
    const verificationRef = db.collection("verifications").doc();
    await verificationRef.set({
      id: verificationRef.id,
      challengeId,
      filePath,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const docId = verificationRef.id;
    const bucket = object.bucket;
    const imageUri = `gs://${bucket}/${filePath}`;

    // 파이프라인 실행
    await runVerificationPipeline({ docId, filePath, imageUri });
  });

// ─────────────────────────────────────────────
// 방법 B: HTTP 트리거 (수동 호출 / 테스트용)
// POST /verifyImageHttp
// body: { challengeId, filePath }
// ─────────────────────────────────────────────
exports.verifyImageHttp = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const { challengeId, filePath } = req.body;

    if (!challengeId || !filePath) {
      return res.status(400).json({ error: "challengeId and filePath required" });
    }

    // verification 문서 생성
    const verificationRef = db.collection("verifications").doc();
    await verificationRef.set({
      id: verificationRef.id,
      challengeId,
      filePath,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const bucket = process.env.STORAGE_BUCKET;
    const imageUri = `gs://${bucket}/${filePath}`;

    try {
      const verdict = await runVerificationPipeline({
        docId: verificationRef.id,
        filePath,
        imageUri,
      });

      return res.status(200).json({
        verificationId: verificationRef.id,
        verdict: verdict.status,
        reason: verdict.reason,
      });
    } catch (err) {
      console.error("[verifyImageHttp] error:", err);
      return res.status(500).json({ error: err.message });
    }
  });