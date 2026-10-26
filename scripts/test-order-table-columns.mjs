import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ BẢNG ĐƠN HÀNG: CỐ ĐỊNH CỘT THAO TÁC (STICKY RIGHT) ===\n');

const filePath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// Lấy phần bảng "Danh sách đơn hàng vận hành"
const orderSectionIndex = content.indexOf('Danh sách đơn hàng vận hành');
assert.ok(orderSectionIndex !== -1, 'Phải tìm thấy section "Danh sách đơn hàng vận hành"');
const orderSection = content.slice(orderSectionIndex);

// 1. Kiểm tra container overflow-x-auto và table min-w
assert.ok(orderSection.includes('overflow-x-auto'), 'Phải có container overflow-x-auto');
assert.ok(orderSection.includes('min-w-[1050px]'), 'Table phải có min-w-[1050px]');
console.log('✓ PASS [1/4]: Bảng có min-w-[1050px] và bọc trong overflow-x-auto hỗ trợ cuộn ngang');

// 2. Kiểm tra cột Thao tác trong thead có sticky right-0
const theadMatch = orderSection.match(/<thead[\s\S]*?<\/thead>/);
assert.ok(theadMatch, 'Phải tìm thấy thead');
const theadHtml = theadMatch[0];

assert.ok(theadHtml.includes('sticky right-0'), 'Cột Thao tác trong thead phải có sticky right-0');
assert.ok(theadHtml.includes('border-l'), 'Cột Thao tác trong thead phải có border-l để ngăn cách khi cuộn');
assert.ok(theadHtml.includes('z-20'), 'Cột Thao tác trong thead phải có z-index cao (z-20) để đè lên các cột khi cuộn');
console.log('✓ PASS [2/4]: Header cột Thao tác được cố định mép phải (sticky right-0 z-20)');

// 3. Kiểm tra ô td của cột Thao tác có sticky right-0 và màu nền
assert.ok(orderSection.includes('sticky right-0 z-10 border-l'), 'Ô td Thao tác phải có sticky right-0 z-10 và border-l');
assert.ok(orderSection.includes('group-hover:bg-slate-50'), 'Ô td Thao tác hỗ trợ đổi màu khi hover dòng');
console.log('✓ PASS [3/4]: Nội dung cell Thao tác được cố định bên phải (sticky right-0 z-10) kèm màu nền');

// 4. Kiểm tra các cột khác và colSpan
assert.ok(theadHtml.includes('>Khách hàng<'), 'Có cột "Khách hàng"');
assert.ok(theadHtml.includes('>Số điện thoại<'), 'Có cột "Số điện thoại"');
assert.ok(orderSection.includes('colSpan={8}'), 'colSpan khi rỗng là 8');
console.log('✓ PASS [4/4]: Duy trì cấu trúc 8 cột tách biệt chính xác');

console.log('\n=== TẤT CẢ 4/4 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
