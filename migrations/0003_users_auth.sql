-- USERS AND AUTHENTICATION SCHEMA FOR CLOUDFLARE D1

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN', 'USER'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ensure phone column exists if users table was already created
ALTER TABLE users ADD COLUMN phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Site Content Table for CMS
CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Seed default Admin and Customer User
-- Admin: SĐT: 0901234567 / admin@caishop.vn / admin123
-- Customer: SĐT: 0987654321 / khachhang@caishop.vn / user123
INSERT OR REPLACE INTO users (id, name, phone, email, password_hash, role) VALUES
('usr-admin-01', 'Chủ Shop (Administrator)', '0901234567', 'admin@caishop.vn', '$2b$10$QpHU4Gml08zD/pkIO2MP5O7Jdyso1sCqR.yJSxr8i/.mq7mkrlmhy', 'ADMIN'),
('usr-cust-01', 'Nguyễn Thị Khách Hàng', '0987654321', 'khachhang@caishop.vn', '$2b$10$C2PGlsH/ze0LkB9n3JgFFePWd/vUggfLmuhhG5Kl6dnjvXaAqNvzG', 'USER');
