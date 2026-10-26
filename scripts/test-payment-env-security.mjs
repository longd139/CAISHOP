import assert from 'node:assert';
import { getResolvedPaymentSettings, defaultPaymentSettings } from '../src/lib/paymentSettings.ts';

console.log('--- Kiểm thử Bảo mật: Cấu hình Thanh toán qua Biến môi trường (.env) ---');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`, err);
  }
}

// Giả lập hacker cố tình inject số tài khoản ngân hàng của hacker vào DB
const hackedDbSettings = {
  account_number: '999988887777', // STK của hacker trong DB
  account_holder: 'HACKER_ATTACK',
  bank_id: 'VCB',
  payos_client_id: 'fake-hacker-client-id',
  payos_api_key: 'fake-hacker-api-key',
  payos_checksum_key: 'fake-hacker-checksum-key'
};

// Test 1: Khóa STK bằng ENV phải chặn hoàn toàn STK giả mạo từ DB
runTest('VIETQR ENV override blocks hacked database account number', () => {
  process.env.VIETQR_ACCOUNT_NUMBER = '0903112233';
  process.env.VIETQR_ACCOUNT_HOLDER = 'DEGENT ATELIER';
  process.env.VIETQR_BANK_ID = 'MB';

  const resolved = getResolvedPaymentSettings(hackedDbSettings);

  assert.strictEqual(resolved.account_number, '0903112233', 'STK phải giữ nguyên từ ENV');
  assert.strictEqual(resolved.account_holder, 'DEGENT ATELIER', 'Tên chủ TK phải giữ từ ENV');
  assert.strictEqual(resolved.bank_id, 'MB', 'Mã ngân hàng phải giữ từ ENV');
  assert.strictEqual(resolved.env_locked.account_number, true, 'account_number phải được gắn cờ env_locked');
  assert.strictEqual(resolved.env_locked.account_holder, true, 'account_holder phải được gắn cờ env_locked');
});

// Test 2: Khóa PayOS Keys bằng ENV phải chặn các key giả mạo
runTest('PayOS ENV override blocks hacked database PayOS keys', () => {
  process.env.PAYOS_CLIENT_ID = 'legit-payos-client-id';
  process.env.PAYOS_API_KEY = 'legit-payos-api-key';
  process.env.PAYOS_CHECKSUM_KEY = 'legit-payos-checksum-key';

  const resolved = getResolvedPaymentSettings(hackedDbSettings);

  assert.strictEqual(resolved.payos_client_id, 'legit-payos-client-id');
  assert.strictEqual(resolved.payos_api_key, 'legit-payos-api-key');
  assert.strictEqual(resolved.payos_checksum_key, 'legit-payos-checksum-key');
  assert.strictEqual(resolved.env_locked.payos_client_id, true);
  assert.strictEqual(resolved.env_locked.payos_api_key, true);
  assert.strictEqual(resolved.env_locked.payos_checksum_key, true);
});

// Test 3: Khi không có biến ENV cho trường nào, trường đó được dùng giá trị hợp lệ bình thường
runTest('Fields without ENV fallback to DB or default correctly', () => {
  delete process.env.PAYOS_CLIENT_ID;
  delete process.env.PAYOS_API_KEY;
  delete process.env.PAYOS_CHECKSUM_KEY;

  const normalDbSettings = {
    cod_note: 'Giao hàng tiêu chuẩn',
    cod_max_amount: 3000000
  };

  const resolved = getResolvedPaymentSettings(normalDbSettings);
  assert.strictEqual(resolved.cod_note, 'Giao hàng tiêu chuẩn');
  assert.strictEqual(resolved.cod_max_amount, 3000000);
});

console.log(`\nTổng kết: ${passedTests}/${totalTests} tests passed`);
if (passedTests !== totalTests) {
  process.exit(1);
}
