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

console.log('--- KIỂM TRA QUY TRÌNH CỌC COD & TIẾN TRÌNH BÀN GIAO CHO SHIPPER ---');

// 1. Kiểm tra UserProfileModal.tsx
const userProfilePath = path.resolve('src/components/UserProfileModal.tsx');
const userProfileContent = fs.readFileSync(userProfilePath, 'utf8');

assert(
  !userProfileContent.includes('Đang chờ bàn giao với ĐVVC'),
  'UserProfileModal.tsx không còn chứa cụm từ "Đang chờ bàn giao với ĐVVC"'
);

assert(
  userProfileContent.includes('Đang chờ bàn giao cho shipper'),
  'UserProfileModal.tsx hiển thị trạng thái "Đang chờ bàn giao cho shipper"'
);

// 2. Kiểm tra src/app/checkout/page.tsx
const checkoutPath = path.resolve('src/app/checkout/page.tsx');
const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');

assert(
  checkoutContent.includes('codDepositPercent, setCodDepositPercent'),
  'Checkout page có state quản lý tỷ lệ cọc codDepositPercent'
);

assert(
  checkoutContent.includes('Cọc 50%') && checkoutContent.includes('Cọc 100%'),
  'Checkout page có nút lựa chọn bắt buộc Cọc 50% hoặc Cọc 100%'
);

assert(
  checkoutContent.includes('CỌC COD:'),
  'Checkout page lưu tag metadata cọc COD vào shipping_address của đơn hàng'
);

assert(
  checkoutContent.includes('Bàn giao cho shipper'),
  'Checkout page stepper và trạng thái hiển thị "Bàn giao cho shipper"'
);

assert(
  !checkoutContent.includes('chờ bàn giao với ĐVVC'),
  'Checkout page không còn chứa cụm từ "chờ bàn giao với ĐVVC"'
);

assert(
  checkoutContent.includes('{!isOrderExpired && isPaid && ('),
  'Nút xác nhận nhận hàng chỉ hiển thị khi isPaid (sau khi khách đã thanh toán cọc/chuyển khoản)'
);

assert(
  checkoutContent.includes('Tiền cọc đã thanh toán'),
  'Hóa đơn thành công hiển thị rõ ràng số tiền cọc đã thanh toán'
);

assert(
  checkoutContent.includes('Số tiền cần thanh toán cho Shipper khi nhận:'),
  'Hóa đơn thành công hiển thị số tiền còn lại shipper sẽ thu'
);

console.log('--------------------------------------------------------------------');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} passed, ${failCount} failed.`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
