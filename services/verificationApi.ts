import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

// 1. Firebase Storage에 이미지 업로드
export async function uploadImageToStorage(uri: string, targetId: string): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');

  // 파일명 생성 (예: 1682392039123.jpg)
  const extension = uri.split('.').pop() || 'jpg';
  const filename = `${Date.now()}.${extension}`;
  const path = `verifications/${user.uid}/${targetId}/${filename}`;
  
  const uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
  const storageRef = storage().ref(path);
  
  await storageRef.putFile(uploadUri);
  return await storageRef.getDownloadURL(); // 업로드된 이미지의 웹 URL 반환
}

// 2. 백엔드에 인증 기록 생성 요청 (verifications 컬렉션에 저장)
export async function submitVerification(targetId: string, type: 'goal' | 'challenge', imageUrl: string) {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  const token = await user.getIdToken();

  const response = await fetch(`${BASE_URL}/createVerification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ targetId, type, imageUrl }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '인증 처리에 실패했습니다.');
  return result;
}

// 3. 해당 목표/챌린지의 인증 히스토리 구독
export function subscribeToVerifications(targetId: string, onUpdate: (history: any[]) => void) {
  return firestore()
    .collection('verifications')
    .where('targetId', '==', targetId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const history = snapshot?.docs.map(doc => {
        const data = doc.data();
        // 날짜 포맷 (예: 04.11)
        const dateStr = data.createdAt ? 
          new Date(data.createdAt.toDate()).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '오늘';
        
        return { id: doc.id, date: dateStr, img: data.imageUrl, ...data };
      }) || [];
      onUpdate(history);
    }, err => console.error("Verifications Sub Error:", err));
}