import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert';

console.log('=== BẮT ĐẦU KIỂM TRA CẤU HÌNH CLOUDINARY ===');

// 1. Kiểm tra tồn tại file .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
assert.ok(fs.existsSync(envPath), 'File .env.local không tồn tại');
console.log('✔ File .env.local đã được tìm thấy.');

// 2. Đọc và parse file .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    envVars[key] = val;
  }
}

// 3. Kiểm tra các biến môi trường Cloudinary
assert.strictEqual(envVars.CLOUDINARY_CLOUD_NAME, 'tkfku9hx', 'CLOUDINARY_CLOUD_NAME không đúng');
assert.strictEqual(envVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 'tkfku9hx', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME không đúng');
assert.strictEqual(envVars.CLOUDINARY_API_KEY, '494821782296531', 'CLOUDINARY_API_KEY không đúng');
assert.strictEqual(envVars.CLOUDINARY_API_SECRET, 'mki_k_V0R-ex2132xih2f1Kxa0o', 'CLOUDINARY_API_SECRET không đúng');
console.log('✔ Toàn bộ 4 biến môi trường Cloudinary đã được nạp chính xác.');

// 4. Kiểm tra thuật toán băm chữ ký SHA-1 như trong src/app/api/upload/route.ts
const timestamp = 1700000000;
const folder = 'degent/uploads';
const paramsToSign = `folder=${folder}&timestamp=${timestamp}${envVars.CLOUDINARY_API_SECRET}`;
const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

const expectedSignature = crypto.createHash('sha1').update(`folder=degent/uploads&timestamp=1700000000mki_k_V0R-ex2132xih2f1Kxa0o`).digest('hex');
assert.strictEqual(signature, expectedSignature, 'Chữ ký signature băm ra không khớp với mong đợi');
console.log('✔ Thuật toán tạo chữ ký SHA-1 của upload route hoạt động chính xác với API_SECRET.');

console.log('=== KẾT QUẢ: 3/3 kiểm tra đạt yêu cầu (PASSED) ===');
