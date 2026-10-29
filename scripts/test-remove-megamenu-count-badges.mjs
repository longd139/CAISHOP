import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU LOAI BO BADGE SO LUONG SAN PHAM O THE DANH MUC <===");

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

const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductMegaMenu.tsx'), 'utf8');

// 1. Kiểm tra không còn badge {count} SP trong hàng thẻ chọn nhanh danh mục
runTest("ProductMegaMenu: Đã loại bỏ hoàn toàn badge {count} SP ở hàng thẻ chọn nhanh danh mục", () => {
  // Trích xuất vùng render các thẻ QUICK_CATEGORIES
  const quickCategoriesSection = content.substring(
    content.indexOf('{QUICK_CATEGORIES.map((cat) => {'),
    content.indexOf('{/* ================= 2. KHÁM PHÁ THEO TỪNG THƯƠNG HIỆU CỤ THỂ ================= */')
  );

  assert.strictEqual(
    quickCategoriesSection.includes('{count} SP'),
    false,
    "Vẫn còn hiển thị {count} SP trong hàng thẻ chọn nhanh danh mục"
  );
  assert.strictEqual(
    quickCategoriesSection.includes('count > 0 && ('),
    false,
    "Vẫn còn điều kiện render badge count trong thẻ danh mục"
  );
});

// 2. Kiểm tra tên danh mục và subtext vẫn hiển thị rõ ràng và đẹp mắt
runTest("ProductMegaMenu: Tên danh mục (Áo, Quần,...) và mô tả phân loại vẫn hiển thị đầy đủ", () => {
  assert.ok(content.includes('cat.label'), "Thiếu tên danh mục cat.label");
  assert.ok(content.includes('cat.subtext'), "Thiếu mô tả danh mục cat.subtext");
  assert.ok(content.includes("slug: 'ao'"), "Thiếu cấu hình danh mục Áo");
  assert.ok(content.includes("slug: 'quan'"), "Thiếu cấu hình danh mục Quần");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
