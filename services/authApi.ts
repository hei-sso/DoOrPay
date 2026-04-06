import auth from '@react-native-firebase/auth';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

export const authApi = {
  // 프로필 정보 업데이트
  updateUserProfile: async (data: { nickname: string; phone: string; birth: string }) => {
    const user = auth().currentUser;
    if (!user) throw new Error("로그인이 필요합니다.");

    const idToken = await user.getIdToken();

    const response = await fetch(`${BASE_URL}/updateUserProfile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        nickname: data.nickname,
        phone: data.phone,
        birth: data.birth
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '프로필 업데이트 실패');
    return result;
  }
};