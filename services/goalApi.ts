import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

async function getAuthToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.getIdToken();
}

// 개인 목표 생성
export async function createPersonalGoal(title: string, stakeAmount: number, emoji: string, startDate: Date, endDate: Date) {
  const token = await getAuthToken();
  
  const response = await fetch(`${BASE_URL}/createGoal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      stakeAmount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      emoji, 
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || '목표 생성에 실패했습니다.');
  }
  
  return result.goalId;
}

// 진행 중인 개인 목표 실시간 구독
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