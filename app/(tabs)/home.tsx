import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F4F6' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 상단 프로필 & 알림 */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.userTitle}>김OO님의</Text>
            <Text style={styles.mainTitle}>오늘의 습관</Text>
          </View>
          <TouchableOpacity style={styles.notiBtn}>
            <Ionicons name="notifications-outline" size={24} color="#1A1F27" />
          </TouchableOpacity>
        </View>

        {/* 리스크 보드 카드 (현재 진행 상황) */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>현재 걸려있는 포인트</Text>
            <View style={styles.tag}><Text style={styles.tagText}>진행중</Text></View>
          </View>
          <Text style={styles.riskAmount}>5,000 포인트</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressInfo}>오늘 10개 중 6개 달성</Text>
        </View>

        {/* 챌린지 섹션 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>그룹 챌린지 🔥</Text>
          <TouchableOpacity><Text style={styles.moreText}>전체보기</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.challengeItem}>
          <View style={styles.itemEmoji}><Text style={{fontSize: 24}}>🏃‍♂️</Text></View>
          <View style={{flex: 1}}>
            <Text style={styles.itemTitle}>아침 7시 기상 인증</Text>
            <Text style={styles.itemSub}>총 2,500 포인트 대기 중</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D6DB" />
        </TouchableOpacity>
      </ScrollView>

      {/* 우측 하단 플로팅 버튼(목표 생성 바로가기) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/create-goal')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
    '#F2F4F6'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40
  },
  userTitle: {
    fontSize: 16,
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
  riskCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  riskLabel: {
    fontSize: 14,
    color: '#8B95A1'
  },
  tag: {
    backgroundColor: '#E8F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  tagText: {
    color: '#1B64DA',
    fontSize: 12,
    fontWeight: 'bold'
  },
  riskAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#1A1F27'
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F2F4F6',
    borderRadius: 4,
    marginTop: 8
  },
  progressFill: {
    height: 8,
    backgroundColor: '#3182F6',
    borderRadius: 4
  },
  progressInfo: {
    marginTop: 12,
    color: '#4E5968',
    fontSize: 13
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
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
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12
  },
  itemEmoji: {
    width: 50,
    height: 50,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
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
  // FAB 스타일
  fab: {
    position: 'absolute',
    bottom: 135, // 탭바 위로 배치
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3182F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5
  }
});