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

module.exports = { updateVerification };