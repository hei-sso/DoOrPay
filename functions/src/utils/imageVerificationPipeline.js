/**
 * imageVerificationPipeline.js
 * functions/src/utils/imageVerificationPipeline.js
 *
 * 전체 AI 파이프라인 오케스트레이터
 *
 *  1단계: pHash 생성          (pHash.js)
 *  2단계: 중복 검사            (hamming distance — 기존 로직 연결)
 *  3단계: 웹 도용 검증         (webDetection.js)
 *  4단계: 최종 판정 + Firestore 저장
 */

const admin = require("firebase-admin");
const { generatePHash, savePHash } = require("./pHash");
const { detectWebTheft } = require("./webDetection");
const { updateVerification } = require("./firestore");

// ─────────────────────────────────────────────
// 최종 판정 기준
// ─────────────────────────────────────────────
function makeFinalVerdict({ webResult }) {
  if (webResult.isStolen) {
    return {
      status: "REJECTED",
      reason: "web_theft_detected",
      confidence: 1 - webResult.topScore,
    };
  }

  return {
    status: "APPROVED",
    reason: null,
    confidence: 1 - (webResult.topScore || 0),
  };
}

// ─────────────────────────────────────────────
// 메인 파이프라인
// ─────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.docId      - Firestore verification 문서 ID
 * @param {string} params.filePath   - Storage 경로 (예: "challenges/abc/photo.jpg")
 * @param {string} params.imageUri   - gs:// 또는 https:// URI (Vision API용)
 */
async function runVerificationPipeline({ docId, filePath, imageUri }) {
  console.log(`[pipeline] 시작 docId=${docId}`);

  // ── 1단계: pHash 생성 ──────────────────────
  await updateVerification(docId, { status: "processing_phash" });
  const pHash = await generatePHash(filePath);
  await savePHash(docId, pHash);
  console.log(`[pipeline] 1단계 완료 pHash=${pHash}`);

  // ── 2단계: 중복 검사 (Hamming distance) ────
  // 기존 프로젝트의 hamming 로직이 있다면 여기서 호출
  // 예: const dupResult = await checkDuplicate(pHash);
  await updateVerification(docId, { status: "processing_web_detection" });

  // ── 3단계: 웹 도용 검증 ────────────────────
  const webResult = await detectWebTheft(imageUri, pHash);
  console.log(
    `[pipeline] 3단계 완료 isStolen=${webResult.isStolen} topScore=${webResult.topScore}`
  );

  await updateVerification(docId, {
    webDetection: {
      isStolen: webResult.isStolen,
      topScore: webResult.topScore,
      matchCount: webResult.matchCount,
      fromCache: webResult.fromCache,
    },
    status: "processing_final",
  });

  // ── 4단계: 최종 판정 ───────────────────────
  const finalVerdict = makeFinalVerdict({ webResult });

  await updateVerification(docId, {
    verdict: finalVerdict.status,
    verdictReason: finalVerdict.reason,
    confidence: finalVerdict.confidence,
    status: "done",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[pipeline] 완료 verdict=${finalVerdict.status}`);
  return finalVerdict;
}

module.exports = { runVerificationPipeline };