import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU MOBILE MENU OVERLAY <===");

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

const files = [
  { name: 'CustomerStorefront.tsx', path: 'src/components/CustomerStorefront.tsx' },
  { name: 'ProductCatalog.tsx', path: 'src/components/ProductCatalog.tsx' },
  { name: 'ProductDetail.tsx', path: 'src/components/ProductDetail.tsx' },
];

for (const file of files) {
  const content = fs.readFileSync(path.resolve(process.cwd(), file.path), 'utf8');

  runTest(`${file.name}: Mobile Drawer su dung absolute top-full overlay`, () => {
    assert.ok(
      content.includes('absolute top-full left-0 right-0 w-full'),
      `Mobile Drawer trong ${file.name} chua co class 'absolute top-full left-0 right-0 w-full'`
    );
  });

  runTest(`${file.name}: Mobile Drawer co z-index va shadow de noi bat tren noi dung`, () => {
    assert.ok(
      content.includes('shadow-2xl') && content.includes('z-50'),
      `Mobile Drawer trong ${file.name} chua co shadow-2xl va z-50`
    );
  });

  runTest(`${file.name}: Co backdrop overlay fixed inset-0 de dong khi cham ra ngoai`, () => {
    assert.ok(
      content.includes('fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden'),
      `Backdrop overlay trong ${file.name} chua duoc cau hinh dung`
    );
  });
}

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
