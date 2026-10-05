import { getCloudflareContext } from '@opennextjs/cloudflare';
import { calculateTier } from './membership';

export interface UniversalDb {
  queryAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ success: boolean; changes?: number }>;
  exec(sql: string): Promise<void>;
}

let localNodeDbInstance: any = null;

async function getLocalNodeDb() {
  if (!localNodeDbInstance) {
    try {
      const { DatabaseSync } = await import('node:sqlite');
      const path = await import('node:path');
      const fs = await import('node:fs');

      const baseDir = path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
      let dbPath = path.join(process.cwd(), 'dev.sqlite');
      if (fs.existsSync(baseDir)) {
        const files = fs.readdirSync(baseDir);
        const dbFile = files.find((f: string) => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
        if (dbFile) {
          dbPath = path.join(baseDir, dbFile);
        }
      }

      localNodeDbInstance = new DatabaseSync(dbPath);
      // Ensure site_content table exists
      try {
        localNodeDbInstance.exec(`
          CREATE TABLE IF NOT EXISTS site_content (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch {}
    } catch (e) {
      console.error('Failed to initialize local node:sqlite database:', e);
      throw e;
    }
  }
  return localNodeDbInstance;
}

export async function getDb(): Promise<UniversalDb> {
  // Check if running inside Cloudflare Worker runtime
  try {
    let ctx: any = null;
    try {
      ctx = getCloudflareContext();
    } catch {
      ctx = await getCloudflareContext({ async: true });
    }

    const env = ctx?.env as any;
    if (env && env.DB) {
      const d1 = env.DB;
      return {
        async queryAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
          const safeParams = (params || []).map(p => (p === undefined ? null : p));
          const stmt = d1.prepare(sql);
          const res = safeParams.length ? await stmt.bind(...safeParams).all() : await stmt.all();
          return (res.results || []) as T[];
        },
        async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
          const safeParams = (params || []).map(p => (p === undefined ? null : p));
          const stmt = d1.prepare(sql);
          const res = safeParams.length ? await stmt.bind(...safeParams).first() : await stmt.first();
          return (res as T) ?? null;
        },
        async execute(sql: string, params?: any[]): Promise<{ success: boolean; changes?: number }> {
          const safeParams = (params || []).map(p => (p === undefined ? null : p));
          const stmt = d1.prepare(sql);
          const res = safeParams.length ? await stmt.bind(...safeParams).run() : await stmt.run();
          return { success: res.success, changes: res.meta?.changes };
        },
        async exec(sql: string): Promise<void> {
          await d1.exec(sql);
        }
      };
    }
  } catch {
    // Fallback to local Node.js environment
  }

  const localDb = await getLocalNodeDb();
  return {
    async queryAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
      const safeParams = (params || []).map(p => (p === undefined ? null : p));
      const stmt = localDb.prepare(sql);
      return (safeParams.length ? stmt.all(...safeParams) : stmt.all()) as T[];
    },
    async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
      const safeParams = (params || []).map(p => (p === undefined ? null : p));
      const stmt = localDb.prepare(sql);
      return ((safeParams.length ? stmt.get(...safeParams) : stmt.get()) as T) ?? null;
    },
    async execute(sql: string, params?: any[]): Promise<{ success: boolean; changes?: number }> {
      const safeParams = (params || []).map(p => (p === undefined ? null : p));
      const stmt = localDb.prepare(sql);
      const res = safeParams.length ? stmt.run(...safeParams) : stmt.run();
      return { success: true, changes: res.changes };
    },
    async exec(sql: string): Promise<void> {
      localDb.exec(sql);
    }
  };
}

export async function getSiteContent<T = any>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const row = await db.queryFirst<{ value: string }>('SELECT value FROM site_content WHERE key = ?', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export async function setSiteContent(key: string, value: any) {
  const db = await getDb();
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value ?? {});
  const now = new Date().toISOString();
  await db.execute(`
    INSERT OR REPLACE INTO site_content (key, value, updated_at)
    VALUES (?, ?, ?)
  `, [key, jsonStr, now]);
  return { success: true, key, updated_at: now };
}

// ----------------- TYPE DEFINITIONS -----------------

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  cost_price: number;
  selling_price: number;
  floor_price: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  variant_id: string;
  product_name: string;
  sku: string;
  color: string;
  size: string;
  cost_price: number;
  selling_price: number;
  floor_price: number;
  physical_qty: number;
  reserved_qty: number;
  available_qty: number;
  safety_threshold: number;
  location_code: string;
  is_low_stock: boolean;
  is_critical: boolean;
}

export interface CashFlowSummary {
  total_revenue: number;
  total_cogs: number;
  total_shipping_fee: number;
  total_gateway_fee: number;
  net_profit: number;
  gross_margin_percentage: number;
  paid_orders_count: number;
  pending_orders_count: number;
}

export interface FinancialTransaction {
  id: string;
  order_id: string | null;
  transaction_type: 'REVENUE' | 'COGS' | 'SHIPPING_FEE' | 'GATEWAY_FEE' | 'REFUND';
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW';
  payment_gateway: string | null;
  bank_ref_code: string | null;
  notes: string | null;
  recorded_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  fulfillment_status: 'UNFULFILLED' | 'PACKING' | 'DISPATCHED' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
  created_at: string;
  items_count?: number;
}

export interface CreateOrderItemInput {
  variant_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  payment_method?: 'vietqr' | 'cod';
  items: CreateOrderItemInput[];
}

// ----------------- QUERY SERVICES -----------------

/**
 * Lấy toàn bộ danh sách sản phẩm kèm các biến thể (Màu, Size, Giá, Tồn)
 */
export async function getAllProductsWithVariants(includeInactive: boolean = false) {
  const db = await getDb();
  const query = includeInactive
    ? 'SELECT * FROM products ORDER BY created_at DESC'
    : 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC';
  const products = await db.queryAll<Product>(query);
  
  const variants = await db.queryAll<ProductVariant & { physical_qty: number; reserved_qty: number; available_qty: number; safety_threshold: number; location_code: string }>(`
    SELECT v.*, i.physical_qty, i.reserved_qty, (i.physical_qty - i.reserved_qty) as available_qty, i.safety_threshold, i.location_code
    FROM product_variants v
    LEFT JOIN inventory_levels i ON v.id = i.variant_id
  `);

  const result = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.product_id === p.id)
  }));

  return JSON.parse(JSON.stringify(result));
}

/**
 * Lấy chi tiết một sản phẩm theo slug hoặc id
 */
export async function getProductByIdOrSlug(idOrSlug: string) {
  const db = await getDb();
  const product = await db.queryFirst<Product>('SELECT * FROM products WHERE (id = ? OR slug = ?) AND is_active = 1', [idOrSlug, idOrSlug]);
  if (!product) return null;

  const variants = await db.queryAll<ProductVariant & { physical_qty: number; reserved_qty: number; available_qty: number; safety_threshold: number; location_code: string }>(`
    SELECT v.*, i.physical_qty, i.reserved_qty, (i.physical_qty - i.reserved_qty) as available_qty, i.safety_threshold, i.location_code
    FROM product_variants v
    LEFT JOIN inventory_levels i ON v.id = i.variant_id
    WHERE v.product_id = ?
  `, [product.id]);

  return JSON.parse(JSON.stringify({
    ...product,
    variants
  }));
}

export async function getProductBySlug(slug: string) {
  return await getProductByIdOrSlug(slug);
}

/**
 * Lấy báo cáo tồn kho chuyên sâu cho Executive Dashboard
 */
export async function getInventoryOverview(): Promise<InventoryItem[]> {
  const db = await getDb();
  const rows = await db.queryAll<any>(`
    SELECT 
      v.id as variant_id,
      p.name as product_name,
      v.sku,
      v.color,
      v.size,
      v.cost_price,
      v.selling_price,
      v.floor_price,
      i.physical_qty,
      i.reserved_qty,
      (i.physical_qty - i.reserved_qty) as available_qty,
      i.safety_threshold,
      i.location_code
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    JOIN inventory_levels i ON v.id = i.variant_id
    ORDER BY (i.physical_qty <= i.safety_threshold) DESC, i.physical_qty ASC
  `);

  return rows.map(r => ({
    ...r,
    is_low_stock: r.physical_qty <= r.safety_threshold,
    is_critical: r.physical_qty <= Math.max(1, Math.floor(r.safety_threshold / 2))
  }));
}

/**
 * Tổng hợp Dòng tiền & Lợi nhuận ròng (P&L Ledger)
 */
export async function getCashFlowSummary(): Promise<CashFlowSummary> {
  const db = await getDb();
  
  const revRow = await db.queryFirst<{ total: number }>(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM financial_transactions 
    WHERE transaction_type = 'REVENUE' AND direction = 'INFLOW'
  `);

  const cogsRow = await db.queryFirst<{ total: number }>(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM financial_transactions 
    WHERE transaction_type = 'COGS' AND direction = 'OUTFLOW'
  `);

  const shipRow = await db.queryFirst<{ total: number }>(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM financial_transactions 
    WHERE transaction_type = 'SHIPPING_FEE' AND direction = 'OUTFLOW'
  `);

  const feeRow = await db.queryFirst<{ total: number }>(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM financial_transactions 
    WHERE transaction_type = 'GATEWAY_FEE' AND direction = 'OUTFLOW'
  `);

  const ordersCountRow = await db.queryFirst<{ paid_count: number; pending_count: number }>(`
    SELECT 
      COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_count,
      COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_count
    FROM orders
  `);

  const total_revenue = revRow?.total || 0;
  const total_cogs = cogsRow?.total || 0;
  const total_shipping_fee = shipRow?.total || 0;
  const total_gateway_fee = feeRow?.total || 0;
  const net_profit = total_revenue - total_cogs - total_shipping_fee - total_gateway_fee;
  const gross_margin_percentage = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

  return {
    total_revenue,
    total_cogs,
    total_shipping_fee,
    total_gateway_fee,
    net_profit,
    gross_margin_percentage: Math.round(gross_margin_percentage * 10) / 10,
    paid_orders_count: ordersCountRow?.paid_count || 0,
    pending_orders_count: ordersCountRow?.pending_count || 0
  };
}

/**
 * Lấy lịch sử sổ cái giao dịch tài chính
 */
export async function getFinancialTransactions(limit: number = 20): Promise<FinancialTransaction[]> {
  const db = await getDb();
  return await db.queryAll<FinancialTransaction>(`
    SELECT * FROM financial_transactions 
    ORDER BY recorded_at DESC 
    LIMIT ?
  `, [limit]);
}

/**
 * Cập nhật giá bán biến thể - Có chốt an toàn chống bán phá giá dưới Giá Sàn (Floor Price)
 */
export async function updateVariantPrice(variantId: string, newSellingPrice: number): Promise<{ success: boolean; message: string; variant?: ProductVariant }> {
  const db = await getDb();
  const variant = await db.queryFirst<ProductVariant>('SELECT * FROM product_variants WHERE id = ?', [variantId]);
  
  if (!variant) {
    return { success: false, message: 'Không tìm thấy biến thể sản phẩm!' };
  }

  if (newSellingPrice < variant.floor_price) {
    return { 
      success: false, 
      message: `Cảnh báo an toàn: Giá ${newSellingPrice.toLocaleString('vi-VN')}đ thấp hơn giá sàn an toàn (${variant.floor_price.toLocaleString('vi-VN')}đ). Hãy bảo vệ biên lợi nhuận!` 
    };
  }

  await db.execute(`
    UPDATE product_variants 
    SET selling_price = ?, updated_at = datetime('now') 
    WHERE id = ?
  `, [newSellingPrice, variantId]);

  const updated = await db.queryFirst<ProductVariant>('SELECT * FROM product_variants WHERE id = ?', [variantId]);
  return { success: true, message: 'Cập nhật giá thành công!', variant: updated || undefined };
}

/**
 * Tự động hủy/xóa các đơn hàng PENDING chuyển khoản quá 1 tiếng (3600 giây) chưa thanh toán:
 * - Hoàn trả số lượng giữ chỗ (reserved_qty) trong kho inventory_levels.
 * - Xóa các bút toán tài chính phát sinh.
 * - Xóa các sản phẩm trong order_items.
 * - Xóa đơn hàng khỏi bảng orders.
 */
export async function cleanupExpiredOrders(specificOrderId?: string): Promise<{ cleanedCount: number; cleanedOrderIds: string[] }> {
  try {
    const db = await getDb();
    let expiredOrders: { id: string; order_code: string; created_at: string }[] = [];

    if (specificOrderId) {
      expiredOrders = await db.queryAll<any>(`
        SELECT id, order_code, created_at
        FROM orders
        WHERE (id = ? OR order_code = ?)
          AND payment_status = 'PENDING' 
          AND fulfillment_status = 'UNFULFILLED'
          AND (
            datetime(created_at, '+1 hour') <= datetime('now')
            OR (strftime('%s', 'now') - strftime('%s', created_at)) >= 3600
          )
      `, [specificOrderId, specificOrderId]);
    } else {
      expiredOrders = await db.queryAll<any>(`
        SELECT id, order_code, created_at
        FROM orders
        WHERE payment_status = 'PENDING' 
          AND fulfillment_status = 'UNFULFILLED'
          AND (
            datetime(created_at, '+1 hour') <= datetime('now')
            OR (strftime('%s', 'now') - strftime('%s', created_at)) >= 3600
          )
      `);
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return { cleanedCount: 0, cleanedOrderIds: [] };
    }

    const cleanedOrderIds: string[] = [];

    for (const ord of expiredOrders) {
      // 1. Hoàn lại số lượng hàng đã giữ chỗ trong kho
      const items = await db.queryAll<{ variant_id: string; quantity: number }>(`
        SELECT variant_id, quantity FROM order_items WHERE order_id = ?
      `, [ord.id]);

      for (const item of items) {
        await db.execute(`
          UPDATE inventory_levels
          SET reserved_qty = MAX(0, reserved_qty - ?), updated_at = datetime('now')
          WHERE variant_id = ?
        `, [item.quantity, item.variant_id]);
      }

      // 2. Xóa các bút toán tài chính phát sinh liên quan đơn này
      await db.execute(`DELETE FROM financial_transactions WHERE order_id = ?`, [ord.id]);

      // 3. Xóa các dòng hàng order_items
      await db.execute(`DELETE FROM order_items WHERE order_id = ?`, [ord.id]);

      // 4. Xóa đơn hàng khỏi bảng orders
      await db.execute(`DELETE FROM orders WHERE id = ?`, [ord.id]);

      cleanedOrderIds.push(ord.id);
    }

    return { cleanedCount: cleanedOrderIds.length, cleanedOrderIds };
  } catch (error) {
    console.error('Error during cleanupExpiredOrders:', error);
    return { cleanedCount: 0, cleanedOrderIds: [] };
  }
}

/**
 * Lấy danh sách đơn hàng
 */
export async function getOrders(limit: number = 20): Promise<Order[]> {
  await cleanupExpiredOrders();
  const db = await getDb();
  return await db.queryAll<Order>(`
    SELECT o.*, COUNT(oi.id) as items_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ?
  `, [limit]);
}

/**
 * Lấy danh sách đơn hàng của khách hàng theo SĐT hoặc Email
 */
export async function getCustomerOrders(phone: string, email?: string): Promise<any[]> {
  await cleanupExpiredOrders();
  const db = await getDb();
  const cleanPhone = phone?.trim() || '';
  const cleanEmail = email?.trim() || '';

  if (!cleanPhone && !cleanEmail) return [];

  // Chuẩn hóa số điện thoại: hỗ trợ 098... lẫn +8498...
  const rawDigits = cleanPhone.replace(/\D/g, '');
  const phoneVariants = Array.from(new Set([
    cleanPhone,
    rawDigits,
    rawDigits.startsWith('84') ? '0' + rawDigits.slice(2) : '',
    rawDigits.startsWith('0') ? '84' + rawDigits.slice(1) : '',
    rawDigits.startsWith('0') ? '+84' + rawDigits.slice(1) : '',
  ].filter(Boolean)));

  const orders = await db.queryAll<any>(`
    SELECT o.*, COUNT(oi.id) as items_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE (
      (? != '' AND (o.customer_phone = ? OR o.customer_phone IN (${phoneVariants.map(() => '?').join(',')})))
      OR (? != '' AND o.customer_email IS NOT NULL AND LOWER(o.customer_email) = LOWER(?))
    )
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 50
  `, [cleanPhone, cleanPhone, ...phoneVariants, cleanEmail, cleanEmail]);

  for (const ord of orders) {
    const items = await db.queryAll<any>(`
      SELECT oi.*, p.name as product_name, p.image_url as product_images, pv.color, pv.size
      FROM order_items oi
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `, [ord.id]);
    ord.items = items;
  }

  return orders;
}

/**
 * Cập nhật số lượng tồn kho thủ công hoặc nhập hàng
 */
export async function adjustInventory(variantId: string, newPhysicalQty: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  await db.execute(`
    UPDATE inventory_levels 
    SET physical_qty = ?, updated_at = datetime('now') 
    WHERE variant_id = ?
  `, [newPhysicalQty, variantId]);
  return { success: true, message: 'Đã cập nhật số lượng tồn kho!' };
}

/**
 * Cập nhật trạng thái xử lý đơn hàng
 */
export async function updateOrderStatus(orderId: string, fulfillmentStatus: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  await db.execute(`
    UPDATE orders 
    SET fulfillment_status = ?, updated_at = datetime('now') 
    WHERE id = ? OR order_code = ?
  `, [fulfillmentStatus, orderId, orderId]);
  return { success: true, message: 'Cập nhật trạng thái đơn hàng thành công!' };
}

/**
 * Lấy chi tiết đơn hàng theo ID hoặc Order Code
 */
export async function getOrderById(orderIdOrCode: string): Promise<Order | null> {
  await cleanupExpiredOrders(orderIdOrCode);
  const db = await getDb();
  return await db.queryFirst<Order>(`
    SELECT o.*, COUNT(oi.id) as items_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ? OR o.order_code = ?
    GROUP BY o.id
  `, [orderIdOrCode, orderIdOrCode]);
}

/**
 * Xác nhận thanh toán chuyển khoản: chuyển payment_status sang PAID và fulfillment_status sang PACKING (Chờ vận chuyển)
 */
export async function confirmOrderPayment(orderIdOrCode: string): Promise<{ success: boolean; message: string; order?: Order }> {
  const db = await getDb();
  const order = await db.queryFirst<Order>(`SELECT * FROM orders WHERE id = ? OR order_code = ?`, [orderIdOrCode, orderIdOrCode]);
  if (!order) {
    return { success: false, message: 'Không tìm thấy đơn hàng' };
  }

  // Cập nhật trạng thái đơn: PAID và PACKING (Chờ vận chuyển)
  await db.execute(`
    UPDATE orders 
    SET payment_status = 'PAID', fulfillment_status = 'PACKING', updated_at = datetime('now') 
    WHERE id = ?
  `, [order.id]);

  // Ghi nhận sổ cái tài chính REVENUE (nếu chưa có)
  const existingTx = await db.queryFirst(`
    SELECT id FROM financial_transactions WHERE order_id = ? AND transaction_type = 'REVENUE'
  `, [order.id]);

  if (!existingTx) {
    await db.execute(`
      INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes)
      VALUES (?, ?, 'REVENUE', ?, 'INFLOW', 'VIETQR', ?, ?)
    `, [`fin-${Date.now().toString(36)}-rev`, order.id, order.total_amount, `VQR-${order.order_code}`, `Khách ${order.customer_name} thanh toán chuyển khoản đơn ${order.order_code}`]);
  }

  const updatedOrder = await db.queryFirst<Order>(`SELECT * FROM orders WHERE id = ?`, [order.id]);
  return {
    success: true,
    message: 'Thanh toán thành công. Đơn hàng đã chuyển sang trạng thái: Chờ vận chuyển!',
    order: updatedOrder || undefined,
  };
}

/**
 * Khách hàng tạo đơn hàng tự động (Tự trừ kho reserved, ghi sổ cái tài chính)
 */
export async function createCustomerOrder(input: CreateOrderInput): Promise<{ success: boolean; message: string; order?: any }> {
  const db = await getDb();

  if (!input.items || input.items.length === 0) {
    return { success: false, message: 'Giỏ hàng đang trống.' };
  }

  // 1. Kiểm tra tồn kho khả dụng cho từng món
  const verifiedItems: { variant_id: string; sku: string; name: string; quantity: number; unit_price: number; unit_cost: number; total_price: number }[] = [];
  let subtotal = 0;
  let totalCost = 0;

  for (const item of input.items) {
    const row = await db.queryFirst<any>(`
      SELECT v.*, p.name as product_name, i.physical_qty, i.reserved_qty, (i.physical_qty - i.reserved_qty) as available_qty
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN inventory_levels i ON v.id = i.variant_id
      WHERE v.id = ?
    `, [item.variant_id]);

    if (!row) {
      return { success: false, message: `Không tìm thấy sản phẩm có mã ${item.variant_id}` };
    }

    if (row.available_qty < item.quantity) {
      return { 
        success: false, 
        message: `Sản phẩm "${row.product_name} (${row.color} - Size ${row.size})" chỉ còn ${row.available_qty} chiếc trong kho.` 
      };
    }

    const itemTotal = row.selling_price * item.quantity;
    subtotal += itemTotal;
    totalCost += row.cost_price * item.quantity;

    verifiedItems.push({
      variant_id: row.id,
      sku: row.sku,
      name: row.product_name,
      quantity: item.quantity,
      unit_price: row.selling_price,
      unit_cost: row.cost_price,
      total_price: itemTotal
    });
  }

  // 1.1 Tính toán Cấp bậc hội viên & Chiết khấu giảm giá theo số lượng đơn hàng (chỉ tính đơn đã thanh toán hoặc đã giao)
  const pastOrdersStats = await db.queryFirst<{ past_orders: number }>(`
    SELECT COUNT(DISTINCT o.id) as past_orders
    FROM orders o
    WHERE o.customer_phone = ? 
      AND o.fulfillment_status != 'CANCELLED'
      AND (o.payment_status = 'PAID' OR o.fulfillment_status = 'DELIVERED')
  `, [input.customer_phone]);

  const pastOrders = pastOrdersStats?.past_orders || 0;
  const tier = calculateTier(pastOrders);
  const discountPercent = tier.discount_percent;
  const discountAmount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;

  // Cước ship cố định 30.000đ (miễn phí nếu đơn >= 500.000đ sau giảm giá)
  const shippingFee = (subtotal - discountAmount) >= 500000 ? 0 : 30000;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
  const orderId = `ord-${Date.now().toString(36)}`;
  const orderCode = `ORD-${Date.now().toString().slice(-6)}`;

  const isCod = input.payment_method === 'cod';
  // Đối với VietQR: Khách cần quét mã, trạng thái ban đầu là PENDING (Chờ chuyển khoản) & UNFULFILLED
  // Đối với COD: PENDING (Chờ thu tiền) & PACKING (Chờ vận chuyển)
  const initialPaymentStatus = 'PENDING';
  const initialFulfillmentStatus = isCod ? 'PACKING' : 'UNFULFILLED';

  // 2. Insert Order
  await db.execute(`
    INSERT INTO orders (id, order_code, customer_name, customer_phone, customer_email, shipping_address, subtotal, shipping_fee, discount_amount, total_amount, payment_status, fulfillment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    orderId,
    orderCode,
    input.customer_name,
    input.customer_phone,
    input.customer_email || null,
    input.shipping_address,
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    initialPaymentStatus,
    initialFulfillmentStatus
  ]);

  // 3. Insert Order Items & Update Inventory Reserved
  for (const it of verifiedItems) {
    await db.execute(`
      INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, unit_cost, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [`oi-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`, orderId, it.variant_id, it.quantity, it.unit_price, it.unit_cost, it.total_price]);

    // Khóa tồn kho reserved
    await db.execute(`
      UPDATE inventory_levels
      SET reserved_qty = reserved_qty + ?, updated_at = datetime('now')
      WHERE variant_id = ?
    `, [it.quantity, it.variant_id]);
  }

  // 4. Ghi nhận sổ cái tài chính kép (Inflow Doanh thu & Outflow Giá vốn COGS)
  if (isCod) {
    await db.execute(`
      INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes)
      VALUES (?, ?, 'REVENUE', ?, 'INFLOW', 'COD', ?, ?)
    `, [`fin-${Date.now().toString(36)}-rev`, orderId, totalAmount, `COD-${orderCode}`, `Khách ${input.customer_name} thanh toán COD đơn ${orderCode}`]);
  }

  await db.execute(`
    INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes)
    VALUES (?, ?, 'COGS', ?, 'OUTFLOW', 'SYSTEM', NULL, ?)
  `, [`fin-${Date.now().toString(36)}-cogs`, orderId, totalCost, `Giá vốn xuất kho đơn ${orderCode}`]);

  if (shippingFee > 0) {
    await db.execute(`
      INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes)
      VALUES (?, ?, 'SHIPPING_FEE', ?, 'OUTFLOW', 'DELIVERY', NULL, ?)
    `, [`fin-${Date.now().toString(36)}-shp`, orderId, 25000, `Cước ship ước tính đơn ${orderCode}`]);
  }

  return {
    success: true,
    message: isCod ? 'Đặt hàng COD thành công!' : 'Đã tạo đơn hàng. Vui lòng quét mã QR chuyển khoản.',
    order: {
      id: orderId,
      order_code: orderCode,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      shipping_address: input.shipping_address,
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_status: initialPaymentStatus,
      fulfillment_status: initialFulfillmentStatus,
      payment_method: input.payment_method || 'vietqr'
    }
  };
}

// ----------------- PRODUCT MANAGEMENT SERVICES -----------------

export interface CreateVariantInput {
  color: string;
  size: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  floor_price?: number;
  physical_qty?: number;
  safety_threshold?: number;
  location_code?: string;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: number;
  variants: CreateVariantInput[];
}

export function generateProductSlug(text: string): string {
  const slug = text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || `san-pham-${Date.now().toString(36)}`;
}

export async function createProduct(input: CreateProductInput): Promise<{ success: boolean; message: string; product?: any }> {
  const db = await getDb();

  if (!input.name || !input.name.trim()) {
    return { success: false, message: 'Tên sản phẩm không được để trống.' };
  }

  if (!input.variants || input.variants.length === 0) {
    return { success: false, message: 'Sản phẩm phải có ít nhất một biến thể (màu sắc, size, giá).' };
  }

  const category = input.category?.trim() || 'Khác';
  let baseSlug = input.slug?.trim() ? generateProductSlug(input.slug) : generateProductSlug(input.name);

  // Check unique slug
  let slug = baseSlug;
  const existingSlug = await db.queryFirst('SELECT id FROM products WHERE slug = ?', [slug]);
  if (existingSlug) {
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const productId = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const imageUrl = input.image_url?.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop';
  const description = input.description?.trim() || '';
  const isActive = input.is_active !== undefined ? input.is_active : 1;

  // Insert product
  await db.execute(`
    INSERT INTO products (id, name, slug, category, description, image_url, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [productId, input.name.trim(), slug, category, description, imageUrl, isActive]);

  // Insert variants and inventory
  for (let i = 0; i < input.variants.length; i++) {
    const v = input.variants[i];
    const variantId = `var-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Auto generate SKU if not specified
    let sku = v.sku?.trim();
    if (!sku) {
      const catCode = category.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
      const colCode = generateProductSlug(v.color || 'COL').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLR';
      const sizeCode = (v.size || 'M').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'M';
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      sku = `${catCode}-${colCode}-${sizeCode}-${rand}`;
    }

    // Ensure unique SKU in db
    const existingSku = await db.queryFirst('SELECT id FROM product_variants WHERE sku = ?', [sku]);
    if (existingSku) {
      sku = `${sku}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    }

    const costPrice = Math.max(0, Number(v.cost_price) || 0);
    const sellingPrice = Math.max(0, Number(v.selling_price) || 0);
    const floorPrice = v.floor_price !== undefined && Number(v.floor_price) > 0 
      ? Number(v.floor_price) 
      : Math.max(costPrice, Math.round(sellingPrice * 0.7));

    await db.execute(`
      INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [variantId, productId, sku, v.color?.trim() || 'Tiêu chuẩn', v.size?.trim() || 'Freesize', costPrice, sellingPrice, floorPrice]);

    // Insert Inventory Level
    const invId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const physicalQty = Math.max(0, Number(v.physical_qty) || 0);
    const safetyThreshold = Math.max(1, Number(v.safety_threshold) || 5);
    const locationCode = v.location_code?.trim() || 'WH-HN-01';

    await db.execute(`
      INSERT INTO inventory_levels (id, variant_id, physical_qty, reserved_qty, safety_threshold, location_code, updated_at)
      VALUES (?, ?, ?, 0, ?, ?, datetime('now'))
    `, [invId, variantId, physicalQty, safetyThreshold, locationCode]);
  }

  const created = await getProductByIdOrSlug(productId);
  return {
    success: true,
    message: 'Thêm sản phẩm thành công!',
    product: created
  };
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  const prod = await db.queryFirst<{ id: string; name: string }>('SELECT id, name FROM products WHERE id = ?', [productId]);
  if (!prod) {
    return { success: false, message: 'Không tìm thấy sản phẩm cần xóa.' };
  }

  // Remove inventory levels
  await db.execute(`
    DELETE FROM inventory_levels 
    WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)
  `, [productId]);

  // Remove variants
  await db.execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);

  // Remove product
  await db.execute('DELETE FROM products WHERE id = ?', [productId]);

  return { success: true, message: `Đã xóa sản phẩm "${prod.name}" thành công!` };
}

export async function updateProductStatus(productId: string, isActive: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  await db.execute(`
    UPDATE products 
    SET is_active = ?, updated_at = datetime('now') 
    WHERE id = ?
  `, [isActive ? 1 : 0, productId]);

  return { 
    success: true, 
    message: isActive ? 'Đã hiển thị sản phẩm trên cửa hàng!' : 'Đã tạm ẩn sản phẩm khỏi cửa hàng!' 
  };
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  category?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: number;
  variants?: Array<{
    id?: string;
    sku?: string;
    color?: string;
    size?: string;
    cost_price?: number;
    selling_price?: number;
    floor_price?: number;
    physical_qty?: number;
    safety_threshold?: number;
    location_code?: string;
  }>;
}

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<{ success: boolean; message: string; product?: any }> {
  const db = await getDb();
  const prod = await db.queryFirst<any>('SELECT * FROM products WHERE id = ?', [productId]);
  if (!prod) {
    return { success: false, message: 'Không tìm thấy sản phẩm cần cập nhật.' };
  }

  const name = input.name !== undefined ? input.name.trim() : prod.name;
  if (!name) {
    return { success: false, message: 'Tên sản phẩm không được để trống.' };
  }

  let slug = prod.slug;
  if (input.slug !== undefined && input.slug.trim()) {
    const candidateSlug = generateProductSlug(input.slug);
    const existing = await db.queryFirst('SELECT id FROM products WHERE slug = ? AND id != ?', [candidateSlug, productId]);
    if (existing) {
      slug = `${candidateSlug}-${Math.random().toString(36).substring(2, 6)}`;
    } else {
      slug = candidateSlug;
    }
  }

  const category = input.category !== undefined ? input.category.trim() : prod.category;
  const description = input.description !== undefined ? input.description?.trim() : prod.description;
  const imageUrl = input.image_url !== undefined ? input.image_url?.trim() : prod.image_url;
  const isActive = input.is_active !== undefined ? input.is_active : prod.is_active;

  // Cập nhật thông tin chung của sản phẩm
  await db.execute(`
    UPDATE products 
    SET name = ?, slug = ?, category = ?, description = ?, image_url = ?, is_active = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [name, slug, category, description, imageUrl, isActive, productId]);

  // Cập nhật biến thể nếu được truyền vào
  if (input.variants && input.variants.length > 0) {
    const existingVariants = await db.queryAll<{ id: string }>('SELECT id FROM product_variants WHERE product_id = ?', [productId]);
    const existingIds = new Set(existingVariants.map(v => v.id));
    const incomingIds = new Set<string>();

    for (const v of input.variants) {
      const costPrice = Math.max(0, Number(v.cost_price) || 0);
      const sellingPrice = Math.max(0, Number(v.selling_price) || 0);
      const floorPrice = v.floor_price !== undefined && Number(v.floor_price) > 0
        ? Number(v.floor_price)
        : Math.max(costPrice, Math.round(sellingPrice * 0.7));
      const physicalQty = Math.max(0, Number(v.physical_qty) || 0);
      const safetyThreshold = Math.max(1, Number(v.safety_threshold) || 5);

      if (v.id && existingIds.has(v.id)) {
        incomingIds.add(v.id);
        let sku = v.sku?.trim();
        if (!sku) {
          sku = `SKU-${v.id}`;
        }
        await db.execute(`
          UPDATE product_variants
          SET sku = ?, color = ?, size = ?, cost_price = ?, selling_price = ?, floor_price = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [sku, v.color?.trim() || 'Tiêu chuẩn', v.size?.trim() || 'Freesize', costPrice, sellingPrice, floorPrice, v.id]);

        const inv = await db.queryFirst<{ id: string }>('SELECT id FROM inventory_levels WHERE variant_id = ?', [v.id]);
        if (inv) {
          await db.execute(`
            UPDATE inventory_levels
            SET physical_qty = ?, safety_threshold = ?, updated_at = datetime('now')
            WHERE id = ?
          `, [physicalQty, safetyThreshold, inv.id]);
        } else {
          const invId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
          await db.execute(`
            INSERT INTO inventory_levels (id, variant_id, physical_qty, reserved_qty, safety_threshold, location_code, updated_at)
            VALUES (?, ?, ?, 0, ?, ?, datetime('now'))
          `, [invId, v.id, physicalQty, safetyThreshold, v.location_code || 'WH-HN-01']);
        }
      } else {
        const variantId = `var-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        incomingIds.add(variantId);

        let sku = v.sku?.trim();
        if (!sku) {
          const catCode = category.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
          const colCode = generateProductSlug(v.color || 'COL').substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLR';
          const sizeCode = (v.size || 'M').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'M';
          const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
          sku = `${catCode}-${colCode}-${sizeCode}-${rand}`;
        }

        await db.execute(`
          INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [variantId, productId, sku, v.color?.trim() || 'Tiêu chuẩn', v.size?.trim() || 'Freesize', costPrice, sellingPrice, floorPrice]);

        const invId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        await db.execute(`
          INSERT INTO inventory_levels (id, variant_id, physical_qty, reserved_qty, safety_threshold, location_code, updated_at)
          VALUES (?, ?, ?, 0, ?, ?, datetime('now'))
        `, [invId, variantId, physicalQty, safetyThreshold, v.location_code || 'WH-HN-01']);
      }
    }

    // Xóa các biến thể không còn tồn tại
    for (const oldId of existingIds) {
      if (!incomingIds.has(oldId)) {
        await db.execute('DELETE FROM inventory_levels WHERE variant_id = ?', [oldId]);
        await db.execute('DELETE FROM product_variants WHERE id = ?', [oldId]);
      }
    }
  }

  const updated = await getProductByIdOrSlug(productId);
  return {
    success: true,
    message: 'Cập nhật sản phẩm thành công!',
    product: updated
  };
}
