import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function GoalTabScreen() {
  const router = useRouter();

  // Mock 데이터
  const myGoals = [
    { id: 'goal_1', title: '매일 물 2L 마시기', type: 'personal', amount: 5000, emoji: '💧' },
    { id: 'goal_2', title: '아침 7시 기상 인증', type: 'group', amount: 2500, emoji: '⏰' },
    { id: 'goal_3', title: '하루 1만보 걷기', type: 'personal', amount: 10000, emoji: '👟' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>목표 관리</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 130 }}>
        <Text style={styles.sectionTitle}>새로운 도전을 시작해보세요!</Text>
        
        {/* 개인 목표 생성 카드 */}
        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/create-goal')}>
          <View style={styles.cardIconBox}><Ionicons name="person" size={24} color="#3182F6" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>개인 목표 만들기</Text>
            <Text style={styles.cardSub}>나만의 습관을 만들고 포인트를 걸어보세요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D6DB" />
        </TouchableOpacity>

        {/* 그룹 챌린지 생성 카드 */}
        <TouchableOpacity style={styles.createCard} onPress={() => router.push('/create-challenge')}>
          <View style={[styles.cardIconBox, { backgroundColor: '#FFF0F0' }]}><Ionicons name="people" size={24} color="#FF5252" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>그룹 챌린지 만들기</Text>
            <Text style={styles.cardSub}>친구들과 함께 상금을 걸고 경쟁하세요.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D6DB" />
        </TouchableOpacity>

        {/* 진행 중인 목표 리스트 */}
        <Text style={[styles.sectionTitle, { marginTop: 40 }]}>진행 중인 내 목표</Text>
        
        {myGoals.map((goal) => (
          <TouchableOpacity 
            key={goal.id} 
            style={styles.goalItemCard}
            onPress={() => router.push({
              pathname: '/goal-detail' as any,
              params: { ...goal }
            })}
          >
            <View style={styles.goalEmojiBox}>
              <Text style={{ fontSize: 20 }}>{goal.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                {/* 타입 배지 추가 */}
                <View style={[
                  styles.typeBadge, 
                  { backgroundColor: goal.type === 'group' ? '#FFF0F0' : '#E8F3FF' }
                ]}>
                  <Text style={[
                    styles.typeBadgeText, 
                    { color: goal.type === 'group' ? '#FF5252' : '#3182F6' }
                  ]}>
                    {goal.type === 'group' ? '그룹' : '개인'}
                  </Text>
                </View>
                <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
              </View>
              <Text style={styles.goalSub}>{goal.amount.toLocaleString()} 포인트 예치 중</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#D1D6DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
  },
  header: {
    padding: 30,
    paddingTop: 60,
    backgroundColor: '#FFF'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F27',
    marginBottom: 16
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333D4B',
    marginBottom: 4
  },
  cardSub: {
    fontSize: 13,
    color: '#8B95A1'
  },
  
  // 진행 중인 목표 아이템
  goalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12
  },
  goalEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333D4B',
    flex: 1
  },
  goalSub: {
    fontSize: 13,
    color: '#8B95A1'
  }
});