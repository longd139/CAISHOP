import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU CHUYEN PRODUCT HEADER SANG TIENG VIET <===");

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

// 1. Kiểm tra defaultSiteContent.ts
runTest("defaultSiteContent.ts: Đã chuyển badge và title sang tiếng Việt", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts'), 'utf8');
  assert.ok(content.includes("badge: 'BỘ SƯU TẬP 01 • DANH MỤC TUYỂN CHỌN'"), "badge chưa đúng tiếng Việt");
  assert.ok(content.includes("title: 'KHO LƯU TRỮ SẢN PHẨM'"), "title chưa đúng tiếng Việt");
  assert.strictEqual(content.includes("THE PRODUCT ARCHIVE"), false, "Vẫn còn chuỗi THE PRODUCT ARCHIVE");
  assert.strictEqual(content.includes("EDITIONS CATALOGUE"), false, "Vẫn còn chuỗi EDITIONS CATALOGUE");
});

// 2. Kiểm tra ProductCatalog.tsx
runTest("ProductCatalog.tsx: Đã chuyển tiêu đề trang sang tiếng Việt", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductCatalog.tsx'), 'utf8');
  assert.ok(content.includes("BỘ SƯU TẬP 01 • DANH MỤC TUYỂN CHỌN"), "badge tiếng Việt không tìm thấy trong ProductCatalog");
  assert.ok(content.includes("KHO LƯU TRỮ SẢN PHẨM"), "title tiếng Việt không tìm thấy trong ProductCatalog");
  assert.strictEqual(content.includes("THE PRODUCT ARCHIVE"), false, "Vẫn còn chuỗi THE PRODUCT ARCHIVE");
  assert.strictEqual(content.includes("EDITIONS CATALOGUE"), false, "Vẫn còn chuỗi EDITIONS CATALOGUE");
});

// 3. Kiểm tra ExecutiveDashboard.tsx
runTest("ExecutiveDashboard.tsx: Đã cập nhật preview sang tiếng Việt", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ExecutiveDashboard.tsx'), 'utf8');
  assert.ok(content.includes("BỘ SƯU TẬP 01 • DANH MỤC TUYỂN CHỌN"), "badge tiếng Việt không tìm thấy trong ExecutiveDashboard");
  assert.ok(content.includes("KHO LƯU TRỮ SẢN PHẨM"), "title tiếng Việt không tìm thấy trong ExecutiveDashboard");
  assert.strictEqual(content.includes("THE PRODUCT ARCHIVE"), false, "Vẫn còn chuỗi THE PRODUCT ARCHIVE");
  assert.strictEqual(content.includes("EDITIONS CATALOGUE"), false, "Vẫn còn chuỗi EDITIONS CATALOGUE");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
