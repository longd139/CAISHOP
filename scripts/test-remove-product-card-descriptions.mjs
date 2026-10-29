import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== KIỂM THỬ: LOẠI BỎ TOÀN BỘ DÒNG MÔ TẢ (DESCRIPTION) TRÊN CARD SẢN PHẨM ===\n');

let passCount = 0;
let failCount = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failCount++;
  }
}

const rootDir = process.cwd();
const storefrontContent = fs.readFileSync(path.join(rootDir, 'src/components/CustomerStorefront.tsx'), 'utf-8');

// Test 1: Đã xóa dòng mô tả {product.description} trên card sản phẩm
it('1. Đã loại bỏ dòng mô tả {product.description} trên card sản phẩm trang chủ', () => {
  // Tìm khối render card sản phẩm
  const cardSectionRegex = /displayedProducts\.map\(\(product,\s*idx\)\s*=>\s*\{[\s\S]*?Thêm vào giỏ hàng[\s\S]*?<\/article>/;
  const match = storefrontContent.match(cardSectionRegex);
  assert.ok(match, 'Không tìm thấy khối card sản phẩm displayedProducts');
  const cardBlock = match[0];

  assert.ok(
    !cardBlock.includes('{product.description}'),
    'Vẫn còn render {product.description} trong card sản phẩm'
  );
  assert.ok(
    !cardBlock.includes('line-clamp-2 font-light leading-relaxed min-h-[2.2rem]'),
    'Vẫn còn class định dạng đoạn văn bản mô tả'
  );
});

// Test 2: Card sản phẩm vẫn giữ nguyên đầy đủ tên, giá, size và nút thêm giỏ hàng
it('2. Card sản phẩm vẫn bảo toàn đầy đủ tên, phân loại, giá bán và nút "Thêm vào giỏ hàng"', () => {
  assert.ok(storefrontContent.includes('{product.name}'), 'Thiếu tên sản phẩm {product.name}');
  assert.ok(storefrontContent.includes('{product.variants.length} Sizes'), 'Thiếu badge số lượng size');
  assert.ok(storefrontContent.includes('{formatMoney(minPrice)}'), 'Thiếu giá bán minPrice');
  assert.ok(storefrontContent.includes('<span>Thêm vào giỏ hàng</span>'), 'Thiếu nút Thêm vào giỏ hàng');
});

console.log(`\n========================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/${passCount + failCount} tests passed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`TẤT CẢ ${passCount} KIỂM THỬ ĐỀU ĐẠT THÀNH CÔNG (100% PASS)!`);
}
