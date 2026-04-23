import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// 1. 그룹 챌린지 생성 (Batch Write 적용)
export async function createGroupChallenge(title: string, description: string, stakeAmount: number, days: number = 7) {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');

  const db = firestore();
  const userRef = db.collection('users').doc(user.uid);
  const challengeRef = db.collection('challenges').doc();
  const memberRef = challengeRef.collection('members').doc(user.uid);
  const txRef = db.collection('transactions').doc();

  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (!userData || userData.wallet.balance < stakeAmount) {
    throw new Error('보유 포인트가 부족합니다. 충전 후 이용해주세요.');
  }

  const now = firestore.Timestamp.now();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const batch = db.batch();

  // 1) 챌린지 메인 문서 생성
  batch.set(challengeRef, {
    title,
    description,
    creatorId: user.uid,
    status: 'recruiting',
    startDate: now,
    endDate: firestore.Timestamp.fromDate(endDate),
    totalStake: stakeAmount,
    createdAt: now,
    participantIds: [user.uid], // 내가 참여한 챌린지를 쉽게 찾기 위한 배열
    type: 'group', // 프론트엔드 구분을 위해 추가
  });

  // 2) members 서브 컬렉션에 방장 추가
  batch.set(memberRef, {
    nickname: userData.nickname || '사용자',
    role: 'leader',
    status: 'joined',
    stakedAt: now
  });

  // 3) 유저 지갑 예치금 처리
  batch.update(userRef, {
    'wallet.balance': firestore.FieldValue.increment(-stakeAmount),
    'wallet.locked': firestore.FieldValue.increment(stakeAmount)
  });

  // 4) 거래 내역 기록
  batch.set(txRef, {
    userId: user.uid,
    type: 'stake',
    amount: stakeAmount,
    status: 'approved',
    referenceId: challengeRef.id,
    createdAt: now
  });

  await batch.commit();
  return challengeRef.id;
}

// 2. 내가 참여 중인 그룹 챌린지 실시간 확인
export function subscribeToMyChallenges(uid: string, onUpdate: (challenges: any[]) => void) {
  return firestore()
    .collection('challenges')
    .where('participantIds', 'array-contains', uid)
    .where('status', 'in', ['recruiting', 'active'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const challenges = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
      onUpdate(challenges);
    }, err => console.error("Challenges Sub Error:", err));
}