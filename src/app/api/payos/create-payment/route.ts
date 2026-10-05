import { NextResponse } from 'next/server';
import { getSiteContent } from '@/lib/db';
import { defaultPaymentSettings, PaymentSettings } from '@/lib/paymentSettings';
import { createPayOSPaymentRequest, formatPayOSDescription, generateNumericOrderCode } from '@/lib/payos';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, order_code, total_amount, customer_name, customer_phone } = body;

    if (!order_id || !total_amount) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin đơn hàng hoặc số tiền' },
        { status: 400 }
      );
    }

    const raw = await getSiteContent('payment_settings', null);
    const settings: PaymentSettings = {
      ...defaultPaymentSettings,
      ...(raw || {})
    };

    if (!settings.is_payos_enabled) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'PayOS chưa được bật trong cấu hình quản trị.'
      });
    }

    if (!settings.payos_client_id || !settings.payos_api_key || !settings.payos_checksum_key) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'Chưa cấu hình đầy đủ Client ID, API Key hoặc Checksum Key của PayOS.'
      });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const numericCode = generateNumericOrderCode(order_code || order_id);
    const description = formatPayOSDescription(order_code || `ORD${numericCode}`);

    const result = await createPayOSPaymentRequest(settings, {
      orderCode: numericCode,
      amount: Math.round(Number(total_amount)),
      description,
      returnUrl: `${baseUrl}/checkout?paid=true&order_id=${encodeURIComponent(order_id || '')}&order_code=${encodeURIComponent(order_code || '')}`,
      cancelUrl: `${baseUrl}/checkout?cancelled=true&order_id=${encodeURIComponent(order_id || '')}&order_code=${encodeURIComponent(order_code || '')}`,
      buyerName: customer_name,
      buyerPhone: customer_phone
    });

    if (result.code === '00' && result.data) {
      return NextResponse.json({
        success: true,
        payosOrderCode: numericCode,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: result.desc || 'PayOS không thể tạo mã thanh toán.',
        details: result
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      fallback: true,
      error: error.message || 'Lỗi kết nối tới cổng thanh toán PayOS'
    });
  }
}
