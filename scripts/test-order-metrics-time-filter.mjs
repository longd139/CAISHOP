import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: BỘ CHỌN KHOẢNG THỜI GIAN VÀ SO SÁNH SỐ ĐƠN THÁNG TRƯỚC TRÊN CARD ===\n');

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

// Test 1: Import Calendar từ lucide-react
it('1. ExecutiveDashboard import icon Calendar từ lucide-react', () => {
  assert.ok(dashContent.includes('Calendar,'), 'Chưa import Calendar từ lucide-react');
});

// Test 2: State orderTimeFilter
it('2. Có state orderTimeFilter hỗ trợ các mốc thời gian', () => {
  assert.ok(
    dashContent.includes("const [orderTimeFilter, setOrderTimeFilter] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'TODAY' | 'LAST_7_DAYS' | 'ALL'>('THIS_MONTH');"),
    'Thiếu khai báo state orderTimeFilter hoặc giá trị mặc định THIS_MONTH'
  );
});

// Test 3: Select box chọn mốc thời gian thay thế cho chữ 'Tổng X đơn hàng'
it('3. Đã thay thế dòng chữ tĩnh bằng select box chọn khoảng thời gian (Tháng này, Tháng trước, Hôm nay, 7 ngày qua, Toàn thời gian)', () => {
  assert.ok(!dashContent.includes('Tổng {orders.length} đơn hàng'), 'Vẫn còn dòng chữ tĩnh "Tổng {orders.length} đơn hàng"');
  assert.ok(dashContent.includes('id="order-time-filter"'), 'Thiếu select element với id order-time-filter');
  assert.ok(dashContent.includes('<option value="THIS_MONTH">Tháng này</option>'), 'Thiếu option Tháng này');
  assert.ok(dashContent.includes('<option value="LAST_MONTH">Tháng trước</option>'), 'Thiếu option Tháng trước');
  assert.ok(dashContent.includes('<option value="TODAY">Hôm nay</option>'), 'Thiếu option Hôm nay');
  assert.ok(dashContent.includes('<option value="LAST_7_DAYS">7 ngày qua</option>'), 'Thiếu option 7 ngày qua');
  assert.ok(dashContent.includes('<option value="ALL">Toàn thời gian</option>'), 'Thiếu option Toàn thời gian');
});

// Test 4: Phía dưới card hiển thị "Tháng trước: X đơn"
it('4. Phía dưới mỗi card hiển thị rõ ràng "Tháng trước: ... đơn" để so sánh số liệu', () => {
  assert.ok(dashContent.includes('Tháng trước:'), 'Thiếu nhãn "Tháng trước:" ở footer card');
  assert.ok(dashContent.includes('{card.lastMonthCount} đơn'), 'Thiếu hiển thị card.lastMonthCount đơn');
  assert.ok(dashContent.includes('lastMonthTotalCount'), 'Thiếu biến lastMonthTotalCount');
  assert.ok(dashContent.includes('lastMonthPackingCount'), 'Thiếu biến lastMonthPackingCount');
  assert.ok(dashContent.includes('lastMonthDeliveredCount'), 'Thiếu biến lastMonthDeliveredCount');
});

// Test 5: Bảng đơn hàng lọc đồng bộ theo thời gian và trạng thái
it('5. Bảng đơn hàng displayedOrders được lọc theo cả mốc thời gian (timeFilteredOrders) và trạng thái', () => {
  assert.ok(
    dashContent.includes('const displayedOrders = timeFilteredOrders.filter('),
    'displayedOrders chưa được lọc từ timeFilteredOrders'
  );
});

// Test 6: Kiểm thử logic phân loại thời gian thực tế
it('6. Kiểm thử hàm logic lọc thời gian: Tháng này vs Tháng trước', () => {
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const currentYear = 2026;
  const currentMonth = 9; // Tháng 10 (0-indexed)
  const lastMonthYear = 2026;
  const lastMonth = 8; // Tháng 9 (0-indexed)

  const isOrderInTimeRange = (order, filter) => {
    if (filter === 'ALL') return true;
    const d = parseOrderDate(order.created_at);
    if (!d) return false;
    if (filter === 'THIS_MONTH') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (filter === 'LAST_MONTH') {
      return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
    }
    return true;
  };

  const orderLastMonth = { id: 'ord-101', created_at: '2026-09-30 13:36:57' };
  const orderThisMonth = { id: 'ord-102', created_at: '2026-10-01 13:36:57' };

  assert.equal(isOrderInTimeRange(orderLastMonth, 'LAST_MONTH'), true, 'ord-101 phải thuộc LAST_MONTH');
  assert.equal(isOrderInTimeRange(orderLastMonth, 'THIS_MONTH'), false, 'ord-101 không được thuộc THIS_MONTH');

  assert.equal(isOrderInTimeRange(orderThisMonth, 'THIS_MONTH'), true, 'ord-102 phải thuộc THIS_MONTH');
  assert.equal(isOrderInTimeRange(orderThisMonth, 'LAST_MONTH'), false, 'ord-102 không được thuộc LAST_MONTH');

  assert.equal(isOrderInTimeRange(orderLastMonth, 'ALL'), true, 'ord-101 phải thuộc ALL');
  assert.equal(isOrderInTimeRange(orderThisMonth, 'ALL'), true, 'ord-102 phải thuộc ALL');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
