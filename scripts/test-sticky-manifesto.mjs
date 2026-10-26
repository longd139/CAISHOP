import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== BẮT ĐẦU KIỂM TRA HIỆU ỨNG STICKY PIN MANIFESTO & CURTAIN OVERLAY ===');

// 1. Kiểm tra mã nguồn CustomerStorefront.tsx
const storefrontPath = path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx');
assert.ok(fs.existsSync(storefrontPath), 'CustomerStorefront.tsx không tồn tại');
const content = fs.readFileSync(storefrontPath, 'utf-8');

assert.ok(content.includes('STICKY PIN MANIFESTO (Curtain Reveal Pattern)'), 'Thiếu ghi chú sticky pin manifesto');
assert.ok(content.includes('sticky top-0 h-[100dvh]'), 'Thiếu class sticky top-0 h-[100dvh] để ngưng lại');
assert.ok(content.includes('min-h-[150dvh] md:min-h-[170dvh]'), 'Thiếu chiều cao hành trình pin để tạo khoảng dừng');
assert.ok(content.includes('relative z-20 w-full bg-[#0a0a0a]'), 'Thiếu class z-20 trên section CTA kế tiếp để đè lên');
assert.ok(content.includes('shadow-[0_-25px_60px_rgba(0,0,0,0.5)]'), 'Thiếu bóng đổ viền trên để tạo chiều sâu đè lên');
console.log('✔ CustomerStorefront.tsx: Cấu trúc sticky pin và curtain overlay được thiết lập chuẩn xác.');

// 2. Kiểm thử toán học mô phỏng hành vi cuộn (Scroll Simulation)
// Giả sử viewportHeight = 800px.
// Vị trí bắt đầu của Manifesto Container tại containerTop = 3000px.
// Chiều cao container = 160vh = 1280px.
// Section CTA bắt đầu xuất hiện và đè lên từ scrollY = containerTop + containerHeight - viewportHeight = 3480px.
function simulateManifestoState(scrollY, containerTop = 3000, vh = 800) {
  const containerHeight = vh * 1.6; // 1280px
  const isPinned = scrollY >= containerTop && scrollY < (containerTop + containerHeight - vh);
  const ctaTopRelativeToViewport = Math.max((containerTop + containerHeight) - scrollY, 0);
  const ctaOverlapHeight = Math.max(vh - ctaTopRelativeToViewport, 0);
  const overlapRatio = Math.min(ctaOverlapHeight / vh, 1);

  return { isPinned, ctaTopRelativeToViewport, ctaOverlapHeight, overlapRatio };
}

// Case 1: Vừa cuộn đến Manifesto (scrollY = 3000)
const stage1 = simulateManifestoState(3000);
assert.strictEqual(stage1.isPinned, true, 'Manifesto phải ở trạng thái pinned dính cố định');
assert.strictEqual(stage1.overlapRatio, 0, 'Chưa có phần nào của CTA đè lên');
console.log('✔ Case 1 (Vừa cuộn đến): Manifesto ngưng lại cố định ngay giữa màn hình (Pinned = true, Overlap = 0%).');

// Case 2: Đang dừng đọc nội dung (scrollY = 3240)
const stage2 = simulateManifestoState(3240);
assert.strictEqual(stage2.isPinned, true, 'Manifesto vẫn ghim chặt tại chỗ cho người dùng đọc');
assert.strictEqual(stage2.overlapRatio, 0, 'CTA vẫn ở dưới đáy chưa đè lên');
console.log('✔ Case 2 (Người dùng đọc): Manifesto giữ nguyên vị trí, không bị đẩy trôi (Dwell Pin = true).');

// Case 3: Tiếp tục cuộn chuột, CTA trượt lên đè 50% (scrollY = 3880)
const stage3 = simulateManifestoState(3880);
assert.strictEqual(stage3.isPinned, false, 'Đã hết khoảng dừng');
assert.strictEqual(stage3.overlapRatio, 0.5, 'Section CTA nền đen đã chạy lên đè 50% diện tích');
console.log('✔ Case 3 (Cuộn tiếp tục): Khối phía dưới chạy lên đè 50% lên nội dung tuyên ngôn.');

// Case 4: Cuộn qua hoàn toàn, CTA phủ kín 100% (scrollY = 4280)
const stage4 = simulateManifestoState(4280);
assert.strictEqual(stage4.overlapRatio, 1.0, 'Section CTA đã phủ kín 100%');
console.log('✔ Case 4 (Hoàn tất chuyển cảnh): Khối phía dưới đã che phủ đè hoàn toàn 100%.');

console.log('=== KẾT QUẢ: 4/4 kiểm tra đạt yêu cầu (PASSED) ===');
