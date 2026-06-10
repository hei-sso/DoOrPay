import { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { confirmChargePayment } from '@/services/walletApi';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { paymentKey, orderId, amount } = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // 백엔드 결제 승인 API 호출
        await confirmChargePayment({
          paymentKey: paymentKey as string,
          orderId: orderId as string,
          amount: Number(amount),
        });
      } catch (e) {
        Alert.alert("에러", "결제 승인 처리에 실패했습니다.");
      } finally {
        // 성공하든 실패하든 무조건 지갑 화면으로 이송
        router.replace('/(tabs)/wallet');
      }
    })();
  }, [paymentKey, orderId, amount]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3182F6" />
    </View>
  );
}