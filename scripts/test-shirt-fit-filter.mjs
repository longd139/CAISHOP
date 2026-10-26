import assert from 'node:assert';

// Mô phỏng logic matchesShirtFit từ ProductCatalog.tsx
function matchesShirtFit(product, fit) {
  if (fit === 'ALL') return true;

  if (product.size_specs) {
    try {
      const specs = typeof product.size_specs === 'string' ? JSON.parse(product.size_specs) : product.size_specs;
      const fitType = (specs.fitType || specs.fitName || '').toUpperCase();
      if (fit === 'SLIM FIT' && fitType.includes('SLIM')) return true;
      if (fit === 'CLASSIC FIT' && (fitType.includes('CLASSIC') || fitType.includes('REGULAR'))) return true;
      if (fit === 'REGULAR FIT' && (fitType.includes('REGULAR') || fitType.includes('CLASSIC'))) return true;
      if (fit === 'OVERSIZED' && (fitType.includes('OVERSIZE') || fitType.includes('BOXY') || fitType.includes('LOOSE'))) return true;
    } catch {
      // ignore json parse error
    }
  }

  const text = `${product.name} ${product.description || ''} ${product.slug || ''} ${product.category || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (fit) {
    case 'SLIM FIT':
      return text.includes('slim') || text.includes('om sat') || text.includes('om dang') || text.includes('bo sat');
    case 'CLASSIC FIT':
      return (
        text.includes('classic') ||
        text.includes('co dien') ||
        text.includes('suong') ||
        text.includes('polo') ||
        text.includes('oxford') ||
        text.includes('regular')
      );
    case 'REGULAR FIT':
      return (
        text.includes('regular') ||
        text.includes('tieu chuan') ||
        text.includes('suong') ||
        text.includes('bomber') ||
        text.includes('polo')
      );
    case 'OVERSIZED':
      return (
        text.includes('oversize') ||
        text.includes('oversized') ||
        text.includes('form rong') ||
        text.includes('phom rong') ||
        text.includes('boxy') ||
        text.includes('loose') ||
        text.includes('thung')
      );
    default:
      return true;
  }
}

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Áo Thun Oversize Heavy Cotton 250gsm',
    category: 'T-Shirt',
    description: 'Chất liệu 100% Cotton định lượng 250gsm dày dặn, đứng form.'
  },
  {
    id: 'prod-2',
    name: 'Áo Sơ Mi Oxford Regular Fit',
    category: 'Shirt',
    description: 'Chất vải Oxford dệt thoi cao cấp, thiết kế cổ bẻ thanh lịch.'
  },
  {
    id: 'prod-3',
    name: 'Quần Jean Slim-fit Co Giãn Cao Cấp',
    category: 'Pants',
    description: 'Denim 12oz pha 2% Spandex co giãn thoải mái.'
  },
  {
    id: 'prod-4',
    name: 'Áo Khoác Bomber Minimalist Windbreaker',
    category: 'Jacket',
    description: 'Áo khoác gió 2 lớp chống nước nhẹ, bo chun dệt kim.'
  },
  {
    id: 'prod-5',
    name: 'Áo Polo Cotton Pique Phối Cổ',
    category: 'Polo',
    description: 'Vải cá sấu mềm mịn, thấm hút mồ hôi tối đa, form suông tôn dáng.'
  }
];

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

// Test 1: Bộ lọc 'ALL' phải trả về toàn bộ 5 sản phẩm
runTest('ALL returns all products', () => {
  const result = mockProducts.filter((p) => matchesShirtFit(p, 'ALL'));
  assert.strictEqual(result.length, 5);
});

// Test 2: 'SLIM FIT' lọc đúng sản phẩm slim
runTest('SLIM FIT filters slim products correctly', () => {
  const result = mockProducts.filter((p) => matchesShirtFit(p, 'SLIM FIT'));
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'prod-3');
});

// Test 3: 'CLASSIC FIT' lọc đúng các sản phẩm form classic / regular / oxford / polo
runTest('CLASSIC FIT filters classic products correctly', () => {
  const result = mockProducts.filter((p) => matchesShirtFit(p, 'CLASSIC FIT'));
  assert.strictEqual(result.length, 2);
  const ids = result.map((p) => p.id);
  assert.ok(ids.includes('prod-2'));
  assert.ok(ids.includes('prod-5'));
});

// Test 4: 'REGULAR FIT' lọc đúng sản phẩm regular / bomber / polo
runTest('REGULAR FIT filters regular products correctly', () => {
  const result = mockProducts.filter((p) => matchesShirtFit(p, 'REGULAR FIT'));
  assert.strictEqual(result.length, 3);
  const ids = result.map((p) => p.id);
  assert.ok(ids.includes('prod-2'));
  assert.ok(ids.includes('prod-4'));
  assert.ok(ids.includes('prod-5'));
});

// Test 5: 'OVERSIZED' lọc đúng áo thun oversize
runTest('OVERSIZED filters oversize products correctly', () => {
  const result = mockProducts.filter((p) => matchesShirtFit(p, 'OVERSIZED'));
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'prod-1');
});

// Test 6: Kiểm tra lọc khi có size_specs với fitType tường minh
runTest('Explicit size_specs takes precedence', () => {
  const customProd = {
    id: 'prod-custom',
    name: 'Áo Sơ Mi Nam Công Sở',
    description: 'Chất liệu lụa satin cao cấp',
    size_specs: JSON.stringify({ fitType: 'SLIM' })
  };
  assert.strictEqual(matchesShirtFit(customProd, 'SLIM FIT'), true);
  assert.strictEqual(matchesShirtFit(customProd, 'OVERSIZED'), false);
});

console.log(`\nTổng kết: ${passedTests}/${totalTests} tests passed`);
if (passedTests !== totalTests) {
  process.exit(1);
}
