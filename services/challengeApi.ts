import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

async function getAuthToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.getIdToken();
}

// 그룹 챌린지 생성
export async function createGroupChallenge(title: string, description: string, stakeAmount: number, emoji: string, startDate: Date, endDate: Date) {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/createChallenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      title,
      description,
      stakeAmount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      emoji,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '챌린지 생성에 실패했습니다.');

  return result.challengeId;
}

// 내 챌린지 목록 실시간 구독 함수
export function subscribeToMyChallenges(uid: string, onUpdate: (challenges: any[]) => void) {
  return firestore()
    .collection('challenges')
    .where('memberIds', 'array-contains', uid)
    .where('status', 'in', ['recruiting', 'active'])
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const challenges = snapshot?.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) || [];
      onUpdate(challenges);
    }, err => console.error("Challenges Sub Error:", err));
}