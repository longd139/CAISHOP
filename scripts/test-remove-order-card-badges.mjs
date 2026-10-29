import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: LOẠI BỎ TOÀN BỘ BADGE PHỤ TRÊN CARD ĐƠN HÀNG VẬN HÀNH ===\n');

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

it('1. Đã loại bỏ code render badge trong phần footer của orderMetricCards', () => {
  assert.ok(
    !dashContent.includes('{card.badge && ('),
    'Vẫn còn chứa khối render {card.badge && (}'
  );
  assert.ok(
    !dashContent.includes('{card.badge}'),
    'Vẫn còn render nội dung card.badge'
  );
});

it('2. Các badge không cần thiết ("Tất cả", "Đang giao & gói", "Giao thành công", "Chờ tiếp nhận") đã được xóa khỏi orderMetricCards', () => {
  // Lấy đoạn định nghĩa orderMetricCards
  const match = dashContent.match(/const orderMetricCards = \[[\s\S]*?\];/);
  assert.ok(match, 'Không tìm thấy mảng orderMetricCards');
  const cardsBlock = match[0];

  assert.ok(!cardsBlock.includes("badge: 'Tất cả'"), 'Vẫn còn badge "Tất cả"');
  assert.ok(!cardsBlock.includes("badge: 'Đang giao & gói'"), 'Vẫn còn badge "Đang giao & gói"');
  assert.ok(!cardsBlock.includes("badge: 'Giao thành công'"), 'Vẫn còn badge "Giao thành công"');
  assert.ok(!cardsBlock.includes("badge: 'Chờ tiếp nhận'"), 'Vẫn còn badge "Chờ tiếp nhận"');
});

it('3. Các thông tin chính của card (label, count, subtext doanh thu/số lượng) vẫn được giữ nguyên đầy đủ', () => {
  assert.ok(dashContent.includes("label: 'Tổng đơn hàng'"), 'Thiếu card Tổng đơn hàng');
  assert.ok(dashContent.includes("label: 'Đang xử lý'"), 'Thiếu card Đang xử lý');
  assert.ok(dashContent.includes("label: 'Đã nhận hàng'"), 'Thiếu card Đã nhận hàng');
  assert.ok(dashContent.includes("label: 'Yêu cầu đổi / hoàn'"), 'Thiếu card Yêu cầu đổi / hoàn');
  assert.ok(dashContent.includes("label: 'Chưa xử lý'"), 'Thiếu card Chưa xử lý');
  assert.ok(dashContent.includes("{card.subtext}"), 'Thiếu hiển thị card.subtext');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
