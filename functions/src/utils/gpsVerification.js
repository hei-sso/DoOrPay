/**
 * gpsVerification.js
 * functions/src/utils/gpsVerification.js
 *
 * EXIF GPS 추출 + 클레임 좌표와 비교
 *
 * 사용 전 준비:
 *   npm install exif-reader (functions/ 폴더에서)
 */

const admin = require("firebase-admin");
const sharp = require("sharp"); // pHash.js에서 이미 사용 중 — 추가 설치 불필요

// ─────────────────────────────────────────────
// 1. GPS 허용 반경
// ─────────────────────────────────────────────
const GPS_RADIUS_KM = 1.0; // 1km 이내면 유효

// ─────────────────────────────────────────────
// 2. Haversine 공식 — 두 좌표 사이 거리(km)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 3. Firebase Storage 이미지에서 EXIF GPS 추출
// ─────────────────────────────────────────────
/**
 * @param {string} filePath  - Storage 경로 (예: "challenges/abc/photo.jpg")
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function extractExifGps(filePath) {
  try {
    const bucket = admin.storage().bucket(process.env.STORAGE_BUCKET);
    const [buffer] = await bucket.file(filePath).download();

    // sharp로 EXIF 메타데이터 추출
    const metadata = await sharp(buffer).metadata();
    const exif = metadata.exif;

    if (!exif) return null;

    // exif-reader로 파싱
    const ExifReader = require("exif-reader");
    const parsed = ExifReader(exif);

    const gps = parsed.gps;
    if (!gps || !gps.GPSLatitude || !gps.GPSLongitude) return null;

    // DMS(도분초) → 십진수 변환
    const toDecimal = ([deg, min, sec]) => deg + min / 60 + sec / 3600;

    const lat = toDecimal(gps.GPSLatitude) * (gps.GPSLatitudeRef === "S" ? -1 : 1);
    const lng =
      toDecimal(gps.GPSLongitude) * (gps.GPSLongitudeRef === "W" ? -1 : 1);

    return { lat, lng };
  } catch (err) {
    console.warn("[gpsVerification] EXIF 추출 실패:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// 4. 메인 함수 — 파이프라인에서 이걸 호출
// ─────────────────────────────────────────────
/**
 * GPS 검증
 *
 * @param {string} filePath        - Storage 이미지 경로
 * @param {{ lat: number, lng: number } | null} claimedGps  - 사용자가 주장하는 촬영 위치
 * @returns {Promise<{
 *   hasExif: boolean,
 *   exifGps: {lat, lng} | null,
 *   distanceKm: number | null,
 *   isValid: boolean | null,   // null = EXIF 없어서 판단 불가
 *   verdict: 'valid' | 'suspicious' | 'no_exif'
 * }>}
 */
async function verifyGps(filePath, claimedGps) {
  const exifGps = await extractExifGps(filePath);

  // EXIF GPS 없음
  if (!exifGps) {
    return {
      hasExif: false,
      exifGps: null,
      distanceKm: null,
      isValid: null,
      verdict: "no_exif",
    };
  }

  // claimed GPS 없음 → EXIF만 기록, 검증 스킵
  if (!claimedGps || claimedGps.lat == null || claimedGps.lng == null) {
    return {
      hasExif: true,
      exifGps,
      distanceKm: null,
      isValid: null,
      verdict: "no_exif", // claimed 없으므로 비교 불가
    };
  }

  const distanceKm = haversineKm(
    exifGps.lat,
    exifGps.lng,
    claimedGps.lat,
    claimedGps.lng
  );

  const isValid = distanceKm <= GPS_RADIUS_KM;

  return {
    hasExif: true,
    exifGps,
    distanceKm: Math.round(distanceKm * 1000) / 1000, // 소수 3자리
    isValid,
    verdict: isValid ? "valid" : "suspicious",
  };
}

module.exports = { verifyGps, GPS_RADIUS_KM };