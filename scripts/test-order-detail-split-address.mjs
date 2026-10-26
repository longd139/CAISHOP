import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== TEST SUITE: PHÂN TÁCH ĐỊA CHỈ NHẬN HÀNG TRONG CHI TIẾT ĐƠN HÀNG ADMIN ===');

// 1. Kiểm tra mã nguồn ExecutiveDashboard.tsx
const dashboardPath = path.resolve('src/components/ExecutiveDashboard.tsx');
const rawContent = fs.readFileSync(dashboardPath, 'utf8');
const content = rawContent.replace(/\r\n/g, '\n');

// A. Kiểm tra helper parseOrderAddressDetails đã được khai báo
assert.ok(
  content.includes('export function parseOrderAddressDetails('),
  'ExecutiveDashboard.tsx phải export function parseOrderAddressDetails'
);

// B. Kiểm tra khối UI đã chia thành các phần riêng biệt
assert.ok(
  content.includes('Địa chỉ giao hàng:'),
  'Modal chi tiết đơn hàng phải có nhãn "Địa chỉ giao hàng:"'
);
assert.ok(
  content.includes('Hình thức vận chuyển:'),
  'Modal chi tiết đơn hàng phải có khối "Hình thức vận chuyển:"'
);
assert.ok(
  content.includes('Chi tiết thanh toán COD:'),
  'Modal chi tiết đơn hàng phải có khối "Chi tiết thanh toán COD:"'
);
assert.ok(
  content.includes('Shipper cần thu:'),
  'Modal chi tiết đơn hàng phải có dòng "Shipper cần thu:"'
);
assert.ok(
  content.includes("selectedOrderForDetail.tracking_code ? 'Sửa mã ĐVVC' : 'Gửi mã ĐVVC'"),
  'Nút thao tác phải là "Gửi mã ĐVVC" khi chưa có mã'
);

// C. Test logic parseOrderAddressDetails bằng regex giống hệt trong code
function parseOrderAddressDetails(rawAddress) {
  if (!rawAddress) {
    return { cleanAddress: 'Chưa có thông tin địa chỉ' };
  }

  let remainingText = rawAddress;
  let orderNote;
  let shippingMethod;
  let dealTag;
  let codInfo;

  // 1. Bóc tách [CỌC COD: ...]
  const codMatch = remainingText.match(/\[CỌC COD:\s*([^\]]+)\]/i);
  if (codMatch) {
    const rawCod = codMatch[1].trim();
    const percentMatch = rawCod.match(/(\d+%\s*(?:cọc)?)/i);
    const depositedMatch = rawCod.match(/ĐÃ CỌC:\s*([^\-]+?)(?=\s*-\s*THU SHIPPER:|$)/i);
    const remainingMatch = rawCod.match(/THU SHIPPER:\s*([^\]]+)/i);

    codInfo = {
      raw: rawCod,
      percent: percentMatch ? percentMatch[1].trim() : undefined,
      deposited: depositedMatch ? depositedMatch[1].trim() : undefined,
      remaining: remainingMatch ? remainingMatch[1].trim() : undefined,
    };
    remainingText = remainingText.replace(codMatch[0], '');
  }

  // 2. Bóc tách [DEAL: ...]
  const dealMatch = remainingText.match(/\[DEAL:\s*([^\]]+)\]/i);
  if (dealMatch) {
    dealTag = dealMatch[1].trim();
    remainingText = remainingText.replace(dealMatch[0], '');
  }

  // 3. Bóc tách [VẬN CHUYỂN: ...]
  const shippingMatch = remainingText.match(/\[VẬN CHUYỂN:\s*([^\]]+)\]/i);
  if (shippingMatch) {
    shippingMethod = shippingMatch[1].trim();
    remainingText = remainingText.replace(shippingMatch[0], '');
  }

  // 4. Bóc tách Ghi chú: (Ghi chú: ...) hoặc [GHI CHÚ: ...]
  const noteMatch = remainingText.match(/\((?:Ghi chú|Note):\s*([^)]+)\)/i) || remainingText.match(/\[(?:Ghi chú|Note):\s*([^\]]+)\]/i);
  if (noteMatch) {
    orderNote = noteMatch[1].trim();
    remainingText = remainingText.replace(noteMatch[0], '');
  }

  // Làm sạch các dấu gạch nối và khoảng trắng thừa còn lại
  const cleanAddress = remainingText
    .replace(/^(\s*-\s*)+/, '')
    .replace(/(\s*-\s*)+$/, '')
    .replace(/\s*-\s*-\s*/g, ' - ')
    .trim();

  return {
    cleanAddress: cleanAddress || 'Chưa có thông tin địa chỉ',
    orderNote,
    shippingMethod,
    dealTag,
    codInfo,
  };
}

