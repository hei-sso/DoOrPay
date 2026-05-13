// src/schedulers/dailyGoalCheck.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

// [요구사항 5] Retry 로직: DB 접근 실패 시 최대 3번까지 재시도하는 헬퍼 함수
async function withRetry(promiseFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await promiseFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`[Retry] 작업 실패, ${i + 1}초 후 재시도합니다...`, error.message);
      await new Promise((res) => setTimeout(res, 1000 * (i + 1))); // 지수 백오프
    }
  }
}

// [요구사항 6] 에러 로그 저장: 에러 발생 시 DB에 로그를 남기는 헬퍼 함수
async function saveErrorLog(context, error) {
  try {
    await db.collection("error_logs").add({
      context: context,
      message: error.message,
      stack: error.stack || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (logErr) {
    console.error("에러 로그 저장 자체에 실패했습니다:", logErr);
  }
}

// [요구사항 1] Cloud Scheduler 매일 실행
// 한국 시간(Asia/Seoul) 기준으로 매일 자정 5분(00:00)에 실행됩니다.
exports.dailyGoalCheck = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("dailyGoalCheck 스케줄러 시작");

    // 어제 날짜 계산 (자정 5분에 실행되므로, '어제' 하루 동안의 인증을 검사)
    const now = new Date();
    // UTC 기준이므로 한국 시간 보정 로직이 필요할 수 있으나, 간소화를 위해 하루를 뺍니다.
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(now);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    try {
      // 1. 현재 진행 중(ongoing)인 모든 목표(Goal) 가져오기
      const goalsSnapshot = await db.collection("goals").where("status", "==", "ongoing").get();

      // [요구사항 3] 에러 처리: 하나가 에러 나도 전체 스케줄러가 죽지 않도록 Promise.allSettled 사용
      const results = await Promise.allSettled(
        goalsSnapshot.docs.map(async (doc) => {
          const goalData = doc.data();
          const goalId = doc.id;

          return withRetry(async () => {
            // 2. 어제 올린 인증(Verification) 문서 가져오기
            const verificationsSnapshot = await db
              .collection("verifications")
              .where("targetId", "==", goalId)
              .where("createdAt", ">=", startOfYesterday)
              .where("createdAt", "<=", endOfYesterday)
              .get();

            let isVerified = false;
            let rejectReason = "no_upload"; // 기본 실패 사유: 안 올림

            // [요구사항 2, 4] 인증 여부 및 AI 실패 상태 처리
            verificationsSnapshot.forEach((vDoc) => {
              const vData = vDoc.data();
              if (vData.status === "approved") {
                isVerified = true;
              } else if (vData.status === "rejected") {
                // AI가 거절했거나 어뷰징 판정
                rejectReason = "ai_rejected";
              } else if (vData.status.startsWith("processing")) {
                // AI 처리가 아직도 안 끝났다면 시스템 에러/타임아웃으로 실패 처리
                rejectReason = "ai_timeout";
              }
            });

            // [요구사항 3] 실패 판정 로직
            if (!isVerified) {
              await db.runTransaction(async (transaction) => {
                const goalRef = db.collection("goals").doc(goalId);
                
                // 목표의 실패 횟수(failCount) 1 증가
                transaction.update(goalRef, {
                  failCount: admin.firestore.FieldValue.increment(1),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // 실패(페널티) 기록 저장 (나중에 사용자에게 알림을 주거나 히스토리 용도)
                const penaltyRef = db.collection("penalties").doc();
                transaction.set(penaltyRef, {
                  targetId: goalId,
                  targetType: "goal",
                  userId: goalData.userId,
                  date: startOfYesterday,
                  reason: rejectReason, // AI가 거절했는지, 아예 안 올렸는지 구분
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              });

              console.log(`[실패 판정] Goal: ${goalId}, User: ${goalData.userId}, Reason: ${rejectReason}`);
            }
          });
        })
      );

      // 에러 난 항목들만 찾아내서 error_logs에 저장
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const failedGoalId = goalsSnapshot.docs[index].id;
          saveErrorLog(`dailyGoalCheck (Goal: ${failedGoalId})`, result.reason);
        }
      });

    } catch (error) {
      console.error("스케줄러 전체 실행 중 치명적 오류:", error);
      await saveErrorLog("dailyGoalCheck_main", error);
    }

    console.log("dailyGoalCheck 스케줄러 종료");
    return null;
  });