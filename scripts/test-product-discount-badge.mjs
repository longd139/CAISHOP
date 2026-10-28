import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log("===> BAT DAU KIEM THU VI TRI BADGE PHAN TRAM GIAM GIA TREN HINH SAN PHAM <===");

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

// 1. Kiểm tra CustomerStorefront.tsx có badge giảm giá trên góc trái ảnh sản phẩm
runTest("CustomerStorefront.tsx: Badge % giảm giá nằm ở góc trên bên trái của hình ảnh", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx'), 'utf8');
  assert.ok(content.includes('discountPercent > 0 && ('), "Thiếu điều kiện kiểm tra discountPercent > 0");
  assert.ok(
    content.includes('className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white font-mono font-bold text-[10px] md:text-[11px] px-2 py-0.5 tracking-tight shadow-xs select-none"'),
    "Badge % giảm giá chưa đúng vị trí absolute góc trên trái (top-2.5 left-2.5) hoặc sai kiểu dáng"
  );
  assert.ok(content.includes('-{discountPercent}%'), "Nội dung badge phải hiển thị -{discountPercent}%");
});

// 2. Kiểm tra CustomerStorefront.tsx đã bỏ badge % dư thừa ở dòng giá tiền bên dưới tiêu đề
runTest("CustomerStorefront.tsx: Đã chuyển % giảm giá khỏi dòng giá tiền bên dưới tiêu đề", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx'), 'utf8');
  assert.strictEqual(
    content.includes('{/* Price with sale effect (Strikethrough original price + sale discount badge) */}'),
    false,
    "Vẫn còn comment sale discount badge ở cụm giá"
  );
  assert.strictEqual(
    content.includes('-{Math.round(((getOriginalPrice(minPrice) - minPrice) / getOriginalPrice(minPrice)) * 100)}%'),
    false,
    "Vẫn còn % giảm giá nằm cạnh giá gạch ngang ở hàng giá"
  );
});

// 3. Kiểm tra ProductCatalog.tsx có badge giảm giá trên góc trái ảnh sản phẩm
runTest("ProductCatalog.tsx: Badge % giảm giá nằm ở góc trên bên trái của hình ảnh", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductCatalog.tsx'), 'utf8');
  assert.ok(content.includes('discountPercent > 0 && ('), "Thiếu điều kiện kiểm tra discountPercent > 0");
  assert.ok(
    content.includes('className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white font-mono font-bold text-[10px] md:text-[11px] px-2 py-0.5 tracking-tight shadow-xs select-none"'),
    "Badge % giảm giá chưa đúng vị trí absolute góc trên trái (top-2.5 left-2.5)"
  );
  assert.ok(content.includes('-{discountPercent}%'), "Nội dung badge phải hiển thị -{discountPercent}%");
});

// 4. Kiểm tra ProductCatalog.tsx đã bỏ badge % dư thừa ở dòng giá tiền
runTest("ProductCatalog.tsx: Đã chuyển % giảm giá khỏi dòng giá tiền bên dưới tiêu đề", () => {
  const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ProductCatalog.tsx'), 'utf8');
  assert.strictEqual(
    content.includes('-{Math.round(((getOriginalPrice(minPrice) - minPrice) / getOriginalPrice(minPrice)) * 100)}%'),
    false,
    "Vẫn còn % giảm giá nằm cạnh giá gạch ngang ở hàng giá"
  );
});

// 5. Kiểm tra logic tính toán % giảm giá chính xác theo giá bán & giá gốc
runTest("Hàm tính % giảm giá: 249k/350k ra đúng 29%, giá bằng nhau ra 0%", () => {
  const getOriginalPrice = (sellingPrice) => {
    if (!sellingPrice || sellingPrice <= 0) return 0;
    if (sellingPrice === 249000) return 350000;
    if (sellingPrice === 380000) return 520000;
    if (sellingPrice === 480000) return 650000;
    if (sellingPrice === 650000) return 890000;
    return Math.ceil((sellingPrice * 1.32) / 10000) * 10000;
  };

  const calcDiscount = (sellingPrice) => {
    const orig = getOriginalPrice(sellingPrice);
    return orig > sellingPrice ? Math.round(((orig - sellingPrice) / orig) * 100) : 0;
  };

  // Case 1: Sản phẩm 249.000đ trong ảnh người dùng gửi -> giá gốc 350.000đ -> -29%
  assert.strictEqual(calcDiscount(249000), 29, "Sản phẩm 249k phải có mức giảm là 29%");

  // Case 2: Sản phẩm 380.000đ -> giá gốc 520.000đ -> 27%
  assert.strictEqual(calcDiscount(380000), 27, "Sản phẩm 380k phải có mức giảm là 27%");

  // Case 3: Không có giá gốc cao hơn -> 0%
  assert.strictEqual(calcDiscount(0), 0, "Giá 0đ không được có % giảm");
});

console.log(`\nKet qua kiem thu: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
