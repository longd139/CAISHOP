import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: BUTTON "CHECK SP" VÀ POPUP CHECKLIST KIỂM KHO TRONG ĐƠN HÀNG ===\n');

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
const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');

// Test 0: ClipboardCheck được import đầy đủ từ lucide-react
it('0. ClipboardCheck được import từ lucide-react trong ExecutiveDashboard', () => {
  assert.ok(dashContent.includes('ClipboardCheck,\r\n') || dashContent.includes('ClipboardCheck,\n'), 'ExecutiveDashboard chưa import ClipboardCheck');
});

// Test 1: Cột thao tác của bảng đơn hàng hiển thị button "Check SP" khi đơn CONFIRMING
it('1. Cột thao tác trong ExecutiveDashboard hiển thị button "Check SP" cho đơn CONFIRMING', () => {
  assert.ok(
    dashContent.includes("ord.fulfillment_status === 'CONFIRMING'") &&
    dashContent.includes("handleOpenCheckSpModal(ord)") &&
    dashContent.includes("<span>Check SP</span>"),
    'Cột thao tác chưa hiển thị button Check SP cho đơn CONFIRMING'
  );
});

// Test 2: Trong modal chi tiết đơn, footer và dòng sản phẩm hiển thị "Check SP" khi CONFIRMING
it('2. Modal chi tiết đơn có button "Check SP" ở footer và tại từng dòng sản phẩm khi CONFIRMING', () => {
  assert.ok(
    dashContent.includes("selectedOrderForDetail.fulfillment_status === 'CONFIRMING'") &&
    dashContent.includes("handleOpenCheckSpModal(selectedOrderForDetail)"),
    'Modal chi tiết đơn chưa có button Check SP'
  );
});

// Test 3: Popup Check SP có checklist từng sản phẩm và xử lý số lượng khách đặt >= 2
it('3. Popup Check SP hiển thị checklist từng món và hỗ trợ chọn số lượng thực giao khi khách đặt >= 2', () => {
  assert.ok(
    dashContent.includes("checkSpModalOrder &&") &&
    dashContent.includes("Check SP & Kiểm tra tồn kho"),
    'Thiếu modal Check SP & Kiểm tra tồn kho'
  );
  assert.ok(
    dashContent.includes("handleSetCheckSpQty(key, 1)") &&
    dashContent.includes("handleSetCheckSpQty(key, 0)"),
    'Thiếu nút chọn Còn hàng / Hết hàng cho sản phẩm đặt 1'
  );
  assert.ok(
    dashContent.includes("Array.from({ length: orderedQty + 1 })"),
    'Thiếu bộ chọn số lượng thực giao cho sản phẩm khách đặt >= 2'
  );
  assert.ok(
    dashContent.includes("Hoàn lại: -"),
    'Thiếu tính toán số tiền hoàn lại theo từng dòng thiếu/hết'
  );
});

// Test 4: Backend API và db.ts hỗ trợ partial fulfillment
it('4. Backend /api/orders và db.ts hỗ trợ SHOP_PARTIAL_FULFILLMENT và confirmPartialFulfillment', () => {
  assert.ok(
    routeContent.includes("action === 'SHOP_PARTIAL_FULFILLMENT'"),
    'Backend /api/orders route chưa hỗ trợ SHOP_PARTIAL_FULFILLMENT'
  );
  assert.ok(
    dbContent.includes("export async function confirmPartialFulfillment"),
    'db.ts chưa có hàm confirmPartialFulfillment'
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

