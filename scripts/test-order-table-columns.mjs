import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ BẢNG ĐƠN HÀNG: CUỘN NGANG VÀ HEADER KHÔNG XUỐNG DÒNG ===\n');

const filePath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// Lấy phần bảng "Danh sách đơn hàng vận hành"
const orderSectionIndex = content.indexOf('Danh sách đơn hàng vận hành');
assert.ok(orderSectionIndex !== -1, 'Phải tìm thấy section "Danh sách đơn hàng vận hành"');
const orderSection = content.slice(orderSectionIndex);

// 1. Kiểm tra container overflow-x-auto và table min-w
assert.ok(orderSection.includes('overflow-x-auto'), 'Phải có container overflow-x-auto để hỗ trợ scroll ngang');
assert.ok(orderSection.includes('min-w-[1050px]'), 'Table phải có min-w-[1050px] để tránh bị co ép trên màn hình hẹp');
console.log('✓ PASS [1/4]: Table được cấu hình min-w-[1050px] và bọc trong container overflow-x-auto cho phép cuộn ngang');

// 2. Kiểm tra thead và các thẻ th có whitespace-nowrap
const theadMatch = orderSection.match(/<thead[\s\S]*?<\/thead>/);
assert.ok(theadMatch, 'Phải tìm thấy thead của bảng đơn hàng');
const theadHtml = theadMatch[0];

assert.ok(theadHtml.includes('whitespace-nowrap'), 'Thẻ thead phải có class whitespace-nowrap');

const thElements = theadHtml.match(/<th\b[^>]*>[\s\S]*?<\/th>/g) || [];
assert.strictEqual(thElements.length, 8, `Số lượng cột trong thead phải là 8 (thực tế: ${thElements.length})`);

for (const th of thElements) {
  assert.ok(th.includes('whitespace-nowrap'), `Thẻ th "${th.trim()}" phải có class whitespace-nowrap để không bị xuống dòng`);
}
console.log('✓ PASS [2/4]: Toàn bộ 8/8 cột trong thead đều có class whitespace-nowrap chống rớt dòng');

// 3. Kiểm tra riêng 2 cột Khách hàng & Số điện thoại
assert.ok(!theadHtml.includes('Khách hàng & Liên hệ'), 'Không còn tiêu đề gộp');
assert.ok(theadHtml.includes('>Khách hàng<'), 'Có cột "Khách hàng"');
assert.ok(theadHtml.includes('>Số điện thoại<'), 'Có cột "Số điện thoại"');
console.log('✓ PASS [3/4]: Hai cột Khách hàng và Số điện thoại tách biệt và hiển thị độc lập');

// 4. Kiểm tra các ô td dữ liệu
assert.ok(orderSection.includes('{ord.customer_name}</div>\n                            </td>'), 'Ô tên khách hàng nằm trong td riêng');
assert.ok(orderSection.includes("{ord.customer_phone || '—'}"), 'Ô số điện thoại hiển thị số điện thoại');
assert.ok(orderSection.includes('colSpan={8}'), 'colSpan khi rỗng là 8');
console.log('✓ PASS [4/4]: Dữ liệu hiển thị chuẩn xác ở các td và colSpan={8}');

console.log('\n=== TẤT CẢ 4/4 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
