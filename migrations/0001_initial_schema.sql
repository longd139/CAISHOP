-- CAISHOP Database Schema for Cloudflare D1 (SQLite)

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Product Variants (Color, Size, SKU, Pricing)
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    cost_price REAL NOT NULL,      -- Giá vốn COGS
    selling_price REAL NOT NULL,   -- Giá niêm yết bán
    floor_price REAL NOT NULL,     -- Giá sàn tối thiểu an toàn
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Inventory Levels (Physical, Reserved, Safety Threshold)
CREATE TABLE IF NOT EXISTS inventory_levels (
    id TEXT PRIMARY KEY,
    variant_id TEXT UNIQUE NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    physical_qty INTEGER NOT NULL DEFAULT 0,
    reserved_qty INTEGER NOT NULL DEFAULT 0,
    safety_threshold INTEGER NOT NULL DEFAULT 5,
    location_code TEXT NOT NULL DEFAULT 'MAIN_WH',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_fee REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',        -- PENDING, PAID, REFUNDED, FAILED
    fulfillment_status TEXT NOT NULL DEFAULT 'UNFULFILLED', -- UNFULFILLED, PACKING, DISPATCHED, DELIVERED, RETURNED, CANCELLED
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total_price REAL NOT NULL
);

-- 6. Financial Transactions (Ledger: Revenue, COGS, Shipping, Fees)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL, -- REVENUE, COGS, SHIPPING_FEE, GATEWAY_FEE, REFUND
    amount REAL NOT NULL,
    direction TEXT NOT NULL,        -- INFLOW, OUTFLOW
    payment_gateway TEXT,           -- VIETQR, PAYOS, CASSO, COD, MANUAL
    bank_ref_code TEXT,
    notes TEXT,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Shipments (Tracking with 3PL / Carriers)
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier TEXT NOT NULL,          -- GHN, GHTK, VIETTEL_POST
    tracking_code TEXT UNIQUE,
    shipping_fee REAL NOT NULL DEFAULT 0,
    cod_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'READY_TO_PICK', -- READY_TO_PICK, IN_TRANSIT, DELIVERED, RETURNED
    dispatched_at TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Purchase Orders (Auto replenishment drafts & approvals)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    po_code TEXT UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    total_cost REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, ORDERED, RECEIVED, CANCELLED
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT
);

-- 9. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_cost REAL NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_fin_order ON financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_fin_type ON financial_transactions(transaction_type, direction);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
