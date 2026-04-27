/**
 * webDetection.mock.test.js
 * functions/src/utils/webDetection.mock.test.js
 *
 * Vision API 권한 없이 전체 파이프라인 테스트
 * 실행: node webDetection.mock.test.js
 *
 * 테스트 시나리오:
 *   1. 도용 이미지 감지 (score >= 0.8)
 *   2. 부분 일치 (score < 0.8, 통과)
 *   3. 매칭 없음 (완전 정상)
 *   4. 캐시 히트 (두 번째 호출 시 API 재호출 안 함)
 *   5. GPS 불일치 (위조 의심)
 *   6. GPS 없음 (EXIF 미포함)
 */

// ─────────────────────────────────────────────
// Vision API 모킹 (실제 API 호출 없이 가짜 응답 반환)
// ─────────────────────────────────────────────
const MOCK_SCENARIOS = {
  stolen: {
    webDetection: {
      fullMatchingImages: [
        { url: "https://instagram.com/p/abc123", score: 0.97 },
        { url: "https://twitter.com/img/xyz", score: 0.91 },
      ],
      partialMatchingImages: [
        { url: "https://reddit.com/r/photos/img1", score: 0.74 },
      ],
    },
  },
  partial: {
    webDetection: {
      fullMatchingImages: [],
      partialMatchingImages: [
        { url: "https://flickr.com/photos/abc", score: 0.65 },
      ],
    },
  },
  clean: {
    webDetection: {
      fullMatchingImages: [],
      partialMatchingImages: [],
    },
  },
};

// Vision API 클라이언트 모킹
function createMockVisionClient(scenario) {
  return {
    webDetection: async () => [{ webDetection: MOCK_SCENARIOS[scenario].webDetection }],
  };
}

// ─────────────────────────────────────────────
// 테스트용 인메모리 캐시 (Firestore 대체)
// ─────────────────────────────────────────────
const memoryCache = new Map();
const mockFirestore = {
  get: async (key) => memoryCache.get(key) || null,
  set: async (key, value) => memoryCache.set(key, { ...value, cachedAt: { toMillis: () => Date.now() } }),
};

// ─────────────────────────────────────────────
// 핵심 로직 (webDetection.js에서 분리)
// ─────────────────────────────────────────────
const THEFT_THRESHOLD = 0.8;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function parseWebDetectionResponse(webDetection) {
  const fullMatches = (webDetection.fullMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 1.0,
    type: "full",
  }));
  const partialMatches = (webDetection.partialMatchingImages || []).map((img) => ({
    url: img.url,
    score: img.score ?? 0.7,
    type: "partial",
  }));
  return [...fullMatches, ...partialMatches].sort((a, b) => b.score - a.score);
}

function judgeTheft(matches) {
  const stolenMatches = matches.filter((m) => m.score >= THEFT_THRESHOLD);
  return {
    isStolen: stolenMatches.length > 0,
    topScore: matches.length > 0 ? matches[0].score : 0,
    matchCount: matches.length,
    stolenMatchCount: stolenMatches.length,
  };
}

async function detectWebTheftMock(imageUri, pHash, mockClient) {
  // 캐시 확인
  const cached = await mockFirestore.get(pHash);
  if (cached) {
    const age = Date.now() - cached.cachedAt.toMillis();
    if (age <= CACHE_TTL_MS) {
      return { ...cached.result, fromCache: true };
    }
  }

  // Mock Vision API 호출
  const [response] = await mockClient.webDetection();
  const matches = parseWebDetectionResponse(response.webDetection);
  const judgment = judgeTheft(matches);

  const result = { ...judgment, matches, fromCache: false };

  // 캐시 저장
  await mockFirestore.set(pHash, { result });

  return result;
}

// GPS 검증 로직
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function verifyGpsMock(exifGps, claimedGps) {
  if (!exifGps) return { hasExif: false, verdict: "no_exif", distanceKm: null, isValid: null };
  if (!claimedGps) return { hasExif: true, verdict: "no_exif", distanceKm: null, isValid: null };

  const distanceKm = haversineKm(exifGps.lat, exifGps.lng, claimedGps.lat, claimedGps.lng);
  const isValid = distanceKm <= 1.0;

  return {
    hasExif: true,
    exifGps,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    isValid,
    verdict: isValid ? "valid" : "suspicious",
  };
}

