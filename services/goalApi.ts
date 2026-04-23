import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// 1. 개인 목표 생성 (Batch Write 적용)
export async function createPersonalGoal(title: string, stakeAmount: number, emoji: string, startDate: Date, endDate: Date) {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');

  const db = firestore();
  const userRef = db.collection('users').doc(user.uid);
  const goalRef = db.collection('goals').doc(); // 자동 ID 생성
  const txRef = db.collection('transactions').doc(); // 자동 ID 생성

  // 트랜잭션을 위한 유저 정보 가져오기 (잔액 확인)
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (!userData || userData.wallet.balance < stakeAmount) {
    throw new Error('보유 포인트가 부족합니다. 충전 후 이용해주세요.');
  }

  const now = firestore.Timestamp.now();
  const batch = db.batch();

  // 1) 목표 문서 생성
  batch.set(goalRef, {
    userId: user.uid,
    userNickname: userData.nickname || '사용자',
    title,
    stakeAmount,
    emoji,
    startDate: firestore.Timestamp.fromDate(startDate),
    endDate: firestore.Timestamp.fromDate(endDate),
    status: 'ongoing',
    createdAt: now,
    type: 'personal', // 프론트엔드 구분을 위해 추가
  });

  // 2) 유저 지갑 업데이트 (잔액 감소, 예치금 증가)
  batch.update(userRef, {
    'wallet.balance': firestore.FieldValue.increment(-stakeAmount),
    'wallet.locked': firestore.FieldValue.increment(stakeAmount)
  });

  // 3) 거래 내역 기록
  batch.set(txRef, {
    userId: user.uid,
    type: 'stake',
    amount: stakeAmount,
    status: 'approved',
    referenceId: goalRef.id,
    createdAt: now
  });

  // 일괄 처리 커밋
  await batch.commit();
  return goalRef.id;
}

// 2. 내 진행 중인 개인 목표 실시간 확인
export function subscribeToMyGoals(uid: string, onUpdate: (goals: any[]) => void) {
  return firestore()
    .collection('goals')
    .where('userId', '==', uid)
    .where('status', '==', 'ongoing')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const goals = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
      onUpdate(goals);
    }, err => console.error("Goals Sub Error:", err));
}