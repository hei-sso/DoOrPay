/**
 * webDetection.js
 * functions/src/utils/webDetection.js
 *
 * Google Vision API Web Detection + Firestore 캐싱
 *
 * 사용 전 준비:
 *   1) npm install @google-cloud/vision (functions/ 폴더에서)
 *   2) functions/.env 에 VISION_API_KEY=AIza... 추가
 *   3) Firebase console → Functions → 환경변수 확인
 */

const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");

const db = admin.firestore();

// Vision API 클라이언트 (싱글톤)
// VISION_API_KEY 환경변수를 사용하거나, GCP 서비스 계정 자동 인증
let _visionClient = null;
function getVisionClient() {
  if (!_visionClient) {
    _visionClient = new vision.ImageAnnotatorClient(
      process.env.VISION_API_KEY
        ? { apiKey: process.env.VISION_API_KEY }
        : {} // Firebase Functions는 GCP 환경이므로 키 없이도 서비스 계정으로 동작
    );
  }
  return _visionClient;
}

// ─────────────────────────────────────────────
// 1. 유사도 점수 임계값
// ─────────────────────────────────────────────
const THEFT_THRESHOLD = 0.8; // 이 값 이상이면 도용 의심

// ─────────────────────────────────────────────
// 2. Vision API 호출
// ─────────────────────────────────────────────
/**
 * Google Vision API Web Detection 호출
 * @param {string} imageUri  - Firebase Storage gs:// URI 또는 공개 https:// URL
 * @returns {Promise<Array>} - 매칭 결과 배열 [{ url, score, type }]
 */
async function callVisionWebDetection(imageUri) {
  const client = getVisionClient();

  const [result] = await client.webDetection({ image: { source: { imageUri } } });
  const web = result.webDetection;

  if (!web) return [];

  // fullMatchingImages: 완전 일치 (score 없으면 1.0으로 처리)
  const fullMatches = (web.fullMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 1.0,
    type: "full",
  }));

  // partialMatchingImages: 부분 일치
  const partialMatches = (web.partialMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 0.7,
    type: "partial",
  }));

  return [...fullMatches, ...partialMatches].sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────
// 3. 도용 판정 로직
// ─────────────────────────────────────────────
/**
 * 매칭 결과를 받아 도용 여부 판정
 * @param {Array} matches
 * @returns {{ isStolen: boolean, topScore: number, matchCount: number }}
 */
function judgeTheft(matches) {
  const stolenMatches = matches.filter((m) => m.score >= THEFT_THRESHOLD);
  const topScore = matches.length > 0 ? matches[0].score : 0;

  return {
    isStolen: stolenMatches.length > 0,
    topScore,
    matchCount: matches.length,
    stolenMatchCount: stolenMatches.length,
  };
}

// ─────────────────────────────────────────────
// 4. Firestore 캐싱
//    컬렉션: imageVerificationCache / 문서 ID: pHash값
//    → 같은 이미지는 24시간 내 Vision API 재호출 안 함
// ─────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

async function getCachedResult(pHash) {
  const doc = await db.collection("imageVerificationCache").doc(pHash).get();
  if (!doc.exists) return null;

  const data = doc.data();
  const age = Date.now() - data.cachedAt.toMillis();
  if (age > CACHE_TTL_MS) return null; // 만료

  return data.result;
}

async function setCachedResult(pHash, result) {
  await db.collection("imageVerificationCache").doc(pHash).set({
    result,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 5. 메인 함수 — 파이프라인에서 이걸 호출
// ─────────────────────────────────────────────
/**
 * 웹 도용 검증 (캐시 → Vision API 순서)
 *
 * @param {string} imageUri  - gs://bucket/path 또는 https://...
 * @param {string} pHash     - 이미 생성된 pHash (캐시 키로 사용)
 * @returns {Promise<{
 *   isStolen: boolean,
 *   topScore: number,
 *   matchCount: number,
 *   matches: Array,
 *   fromCache: boolean
 * }>}
 */
async function detectWebTheft(imageUri, pHash) {
  // 캐시 확인
  const cached = await getCachedResult(pHash);
  if (cached) {
    console.log(`[webDetection] 캐시 히트 pHash=${pHash}`);
    return { ...cached, fromCache: true };
  }

  // Vision API 호출
  console.log(`[webDetection] Vision API 호출 imageUri=${imageUri}`);
  const matches = await callVisionWebDetection(imageUri);
  const judgment = judgeTheft(matches);

  const result = {
    ...judgment,
    matches,
    fromCache: false,
  };

  // 결과 캐싱
  await setCachedResult(pHash, result);

  return result;
}

module.exports = { detectWebTheft, THEFT_THRESHOLD };