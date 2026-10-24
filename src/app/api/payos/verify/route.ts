import { NextResponse } from 'next/server';
import { getDb, getSiteContent, confirmOrderPayment } from '@/lib/db';
import { defaultPaymentSettings, PaymentSettings } from '@/lib/paymentSettings';
import { getPayOSPaymentInformation, generateNumericOrderCode } from '@/lib/payos';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, message: 'Thiếu order_id' }, { status: 400 });
    }

    const db = await getDb();
    const order = await db.queryFirst<any>(
      `SELECT id, order_code, total_amount, payment_status, fulfillment_status FROM orders WHERE id = ? OR order_code = ?`,
      [order_id, order_id]
    );

    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Nếu đã thanh toán từ trước (qua webhook)
    if (order.payment_status === 'PAID') {
      return NextResponse.json({
        success: true,
        payment_status: 'PAID',
        fulfillment_status: order.fulfillment_status,
        message: 'Đơn hàng đã được ghi nhận thanh toán thành công.'
      });
    }

    // Nếu chưa thanh toán: Thực hiện đối soát trực tiếp từ máy chủ tới cổng PayOS
    const raw = await getSiteContent('payment_settings', null);
    const settings: PaymentSettings = {
      ...defaultPaymentSettings,
      ...(raw || {})
    };

    if (!settings.is_payos_enabled || !settings.payos_client_id || !settings.payos_api_key) {
      return NextResponse.json({
        success: false,
        payment_status: 'PENDING',
        message: 'Cổng thanh toán tự động PayOS chưa được kích hoạt.'
      });
    }

    const numericCode = generateNumericOrderCode(order.order_code || order.id);

    try {
      const payosInfo = await getPayOSPaymentInformation(settings, numericCode);

      if (payosInfo.code === '00' && payosInfo.data) {
        const payosStatus = payosInfo.data.status;
        const amountPaid = Number(payosInfo.data.amountPaid || 0);

        // Đối soát thành công: trạng thái là PAID hoặc đã nhận đủ tiền
        if (payosStatus === 'PAID' || amountPaid >= Number(order.total_amount)) {
          await confirmOrderPayment(order.id);
          return NextResponse.json({
            success: true,
            payment_status: 'PAID',
            fulfillment_status: 'PACKING',
            message: 'Xác thực thanh toán PayOS thành công!'
          });
        }

        if (payosStatus === 'CANCELLED') {
          return NextResponse.json({
            success: false,
            payment_status: 'CANCELLED',
            fulfillment_status: order.fulfillment_status,
            message: 'Giao dịch trên cổng PayOS đã bị hủy.'
          });
        }

        return NextResponse.json({
          success: false,
          payment_status: 'PENDING',
          fulfillment_status: order.fulfillment_status,
          message: 'Chưa phát hiện giao dịch thành công từ ngân hàng trên PayOS.'
        });
      } else {
        return NextResponse.json({
          success: false,
          payment_status: 'PENDING',
          fulfillment_status: order.fulfillment_status,
          message: payosInfo.desc || 'Không thể lấy thông tin giao dịch từ PayOS.'
        });
      }
    } catch (apiErr: any) {
      console.warn('Lỗi khi truy vấn PayOS API:', apiErr.message);
      return NextResponse.json({
        success: false,
        payment_status: 'PENDING',
        fulfillment_status: order.fulfillment_status,
        message: 'Chưa thể kết nối tới cổng thanh toán để đối soát.'
      });
    }
  } catch (error: any) {
    console.error('Error in /api/payos/verify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
