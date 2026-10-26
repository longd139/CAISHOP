import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU CHI CO MOI NUT CHOT DON NGAY <===");

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

// 1. Kiểm tra CustomerStorefront.tsx
runTest("CustomerStorefront.tsx: Khu vực CTA chỉ có nút CHỐT ĐƠN NGAY, không còn nút Executive Dashboard", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx'), 'utf8');
  assert.ok(content.includes("{siteContent?.home?.cta_button_text || 'CHỐT ĐƠN NGAY'}"), "Không tìm thấy nút CHỐT ĐƠN NGAY");
  
  // Lấy đoạn CTA xung quanh
  const ctaSection = content.substring(content.indexOf('id="preview-home-sec-cta"') || content.indexOf('SỞ HỮU ITEM ĐỒ HIỆU ƯA THÍCH'), content.indexOf('DARK EDITORIAL FOOTER'));
  assert.strictEqual(ctaSection.includes('Executive Dashboard'), false, "Khu vực CTA vẫn còn nút Executive Dashboard");
});

// 2. Kiểm tra ExecutiveDashboard.tsx
runTest("ExecutiveDashboard.tsx: Preview khối CTA chỉ có nút CHỐT ĐƠN NGAY", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ExecutiveDashboard.tsx'), 'utf8');
  const ctaPreview = content.substring(content.indexOf('[KHỐI 6: KÊU GỌI HÀNH ĐỘNG (CTA)]'), content.indexOf('[KHỐI 7: CHÂN TRANG STOREFRONT]'));
  assert.strictEqual(ctaPreview.includes('Executive Dashboard'), false, "Preview khối CTA vẫn còn nút Executive Dashboard");
  assert.ok(ctaPreview.includes("{cmsContent?.home?.cta_button_text || 'CHỐT ĐƠN NGAY'}"), "Preview khối CTA thiếu nút CHỐT ĐƠN NGAY");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
