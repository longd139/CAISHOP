'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, User, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag, Sparkles, ChevronLeft } from 'lucide-react';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const reasonParam = searchParams.get('reason') || '';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Form fields
  const [identifier, setIdentifier] = useState(''); // phone or email for login
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [email, setEmail] = useState(''); // optional for registration
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Compute confirm password validation state
  const isConfirmMatch = Boolean(
    password && confirmPassword && password === confirmPassword
  );
  const isConfirmMismatch = Boolean(
    confirmPasswordTouched && (!confirmPassword || password !== confirmPassword)
  );

  // Validate Vietnamese mobile phone number
  const validatePhone = (input: string) => {
    if (!input || !input.trim()) {
      return { isValid: false, message: 'Vui lòng nhập số điện thoại.', normalized: '' };
    }
    let clean = input.trim().replace(/[\s\.-]/g, '');
    if (clean.startsWith('+84')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('84') && clean.length === 11) {
      clean = '0' + clean.slice(2);
    }

    if (!/^\d+$/.test(clean)) {
      return { isValid: false, message: 'Số điện thoại chỉ được chứa chữ số.', normalized: clean };
    }
    if (!clean.startsWith('0')) {
      return { isValid: false, message: 'Số điện thoại phải bắt đầu bằng số 0 (hoặc +84).', normalized: clean };
    }
    if (clean.length < 10) {
      return { isValid: false, message: `Số điện thoại cần 10 chữ số (hiện có ${clean.length} số).`, normalized: clean };
    }
    if (clean.length > 10) {
      return { isValid: false, message: `Số điện thoại không được vượt quá 10 chữ số (${clean.length} số).`, normalized: clean };
    }
    if (!/^(03|05|07|08|09)\d{8}$/.test(clean)) {
      return { isValid: false, message: 'Đầu số không hợp lệ. Vui lòng nhập đầu số 03, 05, 07, 08 hoặc 09.', normalized: clean };
    }
    return { isValid: true, message: 'Số điện thoại hợp lệ.', normalized: clean };
  };

  const phoneStatus = useMemo(() => {
    return validatePhone(phone);
  }, [phone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, +, spaces, dots, dashes
    const val = e.target.value.replace(/[^0-9+\s\.-]/g, '');
    setPhone(val);
    if (!phoneTouched) setPhoneTouched(true);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle URL redirect alerts as Toast
  useEffect(() => {
    if (reasonParam === 'checkout') {
      showToast('Vui lòng đăng nhập để tiếp tục thanh toán đơn hàng.', 'info');
    } else if (reasonParam === 'require_login') {
      showToast('Vui lòng đăng nhập quyền ADMIN để truy cập Bảng điều hành.', 'info');
    } else if (reasonParam === 'forbidden_role') {
      showToast('Tài khoản của bạn là USER. Chỉ quyền ADMIN mới có quyền truy cập /admin.', 'error');
    } else if (reasonParam === 'invalid_token') {
      showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'info');
    }
  }, [reasonParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'register') {
      setPhoneTouched(true);
      setConfirmPasswordTouched(true);
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.isValid) {
        showToast(phoneCheck.message, 'error');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.', 'error');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        showToast('Mật khẩu cần tối thiểu 6 ký tự.', 'error');
        setLoading(false);
        return;
      }
    } else {
      if (!identifier.trim()) {
        showToast('Vui lòng nhập số điện thoại hoặc email.', 'error');
        setLoading(false);
        return;
      }
    }

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login'
      ? { identifier: identifier.trim(), password }
      : { 
          name: name.trim(), 
          phone: validatePhone(phone).normalized || phone.trim(), 
          email: email.trim() || undefined, 
          password 
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Thao tác thất bại. Vui lòng kiểm tra lại.', 'error');
      } else {
        showToast(data.message || (mode === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký tài khoản thành công!'), 'success');

        // Redirect based on redirectParam or role
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth-change'));
            if (redirectParam) {
              window.location.href = redirectParam;
            } else if (data.user?.role === 'ADMIN') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/';
            }
          }
        }, 400);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối máy chủ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'user') => {
    setMode('login');
    if (type === 'admin') {
      setIdentifier('0901234567');
      setPassword('admin123');
      showToast('Đã điền tài khoản ADMIN (SĐT: 0901234567).', 'info');
    } else {
      setIdentifier('0987654321');
      setPassword('user123');
      showToast('Đã điền tài khoản Khách hàng (SĐT: 0987654321).', 'info');
    }
  };

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 transition-all duration-200 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0f172a] text-white text-xs rounded-md shadow-lg border border-slate-700 max-w-sm">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-400'
                  : toast.type === 'info'
                  ? 'bg-sky-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="flex-1 font-medium leading-tight">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs ml-1"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Checkout Context Banner */}
      {reasonParam === 'checkout' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-slate-800 text-xs flex items-start gap-3">
          <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-900 block text-[13px] mb-0.5">Tiếp tục thanh toán giỏ hàng</span>
            <span className="text-slate-600 leading-relaxed">
              Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng và tự động áp dụng chiết khấu hội viên.
            </span>
          </div>
        </div>
      )}

      {/* Mode Switch Tabs (Segmented control) */}
      <div className="flex p-1 bg-slate-100 rounded-md mb-6 border border-slate-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => { setMode('login'); setPhoneTouched(false); setConfirmPasswordTouched(false); }}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setPhoneTouched(false); setConfirmPasswordTouched(false); }}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Đăng ký tài khoản
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'login' ? (
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="text-[13px] font-medium text-slate-800 block">
              Số điện thoại hoặc Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0912345678 hoặc name@example.com"
                required
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="fullname" className="text-[13px] font-medium text-slate-800 block">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="fullname"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-[13px] font-medium text-slate-800 block">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="0912 345 678"
                  maxLength={13}
                  required
                  className={`h-11 w-full rounded-md border bg-white px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    phoneTouched
                      ? phoneStatus.isValid
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        : 'border-rose-400 bg-rose-50/15 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {phoneTouched && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {phoneStatus.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
              {phoneTouched && !phoneStatus.isValid ? (
                <p className="text-[11.5px] text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {phoneStatus.message}
                </p>
              ) : phoneTouched && phoneStatus.isValid ? (
                <p className="text-[11.5px] text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Số điện thoại hợp lệ ({phoneStatus.normalized})
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Gồm 10 chữ số (đầu số 03, 05, 07, 08, 09).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="text-[13px] font-medium text-slate-800 block">
                  Địa chỉ Email
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Không bắt buộc</span>
              </div>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com (tùy chọn)"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-slate-800 block">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="confirmPassword" className="text-[13px] font-medium text-slate-800 block">
                Xác nhận mật khẩu <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setConfirmPasswordTouched(true)}
                placeholder="••••••••"
                required
                className={`h-11 w-full rounded-md border bg-white pl-3.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  isConfirmMatch
                    ? 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    : isConfirmMismatch
                    ? 'border-rose-400 bg-rose-50/15 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              <div className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none">
                {isConfirmMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isConfirmMismatch ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isConfirmMatch ? (
              <p className="text-[11.5px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu xác nhận trùng khớp
              </p>
            ) : isConfirmMismatch ? (
              <p className="text-[11.5px] text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {!confirmPassword ? 'Vui lòng xác nhận lại mật khẩu.' : 'Mật khẩu xác nhận không khớp.'}
              </p>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-md bg-[#0f172a] text-white text-sm font-medium hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          {loading ? (
            <span>Đang xác thực...</span>
          ) : (
            <span>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</span>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick Fill */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Tài khoản thử nghiệm nhanh
          </span>
          <span className="text-[11px] text-slate-400">1-click để điền</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => fillCredentials('user')}
            className="p-3 text-left rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Khách hàng
            </div>
            <div className="text-slate-600 truncate text-[11px]">SĐT: 0987654321</div>
            <div className="text-slate-400 text-[10px] mt-0.5">Pass: user123 (hoặc email)</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials('admin')}
            className="p-3 text-left rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
              Quản trị (Admin)
            </div>
            <div className="text-slate-600 truncate text-[11px]">SĐT: 0901234567</div>
            <div className="text-slate-400 text-[10px] mt-0.5">Pass: admin123 (hoặc email)</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 grid grid-cols-1 lg:grid-cols-12 items-start selection:bg-slate-900 selection:text-white">
      
      {/* ================= LEFT COLUMN: FULL SCREEN EDITORIAL LOOKBOOK ================= */}
      <div className="lg:col-span-5 xl:col-span-5 bg-slate-950 text-white min-h-[460px] lg:h-screen lg:sticky lg:top-0 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden shrink-0">
        
        {/* Full-bleed Lookbook Visual Anchor */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity contrast-110"
          style={{ backgroundImage: `url('/images/hero-atelier.jpg')` }}
        />
        {/* Editorial Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent" />

        {/* Top brand identity */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block font-wide text-2xl tracking-widest uppercase text-white hover:opacity-80 transition-opacity"
          >
            ATELIER
          </Link>
        </div>

        {/* Center: Membership perks */}
        <div className="relative z-10 space-y-6 my-8 lg:my-0 max-w-md">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              Đặc quyền mua sắm & chiết khấu riêng biệt
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Đăng nhập để tự động áp dụng chiết khấu cấp bậc, lưu lịch sử đơn hàng và trải nghiệm thanh toán VietQR tức thì.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Hội viên Bạc (Từ 2 sản phẩm):</strong>
                <span className="text-slate-300">Tự động giảm 5% toàn bộ giỏ hàng khi thanh toán.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Hội viên Vàng (Từ 4 sản phẩm):</strong>
                <span className="text-slate-300">Giảm 10% toàn bộ đơn hàng và ưu tiên đóng gói giao nhanh.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Thanh toán VietQR tiện lợi:</strong>
                <span className="text-slate-300">Mã QR động tự động nhận diện và cập nhật trạng thái đơn hàng.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= RIGHT COLUMN: FULL SCREEN AUTH CANVAS ================= */}
      <div className="lg:col-span-7 xl:col-span-7 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-20 bg-white">
        
        {/* Top Header Inside Right Column */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <Link
            href="/"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại cửa hàng</span>
          </Link>
        </div>

        {/* Centered Form Area */}
        <div className="w-full max-w-md mx-auto my-auto py-10 sm:py-14">
          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Chào mừng bạn đến với Atelier
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-light">
              Đăng nhập để quản lý đơn hàng hoặc tiếp tục thanh toán giỏ hàng.
            </p>
          </div>

          <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Đang tải biểu mẫu...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer inside right column */}
        <div className="pt-6 border-t border-slate-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 CAISHOP. Bảo mật thông tin tuyệt đối.</span>
          <div className="flex items-center gap-4 text-slate-500 text-xs">
            <Link href="/" className="hover:text-slate-900">Trang chủ</Link>
            <Link href="/products" className="hover:text-slate-900">Sản phẩm</Link>
          </div>
        </div>

      </div>

    </div>
  );
}
