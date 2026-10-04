-- SEED DATA FOR CAISHOP

-- 1. Insert Products
INSERT INTO products (id, name, slug, category, description, image_url, is_active) VALUES
('prod-1', 'Áo Thun Oversize Heavy Cotton 250gsm', 'ao-thun-oversize-heavy-cotton', 'T-Shirt', 'Chất liệu 100% Cotton định lượng 250gsm dày dặn, đứng form, thoáng mát, chống xù lông.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop', 1),
('prod-2', 'Áo Sơ Mi Oxford Regular Fit', 'ao-so-mi-oxford-regular', 'Shirt', 'Chất vải Oxford dệt thoi cao cấp, chống nhăn nhẹ, thiết kế cổ bẻ thanh lịch phù hợp đi làm và đi chơi.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop', 1),
('prod-3', 'Quần Jean Slim-fit Co Giãn Cao Cấp', 'quan-jean-slim-fit-co-gian', 'Pants', 'Denim 12oz pha 2% Spandex co giãn thoải mái khi vận động, wash màu vintage bền đẹp.', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop', 1),
('prod-4', 'Áo Khoác Bomber Minimalist Windbreaker', 'ao-khoac-bomber-minimalist', 'Jacket', 'Áo khoác gió 2 lớp chống nước nhẹ, lót dù thông khí, bo chun dệt kim co giãn cao cấp.', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop', 1),
('prod-5', 'Áo Polo Cotton Pique Phối Cổ', 'ao-polo-cotton-pique', 'Polo', 'Vải cá sấu mắt chim cotton mềm mịn, thấm hút mồ hôi tối đa, form suông tôn dáng.', 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop', 1);

-- 2. Insert Variants (SKU, Cost Price, Selling Price, Floor Price)
-- Áo Thun prod-1 (Giá vốn 95k, Giá bán 249k, Giá sàn 150k)
INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price) VALUES
('var-1-blk-m', 'prod-1', 'TSH-BLK-M', 'Đen', 'M', 95000, 249000, 150000),
('var-1-blk-l', 'prod-1', 'TSH-BLK-L', 'Đen', 'L', 95000, 249000, 150000),
('var-1-blk-xl', 'prod-1', 'TSH-BLK-XL', 'Đen', 'XL', 95000, 249000, 150000),
('var-1-wht-m', 'prod-1', 'TSH-WHT-M', 'Trắng', 'M', 95000, 249000, 150000),
('var-1-wht-l', 'prod-1', 'TSH-WHT-L', 'Trắng', 'L', 95000, 249000, 150000);

-- Áo Sơ Mi prod-2 (Giá vốn 140k, Giá bán 380k, Giá sàn 230k)
INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price) VALUES
('var-2-blu-m', 'prod-2', 'SMI-BLU-M', 'Xanh Nhạt', 'M', 140000, 380000, 230000),
('var-2-blu-l', 'prod-2', 'SMI-BLU-L', 'Xanh Nhạt', 'L', 140000, 380000, 230000),
('var-2-wht-m', 'prod-2', 'SMI-WHT-M', 'Trắng', 'M', 140000, 380000, 230000),
('var-2-wht-l', 'prod-2', 'SMI-WHT-L', 'Trắng', 'L', 140000, 380000, 230000);

-- Quần Jean prod-3 (Giá vốn 190k, Giá bán 480k, Giá sàn 300k)
INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price) VALUES
('var-3-blk-30', 'prod-3', 'JEA-BLK-30', 'Đen Wash', '30', 190000, 480000, 300000),
('var-3-blk-31', 'prod-3', 'JEA-BLK-31', 'Đen Wash', '31', 190000, 480000, 300000),
('var-3-blk-32', 'prod-3', 'JEA-BLK-32', 'Đen Wash', '32', 190000, 480000, 300000);

-- Áo Khoác Bomber prod-4 (Giá vốn 260k, Giá bán 650k, Giá sàn 420k)
INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price) VALUES
('var-4-blk-l', 'prod-4', 'JKT-BLK-L', 'Đen Matt', 'L', 260000, 650000, 420000),
('var-4-blk-xl', 'prod-4', 'JKT-BLK-XL', 'Đen Matt', 'XL', 260000, 650000, 420000);

-- Áo Polo prod-5 (Giá vốn 120k, Giá bán 320k, Giá sàn 200k)
INSERT INTO product_variants (id, product_id, sku, color, size, cost_price, selling_price, floor_price) VALUES
('var-5-nvy-m', 'prod-5', 'POL-NVY-M', 'Xanh Navy', 'M', 120000, 320000, 200000),
('var-5-nvy-l', 'prod-5', 'POL-NVY-L', 'Xanh Navy', 'L', 120000, 320000, 200000);

