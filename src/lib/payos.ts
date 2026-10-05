import crypto from 'crypto';
import { PaymentSettings } from './paymentSettings';

export interface PayOSCreatePaymentInput {
  orderCode: number; // Integer (1 to 9007199254740991)
  amount: number; // Integer VND
  description: string; // Max 25 chars, alphanumeric + space only
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  cancelUrl: string;
  returnUrl: string;
}

export interface PayOSCreatePaymentResponse {
  code: string; // '00' on success
  desc: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string; // 'PENDING'
    checkoutUrl: string;
    qrCode: string; // EMVCo QR String
  };
  signature?: string;
}

export interface PayOSWebhookPayload {
  code: string;
  desc: string;
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId?: string;
    counterAccountBankName?: string;
    counterAccountName?: string;
    counterAccountNumber?: string;
    virtualAccountName?: string;
    virtualAccountNumber?: string;
  };
  signature: string;
}

/**
 * Generate HMAC-SHA256 signature for PayOS payment creation
 * Formula: key1=value1&key2=value2... sorted alphabetically
 */
export function generatePayOSSignature(
  params: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  },
  checksumKey: string
): string {
  const sortedKeys = ['amount', 'cancelUrl', 'description', 'orderCode', 'returnUrl'].sort();
  const signString = sortedKeys
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&');

  return crypto.createHmac('sha256', checksumKey).update(signString).digest('hex');
}

/**
 * Verify PayOS Webhook signature
 */
export function verifyPayOSWebhook(payload: PayOSWebhookPayload, checksumKey: string): boolean {
  if (!payload || !payload.data || !payload.signature || !checksumKey) {
    return false;
  }

  const data = payload.data;
  const sortedKeys = Object.keys(data).sort();
  const signString = sortedKeys
    .map((key) => `${key}=${(data as any)[key]}`)
    .join('&');

  const expectedSignature = crypto.createHmac('sha256', checksumKey).update(signString).digest('hex');
  return expectedSignature.toLowerCase() === payload.signature.toLowerCase();
}

/**
 * Clean description to fit PayOS requirement:
 * Max 25 chars, no special characters, ASCII only
 */
export function formatPayOSDescription(orderCode: string): string {
  const clean = orderCode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();

  const result = `DH ${clean}`.slice(0, 25);
  return result || 'DH CAISHOP';
}

/**
 * Convert string order_code or ID into a safe positive integer for PayOS orderCode
 */
export function generateNumericOrderCode(orderIdOrCode?: string): number {
  const timestamp = Date.now().toString();
  const rand = Math.floor(Math.random() * 899 + 100);
  return Number(timestamp.slice(-6) + rand);
}

/**
 * Call PayOS API to create payment request
 */
export async function createPayOSPaymentRequest(
  settings: PaymentSettings,
  input: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    buyerName?: string;
    buyerPhone?: string;
  }
): Promise<PayOSCreatePaymentResponse> {
  const { payos_client_id, payos_api_key, payos_checksum_key } = settings;

  if (!payos_client_id || !payos_api_key || !payos_checksum_key) {
    throw new Error('Chưa cấu hình đầy đủ Client ID, API Key hoặc Checksum Key của PayOS.');
  }

  const signature = generatePayOSSignature(
    {
      amount: input.amount,
      cancelUrl: input.cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl
    },
    payos_checksum_key
  );

  const payload = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    buyerName: input.buyerName || undefined,
    buyerPhone: input.buyerPhone || undefined,
    signature
  };

  const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'x-client-id': payos_client_id,
      'x-api-key': payos_api_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data: PayOSCreatePaymentResponse = await response.json();
  return data;
}

/**
 * Query PayOS API for real-time payment status of an order
 */
export async function getPayOSPaymentInformation(
  settings: PaymentSettings,
  orderCode: number | string
): Promise<{ code: string; desc: string; data?: any }> {
  const { payos_client_id, payos_api_key } = settings;

  if (!payos_client_id || !payos_api_key) {
    throw new Error('Chưa cấu hình đầy đủ Client ID hoặc API Key của PayOS.');
  }

  const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
    method: 'GET',
    headers: {
      'x-client-id': payos_client_id,
      'x-api-key': payos_api_key,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
}
