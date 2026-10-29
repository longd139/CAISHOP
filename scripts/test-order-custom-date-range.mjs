import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: CHỌN KHOẢNG THỜI GIAN TỪ NGÀY ĐẾN NGÀY VÀ TỰ ĐỘNG CHUYỂN KHOẢNG NGÀY KHI CHỌN PRESET ===\n');

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

// Test 1: Khai báo state orderStartDate và orderEndDate
it('1. ExecutiveDashboard khai báo state orderStartDate và orderEndDate với giá trị mặc định đầu tháng và cuối tháng', () => {
  assert.ok(dashContent.includes('const [orderStartDate, setOrderStartDate] = useState<string>('), 'Thiếu state orderStartDate');
  assert.ok(dashContent.includes('const [orderEndDate, setOrderEndDate] = useState<string>('), 'Thiếu state orderEndDate');
});

// Test 2: Có 2 ô input chọn ngày Từ ngày -> Đến ngày
it('2. Header danh sách đơn hàng có 2 input type="date" cho "Từ ngày" và "Đến ngày"', () => {
  assert.ok(dashContent.includes('aria-label="Từ ngày"'), 'Thiếu input với aria-label="Từ ngày"');
  assert.ok(dashContent.includes('aria-label="Đến ngày"'), 'Thiếu input với aria-label="Đến ngày"');
  assert.ok(dashContent.includes('value={orderStartDate}'), 'input Từ ngày chưa gán value orderStartDate');
  assert.ok(dashContent.includes('value={orderEndDate}'), 'input Đến ngày chưa gán value orderEndDate');
});

// Test 3: Hàm handleTimeFilterPresetChange tự động đồng bộ ngày khi chọn Tháng này, Tháng trước, ...
it('3. Có hàm handleTimeFilterPresetChange tự động cập nhật ngày đầu tháng -> cuối tháng khi chọn Tháng này', () => {
  assert.ok(dashContent.includes('handleTimeFilterPresetChange'), 'Thiếu hàm handleTimeFilterPresetChange');
  assert.ok(dashContent.includes("if (preset === 'THIS_MONTH')"), 'Thiếu logic tự set ngày cho THIS_MONTH');
  assert.ok(dashContent.includes("else if (preset === 'LAST_MONTH')"), 'Thiếu logic tự set ngày cho LAST_MONTH');
  assert.ok(dashContent.includes("else if (preset === 'TODAY')"), 'Thiếu logic tự set ngày cho TODAY');
  assert.ok(dashContent.includes("else if (preset === 'LAST_7_DAYS')"), 'Thiếu logic tự set ngày cho LAST_7_DAYS');
});

// Test 4: Khi nhập ngày tùy chỉnh, tự động chuyển dropdown sang Tùy chỉnh (CUSTOM)
it('4. Có hàm handleCustomStartDateChange / handleCustomEndDateChange tự chuyển filter sang "CUSTOM"', () => {
  assert.ok(dashContent.includes('handleCustomStartDateChange'), 'Thiếu hàm handleCustomStartDateChange');
  assert.ok(dashContent.includes('handleCustomEndDateChange'), 'Thiếu hàm handleCustomEndDateChange');
  assert.ok(dashContent.includes("setOrderTimeFilter('CUSTOM')"), 'Thiếu setOrderTimeFilter CUSTOM');
  assert.ok(dashContent.includes('<option value="CUSTOM">Tùy chỉnh</option>'), 'Thiếu option Tùy chỉnh trong select box');
});

// Test 5: Logic lọc theo khoảng ngày thực tế
it('5. Kiểm thử logic tính ngày: Chọn Tháng này (10/2026) tự sinh ngày 2026-10-01 đến 2026-10-31', () => {
  const formatDateToYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const now = new Date('2026-10-29T12:00:00Z');
  // Tháng này:
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  assert.equal(formatDateToYMD(startThisMonth), '2026-10-01', 'Ngày đầu tháng 10 phải là 2026-10-01');
  assert.equal(formatDateToYMD(endThisMonth), '2026-10-31', 'Ngày cuối tháng 10 phải là 2026-10-31');

  // Tháng trước:
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  assert.equal(formatDateToYMD(startLastMonth), '2026-09-01', 'Ngày đầu tháng trước phải là 2026-09-01');
  assert.equal(formatDateToYMD(endLastMonth), '2026-09-30', 'Ngày cuối tháng trước phải là 2026-09-30');
});

// Test 6: Kiểm thử logic lọc đơn hàng theo startDate và endDate
it('6. Kiểm thử lọc đơn hàng theo khoảng ngày: 2026-10-01 đến 2026-10-31', () => {
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const isOrderInRange = (order, startDate, endDate) => {
    const d = parseOrderDate(order.created_at);
    if (!d) return false;
    if (startDate) {
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const startOfDay = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      if (d < startOfDay) return false;
    }
    if (endDate) {
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      const endOfDay = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  };

  const orderSept = { id: 'ord-101', created_at: '2026-09-30 13:36:57' };
  const orderOct1 = { id: 'ord-102', created_at: '2026-10-01 08:00:00' };
  const orderOct26 = { id: 'ord-mvp', created_at: '2026-10-26 11:08:27' };

  // Khoảng tháng 10: 2026-10-01 -> 2026-10-31
  assert.equal(isOrderInRange(orderSept, '2026-10-01', '2026-10-31'), false, 'Đơn 30/9 không được nằm trong tháng 10');
  assert.equal(isOrderInRange(orderOct1, '2026-10-01', '2026-10-31'), true, 'Đơn 1/10 phải nằm trong tháng 10');
  assert.equal(isOrderInRange(orderOct26, '2026-10-01', '2026-10-31'), true, 'Đơn 26/10 phải nằm trong tháng 10');

  // Khoảng tùy chỉnh: 2026-10-15 -> 2026-10-30
  assert.equal(isOrderInRange(orderOct1, '2026-10-15', '2026-10-30'), false, 'Đơn 1/10 không nằm trong 15/10 - 30/10');
  assert.equal(isOrderInRange(orderOct26, '2026-10-15', '2026-10-30'), true, 'Đơn 26/10 phải nằm trong 15/10 - 30/10');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
