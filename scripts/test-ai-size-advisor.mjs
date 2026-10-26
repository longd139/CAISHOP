import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_DEGENT_SIZE_SPECS,
  analyzeBodySpecsHeuristically
} from '../src/lib/aiSizeAdvisor.ts';

console.log('=== KIỂM THỬ: HỆ THỐNG THÔNG SỐ XƯỞNG MAY & TRỢ LÝ AI TƯ VẤN SIZE (AI READY) ===\n');

// 1. Kiểm tra bộ thông số xưởng may chuẩn (Product Specs)
assert.ok(DEFAULT_DEGENT_SIZE_SPECS.sizes.S, 'Phải có thông số Size S');
assert.ok(DEFAULT_DEGENT_SIZE_SPECS.sizes.M, 'Phải có thông số Size M');
assert.ok(DEFAULT_DEGENT_SIZE_SPECS.sizes.L, 'Phải có thông số Size L');
assert.ok(DEFAULT_DEGENT_SIZE_SPECS.sizes.XL, 'Phải có thông số Size XL');
assert.ok(DEFAULT_DEGENT_SIZE_SPECS.sizes.XXL, 'Phải có thông số Size XXL');

// Kiểm tra 4 thông số may đo thiết yếu: Dài áo, Rộng ngực, Vai, Tay
for (const [sizeName, spec] of Object.entries(DEFAULT_DEGENT_SIZE_SPECS.sizes)) {
  assert.ok(spec.length > 50, `Size ${sizeName} phải có dài áo > 50cm`);
  assert.ok(spec.chest > 80, `Size ${sizeName} phải có rộng ngực > 80cm`);
  assert.ok(spec.shoulder > 40, `Size ${sizeName} phải có rộng vai > 40cm`);
  assert.ok(spec.sleeve > 15, `Size ${sizeName} phải có dài tay > 15cm`);
}
console.log('✓ PASS [1/5]: Bộ thông số đo thành phẩm từ xưởng may chuẩn xác và đầy đủ các chỉ số');

// 2. Kiểm tra thuật toán phân tích số đo 3 vòng & tỷ lệ cơ thể
// Ca 1: Khách hàng dáng chuẩn 1m70, 62kg, ngực 88cm -> Nên là Size M
const res1 = analyzeBodySpecsHeuristically(DEFAULT_DEGENT_SIZE_SPECS, {
  height: 170,
  weight: 62,
  bust: 88,
  waist: 76,
  fitPreference: 'comfort'
});
assert.strictEqual(res1.recommendedSize, 'M', '1m70 62kg ngực 88cm nên được gợi ý Size M');
assert.ok(res1.confidenceScore >= 85, 'Độ tin cậy phải >= 85%');
assert.ok(res1.analysisText.includes('Size M'), 'Đoạn phân tích phải nhắc tới Size M');
console.log('✓ PASS [2/5]: Phân tích thể hình chuẩn xác cho khách hàng thể trạng trung bình (1m70, 62kg)');

// Ca 2: Khách hàng cao to 1m80, 80kg, ngực 100cm -> Nên là Size XL
const res2 = analyzeBodySpecsHeuristically(DEFAULT_DEGENT_SIZE_SPECS, {
  height: 180,
  weight: 80,
  bust: 100,
  waist: 86,
  fitPreference: 'oversize'
});
assert.strictEqual(res2.recommendedSize, 'XL', '1m80 80kg ngực 100cm gu oversize nên là Size XL');
console.log('✓ PASS [3/5]: Phân tích chuẩn xác cho khách hàng cao to thích mặc phong cách Oversize');

// 3. Kiểm tra API Route /api/ai/size-advisor
const apiPath = path.resolve('src/app/api/ai/size-advisor/route.ts');
assert.ok(fs.existsSync(apiPath), 'File API route /api/ai/size-advisor/route.ts phải tồn tại');
const apiCode = fs.readFileSync(apiPath, 'utf-8');
assert.ok(apiCode.includes('consultSizeWithAi'), 'API phải gọi hàm consultSizeWithAi');
assert.ok(apiCode.includes('fitPreference'), 'API hỗ trợ tham số gu mặc fitPreference');
console.log('✓ PASS [4/5]: API Route /api/ai/size-advisor sẵn sàng tiếp nhận yêu cầu tư vấn');

// 4. Kiểm tra giao diện ProductDetail.tsx tích hợp tab Trợ lý AI và 3 vòng
const productDetailPath = path.resolve('src/components/ProductDetail.tsx');
const detailCode = fs.readFileSync(productDetailPath, 'utf-8');
assert.ok(detailCode.includes('Trợ lý AI phân tích số đo 3 vòng'), 'ProductDetail phải có tab Trợ lý AI');
assert.ok(detailCode.includes('Vòng 1 - Ngực'), 'Phải có ô nhập Vòng 1');
assert.ok(detailCode.includes('Vòng 2 - Bụng/Eo'), 'Phải có ô nhập Vòng 2');
assert.ok(detailCode.includes('Vòng 3 - Mông'), 'Phải có ô nhập Vòng 3');
assert.ok(detailCode.includes('Gu mặc mong muốn'), 'Phải có lựa chọn Gu mặc mong muốn');
assert.ok(detailCode.includes('/api/ai/size-advisor'), 'Phải gọi API /api/ai/size-advisor');
console.log('✓ PASS [5/5]: Trang chi tiết sản phẩm đã tích hợp đầy đủ giao diện nhập số đo 3 vòng & tab Trợ lý AI');

console.log('\n=== TẤT CẢ 5/5 KIỂM THỬ ĐÃ PASS THÀNH CÔNG ===');
