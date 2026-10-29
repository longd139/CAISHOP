import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== BẮT ĐẦU KIỂM THỬ: LUỒNG XÁC NHẬN ĐƠN HÀNG VÀ CHẶN GỬI MÃ ĐVVC ===\n');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failCount++;
  }
}

async function runTests() {
  const rootDir = process.cwd();

  // Test 1: Kiểm tra mã nguồn Backend trong src/lib/db.ts
  it('1. src/lib/db.ts có kiểu CONFIRMING và chặn dispatchOrder khi chưa thanh toán', () => {
    const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');
    assert.ok(dbContent.includes("'CONFIRMING'"), 'Thiếu giá trị enum CONFIRMING trong Order interface');
    assert.ok(dbContent.includes("order.payment_method !== 'cod' && order.payment_status !== 'PAID'"), 'Hàm dispatchOrder thiếu kiểm tra điều kiện thanh toán PAID');
    assert.ok(dbContent.includes("order.fulfillment_status === 'CONFIRMING'"), 'Hàm dispatchOrder thiếu kiểm tra trạng thái CONFIRMING');
    assert.ok(dbContent.includes("Thao tác bị chặn: Đơn hàng chưa hoàn tất thanh toán hoặc tiền chưa về tài khoản!"), 'Thiếu thông báo chặn thanh toán tiếng Việt');
  });

  // Test 2: Kiểm tra confirmOrderPayment chuyển sang CONFIRMING
  it('2. confirmOrderPayment chuyển sang CONFIRMING thay vì PACKING', () => {
    const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');
    assert.ok(dbContent.includes("SET payment_status = 'PAID', fulfillment_status = 'CONFIRMING'"), 'confirmOrderPayment phải set fulfillment_status = CONFIRMING');
    assert.ok(dbContent.includes("Chờ shop xác nhận còn hàng"), 'Message của confirmOrderPayment phải phản ánh Chờ shop xác nhận còn hàng');
  });

  // Test 3: Kiểm tra hai hàm nghiệp vụ confirmStockAvailable và refundOutOfStockOrder
  it('3. db.ts có đầy đủ hàm confirmStockAvailable và refundOutOfStockOrder', () => {
    const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');
    assert.ok(dbContent.includes('export async function confirmStockAvailable'), 'Thiếu hàm confirmStockAvailable');
    assert.ok(dbContent.includes('export async function refundOutOfStockOrder'), 'Thiếu hàm refundOutOfStockOrder');
    assert.ok(dbContent.includes("SET fulfillment_status = 'PACKING'"), 'confirmStockAvailable phải chuyển sang PACKING');
    assert.ok(dbContent.includes("SET payment_status = 'REFUNDED'"), 'refundOutOfStockOrder phải cập nhật REFUNDED');
    assert.ok(dbContent.includes("transaction_type, amount, direction, payment_gateway, bank_ref_code, notes"), 'refundOutOfStockOrder phải ghi sổ cái tài chính');
  });

  // Test 4: Kiểm tra API Route src/app/api/orders/route.ts
  it('4. API route /api/orders hỗ trợ SHOP_CONFIRM_STOCK và SHOP_OUT_OF_STOCK_REFUND', () => {
    const routeContent = fs.readFileSync(path.join(rootDir, 'src/app/api/orders/route.ts'), 'utf-8');
    assert.ok(routeContent.includes("action === 'SHOP_CONFIRM_STOCK'"), 'Thiếu action SHOP_CONFIRM_STOCK');
    assert.ok(routeContent.includes("action === 'SHOP_OUT_OF_STOCK_REFUND'"), 'Thiếu action SHOP_OUT_OF_STOCK_REFUND');
    assert.ok(routeContent.includes("confirmStockAvailable"), 'Thiếu gọi hàm confirmStockAvailable');
    assert.ok(routeContent.includes("refundOutOfStockOrder"), 'Thiếu gọi hàm refundOutOfStockOrder');
  });

  // Test 5: Kiểm tra giao diện ExecutiveDashboard.tsx
  it('5. ExecutiveDashboard ẩn nút Gửi mã ĐVVC khi chờ thanh toán và hiển thị Còn hàng / Hết hàng khi CONFIRMING', () => {
    const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');
    assert.ok(dashContent.includes('handleShopConfirmStock'), 'Thiếu hàm handleShopConfirmStock');
    assert.ok(dashContent.includes('handleOpenRefundModal'), 'Thiếu hàm handleOpenRefundModal');
    assert.ok(dashContent.includes('handleConfirmRefund'), 'Thiếu hàm handleConfirmRefund');
    assert.ok(dashContent.includes('Báo hết hàng & Hoàn tiền cho khách'), 'Thiếu modal hoàn tiền khi hết hàng');
    assert.ok(dashContent.includes('Chờ shop xác nhận'), 'Thiếu nhãn trạng thái Chờ shop xác nhận');
    assert.ok(dashContent.includes('!isPaid && ord.payment_method !== \'cod\''), 'Thiếu điều kiện ẩn nút gửi mã ĐVVC cho đơn chờ thanh toán');
  });

  // Test 6: Kiểm tra giao diện khách hàng UserProfileModal.tsx
  it('6. UserProfileModal hiển thị nhãn Chờ shop xác nhận và Đã hoàn tiền', () => {
    const modalContent = fs.readFileSync(path.join(rootDir, 'src/components/UserProfileModal.tsx'), 'utf-8');
    assert.ok(modalContent.includes('isConfirming'), 'Thiếu biến isConfirming');
    assert.ok(modalContent.includes('Chờ shop xác nhận'), 'Thiếu nhãn Chờ shop xác nhận trong danh sách đơn');
    assert.ok(modalContent.includes('Đã hoàn tiền'), 'Thiếu nhãn Đã hoàn tiền trong danh sách đơn');
    assert.ok(modalContent.includes('Chờ shop xác nhận còn hàng'), 'Thiếu thông báo Chờ shop xác nhận trong chi tiết đơn');
  });

  // Test 7: Kiểm thử thực thi trực tiếp các hàm logic với Database (Node.js DatabaseSync)
  it('7. Kiểm thử tích hợp hàm logic: Chặn dispatch khi PENDING & Luồng CONFIRMING -> PACKING / REFUND', async () => {
    const { getDb, dispatchOrder, confirmOrderPayment, confirmStockAvailable, refundOutOfStockOrder } = await import('../src/lib/db.ts');
    const db = await getDb();

    const testOrderId = `test-guard-${Date.now()}`;
    const testOrderCode = `ORD-TEST-${Date.now().toString().slice(-4)}`;

    // Tạo đơn hàng test giả lập trạng thái PENDING & UNFULFILLED
    await db.execute(`
      INSERT INTO orders (id, order_code, customer_name, customer_phone, customer_email, shipping_address, subtotal, shipping_fee, discount_amount, total_amount, payment_status, fulfillment_status)
      VALUES (?, ?, 'Nguyễn Văn Test', '0912345678', 'test@test.vn', '123 Đường Test', 350000, 30000, 0, 380000, 'PENDING', 'UNFULFILLED')
    `, [testOrderId, testOrderCode]);

    // BƯỚC A: Thử gọi dispatchOrder khi đơn chưa thanh toán -> BE PHẢI CHẶN!
    const dispatchFailRes = await dispatchOrder(testOrderId, 'VTPTEST123VN', 'VIETTEL_POST');
    assert.equal(dispatchFailRes.success, false, 'Hàm dispatchOrder không chặn đơn chưa thanh toán');
    assert.ok(dispatchFailRes.message.includes('Thao tác bị chặn: Đơn hàng chưa hoàn tất thanh toán'), 'Nội dung thông báo chặn không khớp');

    // BƯỚC B: Khách thanh toán thành công -> chuyển sang CONFIRMING
    const paymentRes = await confirmOrderPayment(testOrderId);
    assert.equal(paymentRes.success, true, 'confirmOrderPayment thất bại');
    const orderAfterPayment = await db.queryFirst('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert.equal(orderAfterPayment.payment_status, 'PAID', 'payment_status chưa thành PAID');
    assert.equal(orderAfterPayment.fulfillment_status, 'CONFIRMING', 'fulfillment_status chưa thành CONFIRMING');

    // BƯỚC C: Khi đang CONFIRMING mà cố gửi mã ĐVVC -> BE TIẾP TỤC CHẶN!
    const dispatchInConfirmingRes = await dispatchOrder(testOrderId, 'VTPTEST123VN', 'VIETTEL_POST');
    assert.equal(dispatchInConfirmingRes.success, false, 'dispatchOrder không chặn khi đơn đang ở CONFIRMING');
    assert.ok(dispatchInConfirmingRes.message.includes('Chờ shop xác nhận còn hàng'), 'Thông báo chặn CONFIRMING không khớp');

    // BƯỚC D: Shop xác nhận còn hàng -> chuyển sang PACKING
    const stockOkRes = await confirmStockAvailable(testOrderId);
    assert.equal(stockOkRes.success, true, 'confirmStockAvailable thất bại');
    const orderAfterStock = await db.queryFirst('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert.equal(orderAfterStock.fulfillment_status, 'PACKING', 'fulfillment_status chưa thành PACKING');

    // BƯỚC E: Khi đã PACKING và PAID -> dispatchOrder thành công!
    const dispatchSuccessRes = await dispatchOrder(testOrderId, 'VTPTEST999VN', 'VIETTEL_POST');
    assert.equal(dispatchSuccessRes.success, true, 'dispatchOrder thất bại khi đơn đã hợp lệ');
    const orderDispatched = await db.queryFirst('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert.equal(orderDispatched.fulfillment_status, 'DISPATCHED', 'fulfillment_status chưa thành DISPATCHED');
    assert.equal(orderDispatched.tracking_code, 'VTPTEST999VN', 'tracking_code chưa được lưu');

    // BƯỚC F: Kiểm thử luồng hết hàng & hoàn tiền với đơn hàng thứ hai
    const testRefundOrderId = `test-refund-${Date.now()}`;
    await db.execute(`
      INSERT INTO orders (id, order_code, customer_name, customer_phone, customer_email, shipping_address, subtotal, shipping_fee, discount_amount, total_amount, payment_status, fulfillment_status)
      VALUES (?, ?, 'Trần Thị Test', '0987654321', 'refund@test.vn', '456 Đường Hoàn Tiền', 500000, 0, 0, 500000, 'PAID', 'CONFIRMING')
    `, [testRefundOrderId, `ORD-REF-${Date.now().toString().slice(-4)}`]);

    const refundRes = await refundOutOfStockOrder(testRefundOrderId, 'Shop hết size - Hoàn tiền STK');
    assert.equal(refundRes.success, true, 'refundOutOfStockOrder thất bại');
    const orderRefunded = await db.queryFirst('SELECT * FROM orders WHERE id = ?', [testRefundOrderId]);
    assert.equal(orderRefunded.payment_status, 'REFUNDED', 'payment_status chưa thành REFUNDED');
    assert.equal(orderRefunded.fulfillment_status, 'CANCELLED', 'fulfillment_status chưa thành CANCELLED');

    // Clean up test data
    await db.execute('DELETE FROM financial_transactions WHERE order_id IN (?, ?)', [testOrderId, testRefundOrderId]);
    await db.execute('DELETE FROM shipments WHERE order_id IN (?, ?)', [testOrderId, testRefundOrderId]);
    await db.execute('DELETE FROM orders WHERE id IN (?, ?)', [testOrderId, testRefundOrderId]);
  });

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
  if (failCount > 0) {
    console.log(`CÓ ${failCount} TEST THẤT BẠI!`);
    process.exit(1);
  } else {
    console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
  }
}

runTests().catch(err => {
  console.error('Lỗi ngoại lệ trong quá trình chạy test:', err);
  process.exit(1);
});
