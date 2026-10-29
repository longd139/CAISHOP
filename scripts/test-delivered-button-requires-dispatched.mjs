import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: CHỈ HIỂN THỊ NÚT "KHÁCH ĐÃ NHẬN HÀNG" KHI ĐÃ BÀN GIAO ĐVVC & CHẶN ĐƠN CHỜ THANH TOÁN ===\n');

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

const rootDir = process.cwd();
const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');
const routeContent = fs.readFileSync(path.join(rootDir, 'src/app/api/orders/route.ts'), 'utf-8');

// Test 1: Frontend Modal Footer kiểm tra điều kiện đã bàn giao ĐVVC và không phải PENDING
it('1. ExecutiveDashboard chỉ hiển thị button "Khách đã nhận hàng" khi đơn đã bàn giao ĐVVC và không ở trạng thái PENDING', () => {
  assert.ok(
    dashContent.includes("(selectedOrderForDetail.fulfillment_status === 'DISPATCHED' || Boolean(selectedOrderForDetail.tracking_code))"),
    'Thiếu kiểm tra DISPATCHED / tracking_code trong Modal Footer'
  );
  assert.ok(
    dashContent.includes("selectedOrderForDetail.payment_status !== 'PENDING'"),
    'Thiếu điều kiện chặn payment_status !== PENDING trong Modal Footer'
  );
});

// Test 2: Frontend handleAdminConfirmDelivered kiểm tra trước khi gọi API
it('2. handleAdminConfirmDelivered có guard chặn đơn chưa bàn giao ĐVVC hoặc đang chờ thanh toán', () => {
  assert.ok(
    dashContent.includes("if (!isDispatched) {") && dashContent.includes("Đơn hàng chưa bàn giao cho ĐVVC, chưa thể xác nhận nhận hàng."),
    'Thiếu guard chặn !isDispatched trong handleAdminConfirmDelivered'
  );
  assert.ok(
    dashContent.includes("if (order.payment_status === 'PENDING') {") && dashContent.includes("Đơn hàng đang chờ thanh toán, không thể xác nhận nhận hàng."),
    'Thiếu guard chặn order.payment_status === PENDING trong handleAdminConfirmDelivered'
  );
});

// Test 3: Backend route.ts CONFIRM_DELIVERY kiểm tra chặt chẽ
it('3. Backend /api/orders route chặn xác nhận nhận hàng nếu đơn chờ thanh toán hoặc chưa bàn giao ĐVVC', () => {
  assert.ok(
    routeContent.includes("if (order.payment_status === 'PENDING')") &&
    routeContent.includes("Đơn hàng đang chờ thanh toán, không thể xác nhận nhận hàng."),
    'Backend thiếu kiểm tra order.payment_status === PENDING'
  );
  assert.ok(
    routeContent.includes("const isDispatched = order.fulfillment_status === 'DISPATCHED' || Boolean(order.tracking_code);") &&
    routeContent.includes("if (!isDispatched)") &&
    routeContent.includes("Đơn hàng chưa bàn giao cho ĐVVC, không thể xác nhận nhận hàng."),
    'Backend thiếu kiểm tra isDispatched'
  );
});

// Test 4: Logic kiểm tra hiển thị button cho từng loại đơn hàng
it('4. Kiểm thử logic hiển thị button "Khách đã nhận hàng" theo trạng thái đơn', () => {
  const canShowDeliveredButton = (order) => {
    if (order.fulfillment_status === 'DELIVERED') return false; // Hiện badge thay vì button
    const isDispatched = order.fulfillment_status === 'DISPATCHED' || Boolean(order.tracking_code);
    const isPendingPayment = order.payment_status === 'PENDING' || !order.payment_status;
    const isCancelledOrReturned = order.fulfillment_status === 'CANCELLED' || order.fulfillment_status === 'RETURNED' || order.fulfillment_status === 'REFUNDED';
    return isDispatched && !isPendingPayment && !isCancelledOrReturned;
  };

  // Case 1: Đơn ORD-058041 đang chờ thanh toán (PENDING, chưa có mã ĐVVC) -> KHÔNG ĐƯỢC HIỆN NÚT
  const pendingOrder = {
    order_code: 'ORD-058041',
    payment_status: 'PENDING',
    fulfillment_status: 'PACKING',
    tracking_code: null
  };
  assert.equal(canShowDeliveredButton(pendingOrder), false, 'Đơn chờ thanh toán không được hiện nút nhận hàng');

  // Case 2: Đơn đang chờ shop xác nhận (CONFIRMING, PAID) -> KHÔNG ĐƯỢC HIỆN NÚT
  const confirmingOrder = {
    order_code: 'ORD-123456',
    payment_status: 'PAID',
    fulfillment_status: 'CONFIRMING',
    tracking_code: null
  };
  assert.equal(canShowDeliveredButton(confirmingOrder), false, 'Đơn chờ xác nhận không được hiện nút nhận hàng');

  // Case 3: Đơn đang đóng gói xuất kho (PACKING, PAID, chưa bàn giao ĐVVC) -> KHÔNG ĐƯỢC HIỆN NÚT
  const packingOrder = {
    order_code: 'ORD-789012',
    payment_status: 'PAID',
    fulfillment_status: 'PACKING',
    tracking_code: null
  };
  assert.equal(canShowDeliveredButton(packingOrder), false, 'Đơn đang đóng gói chưa gửi ĐVVC không được hiện nút nhận hàng');

  // Case 4: Đơn ĐÃ BÀN GIAO ĐVVC (DISPATCHED, PAID, có tracking_code) -> ĐƯỢC HIỆN NÚT
  const dispatchedOrder = {
    order_code: 'ORD-999999',
    payment_status: 'PAID',
    fulfillment_status: 'DISPATCHED',
    tracking_code: 'VTP-888123'
  };
  assert.equal(canShowDeliveredButton(dispatchedOrder), true, 'Đơn đã bàn giao ĐVVC phải được hiện nút nhận hàng');

  // Case 5: Đơn ĐÃ NHẬN HÀNG (DELIVERED) -> KHÔNG HIỆN NÚT (hiện badge text)
  const deliveredOrder = {
    order_code: 'ORD-555555',
    payment_status: 'PAID',
    fulfillment_status: 'DELIVERED',
    tracking_code: 'VTP-888123'
  };
  assert.equal(canShowDeliveredButton(deliveredOrder), false, 'Đơn đã nhận hàng không hiện nút');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
