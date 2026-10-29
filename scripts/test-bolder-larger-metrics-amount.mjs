import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: TĂNG KÍCH THƯỚC VÀ ĐỘ ĐẬM (FONT-BLACK, TEXT-3XL/4XL) CHO SỐ TIỀN & CHỈ SỐ DASHBOARD ===\n');

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
const overviewContent = fs.readFileSync(path.join(rootDir, 'src/components/OverviewSection.tsx'), 'utf-8');
const dashContent = fs.readFileSync(path.join(rootDir, 'src/components/ExecutiveDashboard.tsx'), 'utf-8');

// Test 1: OverviewSection có số tiền doanh thu và lợi nhuận to hơn và in đậm (font-black text-3xl sm:text-4xl)
it('1. OverviewSection: 4 card chỉ số cốt lõi (Doanh thu, Lợi nhuận, Đơn hàng, SKU) có định dạng to và in đậm font-black', () => {
  assert.ok(
    overviewContent.includes('text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight leading-none'),
    'Thiếu class text-3xl sm:text-4xl font-black cho Doanh thu/Đơn hàng trong OverviewSection'
  );
  assert.ok(
    overviewContent.includes('text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-none'),
    'Thiếu class text-3xl sm:text-4xl font-black cho Lợi nhuận ròng trong OverviewSection'
  );
});

// Test 2: ExecutiveDashboard tab Cashflow đồng bộ to và in đậm
it('2. ExecutiveDashboard tab Cashflow: Số tiền doanh thu và lợi nhuận cũng to và in đậm font-black', () => {
  assert.ok(
    dashContent.includes('text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight leading-none'),
    'Thiếu class text-3xl sm:text-4xl font-black cho Doanh thu trong ExecutiveDashboard'
  );
  assert.ok(
    dashContent.includes('text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-none'),
    'Thiếu class text-3xl sm:text-4xl font-black cho Lợi nhuận ròng trong ExecutiveDashboard'
  );
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
