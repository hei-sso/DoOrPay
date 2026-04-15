const TOSS_CLIENT_KEY = process.env.TOSS_SECRET_KEY;
const SUCCESS_URL = 'http://localhost:19006/payment/success';
const FAIL_URL = 'http://localhost:19006/payment/fail';

interface PaymentParams {
  orderId: string;
  amount: string | number;
  orderName: string;
  customerName: string;
}

export function generatePaymentHTML(params: PaymentParams): string {
  const { orderId, amount, orderName, customerName } = params;
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
  return url.includes('/payment/success');
}

export function isFailURL(url: string): boolean {
  return url.includes('/payment/fail');
}