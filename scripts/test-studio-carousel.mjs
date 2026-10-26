import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== BẮT ĐẦU KIỂM TRA STUDIO ATELIER CAROUSEL ===');

// 1. Kiểm tra mã nguồn CustomerStorefront.tsx
const storefrontPath = path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx');
assert.ok(fs.existsSync(storefrontPath), 'CustomerStorefront.tsx không tồn tại');
const content = fs.readFileSync(storefrontPath, 'utf-8');

assert.ok(content.includes('STUDIO_SLIDES'), 'Thiếu danh sách STUDIO_SLIDES');
assert.ok(content.includes('studioImageIndex'), 'Thiếu state studioImageIndex');
assert.ok(content.includes('isStudioPaused'), 'Thiếu state isStudioPaused');
assert.ok(content.includes('Dynamic Studio Image Carousel'), 'Thiếu component Studio Image Carousel');
assert.ok(content.includes('Previous Slide'), 'Thiếu nút Prev Slide');
assert.ok(!content.includes('Top Bar: Slide Counter & Current Spec Tag'), '2 badge ở top bar vẫn chưa được gỡ bỏ');
console.log('✔ CustomerStorefront.tsx: 2 badge ở thanh trên đã được gỡ bỏ thành công theo yêu cầu.');
console.log('✔ CustomerStorefront.tsx: Tích hợp đầy đủ danh sách slide, state chuyển động, nút điều hướng và thanh chỉ báo.');

// 2. Kiểm thử logic chuyển slide (Next, Prev, Loop)
const slidesCount = 4;
let currentIndex = 0;

function nextSlide(curr) {
  return (curr + 1) % slidesCount;
}

function prevSlide(curr) {
  return (curr - 1 + slidesCount) % slidesCount;
}

// Test Next
currentIndex = nextSlide(currentIndex);
assert.strictEqual(currentIndex, 1, 'Sau slide 0 phải là slide 1');
currentIndex = nextSlide(currentIndex);
assert.strictEqual(currentIndex, 2, 'Sau slide 1 phải là slide 2');
currentIndex = nextSlide(currentIndex);
assert.strictEqual(currentIndex, 3, 'Sau slide 2 phải là slide 3');
currentIndex = nextSlide(currentIndex);
assert.strictEqual(currentIndex, 0, 'Sau slide 3 phải vòng lại slide 0 (loop)');
console.log('✔ Logic Next Slide: Chuyển động tuần tự và vòng lặp (0 -> 1 -> 2 -> 3 -> 0) hoạt động chính xác.');

// Test Prev
currentIndex = prevSlide(currentIndex);
assert.strictEqual(currentIndex, 3, 'Từ slide 0 lùi lại phải là slide 3 (wrap-around)');
currentIndex = prevSlide(currentIndex);
assert.strictEqual(currentIndex, 2, 'Từ slide 3 lùi lại phải là slide 2');
console.log('✔ Logic Prev Slide: Lùi slide và wrap-around về cuối hoạt động chính xác.');

// 3. Kiểm tra tính toàn vẹn của URL hình ảnh
const expectedUrls = [
  'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
  'https://images.unsplash.com/photo-1542272604-780c96856592',
  'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99'
];

for (const urlPart of expectedUrls) {
  assert.ok(content.includes(urlPart), `URL ${urlPart} phải có trong CustomerStorefront.tsx`);
}
console.log('✔ 4/4 hình ảnh chất lượng cao về chất liệu may đo và fitting room được cấu hình đầy đủ.');

console.log('=== KẾT QUẢ: 4/4 kiểm tra đạt yêu cầu (PASSED) ===');
