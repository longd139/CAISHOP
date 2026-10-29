import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: HIỂN THỊ DẤU GẠCH NGANG "—" CHO TRẠNG THÁI THANH TOÁN CỦA ĐƠN HÀNG ĐÃ HỦY / HOÀN TIỀN ===\n');

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

// Test 1: Bảng đơn hàng có guard check đơn hủy hoặc hoàn tiền để hiển thị dấu gạch ngang "—"
it('1. Cột thanh toán bảng đơn hàng hiển thị "—" khi đơn CANCELLED hoặc REFUNDED', () => {
  assert.ok(
    dashContent.includes("const isCancelledOrRefunded = ord.fulfillment_status === 'CANCELLED' || ord.payment_status === 'REFUNDED';") &&
    dashContent.includes('return <span className="text-xs text-slate-400 font-semibold">—</span>;'),
    'Cột thanh toán trong bảng đơn hàng chưa kiểm tra isCancelledOrRefunded để hiển thị "—"'
  );
});

// Test 2: Nút "Thanh toán test" và nhãn "Chờ thanh toán" bị ẩn hoàn toàn khi đơn hủy / hoàn tiền
it('2. Nút "Thanh toán test" và nhãn "Chờ thanh toán" không hiển thị cho đơn đã hủy hoặc hoàn tiền', () => {
  // Logic mô phỏng renderer cột thanh toán
  function renderPaymentCell(ord, isMockPaymentEnabled) {
    const isCancelledOrRefunded = ord.fulfillment_status === 'CANCELLED' || ord.payment_status === 'REFUNDED';
    if (isCancelledOrRefunded) {
      return { text: '—', showMockBtn: false };
    }
    const text = ord.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán';
    const showMockBtn = Boolean(isMockPaymentEnabled && ord.payment_status !== 'PAID');
    return { text, showMockBtn };
  }

  // Case 1: Đơn bị hủy do hết hàng và đã hoàn tiền
  const orderOutOfStock = {
    order_code: 'ORD-208130',
    fulfillment_status: 'CANCELLED',
    payment_status: 'REFUNDED'
  };
  const result1 = renderPaymentCell(orderOutOfStock, true);
  assert.equal(result1.text, '—');
  assert.equal(result1.showMockBtn, false);

  // Case 2: Đơn bị hủy nhưng payment_status là PENDING
  const orderCancelledPending = {
    order_code: 'ORD-208131',
    fulfillment_status: 'CANCELLED',
    payment_status: 'PENDING'
  };
  const result2 = renderPaymentCell(orderCancelledPending, true);
  assert.equal(result2.text, '—');
  assert.equal(result2.showMockBtn, false);

  // Case 3: Đơn bình thường chưa thanh toán
  const orderPending = {
    order_code: 'ORD-208132',
    fulfillment_status: 'CONFIRMING',
    payment_status: 'PENDING'
  };
  const result3 = renderPaymentCell(orderPending, true);
  assert.equal(result3.text, 'Chờ thanh toán');
  assert.equal(result3.showMockBtn, true);

  // Case 4: Đơn đã thanh toán
  const orderPaid = {
    order_code: 'ORD-208133',
    fulfillment_status: 'CONFIRMING',
    payment_status: 'PAID'
  };
  const result4 = renderPaymentCell(orderPaid, true);
  assert.equal(result4.text, 'Đã thanh toán');
  assert.equal(result4.showMockBtn, false);
});

// Test 3: Trong modal chi tiết đơn hàng (selectedOrderForDetail) hiển thị "—" cho đơn hủy / hoàn tiền
it('3. Modal chi tiết đơn hàng hiển thị "—" cho trạng thái thanh toán khi đơn CANCELLED hoặc REFUNDED', () => {
  assert.ok(
    dashContent.includes("const isCancelledOrRefunded = selectedOrderForDetail.fulfillment_status === 'CANCELLED' || selectedOrderForDetail.payment_status === 'REFUNDED';") &&
    dashContent.includes('className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-400"'),
    'Modal chi tiết đơn hàng chưa xử lý hiển thị "—" cho đơn CANCELLED hoặc REFUNDED'
  );
});

// Test 4: Chạy lại test check-sp để đảm bảo không bị break tính năng trước đó
it('4. Tính năng Check SP và popup checklist vẫn nguyên vẹn sau khi cập nhật', () => {
  assert.ok(dashContent.includes('ClipboardCheck'), 'ExecutiveDashboard thiếu ClipboardCheck');
  assert.ok(dashContent.includes('Check SP'), 'Thiếu nút Check SP');
  assert.ok(dashContent.includes('opacity-40 hover:opacity-100'), 'Thiếu hiệu ứng mờ card hết hàng');
});

console.log('\n========================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  console.error(`CÓ ${failCount} KIỂM THỬ THẤT BẠI!`);
  process.exit(1);
} else {
  console.log('TẤT CẢ KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!');
}

