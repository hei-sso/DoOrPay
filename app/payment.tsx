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

  // 비동기 처리용 함수를 별도로 분리 (안전성 확보)
  const handlePaymentSuccess = async (url: string) => {
    const { paymentKey, orderId, amount: successAmount } = parseSuccessURL(url);
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
  };

  return (
    <WebView
      source={{ html }}
      style={{ flex: 1 }}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => <ActivityIndicator size="large" style={{ flex: 1 }} />}
      
      onShouldStartLoadWithRequest={(request) => {
        const { url } = request;

        // 🌟 [핵심 추가] 결제가 끝나고 우리 앱 주소(doorpay://)로 리다이렉트 될 때
        // 웹뷰가 직접 열지 못하게 차단하고, OS(스마트폰 시스템)로 주소를 던집니다.
        if (url.startsWith('doorpay://')) {
          Linking.openURL(url).catch(() => {
            Alert.alert("에러", "앱으로 돌아갈 수 없습니다.");
          });
          return false; // 🌟 중요: false를 리턴하여 웹뷰 내부의 'unknown url scheme' 에러를 원천 차단합니다!
        }

        // 기존 외부 카드사 앱 실행 스킴 처리 (그대로 유지)
        if (isAppScheme(url)) {
          // [Android] intent: 스킴 처리
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

          // [iOS] 및 기타 일반 앱 스킴 실행
          Linking.openURL(url).catch(() => {
            Alert.alert(t('home.alert_title'), t('payment.alerts.app_error'));
          });
          return false;
        }    
        return true;
      }}
    />
  );
}