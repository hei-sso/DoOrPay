import React from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Platform, ActivityIndicator } from 'react-native'; 
import { generatePaymentHTML, parseSuccessURL, isSuccessURL, isFailURL } from '@/services/paymentApi';
import { confirmChargePayment } from '@/services/walletApi';

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, amount, orderName, customerName } = useLocalSearchParams();

  const html = generatePaymentHTML({
    orderId: orderId as string,
    amount: amount as string,
    orderName: orderName as string,
    customerName: customerName as string,
  });

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    if (isSuccessURL(navState.url)) {
      const { paymentKey, orderId, amount } = parseSuccessURL(navState.url);
      try {
        await confirmChargePayment({
          paymentKey: paymentKey!,
          orderId: orderId!,
          amount: Number(amount),
        });
        router.replace('/wallet');
      } catch (e) {
        Alert.alert('결제 오류', '결제 확인 중 문제가 발생했습니다.');
        router.back();
      }
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
      // 외부 앱 실행(Scheme) 처리 로직
      onShouldStartLoadWithRequest={(request) => {
        const { url } = request;

        // http나 https가 아닌 경우 (앱 스킴 처리)
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:blank')) {
          if (Platform.OS === 'android' && url.startsWith('intent:')) {
            // 안드로이드 intent 스킴 특수 처리
            const parsedUrl = url.replace('intent:', '').split('#Intent;')[0];
            const finalUrl = parsedUrl.startsWith('//') ? `https:${parsedUrl}` : parsedUrl;
            
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // 앱이 설치되어 있지 않을 경우 마켓으로 유도하거나 안내
                Alert.alert('알림', '결제 앱이 설치되어 있지 않습니다.');
              }
            });
            return false;
          }

          // iOS 및 기타 일반 스킴 처리
          Linking.openURL(url).catch(() => {
            Alert.alert('알림', '해당 결제를 실행할 수 있는 앱이 없습니다.');
          });
          return false;
        }
        return true;
      }}
      style={{ flex: 1 }}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => <ActivityIndicator size="large" style={{ flex: 1 }} />}
    />
  );
}