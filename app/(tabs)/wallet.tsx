import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AmountInputModal from '../../components/AmountInputModal';

// Wallet 구조 정의
interface WalletData {
  balance: number;
  locked: number;
}

export default function WalletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // 결제 웹뷰에서 돌아올 때 전달되는 파라미터 확인
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 제어를 위한 상태 추가
  const [isChargeVisible, setIsChargeVisible] = useState(false);
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [inputAmount, setInputAmount] = useState('');

  // 나중에 배포되면 URL 변경
  const API_BASE_URL = 'https://asia-northeast3-[프로젝트ID].cloudfunctions.net';

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. 실시간 잔액 리스너: Firestore의 wallet 필드 감시
    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists()) {
          // users 문서 내의 wallet 객체만 추출
          setWallet(doc.data()?.wallet as WalletData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      });

    // 2. 결제 성공 후 돌아온 경우 자동 승인 처리
    // payment-webview 화면에서 결제 성공 시 params와 함께 이 화면으로 리다이렉트
    if (params.status === 'success' && params.paymentKey) {
      handleFinalConfirm();
    }

    return () => unsubscribe();
  }, [params.status]); // 결제 상태 파라미터가 바뀔 때마다 실행

  // ⭐ 결제 승인 프로세스 1단계: 백엔드에 주문 생성 요청 (createChargeOrder 호출)
  const handleRequestCharge = async () => {
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("알림", "올바른 금액을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setIsChargeVisible(false); // 모달 닫기
      const user = auth().currentUser;
      if (!user) throw new Error("로그인이 필요합니다.");

      const idToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/createChargeOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "주문 생성에 실패했습니다.");
      }

      // 주문 생성 성공 시 토스 결제 웹뷰 화면으로 이동
      // payment.tsx로 주문 정보를 넘기기 (Typed Routes 에러 시 as any 사용)
      router.push({
        pathname: '/payment' as any,
        params: {
          orderId: result.orderId,
          amount: result.amount,
          orderName: result.orderName,
        }
      });
    } catch (error: any) {
      Alert.alert("충전 요청 실패", error.message);
    } finally {
      setLoading(false);
      setInputAmount(''); // 입력값 초기화
    }
  };

  // 출금 처리 로직 (현재 UI 및 알림 위주)
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

  // ⭐ 결제 승인 프로세스 2단계: 백엔드에 최종 결제 승인 요청 (confirmChargePayment 호출)
  const handleFinalConfirm = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/confirmChargePayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          paymentKey: params.paymentKey,
          orderId: params.orderId,
          amount: params.amount,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("충전 완료", `${Number(params.amount).toLocaleString()} 포인트가 성공적으로 충전되었습니다.`);
        // URL의 파라미터를 초기화하기 위해 현재 경로로 replace
        router.replace('/wallet');
      } else {
        throw new Error(result.error || "결제 승인 중 오류가 발생했습니다.");
      }
    } catch (error: any) {
      Alert.alert("승인 오류", error.message);
      router.replace('/wallet');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#3182F6" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.walletHeader}>
        <Text style={styles.walletLabel}>포인트 보유 현황</Text>
        <Text style={styles.balance}>
          {wallet?.balance?.toLocaleString() || 0} 포인트
        </Text>
        
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => {
              setInputAmount('');
              setIsChargeVisible(true);
            }}
          >
            <Text style={styles.primaryBtnText}>충전하기</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => {
              setInputAmount('');
              setIsWithdrawVisible(true);
            }}
          >
            <Text style={styles.secondaryBtnText}>출금</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>최근 내역</Text>
        {/* 테스트 진행 후 transactions 컬렉션을 쿼리하여 리스트 렌더링 */}
        <View style={styles.historyItem}>
          <View>
            <Text style={styles.historyName}>포인트 충전</Text>
            <Text style={styles.historyDate}>상세 내역 보기</Text>
          </View>
          <Text style={styles.historyAmount}>거래 확인 중...</Text>
        </View>
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