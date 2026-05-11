import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AmountInputModal from '@/components/AmountInputModal';
import { createChargeOrder, subscribeToWallet, subscribeToTransactions } from '@/services/walletApi';

// Wallet 구조 정의
interface WalletData {
  balance: number;
  locked: number;
}

// Transaction 구조 정의
interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'stake' | 'reward';
  amount: number;
  referenceId?: string;
  createdAt: any; 
}

export default function WalletScreen() {
  const router = useRouter();

  // 상태 관리
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 및 입력 상태
  const [isChargeVisible, setIsChargeVisible] = useState(false);
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsubWallet = subscribeToWallet(user.uid, (data) => setWallet(data));
    const unsubTx = subscribeToTransactions(user.uid, (list) => {
      setTransactions(list);
      setLoading(false);
    });

    return () => { unsubWallet(); unsubTx(); };
  }, []);

  // 충전 요청 처리
  const handleRequestCharge = async () => {
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 100) {
      Alert.alert("알림", "최소 100원 이상 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setIsChargeVisible(false);

      const result = await createChargeOrder(amount);

      router.push({
        pathname: '/payment' as any,
        params: {
          orderId: result.orderId,
          amount: result.amount,
          orderName: result.orderName,
          customerName: auth().currentUser?.displayName || '사용자',
        }
      });
    } catch (error: any) {
      Alert.alert("충전 요청 실패", error.message);
    } finally {
      setLoading(false);
      setInputAmount('');
    }
  };

  // 출금 요청 처리
  const handleRequestWithdraw = () => {
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("알림", "올바른 금액을 입력해주세요.");
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      Alert.alert("잔액 부족", "보유 포인트가 부족합니다.");
      return;
    }

    Alert.alert("출금 신청", `${amount.toLocaleString()} 포인트를 출금하시겠습니까?`);
    setIsWithdrawVisible(false);
    setInputAmount('');
  };

  if (loading && !wallet) return <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.walletHeader}>
        <Text style={styles.walletLabel}>포인트 보유 현황</Text>
        <Text style={styles.balance}>
          {wallet?.balance?.toLocaleString() || 0} P
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { setInputAmount(''); setIsChargeVisible(true); }}
          >
            <Text style={styles.primaryBtnText}>충전하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => { setInputAmount(''); setIsWithdrawVisible(true); }}
          >
            <Text style={styles.secondaryBtnText}>출금</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>최근 내역</Text>
        {transactions.length === 0 ? (
          <Text style={styles.historyEmptyText}>거래 내역이 없습니다...</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyName}>
                  {tx.type === 'deposit' ? '포인트 충전' : 
                   tx.type === 'withdraw' ? '포인트 출금' :
                   tx.type === 'stake' ? '목표 예치' : '상금 입금'}
                </Text>
                <Text style={styles.historyDate}>
                  {tx.createdAt?.toDate().toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.historyAmount,
                { color: (tx.type === 'deposit' || tx.type === 'reward') ? '#3182F6' : '#F04452' }
              ]}>
                {(tx.type === 'deposit' || tx.type === 'reward') ? '+' : '-'}{tx.amount?.toLocaleString()} P
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 충전 모달 */}
      <AmountInputModal 
        visible={isChargeVisible}
        onClose={() => setIsChargeVisible(false)}
        onSubmit={handleRequestCharge}
        title="얼마를 충전할까요?"
        buttonText="충전하기"
        amount={inputAmount}
        setAmount={setInputAmount}
      />

      {/* 출금 모달 */}
      <AmountInputModal 
        visible={isWithdrawVisible}
        onClose={() => setIsWithdrawVisible(false)}
        onSubmit={handleRequestWithdraw}
        title="얼마를 출금할까요?"
        buttonText="출금하기"
        amount={inputAmount}
        setAmount={setInputAmount}
      />
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
  historyEmptyText: {
    fontSize: 18
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