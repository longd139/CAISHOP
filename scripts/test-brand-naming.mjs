import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU CAP NHAT THUONG HIEU DE'GENT <===");

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
runTest("defaultSiteContent.ts: Không còn chứa 'Cái Shop' hoặc 'CÁI SHOP'", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts'), 'utf8');
  assert.strictEqual(content.includes('Cái Shop'), false, "Vẫn còn xuất hiện 'Cái Shop'");
  assert.strictEqual(content.includes('CÁI SHOP'), false, "Vẫn còn xuất hiện 'CÁI SHOP'");
});

runTest("defaultSiteContent.ts: footer_copyright cập nhật chính xác", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts'), 'utf8');
  assert.ok(
    content.includes("footer_copyright: '© 2026 DE\\'GENT. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY.'") ||
    content.includes("footer_copyright: \"© 2026 DE'GENT. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY.\""),
    "footer_copyright chưa đúng định dạng yêu cầu"
  );
});

runTest("defaultSiteContent.ts: footer_brand cập nhật thành DE'GENT", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts'), 'utf8');
  assert.ok(
    content.includes("footer_brand: 'DE\\'GENT - HỘI TỤ ĐỒ HIỆU TUYỂN CHỌN'") ||
    content.includes("footer_brand: \"DE'GENT - HỘI TỤ ĐỒ HIỆU TUYỂN CHỌN\""),
    "footer_brand chưa đúng định dạng yêu cầu"
  );
});

// 2. Kiểm tra CustomerStorefront.tsx
runTest("CustomerStorefront.tsx: Không còn 'Cái Shop' hoặc 'CÁI SHOP' trong văn bản hiển thị", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx'), 'utf8');
  assert.strictEqual(content.includes('Cái Shop'), false, "Vẫn còn xuất hiện 'Cái Shop' trong CustomerStorefront");
  assert.strictEqual(content.includes('CÁI SHOP'), false, "Vẫn còn xuất hiện 'CÁI SHOP' trong CustomerStorefront");
});

runTest("CustomerStorefront.tsx: footer_copyright fallback chính xác", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx'), 'utf8');
  assert.ok(
    content.includes("© 2026 DE'GENT. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY."),
    "Fallback footer_copyright trong CustomerStorefront chưa đúng"
  );
});

// 3. Kiểm tra ExecutiveDashboard.tsx
runTest("ExecutiveDashboard.tsx: hero_description và footer_copyright fallback đã cập nhật DE'GENT", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ExecutiveDashboard.tsx'), 'utf8');
  assert.ok(content.includes("Bộ tứ kinh điển hội tụ tại DE\\'GENT:"), "hero_description fallback chưa cập nhật DE'GENT");
  assert.ok(content.includes("© 2026 DE'GENT. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY."), "footer_copyright fallback chưa cập nhật DE'GENT");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
