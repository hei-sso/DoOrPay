/**
 * imageVerificationPipeline.js
 * functions/src/utils/imageVerificationPipeline.js
 *
 * 전체 AI 파이프라인 오케스트레이터
 *
 *  1단계: pHash 생성          (pHash.js)
 *  2단계: 중복 검사            (hamming distance — 기존 로직 연결)
 *  3단계: 웹 도용 검증         (webDetection.js)  ← 오늘 추가
 *  4단계: GPS 위치 검증        (gpsVerification.js) ← 오늘 추가
 *  5단계: 최종 판정 + Firestore 저장
 */

const admin = require("firebase-admin");
const { generatePHash, savePHash } = require("./pHash");
const { detectWebTheft } = require("./webDetection");
const { verifyGps } = require("./gpsVerification");
const { updateVerification } = require("./firestore");

const db = admin.firestore();

// ─────────────────────────────────────────────
// 최종 판정 기준
// ─────────────────────────────────────────────
function makeFinalVerdict({ webResult, gpsResult }) {
  // 도용 의심이면 바로 REJECTED
  if (webResult.isStolen) {
    return {
      status: "REJECTED",
      reason: "web_theft_detected",
      confidence: 1 - webResult.topScore,
    };
  }

  // GPS 불일치 (EXIF 있고 범위 초과)
  if (gpsResult.verdict === "suspicious") {
    return {
      status: "REJECTED",
      reason: "gps_mismatch",
      confidence: 0,
    };
  }

  // 정상
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
 * @param {string} params.docId        - Firestore verification 문서 ID
 * @param {string} params.filePath     - Storage 경로 (예: "challenges/abc/photo.jpg")
 * @param {string} params.imageUri     - gs:// 또는 https:// URI (Vision API용)
 * @param {{ lat: number, lng: number } | null} params.claimedGps - 사용자 입력 GPS
 */
async function runVerificationPipeline({ docId, filePath, imageUri, claimedGps }) {
  console.log(`[pipeline] 시작 docId=${docId}`);

  // ── 1단계: pHash 생성 ──────────────────────
  await updateVerification(docId, { status: "processing_phash" });
  const pHash = await generatePHash(filePath);
  await savePHash(docId, pHash);
  console.log(`[pipeline] 1단계 완료 pHash=${pHash}`);

  // ── 2단계: 중복 검사 (Hamming distance) ────
  // 기존 프로젝트의 hamming 로직이 있다면 여기서 호출
  // 예: const dupResult = await checkDuplicate(pHash);
  // 현재는 스킵하고 다음 단계로 진행
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
    status: "processing_gps",
  });

  // ── 4단계: GPS 검증 ────────────────────────
  const gpsResult = await verifyGps(filePath, claimedGps);
  console.log(`[pipeline] 4단계 완료 verdict=${gpsResult.verdict}`);

  await updateVerification(docId, {
    gpsVerification: {
      hasExif: gpsResult.hasExif,
      distanceKm: gpsResult.distanceKm,
      verdict: gpsResult.verdict,
    },
    status: "processing_final",
  });

  // ── 5단계: 최종 판정 ───────────────────────
  const finalVerdict = makeFinalVerdict({ webResult, gpsResult });

  await updateVerification(docId, {
    verdict: finalVerdict.status,       // "APPROVED" | "REJECTED"
    verdictReason: finalVerdict.reason,
    confidence: finalVerdict.confidence,
    status: "done",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`[pipeline] 완료 verdict=${finalVerdict.status}`);
  return finalVerdict;
}

module.exports = { runVerificationPipeline };