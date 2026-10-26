import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 1. Đọc file .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const cloudName = envVars.CLOUDINARY_CLOUD_NAME;
const apiKey = envVars.CLOUDINARY_API_KEY;
const apiSecret = envVars.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Thiếu cấu hình Cloudinary trong .env.local');
  process.exit(1);
}

// 2. Đọc file ảnh từ D:\FPT\Bước chân thời trang giữa phố đêm.png
const imagePath = 'D:\\FPT\\Bước chân thời trang giữa phố đêm.png';
if (!fs.existsSync(imagePath)) {
  console.error('Không tìm thấy file ảnh:', imagePath);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(imagePath);
console.log('Đã đọc file ảnh, dung lượng:', fileBuffer.length, 'bytes');

// 3. Chuẩn bị tham số ký tên
const timestamp = Math.floor(Date.now() / 1000);
const folder = 'degent/hero';
const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

// 4. Tạo FormData và gửi request tới Cloudinary
const formData = new FormData();
formData.append('file', new Blob([fileBuffer], { type: 'image/png' }), 'buoc-chan-thoi-trang-pho-dem.png');
formData.append('api_key', apiKey);
formData.append('timestamp', timestamp.toString());
formData.append('folder', folder);
formData.append('signature', signature);

console.log('Đang tải ảnh lên Cloudinary...');
const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
  method: 'POST',
  body: formData,
});

const data = await res.json();
if (data.error) {
  console.error('Lỗi từ Cloudinary:', data.error);
  process.exit(1);
}

console.log('UPLOAD THÀNH CÔNG!');
console.log('SECURE_URL:', data.secure_url);
console.log('PUBLIC_ID:', data.public_id);
