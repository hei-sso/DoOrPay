/**
 * imageValidator.js
 * functions/src/utils/imageValidator.js
 *
 * 엣지 케이스 대응
 *  - HEIC/HEIF 이미지 감지 및 변환
 *  - 용량 큰 RAW 파일 차단
 *  - 손상된 EXIF 안전 파싱
 */

const admin = require("firebase-admin");
const path = require("path");

// ── 상수 ──────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

// 허용 MIME 타입
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// RAW 파일 확장자 (차단 대상)
const RAW_EXTENSIONS = new Set([
  ".raw", ".cr2", ".cr3", ".nef", ".arw",
  ".orf", ".rw2", ".dng", ".raf", ".pef",
]);

// HEIC/HEIF 감지
const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

// ── 검증 함수 ─────────────────────────────────────────────────────────────────

/**
 * Storage 오브젝트 메타데이터 기반 사전 검증
 * 파이프라인 진입 전에 호출 — 빠른 실패(fail-fast)
 *
 * @param {object} objectMetadata - Storage onFinalize의 object
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateObjectMetadata(objectMetadata) {
  const { contentType, size, name } = objectMetadata;
  const ext = path.extname(name || "").toLowerCase();

  // 1. RAW 파일 차단
  if (RAW_EXTENSIONS.has(ext)) {
    return { valid: false, reason: `raw_file_not_supported: ${ext}` };
  }

  // 2. MIME 타입 확인
  if (!contentType || !ALLOWED_MIME_TYPES.has(contentType)) {
    return { valid: false, reason: `unsupported_mime_type: ${contentType}` };
  }

  // 3. 파일 크기 제한
  const fileSize = Number(size);
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const mb = (fileSize / 1024 / 1024).toFixed(1);
    return { valid: false, reason: `file_too_large: ${mb}MB (max 20MB)` };
  }

  return { valid: true };
}

/**
 * HEIC/HEIF 파일 여부 확인
 *
 * @param {object} objectMetadata
 * @returns {boolean}
 */
function isHeicFile(objectMetadata) {
  const { contentType, name } = objectMetadata;
  const ext = path.extname(name || "").toLowerCase();
  return HEIC_MIME_TYPES.has(contentType) || HEIC_EXTENSIONS.has(ext);
}

/**
 * HEIC → JPEG 변환 후 Storage에 재업로드
 * sharp 라이브러리 필요: npm install sharp
 *
 * @param {string} filePath - Storage 경로
 * @param {string} bucketName
 * @returns {Promise<{ convertedPath: string, convertedUri: string }>}
 */
async function convertHeicToJpeg(filePath, bucketName) {
  // sharp는 런타임에서만 require (콜드스타트 최적화)
  const sharp = require("sharp");
  const os = require("os");
  const fs = require("fs");

  const bucket = admin.storage().bucket(bucketName);
  const fileName = path.basename(filePath, path.extname(filePath));
  const tempInput = path.join(os.tmpdir(), `heic_${fileName}_input`);
  const tempOutput = path.join(os.tmpdir(), `heic_${fileName}.jpg`);

  try {
    // 1. Storage에서 임시 파일로 다운로드
    await bucket.file(filePath).download({ destination: tempInput });

    // 2. HEIC → JPEG 변환
    await sharp(tempInput)
      .jpeg({ quality: 90 })
      .toFile(tempOutput);

    // 3. 변환된 파일을 Storage에 업로드
    const convertedPath = filePath.replace(/\.(heic|heif)$/i, "_converted.jpg");
    await bucket.upload(tempOutput, {
      destination: convertedPath,
      metadata: { contentType: "image/jpeg" },
    });

    console.log(`[imageValidator] HEIC 변환 완료: ${filePath} → ${convertedPath}`);

    return {
      convertedPath,
      convertedUri: `gs://${bucketName}/${convertedPath}`,
    };
  } finally {
    // 임시 파일 정리
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}

/**
 * 손상된 EXIF 안전 파싱
 * EXIF 파싱 실패 시 에러를 던지지 않고 빈 객체 반환
 *
 * @param {Buffer} imageBuffer
 * @returns {object} - EXIF 데이터 또는 {}
 */
function safeParseExif(imageBuffer) {
  try {
    // exif-reader 라이브러리 필요: npm install exif-reader
    const exifReader = require("exif-reader");
    return exifReader(imageBuffer) ?? {};
  } catch (err) {
    // 손상된 EXIF는 무시하고 계속 진행
    console.warn("[imageValidator] EXIF 파싱 실패 (무시하고 계속):", err.message);
    return {};
  }
}

module.exports = {
  validateObjectMetadata,
  isHeicFile,
  convertHeicToJpeg,
  safeParseExif,
};
