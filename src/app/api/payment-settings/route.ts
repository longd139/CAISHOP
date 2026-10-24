import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';
import { defaultPaymentSettings, PaymentSettings } from '@/lib/paymentSettings';

export async function GET() {
  try {
    const raw = await getSiteContent('payment_settings', null);
    const settings: PaymentSettings = {
      ...defaultPaymentSettings,
      ...(raw || {})
    };

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tải cấu hình thanh toán' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const raw = await getSiteContent('payment_settings', null);
    const existing: PaymentSettings = {
      ...defaultPaymentSettings,
      ...(raw || {})
    };

    // Sanitize and merge
    const updated: PaymentSettings = {
      ...existing,
      ...body,
      bank_id: String(body.bank_id || existing.bank_id).trim().toUpperCase(),
      bank_name: String(body.bank_name || existing.bank_name).trim(),
      account_number: String(body.account_number || existing.account_number).trim().replace(/\s+/g, ''),
      account_holder: String(body.account_holder || existing.account_holder).trim().toUpperCase(),
      qr_template: body.qr_template || existing.qr_template || 'compact2',
      transfer_syntax: body.transfer_syntax !== undefined ? String(body.transfer_syntax) : existing.transfer_syntax,
      payment_instructions: body.payment_instructions !== undefined ? String(body.payment_instructions) : existing.payment_instructions,
      is_payos_enabled: body.is_payos_enabled !== undefined ? Boolean(body.is_payos_enabled) : existing.is_payos_enabled,
      payos_client_id: body.payos_client_id !== undefined ? String(body.payos_client_id).trim() : existing.payos_client_id,
      payos_api_key: body.payos_api_key !== undefined ? String(body.payos_api_key).trim() : existing.payos_api_key,
      payos_checksum_key: body.payos_checksum_key !== undefined ? String(body.payos_checksum_key).trim() : existing.payos_checksum_key,
      is_vietqr_enabled: body.is_vietqr_enabled !== undefined ? Boolean(body.is_vietqr_enabled) : existing.is_vietqr_enabled,
      is_cod_enabled: body.is_cod_enabled !== undefined ? Boolean(body.is_cod_enabled) : existing.is_cod_enabled,
      cod_note: body.cod_note !== undefined ? String(body.cod_note) : existing.cod_note,
      cod_max_amount: body.cod_max_amount !== undefined ? Number(body.cod_max_amount) || 0 : existing.cod_max_amount
    };

    await setSiteContent('payment_settings', updated);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình thanh toán thành công!',
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lưu cấu hình thanh toán' },
      { status: 500 }
    );
  }
}
