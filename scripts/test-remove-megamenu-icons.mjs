import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU LOAI BO ICON DANH MUC TRONG MEGA MENU <===");

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

// 1. Kiểm tra không còn hộp icon trong thẻ danh mục desktop
runTest("ProductMegaMenu: Đã loại bỏ khung icon w-9 h-9 trong thẻ danh mục desktop", () => {
  assert.strictEqual(
    content.includes('w-9 h-9 rounded-lg bg-white group-hover:bg-white/10 flex items-center justify-center'),
    false,
    "Vẫn còn khung chứa icon w-9 h-9 trong các thẻ danh mục desktop"
  );
  assert.strictEqual(
    content.includes('<IconComp className="w-4.5 h-4.5" />'),
    false,
    "Vẫn còn render icon w-4.5 h-4.5 trong desktop"
  );
});

// 2. Kiểm tra không còn icon trong danh mục mobile
runTest("MobileCollectionsAccordion: Đã loại bỏ icon trong danh mục mobile", () => {
  assert.strictEqual(
    content.includes('<IconComp className="w-3.5 h-3.5 shrink-0" />'),
    false,
    "Vẫn còn render icon w-3.5 h-3.5 trong mobile"
  );
});

// 3. Kiểm tra các thông tin cốt lõi (tên danh mục, số lượng SP, mô tả phụ) vẫn hiển thị đầy đủ
runTest("ProductMegaMenu: Bảo toàn đầy đủ nhãn danh mục, số lượng SP và mô tả phân loại", () => {
  assert.ok(content.includes('cat.label'), "Thiếu hiển thị tên danh mục cat.label");
  assert.ok(content.includes('{count} SP'), "Thiếu hiển thị số lượng {count} SP");
  assert.ok(content.includes('cat.subtext'), "Thiếu hiển thị mô tả phân loại cat.subtext");
  assert.ok(content.includes("slug: 'ao'"), "Thiếu cấu hình danh mục Áo");
  assert.ok(content.includes("subtext: 'Thun • Sơ mi • Polo'"), "Thiếu subtext của Áo");
});

// 4. Kiểm tra các icon không dùng đã được dọn sạch khỏi lucide-react import
runTest("ProductMegaMenu: Dọn sạch import icon thừa (Shirt, Footprints, Watch, Scissors)", () => {
  assert.strictEqual(content.includes('Shirt,'), false, "Vẫn còn import Shirt");
  assert.strictEqual(content.includes('Footprints,'), false, "Vẫn còn import Footprints");
  assert.strictEqual(content.includes('Watch,'), false, "Vẫn còn import Watch");
  assert.strictEqual(content.includes('Scissors,'), false, "Vẫn còn import Scissors");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
