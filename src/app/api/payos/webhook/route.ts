import { NextResponse } from 'next/server';
import { getDb, getSiteContent, confirmOrderPayment } from '@/lib/db';
import { defaultPaymentSettings, PaymentSettings } from '@/lib/paymentSettings';
import { verifyPayOSWebhook, PayOSWebhookPayload } from '@/lib/payos';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'CAISHOP PayOS Webhook endpoint is online & ready.'
  });
}

export async function POST(request: Request) {
  try {
    const raw = await getSiteContent('payment_settings', null);
    const settings: PaymentSettings = {
      ...defaultPaymentSettings,
      ...(raw || {})
    };

    if (!settings.payos_checksum_key) {
      console.warn('[PayOS Webhook] Checksum key not configured');
      return NextResponse.json({ success: false, error: 'Chưa cấu hình Checksum Key' }, { status: 400 });
    }

    const body: PayOSWebhookPayload = await request.json();

    // Verify signature
    const isValid = verifyPayOSWebhook(body, settings.payos_checksum_key);
    if (!isValid) {
      console.error('[PayOS Webhook] Chữ ký không hợp lệ', body);
      return NextResponse.json({ success: false, error: 'Chữ ký không hợp lệ' }, { status: 400 });
    }

    // Check if transaction is successful
    if (body.code === '00' && body.data) {
      const { amount, description, reference, orderCode } = body.data;
      const db = await getDb();

      // Find the corresponding order
      // 1. Try matching order_code contained in description (e.g. "DH CAI-202610-888" or "CAI888")
      // 2. Or match pending order with the same amount
      let order: any = null;

      // Extract alphanumeric tokens from description
      const tokens = (description || '').split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        if (token.length >= 4) {
          order = await db.queryFirst(
            `SELECT id, order_code, total_amount, payment_status FROM orders WHERE order_code LIKE ? LIMIT 1`,
            [`%${token}%`]
          );
          if (order) break;
        }
      }

      // If not found by description token, find newest pending order with exact total_amount
      if (!order && amount > 0) {
        order = await db.queryFirst(
          `SELECT id, order_code, total_amount, payment_status 
           FROM orders 
           WHERE total_amount = ? AND payment_status != 'PAID' 
           ORDER BY created_at DESC LIMIT 1`,
          [amount]
        );
      }

      if (order) {
        console.log(`[PayOS Webhook] Khớp đơn hàng ${order.order_code} (ID: ${order.id}) với số tiền ${amount}đ`);
        if (order.payment_status !== 'PAID') {
          await confirmOrderPayment(order.id);
        }
        return NextResponse.json({
          success: true,
          message: `Xác nhận thanh toán đơn hàng ${order.order_code} thành công!`,
          order_code: order.order_code
        });
      } else {
        console.warn(`[PayOS Webhook] Không tìm thấy đơn hàng khớp với giao dịch: orderCode=${orderCode}, amount=${amount}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã nhận webhook PayOS'
    });
  } catch (error: any) {
    console.error('[PayOS Webhook Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
