import auth from '@react-native-firebase/auth';

const BASE_URL = 'https://asia-northeast3-do-or-pay-ac3a9.cloudfunctions.net';

async function getAuthToken(): Promise<string> {
  const user = auth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.getIdToken();
}

// 내 초대장 목록 가져오기
export async function fetchMyInvitations() {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/getMyInvitations`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '초대장 목록을 불러오지 못했습니다.');
  return result.invitations;
}

// 특정 유저를 챌린지에 초대하기
export async function inviteMember(challengeId: string, toUid: string) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/inviteChallengeMember`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ challengeId, toUid }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '초대에 실패했습니다.');
  return result;
}

// 초대장 수락 또는 거절하기
export async function respondToInvite(invitationId: string, action: 'accepted' | 'rejected') {
  const token = await getAuthToken();
  const response = await fetch(`${BASE_URL}/respondChallengeInvite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ invitationId, action }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '초대장 처리에 실패했습니다.');
  return result;
}