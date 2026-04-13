const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { execFile } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

initializeApp();
const db = getFirestore();

const THRESHOLD = 10;
const PHASH_SCRIPT = path.join(__dirname, "..", "src", "utils", "hamming.py");


// ── pHash 계산 헬퍼 ───────────────────────────────────
function computePHash(imagePath) {
  return new Promise((resolve, reject) => {
    execFile("python", [PHASH_SCRIPT, imagePath], (err, stdout) => {
      if (err) return reject(err);
      try {
        const result = JSON.parse(stdout);
        if (result.error) return reject(new Error(result.error));
        resolve(result.phash);
      } catch (e) {
        reject(new Error("pHash 파싱 실패: " + stdout));
      }
    });
  });
}


// ── Hamming Distance 계산 헬퍼 ────────────────────────
function hammingDistance(hashA, hashB) {
  const intA = BigInt("0x" + hashA);
  const intB = BigInt("0x" + hashB);
  const xor = intA ^ intB;
  return xor.toString(2).split("0").join("").length;
}


// ── Cloud Function v1: 중복 이미지 검사 ──────────────
// 호출: { data: { verificationId: "..." } }
exports.checkDuplicate = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    const { verificationId } = data;

    if (!verificationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "verificationId가 필요합니다."
      );
    }

    // 1. verifications 문서 조회
    const verRef = db.collection("verifications").doc(verificationId);
    const verDoc = await verRef.get();

    if (!verDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "verification 문서를 찾을 수 없습니다."
      );
    }

    const { imageUrl, userId } = verDoc.data();

    if (!imageUrl) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "imageUrl이 없습니다."
      );
    }
    if (!userId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "userId가 없습니다."
      );
    }

    // 2. Storage에서 이미지 다운로드 → 임시 파일 저장
    const bucket = getStorage().bucket();
    const storagePath = imageUrl.startsWith("gs://")
      ? imageUrl.replace(/^gs:\/\/[^/]+\//, "")
      : imageUrl;
    const tempPath = path.join(os.tmpdir(), `${verificationId}.jpg`);

    await bucket.file(storagePath).download({ destination: tempPath });

    // 3. pHash 계산
    let newHash;
    try {
      newHash = await computePHash(tempPath);
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }

    // 4. verifications 문서에 pHash 저장 (status는 건드리지 않음)
    await verRef.update({ pHash: newHash });

    // 5. 같은 userId의 기존 verifications에서 pHash 목록 조회
    const existingSnap = await db.collection("verifications")
      .where("userId", "==", userId)
      .get();

    // 6. 중복 검사
    const duplicates = [];
    existingSnap.forEach((doc) => {
      if (doc.id === verificationId) return;
      const { pHash: oldHash } = doc.data();
      if (!oldHash) return;

      const dist = hammingDistance(newHash, oldHash);
      if (dist <= THRESHOLD) {
        duplicates.push({
          verificationId: doc.id,
          distance: dist,
        });
      }
    });

    const isDuplicate = duplicates.length > 0;

    // 7. 중복 여부 저장
    await verRef.update({ isDuplicate });

    // 8. 결과 반환
    return {
      isDuplicate,
      pHash: newHash,
      duplicates,
      message: isDuplicate
        ? "이미 업로드한 사진과 유사한 이미지입니다."
        : "새로운 인증 이미지입니다.",
    };
  });