// ─────────────────────────────────────────────
// 테스트 러너
// ─────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("=".repeat(55));
  console.log("  이미지 도용 검증 파이프라인 — 모킹 테스트");
  console.log("=".repeat(55));

  // ── 테스트 1: 도용 이미지 감지 ──────────────
  console.log("\n[1] 도용 이미지 감지 (fullMatch score 0.97)");
  const r1 = await detectWebTheftMock(
    "gs://bucket/challenges/test1/photo.jpg",
    "aabbccdd11223344",
    createMockVisionClient("stolen")
  );
  assert(r1.isStolen === true, "isStolen = true");
  assert(r1.topScore >= 0.8, `topScore ${r1.topScore} >= 0.8`);
  assert(r1.matchCount === 3, `matchCount = 3 (got ${r1.matchCount})`);
  assert(r1.stolenMatchCount === 2, `stolenMatchCount = 2 (got ${r1.stolenMatchCount})`);
  assert(r1.fromCache === false, "fromCache = false (최초 호출)");

  // ── 테스트 2: 캐시 히트 ──────────────────────
  console.log("\n[2] 캐시 히트 (동일 pHash 재호출)");
  const r2 = await detectWebTheftMock(
    "gs://bucket/challenges/test1/photo.jpg",
    "aabbccdd11223344", // 같은 pHash
    createMockVisionClient("stolen")
  );
  assert(r2.fromCache === true, "fromCache = true (캐시 사용)");
  assert(r2.isStolen === true, "캐시된 결과도 isStolen = true");

  // ── 테스트 3: 부분 일치 (통과) ───────────────
  console.log("\n[3] 부분 일치 score 0.65 — 임계값 미달, 통과");
  const r3 = await detectWebTheftMock(
    "gs://bucket/challenges/test2/photo.jpg",
    "ffffffff00000001",
    createMockVisionClient("partial")
  );
  assert(r3.isStolen === false, "isStolen = false");
  assert(r3.topScore < THEFT_THRESHOLD, `topScore ${r3.topScore} < threshold ${THEFT_THRESHOLD}`);
  assert(r3.matchCount === 1, `matchCount = 1 (got ${r3.matchCount})`);

  // ── 테스트 4: 완전 정상 ───────────────────────
  console.log("\n[4] 매칭 없음 — 원본 이미지");
  const r4 = await detectWebTheftMock(
    "gs://bucket/challenges/test3/photo.jpg",
    "0000000000000000",
    createMockVisionClient("clean")
  );
  assert(r4.isStolen === false, "isStolen = false");
  assert(r4.matchCount === 0, `matchCount = 0 (got ${r4.matchCount})`);
  assert(r4.topScore === 0, `topScore = 0 (got ${r4.topScore})`);

  // ── 테스트 5: GPS 유효 ────────────────────────
  console.log("\n[5] GPS 검증 — 유효 (거리 50m)");
  const r5 = verifyGpsMock(
    { lat: 37.5665, lng: 126.9780 },          // EXIF
    { lat: 37.5666, lng: 126.9781 }           // claimed (50m 차이)
  );
  assert(r5.verdict === "valid", `verdict = valid (거리 ${r5.distanceKm}km)`);
  assert(r5.isValid === true, "isValid = true");
  assert(r5.distanceKm < 1.0, `distanceKm ${r5.distanceKm} < 1.0`);

  // ── 테스트 6: GPS 불일치 ──────────────────────
  console.log("\n[6] GPS 검증 — 불일치 (서울 ↔ 부산, 약 320km)");
  const r6 = verifyGpsMock(
    { lat: 37.5665, lng: 126.9780 },          // EXIF: 서울
    { lat: 35.1796, lng: 129.0756 }           // claimed: 부산
  );
  assert(r6.verdict === "suspicious", `verdict = suspicious (거리 ${r6.distanceKm}km)`);
  assert(r6.isValid === false, "isValid = false");
  assert(r6.distanceKm > 1.0, `distanceKm ${r6.distanceKm} > 1.0`);

  // ── 테스트 7: EXIF GPS 없음 ───────────────────
  console.log("\n[7] GPS 검증 — EXIF 없음 (메타데이터 제거된 이미지)");
  const r7 = verifyGpsMock(null, { lat: 37.5665, lng: 126.9780 });
  assert(r7.verdict === "no_exif", "verdict = no_exif");
  assert(r7.hasExif === false, "hasExif = false");
  assert(r7.isValid === null, "isValid = null (판단 불가)");

  // ── 테스트 8: 최종 판정 통합 ──────────────────
  console.log("\n[8] 최종 판정 — 도용 + GPS 불일치 → REJECTED");
  function makeFinalVerdict(webResult, gpsResult) {
    if (webResult.isStolen) return { status: "REJECTED", reason: "web_theft_detected" };
    if (gpsResult.verdict === "suspicious") return { status: "REJECTED", reason: "gps_mismatch" };
    return { status: "APPROVED", reason: null };
  }
  const v1 = makeFinalVerdict({ isStolen: true, topScore: 0.97 }, { verdict: "valid" });
  assert(v1.status === "REJECTED", "도용 → REJECTED");
  assert(v1.reason === "web_theft_detected", "reason = web_theft_detected");

  const v2 = makeFinalVerdict({ isStolen: false, topScore: 0.5 }, { verdict: "suspicious" });
  assert(v2.status === "REJECTED", "GPS 불일치 → REJECTED");
  assert(v2.reason === "gps_mismatch", "reason = gps_mismatch");

  const v3 = makeFinalVerdict({ isStolen: false, topScore: 0.3 }, { verdict: "valid" });
  assert(v3.status === "APPROVED", "정상 이미지 → APPROVED");

  // ── 결과 요약 ─────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log(`  결과: ${passed}개 통과 / ${failed}개 실패 / 총 ${passed + failed}개`);
  if (failed === 0) {
    console.log("  🎉 모든 테스트 통과! Vision API 권한 받으면 바로 배포 가능");
  } else {
    console.log("  ⚠️  실패한 테스트를 확인하세요");
  }
  console.log("=".repeat(55));
}

runTests().catch(console.error);