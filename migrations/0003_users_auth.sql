-- USERS AND AUTHENTICATION SCHEMA FOR CLOUDFLARE D1

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN', 'USER'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed default Admin and Customer User
-- Admin: admin@caishop.vn / admin123
-- Customer: khachhang@caishop.vn / user123
INSERT OR REPLACE INTO users (id, name, email, password_hash, role) VALUES
('usr-admin-01', 'Chủ Shop (Administrator)', 'admin@caishop.vn', '$2b$10$QpHU4Gml08zD/pkIO2MP5O7Jdyso1sCqR.yJSxr8i/.mq7mkrlmhy', 'ADMIN'),
('usr-cust-01', 'Nguyễn Thị Khách Hàng', 'khachhang@caishop.vn', '$2b$10$C2PGlsH/ze0LkB9n3JgFFePWd/vUggfLmuhhG5Kl6dnjvXaAqNvzG', 'USER');
