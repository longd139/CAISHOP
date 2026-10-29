import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU LOAI BO HANG CHU 'KHAM PHA THUONG HIEU' O CUOI COT <===");

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

// 1. Kiểm tra không còn dòng link footer 'Khám phá {col.brand}' ở dưới mỗi cột thương hiệu
runTest("ProductMegaMenu: Đã loại bỏ hoàn toàn hàng chữ 'Khám phá {col.brand}' ở cuối mỗi cột", () => {
  assert.strictEqual(
    content.includes('<span>Khám phá {col.brand}</span>'),
    false,
    "Vẫn còn dòng chữ Khám phá {col.brand}"
  );
  assert.strictEqual(
    content.includes('{/* Brand Direct Link Footer */}'),
    false,
    "Vẫn còn block comment Brand Direct Link Footer"
  );
});

// 2. Kiểm tra Brand Header ở đầu mỗi cột vẫn hoạt động chuẩn xác
runTest("ProductMegaMenu: Tiêu đề thương hiệu ở đầu cột (Brand Header) vẫn được bảo toàn nguyên vẹn", () => {
  assert.ok(
    content.includes('href={`/products?brand=${encodeURIComponent(col.id)}`}'),
    "Thiếu link xem toàn bộ sản phẩm theo thương hiệu ở đầu cột"
  );
  assert.ok(content.includes('{col.brand}'), "Thiếu tên thương hiệu {col.brand}");
  assert.ok(content.includes('{totalBrandProducts} SP'), "Thiếu hiển thị tổng số sản phẩm của thương hiệu");
});

// 3. Kiểm tra các nhóm và danh mục con trong thương hiệu vẫn đầy đủ
runTest("ProductMegaMenu: Danh sách nhóm (Áo, Quần,...) và phân loại con vẫn hiển thị đầy đủ", () => {
  assert.ok(content.includes('col.groups.map'), "Thiếu render col.groups");
  assert.ok(content.includes('grp.items.map'), "Thiếu render grp.items");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
