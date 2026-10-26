import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: LOẠI BỎ CHẤM TRÒN PHÍA TRƯỚC CHỮ RANK KHÁCH HÀNG ===\n');

const filePath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// 1. Kiểm tra section Cấp bậc Hội viên
const startIdx = content.indexOf('Hệ Thống Cấp Bậc Hội Viên');
assert.ok(startIdx !== -1, 'Phải tìm thấy section Hệ Thống Cấp Bậc Hội Viên');
const endIdx = content.indexOf('Tài Khoản Đăng Ký Hệ Thống');
assert.ok(endIdx !== -1, 'Phải tìm thấy section Tài Khoản Đăng Ký Hệ Thống');
const customerTabSection = content.slice(startIdx, endIdx);

// Kiểm tra 4 Rank Cards
assert.ok(customerTabSection.includes('Hội Viên Đồng'), 'Phải có Hội Viên Đồng');
assert.ok(customerTabSection.includes('Hội Viên Bạc'), 'Phải có Hội Viên Bạc');
assert.ok(customerTabSection.includes('Hội Viên Vàng'), 'Phải có Hội Viên Vàng');
assert.ok(customerTabSection.includes('Kim Cương / CTV VIP'), 'Phải có Kim Cương / CTV VIP');

// Đảm bảo không còn thẻ chấm tròn trước các tên rank này
assert.ok(!customerTabSection.includes('<span className="w-2 h-2 rounded-full bg-amber-600" />'), 'Đã bỏ chấm tròn trước Hội Viên Đồng');
assert.ok(!customerTabSection.includes('<span className="w-2 h-2 rounded-full bg-slate-500" />'), 'Đã bỏ chấm tròn trước Hội Viên Bạc');
assert.ok(!customerTabSection.includes('<span className="w-2 h-2 rounded-full bg-yellow-500" />'), 'Đã bỏ chấm tròn trước Hội Viên Vàng');
assert.ok(!customerTabSection.includes('<span className="w-2 h-2 rounded-full bg-indigo-600" />'), 'Đã bỏ chấm tròn trước Kim Cương / CTV VIP');
console.log('✓ PASS [1/3]: 4 Thẻ Rank phía trên đã được loại bỏ hoàn toàn dấu chấm tròn trước chữ');

// 2. Kiểm tra cột Cấp bậc Rank trong bảng
assert.ok(!customerTabSection.includes('${c.dot_color}'), 'Đã bỏ chấm tròn ${c.dot_color} trong badge Rank');
assert.ok(customerTabSection.includes('{c.tier}'), 'Badge hiển thị tên Rank {c.tier}');
const badgeMatch = customerTabSection.match(/<span\s+className=\{`inline-flex items-center px-2\.5 py-0\.5 rounded-full[\s\S]*?<\/span>/);
assert.ok(badgeMatch, 'Phải tìm thấy thẻ span badge');
assert.ok(!badgeMatch[0].includes('rounded-full bg-'), 'Badge không chứa thẻ chấm tròn nào');
console.log('✓ PASS [2/3]: Badge Cấp bậc Rank trong bảng danh sách đã được bỏ dấu chấm trước chữ');

// 3. Kiểm tra tính toàn vẹn của bảng
assert.ok(customerTabSection.includes('Cấp bậc Rank'), 'Cột Cấp bậc Rank vẫn hiển thị chuẩn');
assert.ok(customerTabSection.includes('Danh Sách Khách Hàng & Cấp Bậc Rank Tích Lũy'), 'Tiêu đề bảng nguyên vẹn');
console.log('✓ PASS [3/3]: Giao diện bảng danh sách khách hàng và Rank hoạt động chuẩn xác');

console.log('\n=== TẤT CẢ 3/3 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