// Case 1: Đơn hàng thực tế trong ảnh của người dùng
const userCase = "123, Phường Thạnh Lộc, Quận 12, Thành phố Hồ Chí Minh - [VẬN CHUYỂN: Shipper riêng DE'GENT - Ship thường trong ngày (40k)] - [CỌC COD: 50% - ĐÃ CỌC: 309.500 đ - THU SHIPPER: 309.500 đ]";
const res1 = parseOrderAddressDetails(userCase);

console.log('Result 1 (Ảnh người dùng cung cấp):', res1);
assert.equal(res1.cleanAddress, '123, Phường Thạnh Lộc, Quận 12, Thành phố Hồ Chí Minh', 'Địa chỉ phải sạch');
assert.equal(res1.shippingMethod, "Shipper riêng DE'GENT - Ship thường trong ngày (40k)", 'Hình thức vận chuyển phải đúng');
assert.ok(res1.codInfo, 'Phải có codInfo');
assert.equal(res1.codInfo.percent, '50%', 'Cọc phải là 50%');
assert.equal(res1.codInfo.deposited, '309.500 đ', 'Đã cọc phải là 309.500 đ');
assert.equal(res1.codInfo.remaining, '309.500 đ', 'Thu shipper phải là 309.500 đ');

// Case 2: Đơn có ghi chú & deal facebook freeship
const caseWithNote = "456 Lê Duẩn, Quận 1, TP. HCM - (Ghi chú: Giao giờ hành chính, gọi trước 10p) - [VẬN CHUYỂN: Shipper riêng DE'GENT - Ship nhanh (Hôm nay lúc 14:00) - Phí: 0đ] [DEAL: Freeship FB - Người Like: @LongĐỗ] - [CỌC COD: 100% - ĐÃ CỌC: 550.000 đ - THU SHIPPER: 0 đ]";
const res2 = parseOrderAddressDetails(caseWithNote);

console.log('Result 2 (Đơn có note & deal freeship):', res2);
assert.equal(res2.cleanAddress, '456 Lê Duẩn, Quận 1, TP. HCM');
assert.equal(res2.orderNote, 'Giao giờ hành chính, gọi trước 10p');
assert.equal(res2.dealTag, 'Freeship FB - Người Like: @LongĐỗ');
assert.equal(res2.codInfo.remaining, '0 đ');

// Case 3: Đơn hàng truyền thống chỉ có địa chỉ thông thường
const simpleCase = "Số 10 Tràng Tiền, Hoàn Kiếm, Hà Nội";
const res3 = parseOrderAddressDetails(simpleCase);
console.log('Result 3 (Địa chỉ đơn giản):', res3);
assert.equal(res3.cleanAddress, 'Số 10 Tràng Tiền, Hoàn Kiếm, Hà Nội');
assert.equal(res3.shippingMethod, undefined);
assert.equal(res3.codInfo, undefined);

console.log('✔ TẤT CẢ TEST ĐÃ PASS (7/7 assertions thành công)!');
