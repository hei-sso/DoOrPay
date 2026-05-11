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
const { updateVerification, finalizeVerification } = require("./firestore");

// 각 단계 결과를 failReasons 배열로 취합 후 최종 판정
// stepResults: Array<{ step: number, passed: boolean, reason?: string }>
function makeFinalVerdict({ stepResults, webResult }) {
  // 각 단계 실패 사유를 구조화된 배열로 수집
  const failReasons = stepResults
    .filter((r) => !r.passed)
    .map((r) => r.reason ?? `step${r.step}_failed`);

  if (failReasons.length > 0) {
    return {
      status: "REJECTED",
      failReasons,
      confidence: 1 - (webResult?.topScore || 0),
    };
  }

  return {
    status: "APPROVED",
    failReasons: [],
    confidence: 1 - (webResult?.topScore || 0),
  };
}

// 메인 파이프라인
/**
 * @param {object} params
 * @param {string} params.docId      - Firestore verification 문서 ID
 * @param {string} params.filePath   - Storage 경로 (예: "challenges/abc/photo.jpg")
 * @param {string} params.imageUri   - gs:// 또는 https:// URI (Vision API용)
 */
async function runVerificationPipeline({ docId, filePath, imageUri }) {
  console.log(`[pipeline] 시작 docId=${docId}`);

  // 1단계: pHash 생성
  await updateVerification(docId, { status: "processing_phash" });
  const pHash = await generatePHash(filePath);
  await savePHash(docId, pHash);
  console.log(`[pipeline] 1단계 완료 pHash=${pHash}`);

  // 2단계: 중복 검사 (Hamming distance)
  // 기존 프로젝트의 hamming 로직이 있다면 여기서 호출
  // 예: const dupResult = await checkDuplicate(pHash);
  await updateVerification(docId, { status: "processing_web_detection" });

  //3단계: 웹 도용 검증
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

  // 5단계: 최종 판정 — 1~4단계 결과 취합 후 failReasons 배열 생성
  const stepResults = [
    { step: 1, passed: !!pHash, reason: pHash ? undefined : "phash_generation_failed" },    // 1단계: pHash 생성 성공 여부 (여기까지 왔으면 성공)
    { step: 2, passed: true },                                                             // 2단계: 중복 검사 (현재 스텁 — dupResult 연결 시 교체)
    { step: 3, passed: !webResult.isStolen, reason: webResult.isStolen ? "web_theft_detected" : undefined },    // 3단계: 웹 도용 검증
    { step: 4, passed: true },                                                                 // 4단계: 추가 판정 기준이 생기면 여기에 추가
  ];

  const finalVerdict = makeFinalVerdict({ stepResults, webResult });

  // Firestore 트랜잭션으로 상태 + 인증 횟수 원자적 업데이트
  await finalizeVerification(docId, {
    verdict: finalVerdict.status,
    failReasons: finalVerdict.failReasons,
    confidence: finalVerdict.confidence,
  });

  console.log(`[pipeline] 완료 verdict=${finalVerdict.status}`, { failReasons: finalVerdict.failReasons });
  return finalVerdict;
}

module.exports = { runVerificationPipeline };