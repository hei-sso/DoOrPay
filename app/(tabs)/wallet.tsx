import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { createChargeOrder, subscribeToTransactions, subscribeToWallet } from '@/services/walletApi';

// Components
import AmountInputModal from '@/components/AmountInputModal';

// Firebase
import auth from '@react-native-firebase/auth';

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
  const { t } = useTranslation();

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
      Alert.alert(t('tabs.home.alert_title'), t('tabs.wallet.alert_min_amount'));
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
          customerName: auth().currentUser?.displayName || t('tabs.wallet.default_user_name'),
        }
      });
    } catch (error: any) {
      Alert.alert(t('tabs.wallet.alert_fail_charge'), error.message);
    } finally {
      setLoading(false);
      setInputAmount('');
    }
  };

  // 출금 요청 처리
  const handleRequestWithdraw = () => {
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('tabs.home.alert_title'), t('tabs.wallet.alert_wrong_amount'));
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      Alert.alert(t('tabs.home.alert_title'), t('tabs.wallet.alert_insufficient'));
      return;
    }

    Alert.alert(t('tabs.wallet.withdraw'), t('tabs.wallet.confirm_withdraw', { amount: amount.toLocaleString() }));
    setIsWithdrawVisible(false);
    setInputAmount('');
  };

  if (loading && !wallet) return <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tabs.wallet.title')}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.walletHeader}>
          <Text style={styles.walletLabel}>{t('tabs.wallet.status')}</Text>
          <Text style={styles.balance}>
            {wallet?.balance?.toLocaleString() || 0} P
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => { setInputAmount(''); setIsChargeVisible(true); }}
            >
              <Text style={styles.primaryBtnText}>{t('tabs.wallet.charge')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => { setInputAmount(''); setIsWithdrawVisible(true); }}
            >
              <Text style={styles.secondaryBtnText}>{t('tabs.wallet.withdraw')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>{t('tabs.wallet.history')}</Text>
          {transactions.length === 0 ? (
            <Text style={styles.historyEmptyText}>{t('tabs.wallet.empty')}</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyName}>
                    {tx.type === 'deposit' ? t('tabs.wallet.type_deposit') :
                     tx.type === 'withdraw' ? t('tabs.wallet.type_withdraw') :
                     tx.type === 'stake' ? t('tabs.wallet.type_stake') : t('tabs.wallet.type_reward')}
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
      </ScrollView>

      {/* 충전 모달 */}
      <AmountInputModal 
        visible={isChargeVisible}
        onClose={() => setIsChargeVisible(false)}
        onSubmit={handleRequestCharge}
        title={t('tabs.wallet.modal_charge_title')}
        buttonText={t('tabs.wallet.charge')}
        amount={inputAmount}
        setAmount={setInputAmount}
      />

      {/* 출금 모달 */}
      <AmountInputModal 
        visible={isWithdrawVisible}
        onClose={() => setIsWithdrawVisible(false)}
        onSubmit={handleRequestWithdraw}
        title={t('tabs.wallet.modal_withdraw_title')}
        buttonText={t('tabs.wallet.withdraw')}
        amount={inputAmount}
        setAmount={setInputAmount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6'
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F27'
  },
  scrollContainer: {
    flex: 1,
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