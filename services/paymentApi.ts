const TOSS_CLIENT_KEY = "test_ck_Poxy1XQL8RldOjMpG264V7nO5Wml"; 

const SUCCESS_URL = 'doorpay://payment/success';
const FAIL_URL = 'doorpay://payment/fail';

interface PaymentParams {
  orderId: string;
  amount: string | number;
  orderName: string;
  customerName: string;
  appScheme: string;
}

export function generatePaymentHTML(params: PaymentParams): string {
  const { orderId, amount, orderName, customerName, appScheme } = params;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://js.tosspayments.com/v1/payment"></script>
      </head>
      <body>
        <script>
          try {
            const tossPayments = TossPayments('${TOSS_CLIENT_KEY}');
            tossPayments.requestPayment('카드', {
              amount: ${amount},
              orderId: '${orderId}',
              orderName: '${orderName}',
              customerName: '${customerName}',
              successUrl: '${SUCCESS_URL}',
              failUrl: '${FAIL_URL}',
              appScheme: '${appScheme}'
            });
          } catch (e) {
            alert('토스 초기화 에러: ' + e.message);
          }
        </script>
      </body>
    </html>
  `;
}

export interface PaymentSuccessResult {
  paymentKey: string | null;
  orderId: string | null;
  amount: string | null;
}

export function parseSuccessURL(url: string): PaymentSuccessResult {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  return {
    paymentKey: urlParams.get('paymentKey'),
    orderId: urlParams.get('orderId'),
    amount: urlParams.get('amount'),
  };
}

export function isSuccessURL(url: string): boolean {
  return url.startsWith('doorpay://payment/success');
}

export function isFailURL(url: string): boolean {
  return url.startsWith('doorpay://payment/fail');
}