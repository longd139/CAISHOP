import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU LOAI BO ICON BONG DEN TREN TRANG CHI TIET SAN PHAM <===");

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

// 1. Kiểm tra không còn icon bóng đèn 💡 trong ProductDetail.tsx
runTest("ProductDetail.tsx: Đã loại bỏ hoàn toàn icon bóng đèn (💡)", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductDetail.tsx'), 'utf8');
  assert.strictEqual(content.includes('💡'), false, "Vẫn còn icon bóng đèn 💡 trong file ProductDetail.tsx");
});

// 2. Kiểm tra thanh gợi ý size vẫn giữ đầy đủ thông tin Size và gợi ý cân nặng/chiều cao
runTest("ProductDetail.tsx: Thanh gợi ý size vẫn hiển thị rõ ràng 'Size {selectedSize}' và thông số", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductDetail.tsx'), 'utf8');
  assert.ok(content.includes('<strong>Size {selectedSize}</strong>:'), "Thiếu tiêu đề 'Size {selectedSize}'");
  assert.ok(content.includes("selectedSize === 'M' && 'Phù hợp 1m65 - 1m72 • 55 - 65 kg (Vừa vặn)'"), "Thiếu gợi ý cho size M");
});

// 3. Kiểm tra nút mở bảng size chi tiết vẫn hoạt động
runTest("ProductDetail.tsx: Nút 'Chi tiết →' vẫn được bảo toàn nguyên vẹn", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductDetail.tsx'), 'utf8');
  assert.ok(content.includes('onClick={() => setIsSizeGuideOpen(true)}'), "Thiếu sự kiện mở modal bảng size");
  assert.ok(content.includes('Chi tiết &rarr;'), "Thiếu nút Chi tiết");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
