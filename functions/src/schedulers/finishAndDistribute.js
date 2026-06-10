const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * [최종 정산 스케줄러]
 * 매일 00:30 실행. 종료일이 지난 개인 목표/그룹 챌린지를 정산합니다.
 */
exports.finishAndDistribute = functions
  .region("asia-northeast3")
  .pubsub.schedule("30 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    console.log("=== finishAndDistribute 시작 ===");

    const now = new Date();

    try {
      await settlePersonalGoals(now);
      await settleGroupChallenges(now);
    } catch (error) {
      console.error("정산 스케줄러 실행 중 치명적 오류:", error);
    }

    console.log("=== finishAndDistribute 종료 ===");
    return null;
  });

async function settlePersonalGoals(now) {
  const goalsSnapshot = await db
    .collection("goals")
    .where("status", "==", "ongoing")
    .where("endDate", "<", now)
    .get();

  if (goalsSnapshot.empty) return;

  const batch = db.batch();

  for (const doc of goalsSnapshot.docs) {
    const goal = doc.data();
    const goalRef = doc.ref;
    const userRef = db.collection("users").doc(goal.userId);
    const stakeAmount = Number(goal.stakeAmount || 0);

    const isSuccess = Number(goal.failCount || 0) < 3;
    const finalStatus = isSuccess ? "success" : "fail";

    batch.update(goalRef, {
      status: finalStatus,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (isSuccess) {
      batch.update(userRef, {
        "wallet.locked": admin.firestore.FieldValue.increment(-stakeAmount),
        "wallet.balance": admin.firestore.FieldValue.increment(stakeAmount),
      });
    } else {
      batch.update(userRef, {
        "wallet.locked": admin.firestore.FieldValue.increment(-stakeAmount),
      });
    }

    const txRef = db.collection("transactions").doc();
    batch.set(txRef, {
      txId: txRef.id,
      userId: goal.userId,
      type: isSuccess ? "reward" : "stake",
      amount: stakeAmount,
      status: "approved",
      referenceId: doc.id,
      goalId: doc.id,
      description: isSuccess ? "목표 성공 포인트 반환" : "목표 실패 예치금 차감",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`[개인 목표] ${goalsSnapshot.size}개 정산 완료`);
}

async function settleGroupChallenges(now) {
  const challengesSnapshot = await db
    .collection("challenges")
    .where("status", "==", "active")
    .where("endDate", "<", now)
    .get();

  if (challengesSnapshot.empty) return;

  for (const doc of challengesSnapshot.docs) {
    const challenge = doc.data();
    const challengeId = doc.id;
    const challengeRef = doc.ref;
    const stakeAmount = Number(challenge.stakeAmount || 0);

    await db.runTransaction(async (transaction) => {
      const membersSnapshot = await transaction.get(challengeRef.collection("members"));

      const successMemberIds = [];
      const failedMemberIds = [];
      let totalPenaltyPool = 0;

      membersSnapshot.forEach((mDoc) => {
        const member = mDoc.data();
        if (member.status !== "joined") return;

        if (Number(member.failCount || 0) < 3) {
          successMemberIds.push(mDoc.id);
        } else {
          failedMemberIds.push(mDoc.id);
          totalPenaltyPool += stakeAmount;
        }
      });

      const bonusPerWinner =
        successMemberIds.length > 0 && totalPenaltyPool > 0
          ? Math.floor(totalPenaltyPool / successMemberIds.length)
          : 0;

      transaction.update(challengeRef, {
        status: "closed",
        successCount: successMemberIds.length,
        failedCount: failedMemberIds.length,
        bonusPerWinner,
        closedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      membersSnapshot.forEach((mDoc) => {
        const member = mDoc.data();
        if (member.status !== "joined") return;

        const memberId = mDoc.id;
        const memberRef = mDoc.ref;
        const userRef = db.collection("users").doc(memberId);
        const txRef = db.collection("transactions").doc();
        const isSuccess = successMemberIds.includes(memberId);

        if (isSuccess) {
          const totalReward = stakeAmount + bonusPerWinner;
          transaction.update(userRef, {
            "wallet.locked": admin.firestore.FieldValue.increment(-stakeAmount),
            "wallet.balance": admin.firestore.FieldValue.increment(totalReward),
          });
          transaction.update(memberRef, {
            result: "success",
            reward: totalReward,
            settledAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          transaction.set(txRef, {
            txId: txRef.id,
            userId: memberId,
            type: "reward",
            amount: totalReward,
            status: "approved",
            referenceId: challengeId,
            challengeId,
            description: "그룹 챌린지 성공 보상",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(userRef, {
            "wallet.locked": admin.firestore.FieldValue.increment(-stakeAmount),
          });
          transaction.update(memberRef, {
            result: "fail",
            reward: 0,
            settledAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          transaction.set(txRef, {
            txId: txRef.id,
            userId: memberId,
            type: "stake",
            amount: stakeAmount,
            status: "approved",
            referenceId: challengeId,
            challengeId,
            description: "그룹 챌린지 실패 예치금 차감",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    });

    console.log(`[그룹 챌린지] ${challengeId} 정산 완료`);
  }
}
