import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== BẮT ĐẦU KIỂM TRA ẢNH NỀN HERO CLOUDINARY ===');

const expectedCloudinaryUrl = 'https://res.cloudinary.com/tkfku9hx/image/upload/v1793010652/degent/hero/wciimhf9kopgdhvpmjtv.png';

// 1. Kiểm tra không đưa file ảnh cục bộ vào thư mục src/
function findImagesInDir(dir) {
  let images = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      images = images.concat(findImagesInDir(fullPath));
    } else if (/\.(png|jpg|jpeg|webp|gif)$/i.test(entry.name)) {
      images.push(fullPath);
    }
  }
  return images;
}

const imagesInSrc = findImagesInDir(path.resolve(process.cwd(), 'src'));
assert.strictEqual(imagesInSrc.length, 0, `Phát hiện ảnh nằm trong thư mục src/: ${imagesInSrc.join(', ')}`);
console.log('✔ Không có bất kỳ file ảnh nhị phân nào bị đưa vào thư mục src/ (đúng yêu cầu).');

// 2. Kiểm tra URL Cloudinary mới trong defaultSiteContent.ts
const defaultContentPath = path.resolve(process.cwd(), 'src/lib/defaultSiteContent.ts');
const defaultContent = fs.readFileSync(defaultContentPath, 'utf-8');
assert.ok(defaultContent.includes(expectedCloudinaryUrl), 'defaultSiteContent.ts chưa chứa URL Cloudinary mới');
console.log('✔ defaultSiteContent.ts: hero_image_url đã được cập nhật URL Cloudinary mới.');

// 3. Kiểm tra URL Cloudinary mới trong CustomerStorefront.tsx
const storefrontPath = path.resolve(process.cwd(), 'src/components/CustomerStorefront.tsx');
const storefrontContent = fs.readFileSync(storefrontPath, 'utf-8');
assert.ok(storefrontContent.includes(expectedCloudinaryUrl), 'CustomerStorefront.tsx chưa chứa URL Cloudinary mới');
console.log('✔ CustomerStorefront.tsx: Hero Background Image đã được cập nhật URL Cloudinary mới.');

// 4. Kiểm tra URL Cloudinary mới trong ExecutiveDashboard.tsx
const dashboardPath = path.resolve(process.cwd(), 'src/components/ExecutiveDashboard.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
assert.ok(dashboardContent.includes(expectedCloudinaryUrl), 'ExecutiveDashboard.tsx chưa chứa URL Cloudinary mới');
console.log('✔ ExecutiveDashboard.tsx: Presets và preview đã cập nhật URL Cloudinary mới.');

// 5. Kiểm tra kết nối tải ảnh thực tế từ Cloudinary CDN
console.log('Đang kiểm tra kết nối CDN Cloudinary...');
const res = await fetch(expectedCloudinaryUrl, { method: 'HEAD' });
assert.strictEqual(res.status, 200, `Cloudinary trả về mã trạng thái ${res.status} thay vì 200`);
const contentType = res.headers.get('content-type');
assert.ok(contentType && contentType.includes('image'), `Content-Type không phải là ảnh: ${contentType}`);
console.log(`✔ Cloudinary CDN phản hồi HTTP 200 OK, Content-Type: ${contentType}.`);

console.log('=== KẾT QUẢ: 5/5 kiểm tra đạt yêu cầu (PASSED) ===');
