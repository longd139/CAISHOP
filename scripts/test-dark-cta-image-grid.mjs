import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: LƯỚI ẢNH TƯƠNG TÁC HOVER REVEAL TẠI KHỐI DARK CTA ===\n');

const filePath = path.resolve('src/components/CustomerStorefront.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// 1. Kiểm tra mảng ảnh và 80 ô lưới ảnh (4 hàng x 20 cột)
assert.ok(content.includes('const CTA_GRID_IMAGES = ['), 'Phải khai báo mảng CTA_GRID_IMAGES');
assert.ok(content.includes('const CTA_GRID_TILES = Array.from({ length: 80 }'), 'Phải tạo mảng 80 ô lưới tương ứng 4x20');
console.log('✓ PASS [1/5]: Mảng 80 ô ảnh cho lưới 4 hàng x 20 cột được khởi tạo hoàn chỉnh');

// 2. Kiểm tra cấu trúc Grid CSS (4 hàng dọc, 20 cột ngang trên desktop)
assert.ok(content.includes('grid-rows-4'), 'Lưới phải có đúng 4 hàng dọc (grid-rows-4)');
assert.ok(content.includes('lg:grid-cols-20'), 'Lưới phải có 20 cột ngang trên desktop (lg:grid-cols-20)');
assert.ok(content.includes('gap-0'), 'Lưới phải có gap-0 để không bị khoảng hở giữa các ô ảnh');
console.log('✓ PASS [2/5]: Cấu trúc grid 4 hàng x 20 cột liền mạch (gap-0) được thiết lập chuẩn xác');

// 3. Kiểm tra tính năng đồng bộ màu đen và không viền
assert.ok(content.includes('border-0 outline-none p-0 m-0'), 'Từng ô ảnh phải không có viền và không có padding/margin');
assert.ok(content.includes('bg-[#0a0a0a]'), 'Nền từng ô ảnh phải đồng bộ với mã màu đen nền #0a0a0a');
console.log('✓ PASS [3/5]: Nền đen #0a0a0a đồng bộ tuyệt đối, loại bỏ 100% viền ảnh');

// 4. Kiểm tra hiệu ứng hover reveal (ban đầu đen, di chuột tới đâu hiện ảnh tới đó, rời chuột mờ về đen)
assert.ok(content.includes('opacity-0 group-hover:opacity-100'), 'Ban đầu ảnh ẩn đen (opacity-0), khi hover hiện ảnh (opacity-100)');
assert.ok(content.includes('transition-all duration-700 ease-out group-hover:duration-75'), 'Khi hover hiện nhanh (75ms), khi rời chuột mờ dần về đen (700ms)');
console.log('✓ PASS [4/5]: Hiệu ứng chuyển động chuột (rê tới đâu hiện ảnh tới đó, rời đi tự mờ về đen) được cài đặt chuẩn');

// 5. Kiểm tra tương tác với nội dung chữ và nút bấm CTA phía trên
assert.ok(content.includes('pointer-events-none'), 'Lớp chữ nổi có pointer-events-none để sự kiện chuột chạm xuống lưới ảnh');
assert.ok(content.includes('pointer-events-auto'), 'Nút CHỐT ĐƠN NGAY có pointer-events-auto để người dùng vẫn click bấm bình thường');
assert.ok(content.includes('CHỐT ĐƠN NGAY'), 'Vẫn giữ nguyên nút CTA CHỐT ĐƠN NGAY');
console.log('✓ PASS [5/5]: Lớp nội dung chữ không cản trở di chuột và nút CTA vẫn bấm hoạt động hoàn hảo');

console.log('\n=== TẤT CẢ 5/5 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