-- 3. Insert Inventory Levels (Tồn kho thực tế + Cảnh báo an toàn)
-- Một số SKU cố tình để số lượng thấp (<= 4) để kích hoạt trạng thái CẢNH BÁO ĐỎ trên dashboard của bạn
INSERT INTO inventory_levels (id, variant_id, physical_qty, reserved_qty, safety_threshold, location_code) VALUES
('inv-1', 'var-1-blk-m', 35, 2, 5, 'WH-HN-01'),
('inv-2', 'var-1-blk-l', 4, 1, 5, 'WH-HN-01'),   -- CẢNH BÁO SẮP HẾT! (Còn 4)
('inv-3', 'var-1-blk-xl', 2, 0, 5, 'WH-HN-01'),  -- CẢNH BÁO NGUY CẤP! (Còn 2)
('inv-4', 'var-1-wht-m', 40, 3, 5, 'WH-HN-01'),
('inv-5', 'var-1-wht-l', 25, 0, 5, 'WH-HN-01'),
('inv-6', 'var-2-blu-m', 18, 0, 5, 'WH-HN-01'),
('inv-7', 'var-2-blu-l', 3, 1, 5, 'WH-HN-01'),   -- CẢNH BÁO! (Còn 3)
('inv-8', 'var-2-wht-m', 22, 2, 5, 'WH-HN-01'),
('inv-9', 'var-2-wht-l', 15, 0, 5, 'WH-HN-01'),
('inv-10', 'var-3-blk-30', 28, 1, 5, 'WH-HN-01'),
('inv-11', 'var-3-blk-31', 19, 0, 5, 'WH-HN-01'),
('inv-12', 'var-3-blk-32', 5, 0, 5, 'WH-HN-01'),
('inv-13', 'var-4-blk-l', 12, 1, 4, 'WH-HN-01'),
('inv-14', 'var-4-blk-xl', 2, 0, 4, 'WH-HN-01'),  -- CẢNH BÁO! (Còn 2)
('inv-15', 'var-5-nvy-m', 30, 2, 5, 'WH-HN-01'),
('inv-16', 'var-5-nvy-l', 16, 0, 5, 'WH-HN-01');

-- 4. Insert Sample Orders & Financial Transactions (Dòng tiền mẫu)
INSERT INTO orders (id, order_code, customer_name, customer_phone, customer_email, shipping_address, subtotal, shipping_fee, discount_amount, total_amount, payment_status, fulfillment_status, created_at) VALUES
('ord-101', 'ORD-2610-001', 'Nguyễn Văn An', '0912345678', 'an.nguyen@example.com', '120 Cầu Giấy, Hà Nội', 498000, 30000, 0, 528000, 'PAID', 'DELIVERED', datetime('now', '-2 days')),
('ord-102', 'ORD-2610-002', 'Trần Thị Mai', '0987654321', 'mai.tran@example.com', '45 Lê Duẩn, Đà Nẵng', 380000, 30000, 20000, 390000, 'PAID', 'DISPATCHED', datetime('now', '-1 days')),
('ord-103', 'ORD-2610-003', 'Lê Hoàng Long', '0903112233', 'long.le@example.com', '88 Nguyễn Huệ, Quận 1, TP.HCM', 1130000, 0, 50000, 1080000, 'PAID', 'PACKING', datetime('now', '-4 hours')),
('ord-104', 'ORD-2610-004', 'Phạm Minh Đức', '0944556677', 'duc.pm@example.com', '15 Quang Trung, Nha Trang', 249000, 30000, 0, 279000, 'PENDING', 'UNFULFILLED', datetime('now', '-30 minutes'));

-- Order Items
INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, unit_cost, total_price) VALUES
('oi-1', 'ord-101', 'var-1-blk-m', 2, 249000, 95000, 498000),
('oi-2', 'ord-102', 'var-2-blu-m', 1, 380000, 140000, 380000),
('oi-3', 'ord-103', 'var-4-blk-l', 1, 650000, 260000, 650000),
('oi-4', 'ord-103', 'var-3-blk-30', 1, 480000, 190000, 480000),
('oi-5', 'ord-104', 'var-1-wht-m', 1, 249000, 95000, 249000);

-- Sổ cái kế toán kép (Financial Transactions)
INSERT INTO financial_transactions (id, order_id, transaction_type, amount, direction, payment_gateway, bank_ref_code, notes, recorded_at) VALUES
('fin-1', 'ord-101', 'REVENUE', 528000, 'INFLOW', 'VIETQR', 'FT261001-992', 'Khách thanh toán quét VietQR đơn ORD-2610-001', datetime('now', '-2 days')),
('fin-2', 'ord-101', 'COGS', 190000, 'OUTFLOW', 'SYSTEM', NULL, 'Giá vốn 2 áo TSH-BLK-M (95k x 2)', datetime('now', '-2 days')),
('fin-3', 'ord-101', 'SHIPPING_FEE', 28000, 'OUTFLOW', 'GHN', 'GHN-88291', 'Cước phí vận chuyển thực trả GHN', datetime('now', '-2 days')),

('fin-4', 'ord-102', 'REVENUE', 390000, 'INFLOW', 'VIETQR', 'FT261002-145', 'Khách thanh toán quét VietQR đơn ORD-2610-002', datetime('now', '-1 days')),
('fin-5', 'ord-102', 'COGS', 140000, 'OUTFLOW', 'SYSTEM', NULL, 'Giá vốn 1 áo SMI-BLU-M (140k)', datetime('now', '-1 days')),
('fin-6', 'ord-102', 'SHIPPING_FEE', 32000, 'OUTFLOW', 'GHTK', 'GHTK-99012', 'Cước phí vận chuyển GHTK', datetime('now', '-1 days')),

('fin-7', 'ord-103', 'REVENUE', 1080000, 'INFLOW', 'PAYOS', 'POS-883190', 'Khách chuyển khoản PayOS đơn ORD-2610-003', datetime('now', '-4 hours')),
('fin-8', 'ord-103', 'COGS', 450000, 'OUTFLOW', 'SYSTEM', NULL, 'Giá vốn 1 Bomber (260k) + 1 Jean (190k)', datetime('now', '-4 hours'));

-- Shipments
INSERT INTO shipments (id, order_id, carrier, tracking_code, shipping_fee, cod_amount, status, dispatched_at, delivered_at) VALUES
('shp-1', 'ord-101', 'GHN', 'GHN-VN-98218731', 28000, 0, 'DELIVERED', datetime('now', '-2 days'), datetime('now', '-1 days')),
('shp-2', 'ord-102', 'GHTK', 'GHTK-DN-44910283', 32000, 0, 'IN_TRANSIT', datetime('now', '-1 days'), NULL);
