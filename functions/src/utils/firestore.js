/**
 * firestore.js
 * functions/src/utils/firestore.js
 *
 * Firestore 공통 유틸
 */

const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * verifications 컬렉션 문서 업데이트 (merge)
 * @param {string} docId
 * @param {object} data
 */
async function updateVerification(docId, data) {
  await db.collection("verifications").doc(docId).set(data, { merge: true });
}

/**
 * 5단계 최종 판정을 Firestore 트랜잭션으로 원자적 업데이트
 * - verificationStatus, failReasons, verificationCount 동시 처리
 * - 이미 판정 완료된 문서는 중복 쓰기 차단 (레이스 컨디션 방지)
 *
 * @param {string} docId
 * @param {{ verdict: string, failReasons: string[], confidence: number }} result
 */
async function finalizeVerification(docId, { verdict, failReasons, confidence }) {
  const docRef = db.collection("verifications").doc(docId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      throw new Error(`verification document not found: ${docId}`);
    }

    const current = snap.data();

    // 레이스 컨디션 방지: 이미 최종 판정 완료된 경우 중복 처리 차단
    if (current.status === "done") {
      throw new Error(`Already finalized (${current.verdict}). Skipping duplicate write.`);
    }

    const verificationCount = (current.verificationCount ?? 0) + 1;

    tx.update(docRef, {
      verdict,
      failReasons,            // 구조화된 배열로 저장
      confidence,
      verificationCount,      // 인증 횟수 원자적 +1
      status: "done",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

module.exports = { updateVerification, finalizeVerification };