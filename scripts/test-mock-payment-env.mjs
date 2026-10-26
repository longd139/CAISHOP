import assert from 'node:assert';

console.log('--- Kiểm tra cấu hình biến môi trường Mock Payment ---');

// Kiểm tra biến môi trường
const enableMock = process.env.ENABLE_MOCK_PAYMENT;
const nextPublicEnableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT;

console.log('ENABLE_MOCK_PAYMENT:', enableMock);
console.log('NEXT_PUBLIC_ENABLE_MOCK_PAYMENT:', nextPublicEnableMock);

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

runTest('ENABLE_MOCK_PAYMENT is enabled in environment', () => {
  assert.strictEqual(enableMock, 'true');
});

runTest('NEXT_PUBLIC_ENABLE_MOCK_PAYMENT is enabled in environment', () => {
  assert.strictEqual(nextPublicEnableMock, 'true');
});

console.log(`\nTổng kết: ${passedTests}/${totalTests} tests passed`);
if (passedTests !== totalTests) {
  process.exit(1);
}
