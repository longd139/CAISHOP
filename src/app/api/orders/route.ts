import { NextResponse } from 'next/server';
import { getOrders, getOrderById, getCustomerOrders, createCustomerOrder, updateOrderStatus, confirmOrderPayment, cleanupExpiredOrders } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    if (id) {
      const order = await getOrderById(id);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order });
    }

    if (phone || email) {
      const orders = await getCustomerOrders(phone || '', email || '');
      return NextResponse.json({
        success: true,
        data: orders
      });
    }

    const authUser = await getAuthUserFromRequest(request);
    if (authUser && authUser.role !== 'ADMIN') {
      const orders = await getCustomerOrders(authUser.phone || '', authUser.email || '');
      return NextResponse.json({
        success: true,
        data: orders
      });
    }

    const orders = await getOrders(50);
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone, customer_email, shipping_address, items, payment_method } = body;

    if (!customer_name || !customer_phone || !shipping_address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, số điện thoại, địa chỉ nhận hàng và chọn ít nhất một sản phẩm.'
      }, { status: 400 });
    }

    const result = await createCustomerOrder({
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      items,
      payment_method: payment_method || 'vietqr'
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_id, fulfillment_status, action } = body;

    if (!order_id) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu order_id.'
      }, { status: 400 });
    }

    const authUser = await getAuthUserFromRequest(request);

    if (action === 'CONFIRM_PAYMENT') {
      if (!authUser || authUser.role !== 'ADMIN') {
        return NextResponse.json({
          success: false,
          message: 'Từ chối truy cập: Chỉ Quản trị viên mới có quyền xác nhận thanh toán thủ công. Hệ thống tự động xác nhận qua cổng PayOS.'
        }, { status: 403 });
      }

      const result = await confirmOrderPayment(order_id);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (!fulfillment_status) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu fulfillment_status.'
      }, { status: 400 });
    }

    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Từ chối truy cập: Chỉ Quản trị viên mới có quyền cập nhật trạng thái đơn hàng.'
      }, { status: 403 });
    }

    const result = await updateOrderStatus(order_id, fulfillment_status);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'cleanup') {
      const result = await cleanupExpiredOrders();
      return NextResponse.json({ success: true, ...result });
    }

    if (id) {
      // Dọn dẹp/hủy đơn cụ thể nếu hết hạn hoặc đơn PENDING
      const result = await cleanupExpiredOrders(id);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ success: false, message: 'Thiếu id đơn hàng hoặc action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

