import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import InviteMemberModal from '../components/InviteMemberModal';

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id, title, type, amount, emoji, leaderId } = useLocalSearchParams();
  
  // UI 테스트를 위해 현재 유저 UID를 leader_uid_123으로 가정
  // leaderId가 'leader_uid_123'으로 넘어오면 방장 메뉴가 활성화됨
  const currentUid = 'leader_uid_123';
  const isLeader = type === 'group' && currentUid === leaderId;

  // 모달 상태 관리
  const [isInviteVisible, setIsInviteVisible] = useState(false);
  const [targetUid, setTargetUid] = useState('');

  // Mock 데이터
  const [goalDetail] = useState({
    startDate: '2026.04.01',
    endDate: '2026.05.30',
    totalDays: 30,
    currentStreak: 12,
    depositedPoints: Number(amount) || 0,
    description: "매일 인증샷을 찍어 목표를 달성하세요!",
    history: [
      { id: 'h1', date: '04.11', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200' },
      { id: 'h2', date: '04.10', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200' },
      { id: 'h3', date: '04.09', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200' },
    ]
  });

  const handleInviteSubmit = (uid: string) => {
    if(!uid.trim()) {
      Alert.alert("알림", "초대할 사용자의 UID를 입력해주세요.");
      return;
    }
    Alert.alert("초대 완료 (Mock)", `${uid}님에게 그룹 초대장을 보냈습니다.`);
    setIsInviteVisible(false);
    setTargetUid('');
  };

  const handleUploadImage = () => {
    Alert.alert("인증하기", "갤러리에서 오늘 인증 사진을 선택하시겠습니까?");
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1F27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>목표 상세</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1A1F27" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 요약 섹션 */}
        <View style={styles.topSection}>
          <View style={styles.emojiCircle}>
            <Text style={{ fontSize: 40 }}>{emoji || '🎯'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: type === 'group' ? '#FFF0F0' : '#E8F3FF' }]}>
            <Text style={[styles.badgeText, { color: type === 'group' ? '#FF5252' : '#3182F6' }]}>
              {type === 'group' ? '그룹 챌린지' : '개인 목표'}
            </Text>
          </View>
          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.descriptionText}>{goalDetail.description}</Text>
        </View>

        {/* 방장 전용 관리 카드 (isLeader가 true일 때만 노출) */}
        {isLeader && (
          <>
            <View style={styles.leaderCard}>
              <View style={styles.leaderHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#1B64DA" />
                <Text style={styles.leaderTitleText}>그룹 관리자 전용</Text>
              </View>
              <TouchableOpacity 
                style={styles.inviteBtn} 
                onPress={() => setIsInviteVisible(true)}
              >
                <Ionicons name="person-add" size={18} color="#FFF" />
                <Text style={styles.inviteBtnText}>새 멤버 초대하기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* 대시보드 */}
        <View style={styles.dashboard}>
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>예치 포인트</Text>
            <Text style={styles.dashValue}>{goalDetail.depositedPoints.toLocaleString()} P</Text>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashItem}>
            <Text style={styles.dashLabel}>진행 기간</Text>
            <Text style={styles.dashValue}>{goalDetail.totalDays}일간</Text>
          </View>
        </View>

        {/* 상세 일정 섹션 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>시작일</Text>
            <Text style={styles.infoValue}>{goalDetail.startDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={20} color="#8B95A1" />
            <Text style={styles.infoLabel}>종료일</Text>
            <Text style={styles.infoValue}>{goalDetail.endDate}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="flame-outline" size={20} color="#FF5252" />
            <Text style={styles.infoLabel}>현재</Text>
            <Text style={[styles.infoValue, { color: '#FF5252', fontWeight: 'bold' }]}>
              {goalDetail.currentStreak}일째 연속 성공 중!
            </Text>
          </View>
        </View>

        {/* 인증 히스토리 갤러리 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 인증 기록</Text>
          <TouchableOpacity><Text style={styles.moreText}>전체보기</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {goalDetail.history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Image source={{ uri: item.img }} style={styles.historyImg} />
              <View style={styles.historyDateBadge}>
                <Text style={styles.historyDateText}>{item.date}</Text>
              </View>
            </View>
          ))}
          {/* 사진이 더 많아지면 여기에 추가 */}
        </ScrollView>
      </ScrollView>

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
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage}>
          <Ionicons name="camera" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.uploadBtnText}>오늘의 인증 사진 올리기</Text>
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