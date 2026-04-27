const admin = require("firebase-admin");
const sharp = require("sharp");
const { updateVerification } = require("./firestore");

async function generatePHash(filePath) {
  const bucket = admin.storage().bucket(process.env.STORAGE_BUCKET); // Storage에 올라간 이미지 경로로 이미지 호출
  const [buffer] = await bucket.file(filePath).download();  // 이미지를 버퍼에 저장

  const { data, info } = await sharp(buffer)
    .rotate()                          // EXIF 회전 정보 먼저 적용
    .toFormat("png")                   // 포맷 통일
    .grayscale()                       // 흑백으로 변환
    .resize(8, 8, { fit: "fill" })     // 8x8 픽셀로 축소
    .raw()                               // 픽셀 숫자 배열로 추출
    .toBuffer({ resolveWithObject: true });

  // 채널/픽셀 수 검증
  if (info.channels !== 1 || data.length !== 64) {
    throw new Error(`픽셀 구조 오류: channels=${info.channels}, length=${data.length}`);
  }

  const pixels = Array.from(data);
  const avg = pixels.reduce((s, v) => s + v, 0) / 64;
  const bits = pixels.map((v) => (v >= avg ? 1 : 0));

  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i+1] << 2) | (bits[i+2] << 1) | bits[i+3];
    hex += nibble.toString(16);
  }

  // hex 길이 검증
  if (hex.length !== 16) {
    throw new Error(`hex 길이 오류: ${hex.length}`);
  }

  return hex;
}

async function savePHash(docId, pHash) {
  await updateVerification(docId, { pHash, status: "hashed" }); // merge 강제
}

module.exports = { generatePHash, savePHash };