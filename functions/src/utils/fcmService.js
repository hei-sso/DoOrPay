/**
 * fcmService.js
 * functions/src/utils/fcmService.js
 *
 * FCM 토큰 관리 + 푸시 알림 전송
 * - approved / rejected 각각 다른 메시지 템플릿
 * - 만료 토큰 자동 정리
 */

const admin = require("firebase-admin");

const db = admin.firestore();

// ── 메시지 템플릿 ─────────────────────────────────────────────────────────────

const MESSAGE_TEMPLATES = {
  approved: {
    title: "인증 완료 ✅",
    body: () => "이미지 검증이 승인되었습니다. 서비스를 이용하실 수 있습니다.",
  },
  rejected: {
    title: "인증 실패 ❌",
    body: (failReasons) =>
      failReasons.length > 0
        ? `인증이 거절되었습니다. 사유: ${failReasons.join(", ")}`
        : "인증이 거절되었습니다.",
  },
};

// ── FCM 토큰 관리 ─────────────────────────────────────────────────────────────

/**
 * 사용자의 FCM 토큰을 Firestore에 저장/갱신
 * 클라이언트에서 앱 시작 시 호출하여 토큰을 최신 상태로 유지
 *
 * @param {string} userId
 * @param {string} fcmToken
 */
async function saveFcmToken(userId, fcmToken) {
  await db
    .collection("fcmTokens")
    .doc(userId)
    .set({ token: fcmToken, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  console.log(`[fcmService] 토큰 저장 userId=${userId}`);
}

/**
 * 사용자의 FCM 토큰 조회
 *
 * @param {string} userId
 * @returns {Promise<string | null>}
 */
async function getFcmToken(userId) {
  const snap = await db.collection("fcmTokens").doc(userId).get();
  if (!snap.exists) return null;
  return snap.data().token ?? null;
}

/**
 * 만료/무효 토큰 삭제
 *
 * @param {string} userId
 */
async function deleteFcmToken(userId) {
  await db.collection("fcmTokens").doc(userId).delete();
  console.log(`[fcmService] 만료 토큰 삭제 userId=${userId}`);
}

// ── 알림 전송 ─────────────────────────────────────────────────────────────────

/**
 * 판정 결과에 따라 FCM 푸시 알림 전송
 *
 * @param {string} userId
 * @param {"approved" | "rejected"} status  - 소문자로 전달
 * @param {string[]} failReasons
 */
async function sendVerificationNotification(userId, status, failReasons = []) {
  const token = await getFcmToken(userId);

  if (!token) {
    console.warn(`[fcmService] 토큰 없음, 알림 스킵 userId=${userId}`);
    return;
  }

  const template = MESSAGE_TEMPLATES[status];
  if (!template) {
    console.warn(`[fcmService] 알 수 없는 status: ${status}`);
    return;
  }

  const message = {
    token,
    notification: {
      title: template.title,
      body: template.body(failReasons),
    },
    data: {
      status,
      failReasons: JSON.stringify(failReasons),
    },
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "default", badge: 1 } } },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[fcmService] 알림 전송 완료 (${status}) userId=${userId}`, response);
  } catch (err) {
    // 만료/무효 토큰 자동 정리
    if (
      err.code === "messaging/registration-token-not-registered" ||
      err.code === "messaging/invalid-registration-token"
    ) {
      console.warn(`[fcmService] 무효 토큰 감지, 자동 삭제 userId=${userId}`);
      await deleteFcmToken(userId);
    } else {
      throw err;
    }
  }
}

module.exports = { saveFcmToken, getFcmToken, deleteFcmToken, sendVerificationNotification };
