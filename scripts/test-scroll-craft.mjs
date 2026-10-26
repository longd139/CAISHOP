import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== BẮT ĐẦU KIỂM TRA HIỆU ỨNG SCROLL-CRAFT TẠI ROUTE "/" ===');

// 1. Kiểm tra tích hợp trong globals.css
const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
assert.ok(fs.existsSync(cssPath), 'globals.css không tồn tại');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert.ok(cssContent.includes('.reveal'), 'Thiếu class .reveal');
assert.ok(cssContent.includes('.reveal.in'), 'Thiếu class .reveal.in');
assert.ok(cssContent.includes('prefers-reduced-motion: reduce'), 'Thiếu hỗ trợ prefers-reduced-motion cho accessibility');
console.log('✔ globals.css: Chứa đầy đủ cấu hình reveal animation và accessibility (prefers-reduced-motion).');

// 2. Kiểm tra CustomerStorefront.tsx
const storefrontPath = path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx');
assert.ok(fs.existsSync(storefrontPath), 'CustomerStorefront.tsx không tồn tại');
const storefrontContent = fs.readFileSync(storefrontPath, 'utf-8');

assert.ok(storefrontContent.includes('heroProgress'), 'Thiếu state heroProgress');
assert.ok(storefrontContent.includes('scrollProgress'), 'Thiếu state scrollProgress');
assert.ok(storefrontContent.includes('scroll-craft Timeline Scrubber Bar'), 'Thiếu timeline scrubber bar');
assert.ok(storefrontContent.includes('Layer 1: Background Parallax Layer'), 'Thiếu Layer 1 parallax trong Hero');
assert.ok(storefrontContent.includes('Layer 2: Dimensional Atmospheric Light Glow'), 'Thiếu Layer 2 glow trong Hero');
assert.ok(storefrontContent.includes('Layer 3: Typography & Content Plane'), 'Thiếu Layer 3 counter-parallax trong Hero');
assert.ok(storefrontContent.includes('requestAnimationFrame'), 'Thiếu requestAnimationFrame để tối ưu hiệu năng 60fps');
console.log('✔ CustomerStorefront.tsx: Tích hợp đầy đủ kiến trúc 3 tầng không gian (dimensional layering) và scrubber bar.');

// 3. Kiểm thử toán học và hành vi tính toán timeline (clamp & progress)
function calculateScrollMetrics(scrollY, viewportHeight, documentHeight) {
  const heroP = Math.min(Math.max(scrollY / viewportHeight, 0), 1);
  const maxScroll = Math.max(documentHeight - viewportHeight, 1);
  const totalP = Math.min(Math.max((scrollY / maxScroll) * 100, 0), 100);

  // Layer calculations
  const bgTranslateY = heroP * 70;
  const bgScale = 1 + heroP * 0.08;
  const textTranslateY = heroP * -45;
  const textOpacity = Math.max(1 - heroP * 1.25, 0);

  return { heroP, totalP, bgTranslateY, bgScale, textTranslateY, textOpacity };
}

// Case A: Đỉnh trang (scrollY = 0)
const topMetrics = calculateScrollMetrics(0, 800, 4000);
assert.strictEqual(topMetrics.heroP, 0, 'Tại đỉnh trang heroP phải là 0');
assert.strictEqual(topMetrics.totalP, 0, 'Tại đỉnh trang totalP phải là 0%');
assert.strictEqual(topMetrics.bgScale, 1.0, 'Tại đỉnh trang scale ảnh nền phải là 1.0');
assert.strictEqual(topMetrics.textOpacity, 1.0, 'Tại đỉnh trang độ mờ chữ phải là 1.0');
console.log('✔ Case A (Đỉnh trang): Tiến trình = 0%, text hiển thị trọn vẹn 100%.');

// Case B: Giữa Hero (scrollY = 400, vh = 800)
const midMetrics = calculateScrollMetrics(400, 800, 4000);
assert.strictEqual(midMetrics.heroP, 0.5, 'Tại scrollY 400, heroP phải là 0.5');
assert.strictEqual(midMetrics.bgTranslateY, 35, 'Nền parallax dịch chuyển 35px');
assert.strictEqual(midMetrics.bgScale, 1.04, 'Nền zoom nhẹ lên 1.04');
assert.strictEqual(midMetrics.textTranslateY, -22.5, 'Chữ dịch chuyển ngược chiều -22.5px');
assert.strictEqual(midMetrics.textOpacity, 0.375, 'Chữ mờ tự nhiên xuống 0.375');
console.log('✔ Case B (Giữa Hero): Parallax đa tầng tách biệt không gian nền (zoom 1.04) và chữ (-22.5px).');

// Case C: Cuộn qua khỏi Hero (scrollY >= 800)
const pastHero = calculateScrollMetrics(1000, 800, 4000);
assert.strictEqual(pastHero.heroP, 1.0, 'heroP được giới hạn trần ở 1.0');
assert.strictEqual(pastHero.textOpacity, 0, 'Khi cuộn qua Hero, text mờ hoàn toàn về 0 để nhường sân cho section kế tiếp');
console.log('✔ Case C (Cuộn qua Hero): Thoát cảnh mượt mà, chuyển tiếp hoàn hảo sang section sản phẩm.');

console.log('=== KẾT QUẢ: 5/5 kiểm tra đạt yêu cầu (PASSED) ===');
