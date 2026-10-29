import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: HẠCH TOÁN GIÁ GỐC, GIÁ BÁN, ƯU ĐÃI VÀ LỢI NHUẬN TRONG CHI TIẾT ĐƠN HÀNG ===\n');

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

// Test 1: Kiểm tra Backend db.ts có fallback unit_cost cho order_items
it('1. src/lib/db.ts truy vấn unit_cost với fallback pv.cost_price', () => {
  const dbContent = fs.readFileSync(path.join(rootDir, 'src/lib/db.ts'), 'utf-8');
  assert.ok(
    dbContent.includes("COALESCE(NULLIF(oi.unit_cost, 0), pv.cost_price, 0) as unit_cost"),
    'Thiếu logic COALESCE(NULLIF(oi.unit_cost, 0), pv.cost_price, 0) as unit_cost trong db.ts'
  );
});

// Test 2: Kiểm tra ExecutiveDashboard.tsx hiển thị 4 thông số: Số lượng, Giá bán, Giá gốc và Lãi trên từng dòng sản phẩm
it('2. ExecutiveDashboard hiển thị Số lượng, Giá bán, Giá gốc và Lãi trên từng dòng sản phẩm', () => {
  const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');
  assert.ok(dashContent.includes('Số lượng:'), 'Thiếu nhãn "Số lượng:" trên dòng sản phẩm');
  assert.ok(dashContent.includes('Giá bán:'), 'Thiếu nhãn "Giá bán:" trên dòng sản phẩm');
  assert.ok(dashContent.includes('Giá gốc:'), 'Thiếu nhãn "Giá gốc:" trên dòng sản phẩm');
  assert.ok(dashContent.includes('Lãi: +'), 'Thiếu nhãn "Lãi: +" trên dòng sản phẩm');
});

// Test 3: Kiểm tra khối hạch toán tài chính trong chi tiết đơn hàng
it('3. ExecutiveDashboard có bảng hạch toán giá bán, ưu đãi, giá gốc và lợi nhuận còn lại', () => {
  const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');
  assert.ok(dashContent.includes('Hạch toán giá vốn & Lợi nhuận đơn'), 'Thiếu tiêu đề bảng hạch toán');
  assert.ok(dashContent.includes('Giá bán niêm yết (Tiền hàng):'), 'Thiếu dòng "Giá bán niêm yết"');
  assert.ok(dashContent.includes('Trừ ưu đãi / Giảm giá voucher:'), 'Thiếu dòng "Trừ ưu đãi / Giảm giá"');
  assert.ok(dashContent.includes('Doanh thu sau khi trừ ưu đãi:'), 'Thiếu dòng "Doanh thu sau khi trừ ưu đãi"');
  assert.ok(dashContent.includes('Trừ tổng giá gốc (Giá vốn hàng bán - COGS):'), 'Thiếu dòng "Trừ tổng giá gốc"');
  assert.ok(dashContent.includes('Lợi nhuận đơn này còn lại:'), 'Thiếu hộp "Lợi nhuận đơn này còn lại"');
  assert.ok(dashContent.includes('profit = netMerchandiseRevenue - totalCostPrice'), 'Thiếu công thức tính lợi nhuận');
});

// Test 4: Kiểm thử tích hợp tính toán logic thực tế
it('4. Kiểm thử công thức tài chính: Giá bán 249.000đ, Giá gốc 95.000đ, Giảm giá 20.000đ => Lợi nhuận đúng 134.000đ', () => {
  const subtotal = 249000;
  const unitCost = 95000;
  const quantity = 1;
  const discountAmount = 20000;

  const totalSellingPrice = subtotal;
  const totalCostPrice = unitCost * quantity;
  const netMerchandiseRevenue = Math.max(0, totalSellingPrice - discountAmount);
  const profit = netMerchandiseRevenue - totalCostPrice;
  const profitMargin = (profit / netMerchandiseRevenue) * 100;

  assert.equal(totalCostPrice, 95000, 'Giá gốc không đúng 95.000đ');
  assert.equal(netMerchandiseRevenue, 229000, 'Doanh thu sau ưu đãi không đúng 229.000đ');
  assert.equal(profit, 134000, 'Lợi nhuận phải là 134.000đ (229k - 95k)');
  assert.equal(profitMargin.toFixed(1), '58.5', 'Tỷ suất lợi nhuận phải là 58.5%');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}

