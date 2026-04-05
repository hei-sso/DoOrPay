import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function GoalTabScreen() {
  const router = useRouter();

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

        <Text style={[styles.sectionTitle, { marginTop: 40 }]}>진행 중인 내 목표</Text>
        {/* 진행 중인 목표 리스트 */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>현재 진행 중인 목표가 없습니다.</Text>
        </View>
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
    paddingTop: 35,
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
    marginBottom: 16
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFF',
    borderRadius: 20
  },
  emptyText: {
    color: '#8B95A1',
    fontSize: 14
  }
});