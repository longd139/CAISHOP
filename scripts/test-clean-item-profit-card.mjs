import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== KIỂM THỬ: CARD SẢN PHẨM TRONG ĐƠN - CHỈ HIỂN THỊ 4 THÔNG SỐ (SỐ LƯỢNG, GIÁ GỐC, GIÁ BÁN, LÃI) VÀ BỎ LẶP TIỀN ===\n');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.log(`  ✗ FAIL: ${name}`);
    console.log(`    -> ${err.message}`);
    failCount++;
  }
}

const rootDir = process.cwd();
const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');

// Test 1: Hiển thị nhãn Số lượng rõ ràng
it('1. Card sản phẩm hiển thị rõ ràng nhãn "Số lượng:" với badge số lượng', () => {
  assert.ok(dashContent.includes('<span>Số lượng:</span>'), 'Thiếu nhãn "Số lượng:"');
  assert.ok(dashContent.includes('{it.quantity}'), 'Thiếu hiển thị it.quantity');
});

// Test 2: Hiển thị nhãn Giá gốc
it('2. Card sản phẩm hiển thị "Giá gốc:"', () => {
  assert.ok(dashContent.includes('Giá gốc:'), 'Thiếu nhãn "Giá gốc:"');
  assert.ok(dashContent.includes('formatMoney(it.unit_cost || 0)'), 'Thiếu hiển thị formatMoney của unit_cost');
});

// Test 3: Hiển thị nhãn Giá bán
it('3. Card sản phẩm hiển thị "Giá bán:"', () => {
  assert.ok(dashContent.includes('Giá bán:'), 'Thiếu nhãn "Giá bán:"');
  assert.ok(dashContent.includes('formatMoney(it.unit_price || 0)'), 'Thiếu hiển thị formatMoney của unit_price');
});

// Test 4: Hiển thị nhãn Lãi rõ ràng
it('4. Card sản phẩm hiển thị nhãn "Lãi: +" với badge lãi nổi bật', () => {
  assert.ok(dashContent.includes('Lãi: +'), 'Thiếu nhãn "Lãi: +"');
  assert.ok(
    dashContent.includes('((Number(it.unit_price) || 0) - (Number(it.unit_cost) || 0)) * (Number(it.quantity) || 1)'),
    'Thiếu công thức tính lãi theo sản phẩm'
  );
});

// Test 5: Đã loại bỏ hiển thị lặp lại số tiền gây rối mắt
it('5. Đã loại bỏ số tiền lặp lại (tổng tiền it.total_price và Vốn: ... ở cột phải)', () => {
  assert.ok(
    !dashContent.includes('{formatMoney(it.total_price || (it.unit_price * it.quantity))}'),
    'Vẫn còn dòng tổng tiền bị lặp lại ở cột phải'
  );
  assert.ok(
    !dashContent.includes('Vốn: {formatMoney(Number(it.unit_cost) * (Number(it.quantity) || 1))}'),
    'Vẫn còn dòng Vốn: ... bị lặp lại ở cột phải'
  );
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}

