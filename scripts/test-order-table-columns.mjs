import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ TÁCH CỘT KHÁCH HÀNG & SỐ ĐIỆN THOẠI (ExecutiveDashboard) ===\n');

const filePath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// Lấy phần bảng "Danh sách đơn hàng vận hành"
const orderSectionIndex = content.indexOf('Danh sách đơn hàng vận hành');
assert.ok(orderSectionIndex !== -1, 'Phải tìm thấy section "Danh sách đơn hàng vận hành"');
const orderSection = content.slice(orderSectionIndex);

// 1. Kiểm tra tiêu đề các cột
assert.ok(!orderSection.includes('>Khách hàng & Liên hệ<'), 'Không được còn cột gộp "Khách hàng & Liên hệ"');
assert.ok(orderSection.includes('>Khách hàng<'), 'Phải có cột riêng "Khách hàng"');
assert.ok(orderSection.includes('>Số điện thoại<'), 'Phải có cột riêng "Số điện thoại"');
console.log('✓ PASS [1/4]: Bảng đơn hàng đã tách tiêu đề 2 cột "Khách hàng" và "Số điện thoại"');

// 2. Kiểm tra colSpan khi danh sách rỗng
assert.ok(orderSection.includes('colSpan={8}'), 'colSpan khi bảng rỗng phải cập nhật lên 8 cột');
console.log('✓ PASS [2/4]: colSpan của hàng empty state đã được cập nhật chuẩn xác thành 8');

// 3. Kiểm tra ô dữ liệu tên khách hàng và số điện thoại
assert.ok(orderSection.includes('{ord.customer_name}</div>\n                            </td>'), 'Cột tên khách hàng kết thúc trong td riêng biệt');
assert.ok(orderSection.includes("{ord.customer_phone || '—'}"), 'Cột số điện thoại hiển thị số điện thoại hoặc gạch nối nếu chưa có');
assert.ok(orderSection.includes('zalo.me/${cleanPhone}'), 'Nút liên hệ Zalo nằm trong cột Số điện thoại');
console.log('✓ PASS [3/4]: Dữ liệu tên khách và số điện thoại đã nằm ở 2 ô td độc lập');

// 4. Kiểm tra cấu trúc tổng thể số lượng cột trong thead của bảng đơn hàng
const theadMatch = orderSection.match(/<thead[\s\S]*?<\/thead>/);
assert.ok(theadMatch, 'Phải tìm thấy thead của bảng đơn hàng');
const thCount = (theadMatch[0].match(/<th\b/g) || []).length;
assert.strictEqual(thCount, 8, `Số lượng cột trong thead phải là 8 (thực tế: ${thCount})`);
console.log('✓ PASS [4/4]: Số lượng thẻ th trong thead của bảng đơn hàng khớp đúng 8 cột');

console.log('\n=== TẤT CẢ 4/4 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
