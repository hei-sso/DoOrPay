import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import '@/constants/i18n';

// API
import { generatePaymentHTML, isFailURL, isSuccessURL, parseSuccessURL } from '@/services/paymentApi';
import { confirmChargePayment } from '@/services/walletApi';

// URL이 앱스킴인지 확인하는 함수
const noAppScheme = ["http", "https", "about", "data", "javascript", "file"];
const isAppScheme = (url: string): boolean => {
  if (!url) return false;
  const scheme = url.split("://")[0];
  return !noAppScheme.includes(scheme);
};

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { orderId, amount, orderName, customerName } = useLocalSearchParams();

  const html = generatePaymentHTML({
    orderId: orderId as string,
    amount: amount as string,
    orderName: orderName as string,
    customerName: customerName as string,
    appScheme: 'doorpay://'
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
        Alert.alert(t('payment.alerts.error_title'), t('payment.alerts.error_msg'));
        router.back();
      }
    }

    if (isFailURL(navState.url)) {
      Alert.alert(t('payment.alerts.fail_title'), t('payment.alerts.fail_msg'));
      router.back();
    }
  };

  return (
    <WebView
      source={{ html }}
      // 앱 스킴 잡기
      onShouldStartLoadWithRequest={(request) => {
        const { url } = request;

        // 1. 토스 결제 성공 시 웹뷰가 링크를 가로채서 즉시 서버 통신 진행
        if (isSuccessURL(url)) {
          const { paymentKey, orderId, amount: successAmount } = parseSuccessURL(url);
          
          // 비동기 즉시 실행 함수(IIFE)로 서버 승인 API 호출
          (async () => {
            try {
              await confirmChargePayment({
                paymentKey: paymentKey!,
                orderId: orderId!,
                amount: Number(successAmount),
              });
              router.replace('/wallet');
            } catch (e) {
              Alert.alert(t('payment.alerts.error_title'), t('payment.alerts.error_msg'));
              router.back();
            }
          })();

          return false; // false를 리턴하여 외부로 unmatched route가 터지는 걸 차단!
        }

        // 2. 토스 결제 실패/취소 시 가로채기
        if (isFailURL(url)) {
          Alert.alert(t('payment.alerts.fail_title'), t('payment.alerts.fail_msg'));
          router.back();
          return false; // 차단
        }

        // 3. 카드사 외부 앱 실행 로직
        if (isAppScheme(url)) {
          // [Android] intent: 스킴 특수 처리
          if (Platform.OS === 'android' && url.startsWith('intent:')) {
            const packageMatch = url.match(/package=([^;]+)/);
            const schemeMatch = url.match(/scheme=([^;]+)/);

            if (packageMatch && schemeMatch) {
              const customSchemeUrl = url.replace('intent://', `${schemeMatch[1]}://`).split('#Intent')[0];
              
              Linking.openURL(customSchemeUrl).catch(() => {
                Linking.openURL(`market://details?id=${packageMatch[1]}`);
              });
              return false;
            }
          }

          // [iOS] 및 일반 앱 스킴 실행
          Linking.openURL(url).catch(() => {
            Alert.alert(t('home.alert_title'), t('payment.alerts.app_error'));
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