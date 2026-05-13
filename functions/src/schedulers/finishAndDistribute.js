const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * [최종 정산 스케줄러]
 * 매일 00:30 실행 (dailyGoalCheck가 00:00에 끝난 후 안전하게 실행)
 * 종료일이 지난 목표/챌린지를 찾아 성공 여부를 판정하고 포인트를 분배합니다.
 */
exports.finishAndDistribute = functions
  .region("asia-northeast3")
  .pubsub.schedule("30 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("=== finishAndDistribute (정산 스케줄러) 시작 ===");
    
    const now = new Date();

    try {
      await settlePersonalGoals(now);
      await settleGroupChallenges(now);
    } catch (error) {
      console.error("정산 스케줄러 실행 중 치명적 오류:", error);
    }

    console.log("=== finishAndDistribute (정산 스케줄러) 종료 ===");
    return null;
  });

// 1. 개인 목표(Goal) 종료 및 정산 로직
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

    // [성공 기준 변경]: 3번 이상 실패하면 실패 (즉, 3 미만이면 성공!)
    const isSuccess = (goal.failCount || 0) < 3;
    const finalStatus = isSuccess ? "completed" : "failed";

    // 1. 목표 상태 업데이트
    batch.update(goalRef, {
      status: finalStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. 지갑(Wallet) 업데이트
    if (isSuccess) {
      batch.update(userRef, {
        "wallet.locked": admin.firestore.FieldValue.increment(-goal.stakeAmount),
        "wallet.balance": admin.firestore.FieldValue.increment(goal.stakeAmount),
      });
    } else {
      batch.update(userRef, {
        "wallet.locked": admin.firestore.FieldValue.increment(-goal.stakeAmount),
      });
    }

    // 3. 거래 내역(Transaction) 기록
    const txRef = db.collection("transactions").doc();
    batch.set(txRef, {
      userId: goal.userId,
      targetId: doc.id,
      targetType: "goal",
      type: isSuccess ? "refund" : "penalty",
      amount: goal.stakeAmount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`[개인 목표] ${goalsSnapshot.size}개 정산 완료`);
}

// 2. 그룹 챌린지(Challenge) 종료 및 1/N 상금 분배 로직
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
    
    await db.runTransaction(async (transaction) => {
      const membersSnapshot = await transaction.get(
        db.collection("challenges").doc(challengeId).collection("members")
      );

      let successMembers = [];
      let failedMembers = [];
      let totalPenaltyPool = 0;

      membersSnapshot.forEach((mDoc) => {
        const member = mDoc.data();
        
        // [성공 기준 변경]: 3번 이상 실패하면 실패 (3 미만이면 성공)
        if ((member.failCount || 0) < 3) {
          successMembers.push(member.userId);
        } else {
          failedMembers.push(member.userId);
          totalPenaltyPool += challenge.stakeAmount;
        }
      });

      // 2. 성공한 사람들에게 돌아갈 1/N 추가 상금 계산
      let bonusPerWinner = 0;
      if (successMembers.length > 0 && totalPenaltyPool > 0) {
        bonusPerWinner = Math.floor(totalPenaltyPool / successMembers.length);
      }

      // 3. 챌린지 상태를 completed로 변경
      transaction.update(challengeRef, {
        status: "completed",
        successCount: successMembers.length,
        failedCount: failedMembers.length,
        bonusPerWinner: bonusPerWinner,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. 유저별 지갑 업데이트 및 멤버 상태 변경
      membersSnapshot.forEach((mDoc) => {
        const member = mDoc.data();
        const memberRef = mDoc.ref;
        const userRef = db.collection("users").doc(member.userId);
        const txRef = db.collection("transactions").doc();

        const isSuccess = successMembers.includes(member.userId);

        if (isSuccess) {
          const totalReward = challenge.stakeAmount + bonusPerWinner;
          transaction.update(userRef, {
            "wallet.locked": admin.firestore.FieldValue.increment(-challenge.stakeAmount),
            "wallet.balance": admin.firestore.FieldValue.increment(totalReward),
          });
          transaction.update(memberRef, { status: "success", reward: totalReward });

          transaction.set(txRef, {
            userId: member.userId,
            targetId: challengeId,
            targetType: "challenge",
            type: "reward",
            amount: totalReward,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(userRef, {
            "wallet.locked": admin.firestore.FieldValue.increment(-challenge.stakeAmount),
          });
          transaction.update(memberRef, { status: "failed", reward: 0 });

          transaction.set(txRef, {
            userId: member.userId,
            targetId: challengeId,
            targetType: "challenge",
            type: "penalty",
            amount: challenge.stakeAmount,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
    });

    console.log(`[그룹 챌린지] ${challengeId} 정산 완료 (상금 풀: ${challenge.stakeAmount * failedMembers.length}, 승자 보너스: ${bonusPerWinner})`);
  }
}