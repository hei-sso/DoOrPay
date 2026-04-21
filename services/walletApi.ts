import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

async function getAuthToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.getIdToken();
}

// 결제 주문 생성
export async function createChargeOrder(amount: number) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/createChargeOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '주문 생성에 실패했습니다.');
  return result;
}

// 결제 승인 요청
export async function confirmChargePayment(params: { paymentKey: string; orderId: string; amount: number; }) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/confirmChargePayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '결제 승인 중 오류가 발생했습니다.');
  return result;
}

// 사용자 지갑 잔액 정보 업데이트
export function subscribeToWallet(uid: string, onUpdate: (data: any) => void) {
  return firestore()
    .collection('users')
    .doc(uid)
    .onSnapshot(doc => {
      if (doc.exists()) onUpdate(doc.data()?.wallet);
    }, err => console.error("Wallet Sub Error:", err));
}

// 최근 거래 내역 업데이트
export function subscribeToTransactions(uid: string, onUpdate: (list: any[]) => void) {
  return firestore()
    .collection('transactions')
    .where('userId', '==', uid)
    .where('status', '==', 'approved')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .onSnapshot(querySnapshot => {
      const txList = querySnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onUpdate(txList || []);
    }, err => console.error("Tx Sub Error:", err));
}