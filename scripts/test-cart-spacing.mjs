import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log('--- KIỂM TRA KHOẢNG CÁCH SẢN PHẨM TRONG GIỎ HÀNG ---');

// 1. Kiểm tra ProductCatalog.tsx
const catalogPath = path.resolve('src/components/ProductCatalog.tsx');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

assert(
  catalogContent.includes('className="py-5 first:pt-0 last:pb-2 flex gap-4 items-start"'),
  'ProductCatalog.tsx: Item giỏ hàng có py-5 để giãn khoảng cách số lượng sản phẩm 1 với sản phẩm 2'
);

assert(
  !catalogContent.includes('space-y-4 divide-y divide-black/10'),
  'ProductCatalog.tsx: Đã loại bỏ space-y-4 gây xung đột khoảng cách với divide-y'
);

// 2. Kiểm tra ProductDetail.tsx
const detailPath = path.resolve('src/components/ProductDetail.tsx');
const detailContent = fs.readFileSync(detailPath, 'utf8');

assert(
  detailContent.includes('className="py-5 first:pt-0 last:pb-2 flex gap-4 items-start"'),
  'ProductDetail.tsx: Item giỏ hàng có py-5 để giãn khoảng cách số lượng sản phẩm 1 với sản phẩm 2'
);

assert(
  !detailContent.includes('space-y-4 divide-y divide-black/10'),
  'ProductDetail.tsx: Đã loại bỏ space-y-4 gây xung đột khoảng cách với divide-y'
);

console.log('----------------------------------------------------');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} passed, ${failCount} failed.`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
