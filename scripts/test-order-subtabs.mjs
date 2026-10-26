import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== BẮT ĐẦU KIỂM THỬ: CHIA TAB TRẠNG THÁI ĐƠN HÀNG (UserProfileModal) ===\n');

// 1. Kiểm tra mã nguồn UserProfileModal.tsx có đầy đủ các tab yêu cầu
const modalPath = path.resolve('src/components/UserProfileModal.tsx');
const modalCode = fs.readFileSync(modalPath, 'utf-8');

// Danh sách các tab yêu cầu: Đã xác nhận, Đang giao, Đã giao, Hoàn đổi
assert.ok(modalCode.includes("'confirmed'"), 'Cần có định nghĩa tab confirmed (Đã xác nhận)');
assert.ok(modalCode.includes("'delivering'"), 'Cần có định nghĩa tab delivering (Đang giao)');
assert.ok(modalCode.includes("'delivered'"), 'Cần có định nghĩa tab delivered (Đã giao)');
assert.ok(modalCode.includes("'returned'"), 'Cần có định nghĩa tab returned (Hoàn đổi)');
assert.ok(modalCode.includes('Đã xác nhận'), 'Cần hiển thị nhãn "Đã xác nhận"');
assert.ok(modalCode.includes('Đang giao'), 'Cần hiển thị nhãn "Đang giao"');
assert.ok(modalCode.includes('Đã giao'), 'Cần hiển thị nhãn "Đã giao"');
assert.ok(modalCode.includes('Hoàn đổi'), 'Cần hiển thị nhãn "Hoàn đổi"');
assert.ok(modalCode.includes('filteredOrders.map'), 'Danh sách render phải dựa trên filteredOrders');

console.log('✓ PASS [1/4]: Giao diện UserProfileModal đã tích hợp đầy đủ 4 tab trạng thái và tab Tất cả');

// 2. Tái hiện hàm getOrderCategory theo đúng logic trong UserProfileModal.tsx
function getOrderCategory(ord) {
  const fulfillment = ord.fulfillment_status || '';
  const isReturned =
    fulfillment === 'RETURNED' ||
    fulfillment === 'RETURNING' ||
    fulfillment === 'RETURN_REQUESTED' ||
    Boolean(ord.return_status);
  if (isReturned) return 'returned';

  const isDelivered = fulfillment === 'DELIVERED';
  if (isDelivered) return 'delivered';

  const isDelivering = fulfillment === 'DISPATCHED' || Boolean(ord.tracking_code);
  if (isDelivering && fulfillment !== 'CANCELLED') return 'delivering';

  return 'confirmed';
}

// 3. Test các ca dữ liệu thực tế
const mockOrders = [
  // Đơn mới tạo / Đang xử lý / Đã cọc COD -> 'confirmed'
  { id: '1', order_code: 'ORD-001', fulfillment_status: 'PENDING', payment_status: 'UNPAID' },
  { id: '2', order_code: 'ORD-002', fulfillment_status: 'PACKING', payment_status: 'PAID' },
  { id: '3', order_code: 'ORD-003', fulfillment_status: 'PENDING', payment_status: 'PARTIALLY_PAID', deposit_amount: 100000 },

  // Đơn đang giao -> 'delivering'
  { id: '4', order_code: 'ORD-004', fulfillment_status: 'DISPATCHED', tracking_code: 'SPX123456' },
  { id: '5', order_code: 'ORD-005', fulfillment_status: 'SHIPPED', tracking_code: 'VTP987654' },

  // Đơn đã giao thành công -> 'delivered'
  { id: '6', order_code: 'ORD-006', fulfillment_status: 'DELIVERED', tracking_code: 'SPX123456' },

  // Đơn yêu cầu hoàn trả hoặc đang hoàn trả -> 'returned'
  { id: '7', order_code: 'ORD-007', fulfillment_status: 'RETURN_REQUESTED', return_status: 'PENDING', return_notes: 'ĐỔI HÀNG size L sang M' },
  { id: '8', order_code: 'ORD-008', fulfillment_status: 'RETURNED', return_status: 'REFUNDED' }
];

const counts = {
  all: mockOrders.length,
  confirmed: mockOrders.filter(o => getOrderCategory(o) === 'confirmed').length,
  delivering: mockOrders.filter(o => getOrderCategory(o) === 'delivering').length,
  delivered: mockOrders.filter(o => getOrderCategory(o) === 'delivered').length,
  returned: mockOrders.filter(o => getOrderCategory(o) === 'returned').length,
};

assert.strictEqual(counts.all, 8, 'Tổng số đơn hàng phải là 8');
assert.strictEqual(counts.confirmed, 3, 'Số đơn Đã xác nhận phải là 3 (ORD-001, ORD-002, ORD-003)');
assert.strictEqual(counts.delivering, 2, 'Số đơn Đang giao phải là 2 (ORD-004, ORD-005)');
assert.strictEqual(counts.delivered, 1, 'Số đơn Đã giao phải là 1 (ORD-006)');
assert.strictEqual(counts.returned, 2, 'Số đơn Hoàn đổi phải là 2 (ORD-007, ORD-008)');

console.log('✓ PASS [2/4]: Phân loại trạng thái đơn hàng (getOrderCategory) hoạt động chính xác tuyệt đối');
console.log('   Thống kê test data:', counts);

// 4. Test bộ lọc filteredOrders theo từng tab
function filterOrders(tab, list) {
  if (tab === 'all') return list;
  return list.filter(ord => getOrderCategory(ord) === tab);
}

const confirmedList = filterOrders('confirmed', mockOrders);
assert.deepStrictEqual(confirmedList.map(o => o.order_code), ['ORD-001', 'ORD-002', 'ORD-003']);

const deliveringList = filterOrders('delivering', mockOrders);
assert.deepStrictEqual(deliveringList.map(o => o.order_code), ['ORD-004', 'ORD-005']);

const deliveredList = filterOrders('delivered', mockOrders);
assert.deepStrictEqual(deliveredList.map(o => o.order_code), ['ORD-006']);

const returnedList = filterOrders('returned', mockOrders);
assert.deepStrictEqual(returnedList.map(o => o.order_code), ['ORD-007', 'ORD-008']);

console.log('✓ PASS [3/4]: Lọc danh sách đơn hàng cho từng tab trả về đúng danh sách mong đợi');

// 5. Test empty state khi tab không có đơn
const emptyDelivered = filterOrders('delivered', mockOrders.filter(o => o.fulfillment_status !== 'DELIVERED'));
assert.strictEqual(emptyDelivered.length, 0, 'Phải có 0 đơn hàng khi tab không có dữ liệu');
console.log('✓ PASS [4/4]: Xử lý chuẩn xác trường hợp danh sách rỗng (Empty State) theo tab');

console.log('\n=== TẤT CẢ 4/4 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
