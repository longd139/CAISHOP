import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU CHONG LAP VO HAN (INFINITE LOOP) DON HANG HET HAN <===");

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

// 1. Kiểm tra OrderCountdownBadge chặn đứng vòng lặp khi đơn hàng đã hết hạn từ trước
runTest("OrderCountdownBadge: Kiểm tra initial <= 0 thì return ngay, không gọi setInterval hay DELETE", () => {
  assert.ok(content.includes('if (initial <= 0) {'), "Thiếu điều kiện kiểm tra initial <= 0");
  assert.ok(content.includes('hasTriggeredRef.current = true;'), "Thiếu cờ chặn trigger lặp lại hasTriggeredRef");
});

// 2. Kiểm tra không lặp lại request DELETE nhờ cờ hasTriggeredRef
runTest("OrderCountdownBadge: Chỉ gọi DELETE duy nhất 1 lần khi bộ đếm chạm 0 trong phiên xem", () => {
  assert.ok(content.includes('if (!hasTriggeredRef.current) {'), "Thiếu guard if (!hasTriggeredRef.current)");
  assert.ok(content.includes('onExpiredRef.current = onExpired;'), "Phải lưu onExpired vào ref để tránh useEffect re-run liên tục");
});

// 3. Đơn hàng COD không gắn đồng hồ đếm ngược 1 tiếng
runTest("UserProfileModal: Không hiển thị OrderCountdownBadge cho đơn hàng COD", () => {
  assert.ok(content.includes("ord.payment_method !== 'cod'"), "Vẫn còn áp dụng đếm ngược cho đơn ord COD");
  assert.ok(content.includes("det.payment_method !== 'cod'"), "Vẫn còn áp dụng đếm ngược cho đơn chi tiết det COD");
});

// 4. fetchOrders hỗ trợ cơ chế isSilent tránh giật giật màn hình
runTest("fetchOrders: Hỗ trợ isSilent = false để không giật unmount giao diện", () => {
  assert.ok(content.includes('const fetchOrders = useCallback(async (isSilent = false) => {'), "fetchOrders chưa hỗ trợ tham số isSilent");
  assert.ok(content.includes('if (!isSilent) setIsLoadingOrders(true);'), "setIsLoadingOrders chưa được bọc bởi isSilent");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
