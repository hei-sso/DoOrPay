import React from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, amount, orderName, customerName } = useLocalSearchParams();

  // 나중에 클라이언트 발급받으면 수정하기
  const TOSS_CLIENT_KEY = 'YOUR_TOSS_CLIENT_KEY'; 
  const SUCCESS_URL = 'http://localhost:19006/payment/success'; // 여기도 나중에 딥링크로 수정
  const FAIL_URL = 'http://localhost:19006/payment/fail';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <script src="https://js.tosspayments.com/v1/payment"></script>
      </head>
      <body>
        <script>
          const tossPayments = TossPayments('${TOSS_CLIENT_KEY}');
          tossPayments.requestPayment('카드', {
            amount: ${amount},
            orderId: '${orderId}',
            orderName: '${orderName}',
            customerName: '${customerName}',
            successUrl: '${SUCCESS_URL}',
            failUrl: '${FAIL_URL}',
          });
        </script>
      </body>
    </html>
  `;

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    // 결제 성공 시 URL에 포함된 파라미터 추출
    if (navState.url.includes('/payment/success')) {
      const urlParams = new URLSearchParams(navState.url.split('?')[1]);
      const paymentKey = urlParams.get('paymentKey');
      const orderId = urlParams.get('orderId');
      const amount = urlParams.get('amount');

      // 성공 화면으로 이동하며 파라미터 전달
      router.replace({
        pathname: '/wallet',
        params: { paymentKey, orderId, amount, status: 'success' }
      });
    }

    if (navState.url.includes('/payment/fail')) {
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