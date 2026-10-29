import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: ĐỔI TIÊU ĐỀ THÀNH "LỢI NHUẬN ĐƠN", BỎ "HẠCH TOÁN GIÁ VỐN &" VÀ BỎ BADGE TỶ SUẤT LÃI ===\n');

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

// Test 1: Tiêu đề hiển thị "Lợi nhuận đơn"
it('1. Tiêu đề khối tài chính hiển thị chính xác "Lợi nhuận đơn"', () => {
  assert.ok(
    dashContent.includes('<span>Lợi nhuận đơn</span>'),
    'Thiếu tiêu đề <span>Lợi nhuận đơn</span>'
  );
});

// Test 2: Bỏ chữ "Hạch toán giá vốn &"
it('2. Đã bỏ cụm từ "Hạch toán giá vốn &" khỏi tiêu đề', () => {
  assert.ok(
    !dashContent.includes('Hạch toán giá vốn & Lợi nhuận đơn'),
    'Vẫn còn chữ "Hạch toán giá vốn & Lợi nhuận đơn"'
  );
  assert.ok(
    !dashContent.includes('Hạch toán giá vốn &'),
    'Vẫn còn chứa cụm từ "Hạch toán giá vốn &"'
  );
});

// Test 3: Bỏ badge tỷ suất lãi ở header
it('3. Đã bỏ badge tỷ suất lãi ở header bảng lợi nhuận đơn', () => {
  assert.ok(
    !dashContent.includes('Tỷ suất lãi: ${profitMargin.toFixed(1)}%'),
    'Vẫn còn badge tỷ suất lãi ở header bảng lợi nhuận'
  );
  assert.ok(
    !dashContent.includes('Đơn âm lợi nhuận'),
    'Vẫn còn badge Đơn âm lợi nhuận ở header'
  );
});

// Test 4: Bảng chi tiết tính toán vẫn đầy đủ nguyên vẹn
it('4. Các mục chi tiết hạch toán giá bán, ưu đãi, giá gốc và lợi nhuận còn lại vẫn được bảo toàn', () => {
  assert.ok(dashContent.includes('1. Giá bán niêm yết (Tiền hàng):'), 'Thiếu dòng Giá bán niêm yết');
  assert.ok(dashContent.includes('2. Trừ ưu đãi / Giảm giá voucher:'), 'Thiếu dòng Trừ ưu đãi');
  assert.ok(dashContent.includes('Doanh thu sau khi trừ ưu đãi:'), 'Thiếu dòng Doanh thu sau khi trừ ưu đãi');
  assert.ok(dashContent.includes('3. Trừ tổng giá gốc (Giá vốn hàng bán - COGS):'), 'Thiếu dòng Trừ tổng giá gốc');
  assert.ok(dashContent.includes('Lợi nhuận đơn này còn lại:'), 'Thiếu khối kết quả Lợi nhuận đơn này còn lại');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
