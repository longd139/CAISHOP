import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU IMPORT USEREF TRONG USERPROFILEMODAL <===");

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

const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/UserProfileModal.tsx'), 'utf8');

// 1. Kiểm tra useRef được import trực tiếp từ react
runTest("UserProfileModal: Đã import useRef từ 'react'", () => {
  const importLine = content.split('\n').find(l => l.includes("from 'react'"));
  assert.ok(importLine, "Không tìm thấy dòng import from 'react'");
  assert.ok(importLine.includes('useRef'), "Dòng import từ 'react' thiếu useRef");
});

// 2. Kiểm tra useRef được sử dụng an toàn trong OrderCountdownBadge
runTest("UserProfileModal: hasTriggeredRef và onExpiredRef sử dụng useRef hợp lệ", () => {
  assert.ok(content.includes('const hasTriggeredRef = useRef<boolean>(false);'), "Thiếu khởi tạo hasTriggeredRef với useRef");
  assert.ok(content.includes('const onExpiredRef = useRef(onExpired);'), "Thiếu khởi tạo onExpiredRef với useRef");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
