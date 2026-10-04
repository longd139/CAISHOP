import { NextResponse } from 'next/server';
import { getOrders, createCustomerOrder, updateOrderStatus } from '@/lib/db';

export async function GET() {
  try {
    const orders = await getOrders(30);
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
    const { customer_name, customer_phone, customer_email, shipping_address, items } = body;

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
      items
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
    const { order_id, fulfillment_status } = body;

    if (!order_id || !fulfillment_status) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu order_id hoặc fulfillment_status.'
      }, { status: 400 });
    }

    const result = await updateOrderStatus(order_id, fulfillment_status);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

