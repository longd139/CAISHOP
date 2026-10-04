import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'caishop-super-secure-jwt-secret-key-2026-monochrome';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AuthUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: 'ADMIN' | 'USER';
}

export interface JwtPayload {
  sub: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

/**
 * Ký mã JWT Token cho user (thời hạn 7 ngày)
 */
export async function signJwt(user: AuthUser): Promise<string> {
  return await new SignJWT({
    sub: user.id,
    name: user.name,
    phone: user.phone || null,
    email: user.email || null,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Xác thực và giải mã JWT Token
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Băm mật khẩu với bcrypt
 */
export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 10);
}

/**
 * Đối chiếu mật khẩu
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

/**
 * Chuẩn hóa số điện thoại Việt Nam (+84, khoảng trắng, dấu chấm -> 0xxx)
 */
export function normalizePhone(rawPhone: string): string {
  let clean = rawPhone.trim().replace(/[\s\.-]/g, '');
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length === 11) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

/**
 * Tìm user theo Email hoặc Số điện thoại
 */
export async function findUserByIdentifier(identifier: string) {
  const db = await getDb();
  const trimmed = identifier.trim();
  const cleanEmail = trimmed.toLowerCase();
  const cleanPhone = normalizePhone(trimmed);
  return await db.queryFirst('SELECT * FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?', [cleanEmail, trimmed, cleanPhone]);
}

/**
 * Tìm user theo email
 */
export async function findUserByEmail(email: string) {
  const db = await getDb();
  return await db.queryFirst('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase().trim()]);
}

/**
 * Tìm user theo số điện thoại
 */
export async function findUserByPhone(phone: string) {
  const db = await getDb();
  const clean = normalizePhone(phone);
  return await db.queryFirst('SELECT * FROM users WHERE phone = ? OR phone = ?', [phone.trim(), clean]);
}

/**
 * Tạo mới user với vai trò (Số điện thoại bắt buộc, Email không bắt buộc)
 */
export async function createUser(
  name: string,
  phone: string,
  email: string | null | undefined,
  passwordPlain: string,
  role: 'ADMIN' | 'USER' = 'USER'
) {
  const db = await getDb();
  const cleanPhone = normalizePhone(phone);
  const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : null;

  // Kiểm tra trùng SĐT
  const existingPhone = await findUserByPhone(cleanPhone);
  if (existingPhone) {
    throw new Error('Số điện thoại này đã được đăng ký tài khoản.');
  }

  // Nếu có email thì kiểm tra trùng email
  if (cleanEmail) {
    const existingEmail = await findUserByEmail(cleanEmail);
    if (existingEmail) {
      throw new Error('Email này đã được đăng ký tài khoản.');
    }
  }

  const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const passwordHash = await hashPassword(passwordPlain);

  await db.execute(`
    INSERT INTO users (id, name, phone, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, name.trim(), cleanPhone, cleanEmail, passwordHash, role]);

  return {
    id,
    name: name.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    role,
  };
}

/**
 * Lấy thông tin user đăng nhập từ Request (qua Cookie caishop_token hoặc Header Bearer)
 */
export async function getAuthUserFromRequest(request: Request): Promise<JwtPayload | null> {
  // 1. Kiểm tra cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/caishop_token=([^;]+)/);
  let token = match ? match[1] : null;

  // 2. Kiểm tra header Authorization
  if (!token) {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;
  return await verifyJwt(token);
}
