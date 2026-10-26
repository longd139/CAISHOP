import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: ĐƯA "ĐÃ NHẬN" VÀO TRẠNG THÁI VÀ DỌN DẸP CỘT THAO TÁC ===\n');

const filePath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// Lấy phần bảng "Danh sách đơn hàng vận hành"
const orderSectionIndex = content.indexOf('Danh sách đơn hàng vận hành');
assert.ok(orderSectionIndex !== -1, 'Phải tìm thấy section "Danh sách đơn hàng vận hành"');
const orderSection = content.slice(orderSectionIndex);

// 1. Kiểm tra cột Trạng thái có tùy chọn "Đã nhận"
assert.ok(
  orderSection.includes("{ value: 'DELIVERED', label: 'Đã nhận'"),
  'Cột Trạng thái phải có tùy chọn "Đã nhận" (DELIVERED)'
);
console.log('✓ PASS [1/5]: Cột Trạng thái quản lý trạng thái "Đã nhận" (DELIVERED)');

// 2. Kiểm tra cột Thao tác không còn nút "Đã nhận"
const tdActionMatch = orderSection.match(/<td\s+className=\{`py-2\.5 px-4 text-center whitespace-nowrap sticky right-0[\s\S]*?<\/td>/);
assert.ok(tdActionMatch, 'Phải tìm thấy thẻ td của cột Thao tác');
const tdActionHtml = tdActionMatch[0];

assert.ok(
  !tdActionHtml.includes('<span>Đã nhận</span>'),
  'Cột Thao tác không được chứa nút/chữ "Đã nhận"'
);
assert.ok(
  !tdActionHtml.includes("handleUpdateOrderStatus(ord.id, 'DELIVERED')"),
  'Cột Thao tác không được chứa nút kích hoạt DELIVERED'
);
console.log('✓ PASS [2/5]: Đã loại bỏ hoàn toàn nút "Đã nhận" khỏi cột Thao tác');

// 3. Kiểm tra cột Thao tác hiển thị đúng nút mã vận đơn hoặc "Gửi mã ĐVVC"
assert.ok(tdActionHtml.includes('<span>Gửi mã ĐVVC</span>'), 'Cột Thao tác có nút "Gửi mã ĐVVC" khi chưa gửi mã');
assert.ok(tdActionHtml.includes('ord.tracking_code'), 'Cột Thao tác hiển thị mã vận đơn khi đã có mã');
console.log('✓ PASS [3/5]: Cột Thao tác hiển thị chuẩn nút mã vận chuyển và "Gửi mã ĐVVC"');

// 4. Kiểm tra các đặc tính Sticky Right và cuộn ngang
assert.ok(orderSection.includes('min-w-[1050px]'), 'Table phải có min-w-[1050px]');
assert.ok(orderSection.includes('sticky right-0 z-20'), 'Header cột Thao tác cố định bên phải (sticky right-0 z-20)');
assert.ok(orderSection.includes('sticky right-0 z-10'), 'Cell cột Thao tác cố định bên phải (sticky right-0 z-10)');
console.log('✓ PASS [4/5]: Cột Thao tác cố định bên phải mượt mà khi cuộn ngang');

// 5. Kiểm tra tính toàn vẹn 8 cột
const theadMatch = orderSection.match(/<thead[\s\S]*?<\/thead>/);
assert.ok(theadMatch, 'Phải tìm thấy thead');
const thElements = theadMatch[0].match(/<th\b[^>]*>[\s\S]*?<\/th>/g) || [];
assert.strictEqual(thElements.length, 8, `Số lượng cột trong thead phải là 8 (thực tế: ${thElements.length})`);
assert.ok(orderSection.includes('colSpan={8}'), 'colSpan khi bảng rỗng phải là 8');
console.log('✓ PASS [5/5]: Cấu trúc 8 cột bảng đơn hàng hoạt động chính xác');

console.log('\n=== TẤT CẢ 5/5 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
