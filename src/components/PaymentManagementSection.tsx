'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Check,
  Copy,
  Save,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Banknote,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  PaymentSettings,
  defaultPaymentSettings,
  EnvLockedPaymentFields
} from '@/lib/paymentSettings';
import { VndInput } from '@/components/VndInput';

export default function PaymentManagementSection() {
  const [settings, setSettings] = useState<PaymentSettings & { env_locked?: EnvLockedPaymentFields }>(defaultPaymentSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');

  // Password masking toggle states
  const [showClientId, setShowClientId] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksumKey, setShowChecksumKey] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err: any) {
      console.error('Lỗi tải cấu hình thanh toán:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validation
      if (settings.is_payos_enabled) {
        if (!settings.payos_client_id.trim()) {
          setMessage({ type: 'error', text: 'Vui lòng nhập Client ID của PayOS.' });
          return;
        }
        if (!settings.payos_api_key.trim()) {
          setMessage({ type: 'error', text: 'Vui lòng nhập API Key của PayOS.' });
          return;
        }
        if (!settings.payos_checksum_key.trim()) {
          setMessage({ type: 'error', text: 'Vui lòng nhập Checksum Key của PayOS.' });
          return;
        }
      }

      const res = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
        setMessage({ type: 'success', text: '✓ Đã lưu và áp dụng cấu hình thanh toán toàn hệ thống thành công!' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi lưu cấu hình.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi mạng khi lưu cấu hình.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (confirm('Bạn có chắc muốn khôi phục về cấu hình thanh toán mặc định?')) {
      setSettings(defaultPaymentSettings);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-500" />
        <span className="text-xs text-slate-500 font-mono">Đang tải cấu hình thanh toán...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Cấu hình Cổng thanh toán & VietQR</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tích hợp cổng thanh toán tự động PayOS (Napas 24/7), tự sinh mã QR động điền sẵn số tiền và tự động cập nhật đơn hàng thành công qua Webhook.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Security Status Banner when ENV is used */}
      {Boolean(settings.env_locked && Object.values(settings.env_locked).some(Boolean)) && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-xl flex items-start gap-3 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold uppercase tracking-wide flex items-center gap-2">
              <span>Bảo mật hệ thống: Cấu hình thanh toán đã khóa bảo vệ bởi biến môi trường (.env)</span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                ENV PROTECTED
              </span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Các thông số thanh toán nhạy cảm (Khóa API PayOS, thông tin tài khoản nhận tiền) được nạp trực tiếp từ file <code>.env.local</code> trên máy chủ. Hacker hoặc tài khoản quản trị viên không thể can thiệp, đánh tráo hoặc đổi số tài khoản qua giao diện hay cơ sở dữ liệu.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Settings on Left, Live Simulator Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Tích hợp PayOS Open Banking (Tự động hóa 100%) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  P
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Cổng thanh toán tự động PayOS</h3>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Napas Open Banking
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Tự sinh mã QR và tự động nhận diện tiền về qua Webhook sau 2 giây</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.env_locked?.is_payos_enabled && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                    🔒 Khóa bởi ENV
                  </span>
                )}
                <button
                  type="button"
                  disabled={settings.env_locked?.is_payos_enabled}
                  onClick={() => setSettings(prev => ({ ...prev, is_payos_enabled: !prev.is_payos_enabled }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ml-1 ${
                    settings.env_locked?.is_payos_enabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  } ${
                    settings.is_payos_enabled ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Bật tắt PayOS"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      settings.is_payos_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {settings.is_payos_enabled ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Client ID: <span className="text-rose-500">*</span></span>
                      {settings.env_locked?.payos_client_id && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                          🔒 Khóa an toàn bởi ENV
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showClientId ? "text" : "password"}
                        value={settings.payos_client_id}
                        disabled={settings.env_locked?.payos_client_id}
                        onChange={(e) => setSettings({ ...settings, payos_client_id: e.target.value.trim() })}
                        placeholder="VD: 9a8b7c6d-1234-5678-abcd-ef0123456789"
                        className={`w-full pl-3 pr-9 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 tracking-wider ${
                          settings.env_locked?.payos_client_id ? 'bg-slate-100 cursor-not-allowed text-slate-500 select-none' : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowClientId(!showClientId)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showClientId ? "Ẩn Client ID" : "Hiện Client ID"}
                      >
                        {showClientId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>API Key: <span className="text-rose-500">*</span></span>
                      {settings.env_locked?.payos_api_key && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                          🔒 Khóa an toàn bởi ENV
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.payos_api_key}
                        disabled={settings.env_locked?.payos_api_key}
                        onChange={(e) => setSettings({ ...settings, payos_api_key: e.target.value.trim() })}
                        placeholder="VD: 12345678-abcd-ef01-2345-6789abcdef01"
                        className={`w-full pl-3 pr-9 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 tracking-wider ${
                          settings.env_locked?.payos_api_key ? 'bg-slate-100 cursor-not-allowed text-slate-500 select-none' : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showApiKey ? "Ẩn API Key" : "Hiện API Key"}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Checksum Key: <span className="text-rose-500">*</span></span>
                      {settings.env_locked?.payos_checksum_key && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                          🔒 Khóa an toàn bởi ENV
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showChecksumKey ? "text" : "password"}
                        value={settings.payos_checksum_key}
                        disabled={settings.env_locked?.payos_checksum_key}
                        onChange={(e) => setSettings({ ...settings, payos_checksum_key: e.target.value.trim() })}
                        placeholder="Chuỗi 64 ký tự hash bảo mật dùng để xác thực webhook"
                        className={`w-full pl-3 pr-9 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 tracking-wider ${
                          settings.env_locked?.payos_checksum_key ? 'bg-slate-100 cursor-not-allowed text-slate-500 select-none' : 'bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowChecksumKey(!showChecksumKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showChecksumKey ? "Ẩn Checksum Key" : "Hiện Checksum Key"}
                      >
                        {showChecksumKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Webhook URL copy box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      <span>Webhook URL của Cái Shop:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${origin || 'http://localhost:3000'}/api/payos/webhook`, 'webhook')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedField === 'webhook' ? 'Đã sao chép' : 'Sao chép URL'}</span>
                    </button>
                  </div>
                  <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-mono text-slate-700 truncate select-all">
                    {origin ? `${origin}/api/payos/webhook` : 'https://degent.vn/api/payos/webhook'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Dán URL này vào mục <strong>Webhook URL</strong> trên <a href="https://dashboard.payos.vn" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">dashboard.payos.vn</a> để PayOS tự động báo tiền về ngay khi khách quét mã chuyển khoản.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs text-slate-500 leading-relaxed">
                Đang dùng chế độ <strong>VietQR trực tiếp</strong> (Khách quét mã xong bấm &quot;Tôi đã chuyển khoản&quot;). Bật công tắc phía trên nếu bạn muốn kích hoạt <strong>PayOS</strong> để tự động nhận diện tiền về sau 2 giây.
              </div>
            )}
          </div>

          {/* Section 2: Phương thức thanh toán & Quy tắc */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Bật / Tắt Phương thức thanh toán</h3>
            </div>

            {/* VietQR Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Chuyển khoản VietQR tự động</div>
                  <div className="text-[11px] text-slate-500">
                    Khách quét mã QR tạo động theo đơn hàng, tự động điền sẵn số tiền và nội dung.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, is_vietqr_enabled: !prev.is_vietqr_enabled }))}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ml-3 ${
                  settings.is_vietqr_enabled ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Bật tắt VietQR"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    settings.is_vietqr_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* COD Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</div>
                  <div className="text-[11px] text-slate-500">
                    Thu tiền mặt tận nơi khi shipper giao hàng cho khách.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, is_cod_enabled: !prev.is_cod_enabled }))}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ml-3 ${
                  settings.is_cod_enabled ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Bật tắt COD"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    settings.is_cod_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* COD Sub-settings */}
            {settings.is_cod_enabled && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Ghi chú chính sách COD hiển thị ở giỏ hàng & thanh toán:
                  </label>
                  <input
                    type="text"
                    value={settings.cod_note}
                    onChange={(e) => setSettings({ ...settings, cod_note: e.target.value })}
                    placeholder="Chỉ áp dụng nội thành TP.HCM • Bao kiểm tra chất vải khi nhận hàng"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Hạn mức tối đa cho đơn COD (VNĐ, để 0 nếu không giới hạn):
                  </label>
                  <VndInput
                    value={settings.cod_max_amount}
                    onChange={(val) => setSettings({ ...settings, cod_max_amount: val })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-md focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500"
                    inputClassName="font-mono font-medium text-slate-900"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-amber-700/80 mt-1 block">
                    Đơn hàng vượt quá mức này sẽ được yêu cầu thanh toán chuyển khoản để đảm bảo an toàn đơn hàng.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Form: PayOS Status & Workflow Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs sticky top-4 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Trạng thái kết nối PayOS</h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  settings.is_payos_enabled && settings.payos_client_id && settings.payos_api_key && settings.payos_checksum_key
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {settings.is_payos_enabled && settings.payos_client_id && settings.payos_api_key && settings.payos_checksum_key
                  ? 'SẴN SÀNG HOẠT ĐỘNG'
                  : settings.is_payos_enabled
                  ? 'CHƯA ĐIỀN ĐỦ KEY'
                  : 'CHƯA BẬT PAYOS'}
              </span>
            </div>

            {/* Connection Checklist */}
            <div className="space-y-2.5 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kiểm tra kết nối hệ thống:</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Cổng PayOS:</span>
                <span className={`font-semibold ${settings.is_payos_enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {settings.is_payos_enabled ? 'Đã kích hoạt' : 'Chưa bật'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Client ID:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {settings.env_locked?.payos_client_id
                    ? '🔒 Khóa qua ENV'
                    : settings.payos_client_id
                    ? '••••••••••••••••'
                    : 'Chưa điền'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">API Key:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {settings.env_locked?.payos_api_key
                    ? '🔒 Khóa qua ENV'
                    : settings.payos_api_key
                    ? '••••••••••••••••'
                    : 'Chưa điền'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Checksum Key:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {settings.env_locked?.payos_checksum_key
                    ? '🔒 Khóa qua ENV'
                    : settings.payos_checksum_key
                    ? '••••••••••••••••'
                    : 'Chưa điền'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Webhook Listener:</span>
                <span className="font-mono font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  /api/payos/webhook (Online)
                </span>
              </div>
            </div>

            {/* Step by step guide */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Quy trình tự động thanh toán:
              </h4>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Khách đặt hàng tại Checkout</div>
                    <div className="text-[11px] text-slate-500">Hệ thống gọi PayOS tự động sinh mã VietQR động theo đơn.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Quét mã QR trên App Ngân hàng</div>
                    <div className="text-[11px] text-slate-500">Số tiền và mã đơn đã điền sẵn 100%, khách chỉ cần xác thực OTP.</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Tự động nhận diện trong 2s</div>
                    <div className="text-[11px] text-slate-500">PayOS bắn Webhook về Cái Shop → Đơn tự chuyển sang Đã thanh toán & xuất kho.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Advice Badge */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-lg flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Tài khoản nhận tiền được kết nối trực tiếp trên <a href="https://dashboard.payos.vn" target="_blank" rel="noreferrer" className="underline font-semibold">dashboard.payos.vn</a>. Tiền khách chuyển sẽ vào thẳng tài khoản ngân hàng của bạn mà không bị giam vốn.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
