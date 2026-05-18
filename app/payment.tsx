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
      onNavigationStateChange={handleNavigationStateChange}
      // 외부 앱 실행(Scheme) 처리 로직
      onShouldStartLoadWithRequest={(request) => {
        const { url } = request;

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

          // [iOS] 및 일반 앱 스킴 실행 (안드로이드의 커스텀 스킴 포함)
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