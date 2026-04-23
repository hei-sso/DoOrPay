import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { subscribeToMyGoals } from '@/services/goalApi';
import { subscribeToMyChallenges } from '@/services/challengeApi';

export default function GoalTabScreen() {
  const router = useRouter();

  const [personalGoals, setPersonalGoals] = useState<any[]>([]);
  const [groupChallenges, setGroupChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    // 1. 개인 목표 구독
    const unsubGoals = subscribeToMyGoals(user.uid, (list) => {
      setPersonalGoals(list);
    });

    // 2. 그룹 챌린지 구독
    const unsubChallenges = subscribeToMyChallenges(user.uid, (list) => {
      setGroupChallenges(list);
    });

    // 약간의 딜레이 후 로딩 해제 (스켈레톤 UI를 넣으면 더 좋아!)
    setTimeout(() => setLoading(false), 500);

    return () => {
      unsubGoals();
      unsubChallenges();
    };
  }, []);

  // 두 배열을 합치고 최신 생성일 기준으로 정렬
  const combinedGoals = [...personalGoals, ...groupChallenges].sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

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
        
        {loading ? (
          <ActivityIndicator size="large" color="#3182F6" style={{ marginTop: 20 }} />
        ) : combinedGoals.length === 0 ? (
           <Text style={{ textAlign: 'center', color: '#8B95A1', marginTop: 20 }}>
             진행 중인 목표가 없어요. 새로운 도전을 시작해 보세요!
           </Text>
        ) : (
          combinedGoals.map((goal) => {
            const isGroup = goal.type === 'group';
            // 표시할 금액 (개인은 stakeAmount, 그룹은 내 개인 stakeAmount가 따로 없으면 totalStake 표시)
            const displayAmount = goal.stakeAmount || goal.totalStake || 0;

            return (
              <TouchableOpacity 
                key={goal.id} 
                style={styles.goalItemCard}
                onPress={() =>
                  router.push({
                    pathname: isGroup ? '/challenge-detail' : '/goal-detail',
                    params: { ...goal }
                  })
                }
              >
                <View style={styles.goalEmojiBox}>
                  <Text style={{ fontSize: 20 }}>{goal.emoji || (goal.type === 'group' ? '🔥' : '💧')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <View style={[
                      styles.typeBadge, 
                      { backgroundColor: isGroup ? '#FFF0F0' : '#E8F3FF' }
                    ]}>
                      <Text style={[
                        styles.typeBadgeText, 
                        { color: isGroup ? '#FF5252' : '#3182F6' }
                      ]}>
                        {isGroup ? '그룹' : '개인'}
                      </Text>
                    </View>
                    <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  </View>
                  <Text style={styles.goalSub}>{displayAmount.toLocaleString()} 포인트 예치 중</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#D1D6DB" />
              </TouchableOpacity>
            )
          })
        )}
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