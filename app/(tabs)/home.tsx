import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { subscribeToMyChallenges } from '@/services/challengeApi';
import { fetchMyInvitations, respondToInvite } from '@/services/inviteApi';

// Components
import NotificationModal from '@/components/NotificationModal';

// Firebase
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [userData, setUserData] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotiVisible, setIsNotiVisible] = useState(false);
  
  // 선택된 날짜 상태 (기본값: 오늘)
  const [selectedDate, setSelectedDate] = useState('');

  // 초대장
  const [invites, setInvites] = useState<any[]>([]);

  // 초대장 목록 불러오기 함수
  const loadInvites = async () => {
    try {
      const data = await fetchMyInvitations();
      // 'pending' 상태인 초대장만 필터링해서 보여주기
      const pendingInvites = data.filter((inv: any) => inv.status === 'pending');
      setInvites(pendingInvites);
    } catch (error) {
      console.error("초대장 불러오기 실패:", error);
    }
  };

  // 언어 변경 감지 및 달력 언어 업데이트
  useEffect(() => {
    // 사용자가 설정을 통해 언어를 바꾸면(ko <-> en), 달력도 즉시 바뀜
    LocaleConfig.defaultLocale = i18n.language; 
  }, [i18n.language]);

  // 화면이 포커스될 때마다(다른 화면 갔다가 홈으로 돌아올 때) 초대장 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [])
  );

  useEffect(() => {
    // 변수 선언: 리턴 함수(cleanup)에서도 볼 수 있게
    let unsubUser: (() => void) | undefined;
    let unsubChallenges: (() => void) | undefined;

    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // 유저 데이터 구독
    unsubUser = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc?.exists()) setUserData(doc.data());
      }, err => console.error("유저 구독 에러:", err));

    // 챌린지 목록 구독
    unsubChallenges = subscribeToMyChallenges(
      user.uid, 
      (list) => {
        setChallenges(list);
        setLoading(false); // 데이터 로드 성공 시 로딩 해제
      }
    );

    // 초대장 불러오기 (실패해도 화면 로딩에 지장 없게 처리)
    loadInvites().catch(err => console.log("초대장 로딩 무시:", err));

    // [안전장치] 3초 뒤에도 로딩이 안 풀리면 강제로 풀기
    const timeout = setTimeout(() => setLoading(false), 3000);

    return () => { 
      // ?를 붙여서 정의되었을 때만 실행되게 함
      unsubUser?.(); 
      unsubChallenges?.();
      clearTimeout(timeout);
    };
  }, []);

  // 초대장 수락/거절 핸들러
  const handleRespondToInvite = async (invitationId: string, action: 'accepted' | 'rejected') => {
    try {
      await respondToInvite(invitationId, action);
      Alert.alert(t('tabs.home.alert_title'), action === 'accepted' ? t('tabs.home.invite_accept') : t('tabs.home.invite_reject'));
      
      // 처리 완료된 초대장을 화면에서 즉시 제거
      setInvites(prev => prev.filter(inv => inv.invitationId !== invitationId));
      
      // 수락했을 경우 내 챌린지 목록이 갱신되어야 하므로 모달을 닫아줌
      if (action === 'accepted') {
        setIsNotiVisible(false);
      }
    } catch (error: any) {
      Alert.alert(t('tabs.home.alert_error'), error.message || t('tabs.home.invite_fail'));
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F4F6' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 상단 프로필 & 알림 */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.userTitle}>{userData?.nickname || 'User'}{t('tabs.home.user_suffix')}</Text>
            <Text style={styles.mainTitle}>{t('tabs.home.main_title')}</Text>
          </View>
          <TouchableOpacity style={styles.notiBtn} onPress={() => setIsNotiVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color="#1A1F27" />
            {/* 초대장이 있을 때만 빨간 점 표시 */}
            {invites.length > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>
        </View>

        {/* 한 달 치 달력 카드 */}
        <View style={styles.calendarWrapper}>
          <Calendar
            // 한국 시간에 맞춘 오늘 날짜 초기화 (YYYY-MM-DD)
            current={new Date().toISOString().split('T')[0]}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: '#3182F6' }
            }}
            theme={{
              backgroundColor: '#FFF',
              calendarBackground: '#FFF',
              textSectionTitleColor: '#8B95A1',
              selectedDayBackgroundColor: '#3182F6',
              selectedDayTextColor: '#FFF',
              todayTextColor: '#3182F6',
              dayTextColor: '#4E5968',
              textDisabledColor: '#D1D6DB',
              arrowColor: '#1A1F27',
              monthTextColor: '#1A1F27',
              textMonthFontWeight: 'bold',
              textDayFontSize: 15,
              textMonthFontSize: 18,
            }}
            // 달력 헤더 월 포맷 (예: 2026년 4월)
            monthFormat={t('tabs.home.month_format')}
          />
        </View>

        {/* 리스크 보드 카드 */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>{t('tabs.home.deposit_label')}</Text>
          </View>
          {/* wallet 필드 접근 시 오류 방지 */}
          <Text style={styles.riskAmount}>
            {userData?.wallet?.locked?.toLocaleString() || 0} P
          </Text>
        </View>

        {/* 그룹 챌린지 섹션 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('tabs.home.group_challenge')}</Text>
          <TouchableOpacity><Text style={styles.moreText}>{t('tabs.home.view_all')}</Text></TouchableOpacity>
        </View>

        {challenges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('tabs.home.empty_challenges')}</Text>
          </View>
        ) : (
          challenges.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.challengeItem}
              onPress={() => router.push({
                pathname: '/challenge-detail' as any,
                params: { ...item }
              })}
            >
              <View style={styles.itemEmoji}>
                <Text style={{fontSize: 24}}>{item.emoji || '🔥'}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{t('tabs.home.total_stake', { amount: item.totalStake?.toLocaleString() || 0 })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D6DB" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 알림 모달 연결 */}
      <NotificationModal 
        visible={isNotiVisible} 
        onClose={() => setIsNotiVisible(false)} 
        invites={invites} 
        onRespond={handleRespondToInvite}
      />

      {/* 우측 하단 플로팅 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-goal')}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20
  },
  userTitle: {
    fontSize: 15,
    color: '#4E5968'
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  notiBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  // 달력
  calendarWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: '#FFF',
    overflow: 'hidden', // 모서리 둥글게
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  // 리스크 보드 카드
  riskCard: {
    alignSelf: 'center',
    width: '90%', 
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 10
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  riskLabel: {
    fontSize: 13,
    color: '#8B95A1'
  },
  riskAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#1A1F27',
    textAlign: 'right'
  },
  // 섹션 & 리스트
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
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
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12
  },
  itemEmoji: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333D4B'
  },
  itemSub: {
    fontSize: 13,
    color: '#8B95A1',
    marginTop: 4
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#8B95A1',
    fontSize: 15
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3182F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8
  }
});