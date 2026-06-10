import { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentFailScreen() {
  const router = useRouter();

  useEffect(() => {
    Alert.alert("알림", "결제가 취소되었거나 실패했습니다.");
    router.replace('/(tabs)/wallet');
  }, []);

  return <View style={{ flex: 1 }} />;
}