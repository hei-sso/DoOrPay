import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function WalletScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.walletHeader}>
        <Text style={styles.walletLabel}>포인트 보유 현황</Text>
        <Text style={styles.balance}>6,400 포인트</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>충전하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>출금</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>최근 내역</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.historyItem}>
            <View>
              <Text style={styles.historyName}>독서 챌린지 보상</Text>
              <Text style={styles.historyDate}>2026.03.24</Text>
            </View>
            <Text style={styles.historyAmount}>+500 포인트</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  walletHeader: {
    padding: 30,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6'
  },
  walletLabel: {
    fontSize: 15,
    color: '#4E5968',
    marginBottom: 8
  },
  balance: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1F27',
    marginBottom: 24
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#3182F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  secondaryBtn: {
    width: 80,
    backgroundColor: '#E8F3FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: '#1B64DA',
    fontWeight: 'bold'
  },
  historySection: {
    padding: 24
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  historyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333D4B'
  },
  historyDate: {
    fontSize: 13,
    color: '#8B95A1',
    marginTop: 4
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3182F6'
  }
});