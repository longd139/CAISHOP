import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';
import { defaultPaymentSettings, PaymentSettings, getResolvedPaymentSettings } from '@/lib/paymentSettings';

export async function GET() {
  try {
    const raw = await getSiteContent('payment_settings', null);
    const settings = getResolvedPaymentSettings(raw);

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
    const currentResolved = getResolvedPaymentSettings(raw);
    const locked = currentResolved.env_locked;

    // Sanitize and merge - Any field locked by ENV is strictly protected against tampering
    const updated: PaymentSettings = {
      ...currentResolved,
      ...body,
      bank_id: locked.bank_id ? currentResolved.bank_id : String(body.bank_id || currentResolved.bank_id).trim().toUpperCase(),
      bank_name: locked.bank_name ? currentResolved.bank_name : String(body.bank_name || currentResolved.bank_name).trim(),
      account_number: locked.account_number ? currentResolved.account_number : String(body.account_number || currentResolved.account_number).trim().replace(/\s+/g, ''),
      account_holder: locked.account_holder ? currentResolved.account_holder : String(body.account_holder || currentResolved.account_holder).trim().toUpperCase(),
      qr_template: body.qr_template || currentResolved.qr_template || 'compact2',
      transfer_syntax: body.transfer_syntax !== undefined ? String(body.transfer_syntax) : currentResolved.transfer_syntax,
      payment_instructions: body.payment_instructions !== undefined ? String(body.payment_instructions) : currentResolved.payment_instructions,
      is_payos_enabled: locked.is_payos_enabled ? currentResolved.is_payos_enabled : (body.is_payos_enabled !== undefined ? Boolean(body.is_payos_enabled) : currentResolved.is_payos_enabled),
      payos_client_id: locked.payos_client_id ? currentResolved.payos_client_id : (body.payos_client_id !== undefined ? String(body.payos_client_id).trim() : currentResolved.payos_client_id),
      payos_api_key: locked.payos_api_key ? currentResolved.payos_api_key : (body.payos_api_key !== undefined ? String(body.payos_api_key).trim() : currentResolved.payos_api_key),
      payos_checksum_key: locked.payos_checksum_key ? currentResolved.payos_checksum_key : (body.payos_checksum_key !== undefined ? String(body.payos_checksum_key).trim() : currentResolved.payos_checksum_key),
      is_vietqr_enabled: locked.is_vietqr_enabled ? currentResolved.is_vietqr_enabled : (body.is_vietqr_enabled !== undefined ? Boolean(body.is_vietqr_enabled) : currentResolved.is_vietqr_enabled),
      is_cod_enabled: locked.is_cod_enabled ? currentResolved.is_cod_enabled : (body.is_cod_enabled !== undefined ? Boolean(body.is_cod_enabled) : currentResolved.is_cod_enabled),
      cod_note: body.cod_note !== undefined ? String(body.cod_note) : currentResolved.cod_note,
      cod_max_amount: body.cod_max_amount !== undefined ? Number(body.cod_max_amount) || 0 : currentResolved.cod_max_amount
    };

    await setSiteContent('payment_settings', updated);

    const finalResolved = getResolvedPaymentSettings(updated);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình thanh toán thành công!',
      data: finalResolved
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lưu cấu hình thanh toán' },
      { status: 500 }
    );
  }
}
