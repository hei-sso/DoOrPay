const TOSS_CLIENT_KEY = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY;
const SUCCESS_URL = 'doorpay-success://';
const FAIL_URL = 'doorpay-fail://';

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
            appScheme: '${appScheme}'
          });
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
  return url.startsWith('doorpay-success://');
}

export function isFailURL(url: string): boolean {
  return url.startsWith('doorpay-fail://');
}