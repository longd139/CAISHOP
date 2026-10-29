import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: ĐỊNH DẠNG CHỮ XÁM IN NGHIÊNG CHO "CHỜ THANH TOÁN" CỘT THAO TÁC ===\n');

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

it('1. Cột Thao tác của bảng đơn hàng hiển thị "Chờ thanh toán" chữ xám in nghiêng, không viền, không nền', () => {
  assert.ok(
    dashContent.includes('text-xs text-slate-400 italic select-none'),
    'Thiếu class text-xs text-slate-400 italic select-none'
  );
  assert.ok(
    !dashContent.includes('px-2 py-1 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded'),
    'Vẫn còn chứa class nền vàng và border cũ trong cột Thao tác'
  );
});

it('2. Modal chi tiết đơn hàng cũng áp dụng đồng bộ chữ xám in nghiêng không nền cho đơn chờ thanh toán', () => {
  assert.ok(
    !dashContent.includes('px-2.5 py-1 rounded border border-amber-200">Chờ thanh toán</span>'),
    'Modal chi tiết vẫn còn chứa badge border vàng cũ cho đơn chờ thanh toán'
  );
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
