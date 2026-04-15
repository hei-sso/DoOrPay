import React from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { generatePaymentHTML, parseSuccessURL, isSuccessURL, isFailURL } from '@/services/paymentApi';

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, amount, orderName, customerName } = useLocalSearchParams();

  const html = generatePaymentHTML({ orderId, amount, orderName, customerName } as any);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (isSuccessURL(navState.url)) {
      const result = parseSuccessURL(navState.url);
      router.replace({
        pathname: '/wallet',
        params: { ...result, status: 'success' },
      });
    }

    if (isFailURL(navState.url)) {
      Alert.alert('결제 실패', '결제가 중단되거나 실패했습니다.');
      router.back();
    }
  };

  return (
    <WebView
      source={{ html }}
      onNavigationStateChange={handleNavigationStateChange}
      style={{ flex: 1 }}
    />
  );
}