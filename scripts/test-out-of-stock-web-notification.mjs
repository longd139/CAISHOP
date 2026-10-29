import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: THÔNG BÁO HẾT HÀNG TRỰC TIẾP TRÊN TRANG WEB CHO KHÁCH & QUẢN TRỊ ===\n');

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
const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');
const userProfileContent = fs.readFileSync(path.join(rootDir, 'src/components/UserProfileModal.tsx'), 'utf-8');
const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');

// Test 1: db.ts có migration cho cancel_reason và refund_notes
it('1. src/lib/db.ts có khởi tạo migration cột cancel_reason và refund_notes cho orders', () => {
  assert.ok(
    dbContent.includes("ALTER TABLE orders ADD COLUMN cancel_reason TEXT"),
    'Thiếu migration cancel_reason trong db.ts'
  );
  assert.ok(
    dbContent.includes("ALTER TABLE orders ADD COLUMN refund_notes TEXT"),
    'Thiếu migration refund_notes trong db.ts'
  );
  assert.ok(
    dbContent.includes("cancel_reason?: string | null;"),
    'Interface Order thiếu trường cancel_reason'
  );
  assert.ok(
    dbContent.includes("refund_notes?: string | null;"),
    'Interface Order thiếu trường refund_notes'
  );
});

// Test 2: refundOutOfStockOrder lưu cancel_reason và refund_notes
it('2. refundOutOfStockOrder cập nhật cancel_reason = OUT_OF_STOCK và lưu refund_notes', () => {
  assert.ok(
    dbContent.includes("cancel_reason = 'OUT_OF_STOCK'") && dbContent.includes("refund_notes = ?"),
    'refundOutOfStockOrder chưa cập nhật cancel_reason = OUT_OF_STOCK hoặc refund_notes'
  );
});

// Test 3: UserProfileModal hiển thị thông báo hết hàng cho khách
it('3. UserProfileModal hiển thị badge Hết hàng • Đã hoàn tiền và banner thông báo chi tiết', () => {
  assert.ok(
    userProfileContent.includes("const isOutOfStock = ord.cancel_reason === 'OUT_OF_STOCK' || (isCancelled && isRefunded);"),
    'Thiếu kiểm tra isOutOfStock trong danh sách đơn UserProfileModal'
  );
  assert.ok(
    userProfileContent.includes("'Hết hàng • Đã hoàn tiền'"),
    'Thiếu badge Hết hàng • Đã hoàn tiền'
  );
  assert.ok(
    userProfileContent.includes("THÔNG BÁO TỪ CỬA HÀNG: SẢN PHẨM HẾT HÀNG"),
    'Thiếu banner thông báo hết hàng trong modal chi tiết đơn của khách'
  );
  assert.ok(
    userProfileContent.includes("https://zalo.me/0903112233"),
    'Thiếu link chat Zalo đổi mẫu cho khách trong thông báo hết hàng'
  );
});

// Test 4: ExecutiveDashboard hiển thị badge và banner hết hàng cho admin
it('4. ExecutiveDashboard hiển thị badge Hết hàng (Hoàn tiền) và banner thông báo hết hàng', () => {
  assert.ok(
    dashContent.includes("ord.cancel_reason === 'OUT_OF_STOCK' || ord.payment_status === 'REFUNDED'") &&
    dashContent.includes("'Hết hàng (Hoàn tiền)'"),
    'Bảng đơn hàng Admin chưa hiển thị badge Hết hàng (Hoàn tiền)'
  );
  assert.ok(
    dashContent.includes("Đơn hàng đã được đánh dấu: HẾT HÀNG TẠI KHO"),
    'Chi tiết đơn hàng Admin chưa có banner thông báo Hết hàng tại kho'
  );
  assert.ok(
    dashContent.includes("https://zalo.me/"),
    'Chi tiết đơn hàng Admin thiếu nút Chat Zalo trực tiếp với số điện thoại khách'
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
