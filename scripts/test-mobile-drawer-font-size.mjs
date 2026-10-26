import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU TANG KICH THUOC CHU MOBILE DRAWER <===");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductCatalog.tsx'), 'utf8');

runTest("ProductCatalog.tsx: Tiêu đề mobile drawer đã tăng lên text-base", () => {
  assert.ok(
    content.includes('font-wide text-base uppercase font-bold flex items-center gap-2 text-black tracking-wide'),
    "Tiêu đề drawer chưa tăng lên text-base"
  );
});

runTest("ProductCatalog.tsx: Nút 'Tất cả sản phẩm' mobile đã tăng lên text-[13px] sm:text-sm font-bold", () => {
  assert.ok(
    content.includes('px-4 py-3 text-[13px] sm:text-sm font-mono uppercase font-bold tracking-wider'),
    "Nút Tất cả sản phẩm mobile chưa tăng kích thước"
  );
});

runTest("ProductCatalog.tsx: Tên thương hiệu mobile drawer đã tăng lên text-[13px] sm:text-sm font-bold", () => {
  assert.ok(
    content.includes('font-wide uppercase text-[13px] sm:text-sm font-bold py-1.5'),
    "Tên thương hiệu mobile drawer chưa tăng kích thước"
  );
});

runTest("ProductCatalog.tsx: Tên nhóm cấp 2 (▸ Áo, ▸ Quần...) đã tăng lên text-[13px] sm:text-sm font-bold", () => {
  assert.ok(
    content.includes('text-[13px] sm:text-sm font-mono text-black/90 py-1 cursor-pointer font-bold'),
    "Tên nhóm cấp 2 chưa tăng kích thước"
  );
});

runTest("ProductCatalog.tsx: Tên mục con cấp 3 (- Áo thun, - Quần Jean...) đã tăng từ 11px lên 13px-13.5px", () => {
  assert.ok(
    content.includes('text-[13px] sm:text-[13.5px] font-mono text-black/70 py-1.5 px-1'),
    "Tên mục con cấp 3 chưa tăng kích thước"
  );
});

runTest("ProductCatalog.tsx: Nút 'Đóng bộ lọc' mobile đã tăng lên py-3.5 text-sm font-bold", () => {
  assert.ok(
    content.includes('py-3.5 bg-black text-white text-sm font-mono uppercase font-bold tracking-wider'),
    "Nút Đóng bộ lọc chưa tăng kích thước"
  );
});

runTest("ProductCatalog.tsx: Nút kích hoạt trigger ngoài trang mobile đã tăng lên text-[13px] sm:text-sm", () => {
  assert.ok(
    content.includes('text-[13px] sm:text-sm font-mono uppercase font-bold text-black cursor-pointer'),
    "Nút trigger ngoài trang chưa tăng kích thước"
  );
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
