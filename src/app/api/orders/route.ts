import { NextResponse } from 'next/server';
import { getOrders, getOrderById, getCustomerOrders, createCustomerOrder, updateOrderStatus, confirmOrderPayment, cleanupExpiredOrders, dispatchOrder, confirmStockAvailable, refundOutOfStockOrder, confirmPartialFulfillment } from '@/lib/db';
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
    const { 
      customer_name, 
      customer_phone, 
      customer_email, 
      shipping_address, 
      items, 
      payment_method,
      refund_bank_name,
      refund_bank_account,
      refund_account_holder
    } = body;

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
      payment_method: payment_method || 'vietqr',
      refund_bank_name,
      refund_bank_account,
      refund_account_holder
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

    if (!order_id && action !== 'CREATE_MOCK_ORDER') {
      return NextResponse.json({
        success: false,
        message: 'Thiếu order_id.'
      }, { status: 400 });
    }

    const authUser = await getAuthUserFromRequest(request);

    if (action === 'CONFIRM_PAYMENT') {
      const isMockEnabled = process.env.ENABLE_MOCK_PAYMENT === 'true' || process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === 'true';
      const isAdmin = authUser && authUser.role === 'ADMIN';

      if (!isAdmin && !isMockEnabled) {
        return NextResponse.json({
          success: false,
          message: 'Từ chối truy cập: Chỉ Quản trị viên mới có quyền xác nhận thanh toán hoặc cần kích hoạt biến môi trường ENABLE_MOCK_PAYMENT=true.'
        }, { status: 403 });
      }

      const result = await confirmOrderPayment(order_id);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'SHOP_CONFIRM_STOCK') {
      const result = await confirmStockAvailable(order_id);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'SHOP_PARTIAL_FULFILLMENT') {
      const { refund_amount, refund_notes, refund_proof_image } = body;
      const result = await confirmPartialFulfillment(order_id, refund_amount, refund_notes, refund_proof_image);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'SHOP_OUT_OF_STOCK_REFUND') {
      const { refund_notes, refund_proof_image } = body;
      const result = await refundOutOfStockOrder(order_id, refund_notes, refund_proof_image);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'DISPATCH_ORDER' || action === 'UPDATE_TRACKING') {
      const { tracking_code, carrier } = body;
      const result = await dispatchOrder(order_id, tracking_code || '', carrier || 'VIETTEL_POST');
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (action === 'CONFIRM_DELIVERY') {
      const db = await (await import('@/lib/db')).getDb();
      const order = await db.queryFirst<any>(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [order_id, order_id]);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      if (order.fulfillment_status === 'RETURNED' || order.fulfillment_status === 'RETURNING' || order.fulfillment_status === 'RETURN_REQUESTED') {
        return NextResponse.json({ success: false, message: 'Đơn hàng đang trong quá trình hoàn / đổi hàng, không thể xác nhận nhận hàng.' }, { status: 400 });
      }

      if (order.fulfillment_status === 'CANCELLED') {
        return NextResponse.json({ success: false, message: 'Đơn hàng đã hủy, không thể xác nhận nhận hàng.' }, { status: 400 });
      }

      if (order.payment_status === 'PENDING') {
        return NextResponse.json({ success: false, message: 'Đơn hàng đang chờ thanh toán, không thể xác nhận nhận hàng.' }, { status: 400 });
      }

      const isDispatched = order.fulfillment_status === 'DISPATCHED' || Boolean(order.tracking_code);
      if (!isDispatched) {
        return NextResponse.json({ success: false, message: 'Đơn hàng chưa bàn giao cho ĐVVC, không thể xác nhận nhận hàng.' }, { status: 400 });
      }

      await db.execute(`
        UPDATE orders 
        SET fulfillment_status = 'DELIVERED', 
            payment_status = 'PAID', 
            updated_at = datetime('now') 
        WHERE id = ?
      `, [order.id]);

      const existingTx = await db.queryFirst(`
        SELECT id FROM financial_transactions WHERE order_id = ? AND transaction_type = 'REVENUE'
      `, [order.id]);

      if (!existingTx) {
        await db.execute(`
          INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes)
          VALUES (?, ?, 'REVENUE', ?, 'INFLOW', ?, ?, ?)
        `, [`fin-${Date.now().toString(36)}-del`, order.id, order.total_amount, order.payment_method === 'cod' ? 'COD' : 'VIETQR', `ORD-${order.order_code}`, `Khách ${order.customer_name} đã nhận hàng đơn ${order.order_code}`]);
      }

      return NextResponse.json({
        success: true,
        message: 'Xác nhận đã nhận hàng thành công!',
        fulfillment_status: 'DELIVERED',
        payment_status: 'PAID'
      });
    }

    if (action === 'REQUEST_RETURN') {
      const db = await (await import('@/lib/db')).getDb();
      const { return_reason, refund_method, bank_account, bank_name, account_holder, notes, contact_phone, tag_image } = body;
      const order = await db.queryFirst<any>(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [order_id, order_id]);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      await db.execute(`
        UPDATE orders 
        SET fulfillment_status = 'RETURNED', refund_proof_image = COALESCE(?, refund_proof_image), 
            updated_at = datetime('now') 
        WHERE id = ?
      `, [tag_image || null, order.id]);

      let items: any[] = [];
      try {
        items = await db.queryAll<any>(`
          SELECT oi.*, pv.sku as variant_sku, pv.size, pv.color, p.name as product_name, p.id as product_id
          FROM order_items oi
          JOIN product_variants pv ON pv.id = oi.variant_id
          JOIN products p ON p.id = pv.product_id
          WHERE oi.order_id = ?
        `, [order.id]);
      } catch {}

      const primaryItem = items?.[0] || {};
      const reasonLabel = return_reason === 'TIGHT' ? 'Mặc bị chật / Kích size' 
        : return_reason === 'LOOSE' ? 'Mặc bị rộng / Dài' 
        : return_reason === 'DEFECT' ? 'Lỗi may / lỗi vải' 
        : return_reason === 'WRONG_ITEM' ? 'Giao sai mẫu / sai size'
        : 'Khác';

      const phone = (contact_phone || order.customer_phone || '').trim();
      const methodLabel = refund_method === 'EXCHANGE' ? 'ĐỔI HÀNG (Đổi size/mẫu)' : 'HOÀN HÀNG (Trả hàng/Hoàn tiền)';
      const bankInfo = bank_account ? ` [STK: ${bank_account} - ${bank_name || ''} (${account_holder || ''})]` : '';
      const tagNote = tag_image ? ' [Đã chụp tag áo]' : '';
      const sendBackNote = refund_method === 'EXCHANGE' ? ' [Yêu cầu: Khách gửi sản phẩm nguyên tag về lại shop]' : '';
      const fullNotes = `[${methodLabel}]${tagNote}${sendBackNote} [SĐT/Zalo liên hệ: ${phone}] Lý do: ${reasonLabel}${bankInfo}${notes ? ` - Ghi chú: ${notes}` : ''}`;

      try {
        const returnId = `ret-${Date.now().toString(36)}`;
        await db.execute(`
          INSERT INTO size_returns (id, order_id, product_id, product_name, variant_sku, size, color, return_reason, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          returnId,
          order.id,
          primaryItem.product_id || 'prod-custom',
          primaryItem.product_name || `Đơn #${order.order_code}`,
          primaryItem.variant_sku || '',
          primaryItem.size || 'L',
          primaryItem.color || '',
          return_reason === 'LOOSE' ? 'LOOSE' : return_reason === 'TIGHT' ? 'TIGHT' : 'OTHER',
          fullNotes
        ]);
      } catch (e) {
        console.error('Error saving size_returns:', e);
      }

      const returnMsg = refund_method === 'EXCHANGE'
        ? `Yêu cầu đổi hàng thành công! Quý khách vui lòng giữ nguyên tag áo và gửi sản phẩm về lại shop khi shipper liên hệ SĐT/Zalo ${phone}.`
        : `Chúng tôi sẽ liên hệ hoàn hàng qua số điện thoại/Zalo ${phone} này nhé, bạn nhớ để ý điện thoại nhé!`;

      return NextResponse.json({
        success: true,
        message: returnMsg,
        fulfillment_status: 'RETURNED',
        contact_phone: phone,
        refund_proof_image: tag_image || order.refund_proof_image
      });
    }

    if (action === 'CREATE_MOCK_ORDER') {
      const isMockEnabled = process.env.ENABLE_MOCK_PAYMENT === 'true' || process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === 'true';
      if (!isMockEnabled && (!authUser || authUser.role !== 'ADMIN')) {
        return NextResponse.json({
          success: false,
          message: 'Từ chối truy cập: Tính năng tạo đơn test đang bị tắt bởi biến môi trường.'
        }, { status: 403 });
      }

      const db = await (await import('@/lib/db')).getDb();
      const variant = await db.queryFirst<any>(`
        SELECT v.id as variant_id, v.sku, v.size, v.selling_price, p.name as product_name
        FROM product_variants v
        JOIN products p ON p.id = v.product_id
        WHERE p.is_active = 1
        LIMIT 1
      `);

      if (!variant) {
        return NextResponse.json({
          success: false,
          message: 'Không tìm thấy sản phẩm nào để tạo đơn test.'
        }, { status: 400 });
      }

      const mockItems = [{
        variant_id: variant.variant_id,
        sku: variant.sku,
        name: `${variant.product_name} (${variant.size})`,
        quantity: 1,
        unit_price: Number(variant.selling_price),
        total_price: Number(variant.selling_price)
      }];

      const result = await createCustomerOrder({
        customer_name: 'Khách Hàng Test Ảo',
        customer_phone: '0901234567',
        customer_email: 'test@caishop.vn',
        shipping_address: '77 Nguyễn Trãi, Q.1, TP.HCM (Đơn Test Mock)',
        items: mockItems,
        payment_method: 'vietqr'
      });

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

    const result = await updateOrderStatus(order_id, fulfillment_status, body.tracking_code, body.carrier);
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

