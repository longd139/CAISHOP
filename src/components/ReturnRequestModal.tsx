'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Check,
  Loader2,
  AlertCircle,
  Truck,
  Building2,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { parseOrderAddressDetails } from '@/components/ExecutiveDashboard';

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess?: (updatedOrder?: any) => void;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const getPrimaryImageUrl = (url?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60';
  if (url.startsWith('[')) {
    try {
      const arr = JSON.parse(url);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : url;
    } catch {
      return url;
    }
  }
  return url;
};

export default function ReturnRequestModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReturnRequestModalProps) {
  if (!isOpen || !order) return null;

  const parsedAddress = parseOrderAddressDetails(order.shipping_address);
  const items: any[] = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          id: 'item-1',
          product_name: order.product_name || `Sản phẩm đơn #${order.order_code}`,
          product_images: order.product_images || order.image_url,
          color: order.color || 'Tiêu chuẩn',
          size: order.size || 'F',
          quantity: 1,
          unit_price: order.total_amount || 0,
          total_price: order.total_amount || 0,
        },
      ];

  // States
  const [refundMethod, setRefundMethod] = useState<'EXCHANGE' | 'REFUND'>('EXCHANGE');
  const [customerName, setCustomerName] = useState(order.customer_name || '');
  const [contactPhone, setContactPhone] = useState(order.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(order.customer_email || '');
  
  // Address selection (matching screenshot 2)
  const [addressChoice, setAddressChoice] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [newAddressText, setNewAddressText] = useState('');

  // Bank Info for Refund
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState(order.customer_name ? order.customer_name.toUpperCase() : '');

  // Reasons & Notes
  const [returnReason, setReturnReason] = useState('TIGHT');
  const [notes, setNotes] = useState('');

  // Item selection (default all checked)
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it, idx) => {
      init[it.id || String(idx)] = true;
    });
    return init;
  });

  const [confirmStep, setConfirmStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto fill details if order changes
  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name || '');
      setContactPhone(order.customer_phone || '');
      setCustomerEmail(order.customer_email || '');
      setAccountHolder(order.customer_name ? order.customer_name.toUpperCase() : '');
      const init: Record<string, boolean> = {};
      items.forEach((it, idx) => {
        init[it.id || String(idx)] = true;
      });
      setSelectedItemIds(init);
    }
  }, [order]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // ensure at least one is selected
      const anySelected = Object.values(next).some(Boolean);
      if (!anySelected) return prev;
      return next;
    });
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contactPhone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại (có Zalo) để DE\'GENT liên hệ.');
      return;
    }

    if (addressChoice === 'NEW' && !newAddressText.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ lấy hàng hoàn / đổi mới.');
      return;
    }

    if (refundMethod === 'REFUND') {
      if (!bankName.trim() || !bankAccount.trim() || !accountHolder.trim()) {
        setErrorMessage('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn.');
        return;
      }
    }

    setConfirmStep(true);
  };

  const handleSubmitReturn = async () => {
    if (!order.id) return;
    setIsSubmitting(true);
    setErrorMessage('');

    const phone = contactPhone.trim();
    const finalAddress = addressChoice === 'NEW' ? newAddressText.trim() : (parsedAddress.cleanAddress || order.shipping_address);
    const selectedItemNames = items
      .filter((it, idx) => selectedItemIds[it.id || String(idx)])
      .map((it) => `${it.product_name || 'Sản phẩm'} (${it.color || ''}/${it.size || ''} x${it.quantity || 1})`)
      .join(', ');

    const combinedNotes = [
      notes ? `Ghi chú: ${notes}` : '',
      addressChoice === 'NEW' ? `[Địa chỉ lấy hàng mới: ${finalAddress}]` : '',
      `[Sản phẩm hoàn: ${selectedItemNames}]`
    ].filter(Boolean).join(' • ');

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          action: 'REQUEST_RETURN',
          return_reason: returnReason,
          refund_method: refundMethod,
          bank_account: refundMethod === 'REFUND' ? bankAccount : undefined,
          bank_name: refundMethod === 'REFUND' ? bankName : undefined,
          account_holder: refundMethod === 'REFUND' ? accountHolder : undefined,
          notes: combinedNotes,
          contact_phone: phone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          data.message ||
            `Chúng tôi sẽ liên hệ ${refundMethod === 'EXCHANGE' ? 'đổi hàng' : 'hoàn hàng'} qua số điện thoại ${phone} này nhé. Bạn nhớ để ý điện thoại nhé!`
        );
        setTimeout(() => {
          onSuccess?.({
            ...order,
            fulfillment_status: 'RETURNED',
          });
          onClose();
        }, 3000);
      } else {
        setErrorMessage(data.message || 'Không thể gửi yêu cầu hoàn hàng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col text-slate-900">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Yêu Cầu Đổi / Hoàn Hàng
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Đơn hàng #{order.order_code} • Khách hàng {order.customer_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Layout matching Screenshot 2 */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh]">
          {successMessage ? (
            <div className="p-8 bg-white border border-emerald-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto shadow-sm animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Gửi Yêu Cầu Thành Công!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {successMessage}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium">
                Shipper DE&apos;GENT sẽ liên hệ đến lấy hàng tận nơi trong 24h - 48h tới.
              </div>
            </div>
          ) : confirmStep ? (
            /* Confirmation Step */
            <div className="max-w-xl mx-auto bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận gửi yêu cầu {refundMethod === 'EXCHANGE' ? 'đổi hàng' : 'hoàn hàng'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed px-2">
                  &ldquo;Chúng tôi sẽ liên hệ {refundMethod === 'EXCHANGE' ? 'đổi hàng' : 'hoàn hàng'} qua số điện thoại <span className="font-bold text-slate-950 underline decoration-amber-500 decoration-2">{contactPhone}</span> này nhé, bạn nhớ để ý điện thoại nhé!&rdquo;
                </p>
              </div>

              {/* Summary recap */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức:</span>
                  <span className="font-bold text-slate-900">{refundMethod === 'EXCHANGE' ? 'Đổi hàng (Miễn phí)' : 'Hoàn hàng (Hoàn tiền)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa chỉ thu hồi:</span>
                  <span className="font-medium text-slate-900 max-w-[280px] truncate text-right">
                    {addressChoice === 'NEW' ? newAddressText : parsedAddress.cleanAddress}
                  </span>
                </div>
                {refundMethod === 'REFUND' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tài khoản hoàn:</span>
                    <span className="font-bold text-slate-900">{bankName} - {bankAccount} ({accountHolder})</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStep(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Chỉnh sửa lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <span>Xác nhận gửi ngay</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Main Form: 2 Columns */
            <form onSubmit={handlePreSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ================= LEFT COLUMN: THÔNG TIN NHẬN HÀNG / THU HỒI ================= */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
                  
                  {/* Step Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Thông Tin Đổi / Trả Hàng
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Mặc định theo đơn hàng</span>
                    </span>
                  </div>

                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <span>Họ và tên người nhận / liên hệ</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Số điện thoại & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Số điện thoại (có Zalo)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0987654321"
                        className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Email (nhận biên lai / thông báo)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="khachhang@degent.vn"
                        className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ nhận hàng / thu hồi hàng (Khớp thiết kế Screenshot 2) */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Địa chỉ thu hồi / giao hàng mới</span>
                      <span className="text-rose-500">*</span>
                    </label>

                    {/* Card 1: Địa chỉ mặc định đơn trước (Màu đen viền trắng chuẩn Screenshot 2) */}
                    <div
                      onClick={() => setAddressChoice('EXISTING')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        addressChoice === 'EXISTING'
                          ? 'bg-black text-white border-black shadow-xs ring-1 ring-black'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="return_address_choice"
                          checked={addressChoice === 'EXISTING'}
                          onChange={() => setAddressChoice('EXISTING')}
                          className="mt-0.5 w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer accent-white"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold">
                              {customerName || order.customer_name} | {contactPhone || order.customer_phone}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                addressChoice === 'EXISTING'
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Mặc định (Đơn trước)
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${addressChoice === 'EXISTING' ? 'text-white/80' : 'text-slate-600'}`}>
                            {parsedAddress.cleanAddress || order.shipping_address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Thêm địa chỉ mới */}
                    <div
                      onClick={() => setAddressChoice('NEW')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        addressChoice === 'NEW'
                          ? 'border-slate-900 bg-slate-50 shadow-2xs ring-1 ring-slate-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="return_address_choice"
                          checked={addressChoice === 'NEW'}
                          onChange={() => setAddressChoice('NEW')}
                          className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          Thêm địa chỉ thu hồi mới
                        </span>
                      </div>

                      {addressChoice === 'NEW' && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            required
                            placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                            value={newAddressText}
                            onChange={(e) => setNewAddressText(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hình thức: Đổi hàng hay Hoàn hàng */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Hình thức xử lý yêu cầu <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRefundMethod('EXCHANGE')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          refundMethod === 'EXCHANGE'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide">Đổi hàng</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            refundMethod === 'EXCHANGE' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            Miễn phí
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 ${refundMethod === 'EXCHANGE' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Đổi sang size vừa vặn hơn hoặc mẫu mã khác
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundMethod('REFUND')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          refundMethod === 'REFUND'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide">Hoàn hàng</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            refundMethod === 'REFUND' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            Trả hàng
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 ${refundMethod === 'REFUND' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Thu hồi sản phẩm & nhận lại tiền qua tài khoản ngân hàng
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Thông tin tài khoản hoàn tiền (nếu chọn REFUND) */}
                  {refundMethod === 'REFUND' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <CreditCard className="w-4 h-4 text-slate-700" />
                        <span>Thông tin tài khoản nhận tiền hoàn:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-medium">Tên ngân hàng *</label>
                          <input
                            type="text"
                            required={refundMethod === 'REFUND'}
                            placeholder="Ví dụ: Vietcombank, Techcombank, MB..."
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-500 font-medium">Số tài khoản *</label>
                          <input
                            type="text"
                            required={refundMethod === 'REFUND'}
                            placeholder="Số tài khoản ngân hàng"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-medium">Tên chủ tài khoản (viết hoa không dấu) *</label>
                        <input
                          type="text"
                          required={refundMethod === 'REFUND'}
                          placeholder="NGUYEN VAN A"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                          className="w-full h-8.5 px-3 bg-white border border-slate-200 rounded-lg text-xs uppercase font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Lý do hoàn trả */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Lý do đổi / hoàn trả <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'TIGHT', label: 'Mặc bị chật / Kích size' },
                        { id: 'LOOSE', label: 'Mặc bị rộng / Dài' },
                        { id: 'DEFECT', label: 'Sản phẩm lỗi may / lỗi vải' },
                        { id: 'WRONG_ITEM', label: 'Giao sai mẫu / sai size' },
                        { id: 'OTHER', label: 'Lý do khác (không hợp...)' },
                      ].map((r) => (
                        <label
                          key={r.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            returnReason === r.id
                              ? 'border-slate-900 bg-slate-50 font-bold text-slate-900'
                              : 'border-slate-200 hover:bg-slate-50/50 text-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="return_reason"
                            value={r.id}
                            checked={returnReason === r.id}
                            onChange={() => setReturnReason(r.id)}
                            className="accent-slate-900"
                          />
                          <span>{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ghi chú đơn hàng (tuỳ chọn) - giống hệt Screenshot 2 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Ghi chú chi tiết (tuỳ chọn)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ví dụ: Áo mặc bị kích vai, tôi muốn đổi sang size XL cùng màu..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all leading-relaxed"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* ================= RIGHT COLUMN: TÓM TẮT ĐƠN HÀNG & DANH SÁCH SẢN PHẨM ================= */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs h-fit">
                  
                  {/* Summary Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Tóm Tắt Đơn Hàng
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {items.length} sản phẩm
                    </span>
                  </div>

                  {/* Danh sách sản phẩm để khách biết đang muốn hoàn cái gì (Matching Screenshot 2) */}
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {items.map((it, idx) => {
                      const itId = it.id || String(idx);
                      const isChecked = Boolean(selectedItemIds[itId]);
                      const img = getPrimaryImageUrl(it.product_images || it.image_url);

                      return (
                        <div
                          key={itId}
                          onClick={() => toggleItemSelection(itId)}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                            isChecked
                              ? 'border-slate-900/40 bg-slate-50/60 shadow-2xs'
                              : 'border-slate-100 bg-white opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItemSelection(itId)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
                          />

                          <img
                            src={img}
                            alt={it.product_name}
                            className="w-12 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                          />

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {it.product_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {it.color || 'Màu tiêu chuẩn'} / Size {it.size || 'M'} × {it.quantity || 1}
                            </p>
                            <p className="text-xs font-mono font-bold text-slate-900">
                              {formatMoney(it.total_price || (it.unit_price * (it.quantity || 1)))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tạm tính:</span>
                      <span className="font-mono font-medium text-slate-900">
                        {formatMoney(order.subtotal || order.total_amount)}
                      </span>
                    </div>

                    {Boolean(order.discount_amount && order.discount_amount > 0) && (
                      <div className="flex items-center justify-between text-emerald-600 font-medium">
                        <span>Chiết khấu / Ưu đãi:</span>
                        <span className="font-mono">
                          -{formatMoney(order.discount_amount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Hình thức yêu cầu:</span>
                      <span className="font-semibold text-slate-900">
                        {refundMethod === 'EXCHANGE' ? 'Đổi hàng tận nơi' : 'Thu hồi hoàn tiền'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Phí thu hồi & đổi:</span>
                      <span className="font-semibold text-emerald-600">
                        Miễn phí (Chính sách DE&apos;GENT)
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {refundMethod === 'REFUND' ? 'Tổng tiền hoàn dự kiến:' : 'Tổng giá trị đơn:'}
                      </span>
                      <span className="text-base sm:text-lg font-mono font-bold text-slate-950">
                        {formatMoney(order.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Cam kết đổi trả */}
                  <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cam kết dịch vụ DE&apos;GENT</span>
                    </div>
                    <p>
                      Đổi trả miễn phí trong 7 ngày đối với sản phẩm còn nguyên tem mác. Nhân viên giao hàng sẽ đến tận địa chỉ của bạn để nhận hàng.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{refundMethod === 'EXCHANGE' ? 'Xác Nhận Gửi Yêu Cầu Đổi Hàng' : 'Xác Nhận Gửi Yêu Cầu Hoàn Hàng'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>

              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
