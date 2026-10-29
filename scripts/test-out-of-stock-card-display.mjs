import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: XÓA "CHỜ THANH TOÁN" VÀ BÁO "HẾT HÀNG" ĐỐI VỚI ĐƠN HẾT HÀNG ===\n');

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
const userProfileContent = fs.readFileSync(path.join(rootDir, 'src/components/UserProfileModal.tsx'), 'utf-8');
const execContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');

// Test 1: UserProfileModal - Bỏ badge "Chờ thanh toán" khi đơn shop báo hết hàng hoặc đã hủy
it('1. UserProfileModal: Bỏ hoàn toàn badge "Chờ thanh toán" khi đơn hết hàng hoặc đã hủy', () => {
  // Logic kiểm tra điều kiện hiển thị "Chờ thanh toán"
  function getPaymentBadgeText(ord) {
    const isPaid = ord.payment_status === 'PAID';
    const isCancelled = ord.fulfillment_status === 'CANCELLED';
    const isRefunded = ord.payment_status === 'REFUNDED';
    const isOutOfStock = 
      ord.cancel_reason === 'OUT_OF_STOCK' || 
      (ord.cancel_reason || '').toUpperCase() === 'OUT_OF_STOCK' ||
      (isCancelled && isRefunded) ||
      (ord.refund_notes || '').toLowerCase().includes('hết hàng');

    if (isPaid) return 'Đã thanh toán';
    if (!isOutOfStock && !isCancelled && !isRefunded) return 'Chờ thanh toán';
    return null; // Bỏ badge "Chờ thanh toán"
  }

  // Đơn shop báo hết hàng, chưa thanh toán
  const unpaidOutOfStockOrder = {
    order_code: 'ORD-208130',
    fulfillment_status: 'CANCELLED',
    payment_status: 'PENDING',
    cancel_reason: 'OUT_OF_STOCK'
  };
  assert.equal(getPaymentBadgeText(unpaidOutOfStockOrder), null, 'Đơn hết hàng chưa thanh toán không được hiện "Chờ thanh toán"');

  // Đơn shop báo hết hàng đã hoàn tiền
  const refundedOutOfStockOrder = {
    order_code: 'ORD-208131',
    fulfillment_status: 'CANCELLED',
    payment_status: 'REFUNDED',
    cancel_reason: 'OUT_OF_STOCK'
  };
  assert.equal(getPaymentBadgeText(refundedOutOfStockOrder), null, 'Đơn hết hàng đã hoàn tiền không được hiện "Chờ thanh toán"');

  // Đơn bình thường chưa thanh toán
  const normalPendingOrder = {
    order_code: 'ORD-208132',
    fulfillment_status: 'CONFIRMING',
    payment_status: 'PENDING'
  };
  assert.equal(getPaymentBadgeText(normalPendingOrder), 'Chờ thanh toán', 'Đơn bình thường phải hiện "Chờ thanh toán"');

  // Đảm bảo code trong UserProfileModal có check !isOutOfStock && !isCancelled
  assert.ok(
    userProfileContent.includes("(!isOutOfStock && !isCancelled && !isRefunded) ? (") &&
    userProfileContent.includes("Chờ thanh toán"),
    'UserProfileModal chưa bỏ "Chờ thanh toán" cho đơn hết hàng/hủy'
  );
});

// Test 2: UserProfileModal - Báo "Hết hàng" (hoặc "Hết hàng • Đã hoàn tiền") thay vì "Đã hủy"
it('2. UserProfileModal: Hiển thị "Hết hàng" rõ ràng thay vì cộc lốc "Đã hủy" cho đơn hết hàng', () => {
  function getStatusBadgeText(ord) {
    const isCancelled = ord.fulfillment_status === 'CANCELLED';
    const isRefunded = ord.payment_status === 'REFUNDED';
    const isOutOfStock = 
      ord.cancel_reason === 'OUT_OF_STOCK' || 
      (ord.cancel_reason || '').toUpperCase() === 'OUT_OF_STOCK' ||
      (isCancelled && isRefunded) ||
      (ord.refund_notes || '').toLowerCase().includes('hết hàng');

    if (isOutOfStock) {
      return isRefunded ? 'Hết hàng • Đã hoàn tiền' : 'Hết hàng';
    }
    if (isRefunded) return 'Đã hoàn tiền';
    if (isCancelled) return 'Đã hủy';
    return 'Chờ shop xác nhận';
  }

  // Case shop báo hết hàng, đã hoàn tiền
  const ord1 = {
    fulfillment_status: 'CANCELLED',
    payment_status: 'REFUNDED',
    cancel_reason: 'OUT_OF_STOCK'
  };
  assert.equal(getStatusBadgeText(ord1), 'Hết hàng • Đã hoàn tiền');

  // Case shop báo hết hàng, khách chưa thanh toán (hoặc hủy do hết hàng)
  const ord2 = {
    fulfillment_status: 'CANCELLED',
    payment_status: 'PENDING',
    cancel_reason: 'OUT_OF_STOCK'
  };
  assert.equal(getStatusBadgeText(ord2), 'Hết hàng');

  // Case khách tự hủy thông thường (không phải do hết hàng)
  const ord3 = {
    fulfillment_status: 'CANCELLED',
    payment_status: 'PENDING',
    cancel_reason: 'CUSTOMER_CHANGED_MIND'
  };
  assert.equal(getStatusBadgeText(ord3), 'Đã hủy');

  assert.ok(
    userProfileContent.includes("(isRefunded ? 'Hết hàng • Đã hoàn tiền' : 'Hết hàng')"),
    'UserProfileModal chưa hiển thị Hết hàng khi đơn hết hàng'
  );
});

// Test 3: Modal chi tiết đơn hàng của khách cũng bỏ "Chờ thanh toán" và báo "Hết hàng"
it('3. Modal chi tiết đơn hàng (selectedDetailOrder) bỏ "Chờ thanh toán" và báo "Hết hàng"', () => {
  assert.ok(
    userProfileContent.includes("isOutOfStock ? (") &&
    userProfileContent.includes("(isRefunded ? 'Hết hàng • Đã hoàn tiền' : 'Hết hàng')"),
    'Modal chi tiết chưa có badge Hết hàng'
  );
});

// Test 4: ExecutiveDashboard bảng quản trị cũng hiển thị Hết hàng
it('4. ExecutiveDashboard hiển thị Hết hàng (Hoàn tiền) hoặc Hết hàng cho đơn CANCELLED do hết hàng', () => {
  assert.ok(
    execContent.includes("isOutOfStock ? (isRefunded ? 'Hết hàng (Hoàn tiền)' : 'Hết hàng') : 'Đã hủy'"),
    'ExecutiveDashboard chưa xử lý hiển thị Hết hàng trong cột tiến trình'
  );
});

console.log('\n========================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  console.error(`CÓ ${failCount} KIỂM THỬ THẤT BẠI!`);
  process.exit(1);
} else {
  console.log('TẤT CẢ KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!');
}
