import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: XÓA BADGE ĐẾM SỐ ĐƠN TRONG BỘ LỌC THỜI GIAN ===\n');

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

// Test 1: Đã xóa badge số lượng đơn cạnh ô chọn ngày
it('1. Đã xóa bỏ hoàn toàn badge {timeFilteredOrders.length} đơn cạnh ô chọn ngày', () => {
  assert.ok(
    !dashContent.includes('{timeFilteredOrders.length} đơn'),
    'Vẫn còn chứa badge {timeFilteredOrders.length} đơn trong ExecutiveDashboard.tsx'
  );
});

// Test 2: Bảo toàn các thành phần của bộ chọn thời gian
it('2. Bộ chọn thời gian vẫn bảo toàn đầy đủ: icon Lịch, Dropdown mốc thời gian, ô Từ ngày và Đến ngày', () => {
  assert.ok(dashContent.includes('id="order-time-filter"'), 'Thiếu dropdown order-time-filter');
  assert.ok(dashContent.includes('aria-label="Từ ngày"'), 'Thiếu input Từ ngày');
  assert.ok(dashContent.includes('aria-label="Đến ngày"'), 'Thiếu input Đến ngày');
  assert.ok(dashContent.includes('handleTimeFilterPresetChange'), 'Thiếu hàm handleTimeFilterPresetChange');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
