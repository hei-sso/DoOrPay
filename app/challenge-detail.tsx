import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// API
import { subscribeToChallengeMembers } from '@/services/challengeApi';
import { inviteMember } from '@/services/inviteApi';
import { submitVerification, subscribeToVerifications, uploadImageToStorage } from '@/services/verificationApi';

// Components
import InviteMemberModal from '@/components/InviteMemberModal';
import MembersModal from '@/components/MembersModal';

// Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { id, title, amount, emoji, creatorId } = useLocalSearchParams(); 

  // 유저 및 권한 상태
  const currentUser = auth().currentUser;
  const currentUid = currentUser?.uid;
  const isLeader = currentUid === creatorId;

  // 데이터 상태 관리
  const [realData, setRealData] = useState<any>(null); // 챌린지 상세 정보
  const [members, setMembers] = useState<any[]>([]); // 참가자 목록
  const [history, setHistory] = useState<any[]>([]); // 인증 히스토리

  // UI 상태 관리
  const [isInviteVisible, setIsInviteVisible] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [targetUid, setTargetUid] = useState('');

  // 실제 데이터 및 히스토리 구독
  useEffect(() => {
    if (!id) return;

    // 챌린지 기본 정보 구독
    const unsubChallenge = firestore().collection('challenges').doc(id as string).onSnapshot(doc => {
      if (doc.exists()) setRealData(doc.data());
    });

    // 참가자 목록 구독
    const unsubMembers = subscribeToChallengeMembers(id as string, (data) => {
      setMembers(data);
    });

    // 인증 히스토리 구독
    const unsubHistory = subscribeToVerifications(id as string, (data) => {
      setHistory(data);
    });

    return () => {
      unsubChallenge();
      unsubMembers();
      unsubHistory();
    };
  }, [id]);

  // 날짜 변환 헬퍼 (Timestamp -> YYYY.MM.DD)
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  // 진행일 계산 헬퍼
  const calculateDays = (startTs: any, endTs: any) => {
    if (!startTs || !endTs) return 0;
    return Math.floor((endTs.toDate() - startTs.toDate()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // 멤버 초대 로직
  const handleInviteSubmit = async (uid: string) => {
    if(!uid.trim()) {
      Alert.alert("알림", "초대할 사용자의 UID를 입력해주세요.");
      return;
    }
    try {
      setIsInviting(true);
      // challengeId와 입력받은 상대방 UID를 넘겨줌
      await inviteMember(id as string, uid);
      Alert.alert("초대 완료", "성공적으로 그룹 초대장을 보냈습니다.");
      setIsInviteVisible(false);
      setTargetUid('');
    } catch (error: any) {
      Alert.alert("초대 실패", error.message);
    } finally {
      setIsInviting(false);
    }
  };

  // 이미지 업로드 로직 (카메라/갤러리 선택)
  const handleUploadClick = () => {
    Alert.alert(
      "인증 사진 올리기",
      "사진을 가져올 방식을 선택해주세요.",
      [
        { text: "카메라로 촬영", onPress: openCamera },
        { text: "갤러리에서 선택", onPress: openGallery },
        { text: "취소", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

  // 스토리지 업로드
  const processImage = async (uri: string) => {
    try {
      setIsUploading(true);
      // 1. Firebase Storage에 사진 업로드
      const imageUrl = await uploadImageToStorage(uri, id as string);

      // 2. 백엔드 호출해서 verifications 컬렉션에 기록 남기기
      await submitVerification(id as string, 'challenge', imageUrl);

      Alert.alert("사진 제출 완료!", "심사 결과를 조금만 기다려주세요! ⏳");
    } catch (error: any) {
      Alert.alert("사진 제출 실패", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 화면 표시용 데이터 정리
  const startDate = realData?.startDate ? formatDate(realData.startDate) : '-';
  const endDate = realData?.endDate ? formatDate(realData.endDate) : '-';
  const totalDays = calculateDays(realData?.startDate, realData?.endDate);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>목표 상세</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsMembersVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1F27" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 요약 섹션 */}
        <View style={styles.topSection}>
          <View style={styles.emojiCircle}>
            <Text style={{ fontSize: 40 }}>{realData?.emoji || emoji || '🎯'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#FFF0F0' }]}>
            <Text style={[styles.badgeText, { color: '#FF5252' }]}>그룹 챌린지</Text>
          </View>
          <Text style={styles.mainTitle}>{realData?.title || title}</Text>
          <Text style={styles.descriptionText}>{realData?.description || "매일 인증샷을 찍어 목표를 달성하세요!"}</Text>
        </View>

        {/* 방장 관리 영역 */}
        {isLeader && (
          <>
            <View style={styles.leaderCard}>
              <View style={styles.leaderHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#1B64DA" />
                <Text style={styles.leaderTitleText}>그룹 관리자 전용</Text>
              </View>
              <TouchableOpacity style={styles.inviteBtn} onPress={() => setIsInviteVisible(true)} disabled={isInviting}>
                {isInviting ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <><Ionicons name="person-add" size={18} color="#FFF" /><Text style={styles.inviteBtnText}>새 멤버 초대하기</Text></>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* 대시보드 */}
        <View style={styles.dashboard}>
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>인당 예치금</Text>
            <Text style={styles.dashValue}>{(realData?.stakePerUser || Number(amount) || 0).toLocaleString()} P</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>진행 기간</Text>
            <Text style={styles.dashValue}>{totalDays}일간</Text>
          </View>
        </View>

        {/* 상세 일정 섹션 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>시작일</Text>
            <Text style={styles.infoValue}>{startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>종료일</Text>
            <Text style={styles.infoValue}>{endDate}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="people-outline" size={20} color="#FF5252" />
            <Text style={styles.infoLabel}>참여 인원</Text>
            <Text style={[styles.infoValue, { color: '#FF5252', fontWeight: 'bold' }]}>{members.length}명 진행 중</Text>
          </View>
        </View>

        {/* 인증 히스토리 갤러리 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>그룹 인증 기록</Text>
          <TouchableOpacity><Text style={styles.moreText}>전체보기</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {history.length === 0 ? (
             <Text style={{color: '#8B95A1', marginTop: 20, marginLeft: 10}}>아직 인증 기록이 없어요.</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Image 
                  source={{ uri: item.img }} 
                  style={[
                    styles.historyImg,
                    // 반려되었을 때만 이미지에 빨간 테두리 살짝
                    item.status === 'rejected' && { borderColor: '#FF5252', borderWidth: 2 } 
                  ]} 
                />
                
                {/* 이미지 우측 상단 상태 뱃지 */}
                <View style={styles.statusBadge}>
                  {item.status === 'approved' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                  {item.status === 'rejected' && <Ionicons name="close-circle" size={20} color="#FF5252" />}
                  {item.status === 'pending' && <ActivityIndicator size="small" color="#FF9800" />}
                </View>

                <View style={styles.historyDateBadge}>
                  <Text style={styles.historyDateText}>{item.date}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>

      {/* 참가자 목록 모달 */}
      <MembersModal 
        visible={isMembersVisible}
        onClose={() => setIsMembersVisible(false)}
        members={members}
      />

      {/* 초대 모달 */}
      <InviteMemberModal 
        visible={isInviteVisible}
        onClose={() => setIsInviteVisible(false)}
        onSubmit={handleInviteSubmit}
        uid={targetUid}
        setUid={setTargetUid}
      />

      {/* 하단 고정 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadClick} disabled={isUploading}>
          {isUploading ? <ActivityIndicator color="#FFF" /> : (
            <><Ionicons name="camera" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>오늘의 인증 사진 올리기</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: '#FFF' 
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  scrollContent: {
    paddingBottom: 160
  },
  
  // 상단 요약
  topSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingBottom: 32
  },
  emojiCircle: { 
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F27',
    marginBottom: 8
  },
  descriptionText: {
    fontSize: 15,
    color: '#8B95A1'
  },

  // 방장 전용 카드
  leaderCard: {
    backgroundColor: '#E8F3FF',
    margin: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D0E4FF'
  },
  leaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  leaderTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B64DA',
    marginLeft: 6
  },
  inviteBtn: {
    backgroundColor: '#3182F6',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inviteBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8
  },
  divider: {
    height: 1,
    backgroundColor: '#c2c2c2',
    marginHorizontal: 24,
    marginBottom: 8,
  },

  // 대시보드
  dashboard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 24, 
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  dashItem: {
    flex: 1,
    alignItems: 'center'
  },
  dashLabel: {
    fontSize: 13,
    color: '#8B95A1',
    marginBottom: 4
  },
  dashValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3182F6'
  },
  dashDivider: {
    width: 1,
    backgroundColor: '#F2F4F6',
    marginHorizontal: 10
  },

  // 상세 정보 카드
  infoCard: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 24,
    padding: 20
  },
  infoRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB'
  },
  infoLabel: {
    fontSize: 15,
    color: '#4E5968',
    marginLeft: 12,
    flex: 1
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1F27',
    fontWeight: '500'
  },

  // 갤러리 섹션 스타일
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  moreText: {
    color: '#8B95A1',
    fontSize: 14
  },
  gallery: {
    paddingLeft: 20,
    paddingRight: 10
  },
  historyItem: {
    marginRight: 12,
    alignItems: 'center'
  },
  historyImg: {
    width: 110,
    height: 150,
    borderRadius: 16,
    backgroundColor: '#E5E8EB'
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
    elevation: 2, 
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  historyDateBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  historyDateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  },

  // 하단 버튼
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 24, 
    paddingBottom: 60, 
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  uploadBtn: { 
    backgroundColor: '#3182F6', 
    flexDirection: 'row', 
    paddingVertical: 18, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});