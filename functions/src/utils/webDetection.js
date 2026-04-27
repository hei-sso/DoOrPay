/**
 * webDetection.js
 * functions/src/utils/webDetection.js
 *
 * Google Vision API Web Detection + Firestore 캐싱 + 일일 호출 제한
 */

const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");

const db = admin.firestore();

// Vision API 클라이언트 (싱글톤)
let _visionClient = null;
function getVisionClient() {
  if (!_visionClient) {
    _visionClient = new vision.ImageAnnotatorClient();
  }
  return _visionClient;
}

// ─────────────────────────────────────────────
// 설정값
// ─────────────────────────────────────────────
const THEFT_THRESHOLD = 0.8;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const DAILY_LIMIT = 900;                   // 1000건 무료 중 900건만 사용 (100건 버퍼)

// ─────────────────────────────────────────────
// 일일 카운터 (Firestore)
// 문서 경로: visionApiUsage / YYYY-MM-DD
// ─────────────────────────────────────────────

// 오늘 날짜 키 (한국 시간 기준)
function getTodayKey() {
  return new Date()
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", ""); // "2026-04-21" 형태
}

// 오늘 호출 횟수 조회
async function getTodayCount() {
  const doc = await db.collection("visionApiUsage").doc(getTodayKey()).get();
  return doc.exists ? doc.data().count : 0;
}

// 호출 횟수 1 증가
async function incrementTodayCount() {
  const ref = db.collection("visionApiUsage").doc(getTodayKey());
  await ref.set(
    {
      count: admin.firestore.FieldValue.increment(1),
      date: getTodayKey(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// ─────────────────────────────────────────────
// Vision API 호출
// ─────────────────────────────────────────────
async function callVisionWebDetection(imageUri) {
  const client = getVisionClient();
  const [result] = await client.webDetection({
    image: { source: { imageUri } },
  });

  const web = result.webDetection || {};

  const fullMatches = (web.fullMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 1.0,
    type: "full",
  }));

  const partialMatches = (web.partialMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 0.7,
    type: "partial",
  }));

  return [...fullMatches, ...partialMatches].sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────
// 도용 판정
// ─────────────────────────────────────────────
function judgeTheft(matches) {
  const stolenMatches = matches.filter((m) => m.score >= THEFT_THRESHOLD);
  return {
    isStolen: stolenMatches.length > 0,
    topScore: matches.length > 0 ? matches[0].score : 0,
    matchCount: matches.length,
    stolenMatchCount: stolenMatches.length,
  };
}

// ─────────────────────────────────────────────
// Firestore 캐싱
// ─────────────────────────────────────────────
async function getCachedResult(pHash) {
  const doc = await db.collection("imageVerificationCache").doc(pHash).get();
  if (!doc.exists) return null;

  const data = doc.data();
  const age = Date.now() - data.cachedAt.toMillis();
  if (age > CACHE_TTL_MS) return null;

  return data.result;
}

async function setCachedResult(pHash, result) {
  await db.collection("imageVerificationCache").doc(pHash).set({
    result,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────
/**
 * 웹 도용 검증
 * 순서: 캐시 확인 → 일일 한도 확인 → Vision API 호출
 *
 * @param {string} imageUri  - gs:// 또는 https:// URI
 * @param {string} pHash     - 캐시 키로 사용
 * @returns {Promise<{
 *   isStolen: boolean,
 *   topScore: number,
 *   matchCount: number,
 *   matches: Array,
 *   fromCache: boolean,
 *   skipped: boolean   // 일일 한도 초과 시 true
 * }>}
 */
async function detectWebTheft(imageUri, pHash) {
  // 1. 캐시 확인 (한도 소모 없음)
  const cached = await getCachedResult(pHash);
  if (cached) {
    console.log(`[webDetection] 캐시 히트 pHash=${pHash}`);
    return { ...cached, fromCache: true, skipped: false };
  }

  // 2. 일일 한도 확인
  const todayCount = await getTodayCount();
  if (todayCount >= DAILY_LIMIT) {
    console.warn(`[webDetection] 일일 한도 초과 (${todayCount}/${DAILY_LIMIT}) — Vision API 스킵`);
    return {
      isStolen: false,
      topScore: 0,
      matchCount: 0,
      stolenMatchCount: 0,
      matches: [],
      fromCache: false,
      skipped: true,
    };
  }

  // 3. Vision API 호출 + 카운터 증가
  console.log(`[webDetection] Vision API 호출 (오늘 ${todayCount + 1}/${DAILY_LIMIT}회)`);
  const matches = await callVisionWebDetection(imageUri);
  await incrementTodayCount();

  const judgment = judgeTheft(matches);
  const result = { ...judgment, matches, fromCache: false, skipped: false };

  // 4. 캐시 저장
  await setCachedResult(pHash, result);

  return result;
}

module.exports = { detectWebTheft, THEFT_THRESHOLD, DAILY_LIMIT };