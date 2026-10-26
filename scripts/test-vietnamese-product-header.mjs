import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU TIEU DE RUT NGAN TIENG VIET <===");

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
runTest("defaultSiteContent.ts: badge là 'DANH MỤC' và title là 'BỘ SƯU TẬP'", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts'), 'utf8');
  assert.ok(content.includes("badge: 'DANH MỤC'"), "badge chưa đúng là 'DANH MỤC'");
  assert.ok(content.includes("title: 'BỘ SƯU TẬP'"), "title chưa đúng là 'BỘ SƯU TẬP'");
  assert.strictEqual(content.includes("KHO LƯU TRỮ SẢN PHẨM"), false, "Vẫn còn chuỗi dài cũ");
});

// 2. Kiểm tra ProductCatalog.tsx
runTest("ProductCatalog.tsx: Đã cập nhật tiêu đề ngắn gọn 'DANH MỤC' và 'BỘ SƯU TẬP'", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductCatalog.tsx'), 'utf8');
  assert.ok(content.includes("{siteContent?.products?.badge || 'DANH MỤC'}"), "badge trong ProductCatalog chưa đúng");
  assert.ok(content.includes("{siteContent?.products?.title || 'BỘ SƯU TẬP'}"), "title trong ProductCatalog chưa đúng");
  assert.strictEqual(content.includes("KHO LƯU TRỮ SẢN PHẨM"), false, "Vẫn còn chuỗi dài cũ");
});

// 3. Kiểm tra ExecutiveDashboard.tsx
runTest("ExecutiveDashboard.tsx: Đã cập nhật preview ngắn gọn", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ExecutiveDashboard.tsx'), 'utf8');
  assert.ok(content.includes("{cmsContent?.products?.badge || 'DANH MỤC'}"), "badge trong ExecutiveDashboard chưa đúng");
  assert.ok(content.includes("{cmsContent?.products?.title || 'BỘ SƯU TẬP'}"), "title trong ExecutiveDashboard chưa đúng");
  assert.strictEqual(content.includes("KHO LƯU TRỮ SẢN PHẨM"), false, "Vẫn còn chuỗi dài cũ");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
