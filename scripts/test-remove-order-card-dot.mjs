import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: LOẠI BỎ DẤU CHẤM GÓC PHẢI CARD ĐƠN HÀNG VẬN HÀNH ===\n');

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

it('1. Card thống kê đơn hàng vận hành không còn chứa dấu chấm tròn màu trắng ở góc trên bên phải', () => {
  assert.ok(
    !dashContent.includes('absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white shadow-xs'),
    'Vẫn còn chứa element dấu chấm tròn màu trắng ở góc trên bên phải của card'
  );
  assert.ok(
    !dashContent.includes('top-2.5 right-2.5 w-2 h-2 rounded-full bg-white'),
    'Vẫn còn chứa class định vị chấm tròn trên card'
  );
});

it('2. Các thẻ orderMetricCards vẫn bảo toàn đầy đủ các card lọc chỉ số vận hành', () => {
  assert.ok(dashContent.includes("label: 'Tổng đơn hàng'"), 'Thiếu card Tổng đơn hàng');
  assert.ok(dashContent.includes("label: 'Đang xử lý'"), 'Thiếu card Đang xử lý');
  assert.ok(dashContent.includes("label: 'Đã nhận hàng'"), 'Thiếu card Đã nhận hàng');
  assert.ok(dashContent.includes("label: 'Yêu cầu đổi / hoàn'"), 'Thiếu card Yêu cầu đổi / hoàn');
  assert.ok(dashContent.includes("label: 'Chưa xử lý'"), 'Thiếu card Chưa xử lý');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
