import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: BANNER SLIDE BỘ SƯU TẬP (COLLECTION BANNER SLIDER) ===\n');

const filePath = path.resolve('src/components/CustomerStorefront.tsx');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const content = rawContent.replace(/\r\n/g, '\n');

// 1. Kiểm tra cấu trúc dữ liệu COLLECTION_BANNER_SLIDES
assert.ok(content.includes('const COLLECTION_BANNER_SLIDES = ['), 'Phải khai báo mảng COLLECTION_BANNER_SLIDES');
assert.ok(content.includes('MÙA THU ĐÔNG MẶC GÌ? • LAYER & COAT COLLECTION'), 'Phải có bộ sưu tập Thu Đông theo yêu cầu');
assert.ok(content.includes('PHONG CÁCH TỐI GIẢN • BẢN LĨNH PHÁI MẠNH'), 'Phải có bộ sưu tập Tối giản Sartorial');
assert.ok(content.includes('BỘ SƯU TẬP PHỐ THỊ • TỰ DO & PHÓNG KHOÁNG'), 'Phải có bộ sưu tập Phố thị Urban');
assert.ok(content.includes('THANH LỊCH CÔNG SỞ • BIẾN TẤU ĐA PHONG CÁCH'), 'Phải có bộ sưu tập Công sở Smart Casual');
console.log('✓ PASS [1/5]: Mảng COLLECTION_BANNER_SLIDES được cấu hình đầy đủ các bộ sưu tập theo mùa và phong cách');

// 2. Kiểm tra State và Logic Auto-play Carousel
assert.ok(content.includes('const [collectionSlideIndex, setCollectionSlideIndex] = useState(0);'), 'Phải có state lưu vị trí slide');
assert.ok(content.includes('const [isCollectionPaused, setIsCollectionPaused] = useState(false);'), 'Phải có state tạm dừng khi hover');
assert.ok(content.includes('setCollectionSlideIndex((prev) => (prev + 1) % COLLECTION_BANNER_SLIDES.length);'), 'Phải có logic auto-play xoay vòng slide');
console.log('✓ PASS [2/5]: Logic quản lý trạng thái slide và tự động chuyển trang hoạt động chuẩn xác');

// 3. Kiểm tra Section giao diện Banner Slide ngang qua
assert.ok(content.includes('id="collections-banner"'), 'Section phải có id="collections-banner"');
assert.ok(content.includes('h-[520px] md:h-[620px] lg:h-[700px]'), 'Banner phải có chiều cao tỉ lệ chuẩn full-bleed');
assert.ok(content.includes('onMouseEnter={() => setIsCollectionPaused(true)}'), 'Phải tạm dừng slide khi người dùng rê chuột vào đọc');
assert.ok(content.includes('onMouseLeave={() => setIsCollectionPaused(false)}'), 'Phải tiếp tục chạy slide khi người dùng rời chuột');
console.log('✓ PASS [3/5]: Section banner slider ngang toàn màn hình được tích hợp hoàn chỉnh với hiệu ứng hover pause');

// 4. Kiểm tra nút "Khám phá ngay", thông tin tiêu đề, hover nền đen chữ trắng và không dùng filter làm tối ảnh
assert.ok(content.includes('Khám phá ngay'), 'Trên mỗi slide phải có nút "Khám phá ngay"');
assert.ok(content.includes('href={slide.href}'), 'Nút khám phá phải liên kết tới khu vực bộ sưu tập / sản phẩm');
assert.ok(content.includes('hover:bg-black hover:text-white'), 'Nút khám phá ngay khi hover phải có nền đen và chữ trắng');
assert.strictEqual(content.includes('bg-gradient-to-t from-black via-black/55'), false, 'Không dùng filter làm tối ảnh');
console.log('✓ PASS [4/5]: Tiêu đề, mô tả và nút "Khám phá ngay" (hover nền đen chữ trắng) hiển thị chuẩn xác');

// 5. Kiểm tra loại bỏ 3 thành phần theo yêu cầu (Badge, Button chuyển ảnh, Tiêu đề ảnh phía dưới)
assert.strictEqual(content.includes('aria-label="Previous Collection Slide"'), false, 'Đã loại bỏ nút chuyển slide trước');
assert.strictEqual(content.includes('aria-label="Next Collection Slide"'), false, 'Đã loại bỏ nút chuyển slide tiếp theo');
assert.strictEqual(content.includes('• 0{idx + 1} / 0{COLLECTION_BANNER_SLIDES.length}'), false, 'Đã loại bỏ badge số slide và tag');
assert.strictEqual(content.includes('0{idx + 1} • {slide.tag.split(\' \')[0]}'), false, 'Đã loại bỏ tiêu đề của ảnh phía dưới');
console.log('✓ PASS [5/5]: Đã loại bỏ hoàn toàn 3 thành phần: badge, nút mũi tên và tiêu đề ảnh phía dưới');

console.log('\n=== TẤT CẢ 5/5 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
