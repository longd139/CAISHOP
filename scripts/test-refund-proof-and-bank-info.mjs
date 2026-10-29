import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: THÔNG TIN TÀI KHOẢN HOÀN TIỀN CỦA KHÁCH VÀ GỬI HÌNH BILL XÁC NHẬN CHUYỂN KHOẢN ===\n');

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
const routeContent = fs.readFileSync(path.join(rootDir, 'src/app/api/orders/route.ts'), 'utf-8');
const checkoutContent = fs.readFileSync(path.join(rootDir, 'src/app/checkout/page.tsx'), 'utf-8');
const execContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');
const userProfileContent = fs.readFileSync(path.join(rootDir, 'src/components/UserProfileModal.tsx'), 'utf-8');

// Test 1: db.ts có migration và lưu thông tin bank & ảnh bill
it('1. db.ts có migration 4 trường: refund_bank_name, refund_bank_account, refund_account_holder, refund_proof_image', () => {
  assert.ok(dbContent.includes('ALTER TABLE orders ADD COLUMN refund_bank_name TEXT'), 'Thiếu migration refund_bank_name');
  assert.ok(dbContent.includes('ALTER TABLE orders ADD COLUMN refund_bank_account TEXT'), 'Thiếu migration refund_bank_account');
  assert.ok(dbContent.includes('ALTER TABLE orders ADD COLUMN refund_account_holder TEXT'), 'Thiếu migration refund_account_holder');
  assert.ok(dbContent.includes('ALTER TABLE orders ADD COLUMN refund_proof_image TEXT'), 'Thiếu migration refund_proof_image');
  assert.ok(dbContent.includes('refund_bank_name?: string | null'), 'Thiếu interface Order.refund_bank_name');
  assert.ok(dbContent.includes('refund_proof_image?: string | null'), 'Thiếu interface Order.refund_proof_image');
  assert.ok(dbContent.includes('refund_proof_image = COALESCE(?, refund_proof_image)'), 'Hàm refund chưa cập nhật refund_proof_image');
});

// Test 2: route.ts tiếp nhận bank info khi tạo đơn và proof image khi hoàn tiền
it('2. route.ts xử lý nhận bank info khi POST và refund_proof_image khi PATCH', () => {
  assert.ok(routeContent.includes('refund_bank_name') && routeContent.includes('refund_bank_account'), 'POST /api/orders chưa nhận bank info');
  assert.ok(routeContent.includes('refund_proof_image') && routeContent.includes('SHOP_OUT_OF_STOCK_REFUND'), 'PATCH chưa nhận refund_proof_image cho SHOP_OUT_OF_STOCK_REFUND');
  assert.ok(routeContent.includes('SHOP_PARTIAL_FULFILLMENT'), 'PATCH chưa hỗ trợ SHOP_PARTIAL_FULFILLMENT');
});

// Test 3: Checkout form cho khách điền thông tin tài khoản nhận lại tiền
it('3. Checkout form cho khách điền ngân hàng, STK, chủ tài khoản để nhận hoàn tiền nếu hết hàng', () => {
  assert.ok(checkoutContent.includes('setRefundBankName') && checkoutContent.includes('setRefundBankAccount'), 'Checkout thiếu state bank info');
  assert.ok(checkoutContent.includes('bank-list-suggestions'), 'Checkout thiếu danh sách gợi ý ngân hàng');
  assert.ok(checkoutContent.includes('Tài khoản ngân hàng nhận tiền hoàn (khi shop hết hàng)'), 'Checkout thiếu tiêu đề hướng dẫn nhận hoàn tiền');
  assert.ok(checkoutContent.includes('caishop_saved_refund_bank'), 'Checkout thiếu lưu tự động bank info vào localStorage');
  assert.ok(checkoutContent.includes('refund_bank_account: refundBankAccount.trim()'), 'Checkout chưa đưa bank info vào payload tạo đơn');
});

// Test 4: ExecutiveDashboard hiển thị STK khách và chỗ gửi hình xác nhận chuyển khoản
it('4. ExecutiveDashboard hiển thị STK khách, nút sao chép và ô upload ảnh xác nhận chuyển khoản (Bill)', () => {
  assert.ok(execContent.includes('checkSpModalOrder.refund_bank_account'), 'Check SP modal chưa hiển thị STK của khách');
  assert.ok(execContent.includes('handleUploadProofImage'), 'ExecutiveDashboard thiếu hàm handleUploadProofImage');
  assert.ok(execContent.includes('Hình xác nhận đã chuyển khoản (Bill chuyển tiền):'), 'Check SP modal thiếu ô gửi ảnh xác nhận chuyển khoản');
  assert.ok(execContent.includes('previewProofModalUrl'), 'ExecutiveDashboard thiếu lightbox xem ảnh bill phóng to');
});

// Test 5: UserProfileModal cho khách xem ảnh bill xác nhận chuyển khoản từ shop
it('5. UserProfileModal hiển thị thumbnail và nút xem ảnh bill xác nhận chuyển khoản cho khách', () => {
  assert.ok(userProfileContent.includes('ord.refund_proof_image'), 'UserProfileModal chưa hiển thị bill hoàn tiền ở thẻ đơn hàng');
  assert.ok(userProfileContent.includes('det.refund_proof_image'), 'UserProfileModal chưa hiển thị bill hoàn tiền ở modal chi tiết');
  assert.ok(userProfileContent.includes('selectedProofImage'), 'UserProfileModal thiếu lightbox xem ảnh bill phóng to');
});

console.log('\n========================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  console.error(`CÓ ${failCount} KIỂM THỬ THẤT BẠI!`);
  process.exit(1);
} else {
  console.log('TẤT CẢ KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!');
}
