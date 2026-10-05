'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  Truck,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { CustomDeal, AVAILABLE_DEALS } from '@/lib/useCart';

export interface AdminDeal extends CustomDeal {
  is_active?: boolean;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function DealManagementSection() {
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'FREESHIP' | 'DISCOUNT'>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealIndex, setEditingDealIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<AdminDeal>({
    code: '',
    title: '',
    discount: '',
    discount_amount: 50000,
    is_freeship: false,
    min_order: 350000,
    condition: '',
    expiry: '31/12/2026',
    is_active: true
  });

  // Modal discount mode: 'CASH' or 'FREESHIP'
  const [discountTypeMode, setDiscountTypeMode] = useState<'CASH' | 'FREESHIP'>('CASH');

  // Preview simulation cart total
  const [previewSubtotal, setPreviewSubtotal] = useState<number>(249000);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deals');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDeals(json.data);
      } else {
        setDeals(AVAILABLE_DEALS.map(d => ({ ...d, is_active: true })));
      }
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setDeals(AVAILABLE_DEALS.map(d => ({ ...d, is_active: true })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingDealIndex(null);
    setDiscountTypeMode('CASH');
    setFormData({
      code: '',
      title: '',
      discount: 'Giảm 50.000đ',
      discount_amount: 50000,
      is_freeship: false,
      min_order: 350000,
      condition: 'Áp dụng cho đơn hàng từ 350.000đ trở lên',
      expiry: '31/12/2026',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (deal: AdminDeal, index: number) => {
    setEditingDealIndex(index);
    setDiscountTypeMode(deal.is_freeship ? 'FREESHIP' : 'CASH');
    setFormData({ ...deal });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    const cleanCode = formData.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      alert('Vui lòng nhập Mã Voucher (Code)');
      return;
    }
    if (!formData.title.trim()) {
      alert('Vui lòng nhập Tiêu đề chương trình');
      return;
    }

    const minOrderVal = Math.max(0, Number(formData.min_order) || 0);
    const isFreeshipVal = discountTypeMode === 'FREESHIP';
    const discountAmountVal = isFreeshipVal ? undefined : Math.max(0, Number(formData.discount_amount) || 0);

    let discountLabel = formData.discount.trim();
    if (!discountLabel) {
      discountLabel = isFreeshipVal
        ? 'Freeship toàn quốc'
        : `Giảm ${new Intl.NumberFormat('vi-VN').format(discountAmountVal || 0)}đ`;
    }

    let conditionLabel = formData.condition.trim();
    if (!conditionLabel) {
      conditionLabel = minOrderVal > 0
        ? `Áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN').format(minOrderVal)}đ trở lên`
        : 'Áp dụng cho mọi giá trị đơn hàng';
    }

    const newDeal: AdminDeal = {
      code: cleanCode,
      title: formData.title.trim(),
      discount: discountLabel,
      discount_amount: discountAmountVal,
      is_freeship: isFreeshipVal,
      min_order: minOrderVal,
      condition: conditionLabel,
      expiry: formData.expiry.trim() || '31/12/2026',
      is_active: formData.is_active !== false
    };

    let updatedDeals: AdminDeal[] = [];
    if (editingDealIndex !== null) {
      updatedDeals = [...deals];
      updatedDeals[editingDealIndex] = newDeal;
    } else {
      // Check duplicate code
      if (deals.some(d => d.code === cleanCode)) {
        alert(`Mã voucher "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.`);
        return;
      }
      updatedDeals = [newDeal, ...deals];
    }

    setDeals(updatedDeals);
    setIsModalOpen(false);
    saveToServer(updatedDeals, editingDealIndex !== null ? 'Cập nhật voucher thành công' : 'Thêm voucher mới thành công');
  };

  const handleDeleteDeal = (index: number) => {
    const target = deals[index];
    if (window.confirm(`Bạn có chắc muốn xóa mã voucher "${target.code}"?`)) {
      const updated = deals.filter((_, i) => i !== index);
      setDeals(updated);
      saveToServer(updated, `Đã xóa mã voucher ${target.code}`);
    }
  };

  const handleToggleActive = (index: number) => {
    const updated = [...deals];
    updated[index] = {
      ...updated[index],
      is_active: !updated[index].is_active
    };
    setDeals(updated);
    saveToServer(updated, `Đã ${updated[index].is_active ? 'kích hoạt' : 'tắt'} voucher ${updated[index].code}`);
  };

  const saveToServer = async (dealList: AdminDeal[], successMsg: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealList)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ ${successMsg}`);
      } else {
        alert(data.error || 'Lỗi khi lưu dữ liệu lên server');
      }
    } catch (err: any) {
      console.error('Error saving deals:', err);
      alert('Không thể kết nối đến máy chủ để lưu cấu hình deal');
    } finally {
      setSaving(false);
    }
  };

  // Filtered List
  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.condition.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'ACTIVE') return deal.is_active !== false;
    if (filterType === 'INACTIVE') return deal.is_active === false;
    if (filterType === 'FREESHIP') return deal.is_freeship;
    if (filterType === 'DISCOUNT') return !deal.is_freeship;

    return true;
  });

  const totalDeals = deals.length;
  const activeCount = deals.filter(d => d.is_active !== false).length;
  const freeshipCount = deals.filter(d => d.is_freeship).length;
  const cashDiscountCount = deals.filter(d => !d.is_freeship).length;

  return (
    <div className="space-y-6">

      {/* ================= 1. SECTION HEADER ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Ticket className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Quản lý Ưu đãi & Voucher (Deals)</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {activeCount} đang bật / {totalDeals} tổng
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình các mã khuyến mãi, giảm giá và miễn phí vận chuyển hiển thị trên Giỏ hàng, Hồ sơ và Trang thanh toán.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchDeals}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Đồng bộ dữ liệu từ D1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-medium text-white hover:bg-black transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Voucher Mới</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
            <span className="text-[11px] font-mono uppercase text-slate-500 block">Tổng số Deal</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{totalDeals}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-[11px] font-mono uppercase text-emerald-700 block">Đang hoạt động</span>
            <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200/60">
            <span className="text-[11px] font-mono uppercase text-blue-700 block">Voucher Freeship</span>
            <span className="text-xl font-bold font-mono text-blue-800 mt-0.5 block">{freeshipCount}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
            <span className="text-[11px] font-mono uppercase text-rose-700 block">Voucher Giảm tiền</span>
            <span className="text-xl font-bold font-mono text-rose-800 mt-0.5 block">{cashDiscountCount}</span>
          </div>
        </div>
      </div>


      {/* ================= 3. SEARCH & FILTERS BAR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã voucher hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ACTIVE', label: 'Đang bật' },
            { id: 'INACTIVE', label: 'Tạm tắt' },
            { id: 'FREESHIP', label: 'Freeship' },
            { id: 'DISCOUNT', label: 'Giảm tiền' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 4. DEALS LIST GRID ================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-white border border-slate-200 rounded-xl p-5 space-y-3" />
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Không tìm thấy voucher nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không có mã voucher nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setFilterType('ALL'); }}
            className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal, idx) => {
            const originalIndex = deals.findIndex(d => d.code === deal.code);
            const isActive = deal.is_active !== false;

            return (
              <div
                key={deal.code}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs ${isActive
                    ? 'border-slate-200 hover:border-slate-400'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-75'
                  }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {deal.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(deal.code)}
                        className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                        title="Sao chép mã"
                      >
                        {copiedCode === deal.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status Pill & Toggle */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {isActive ? 'Hoạt động' : 'Tạm tắt'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {deal.condition}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${deal.is_freeship
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                    >
                      {deal.discount}
                    </span>

                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Đơn tối thiểu: {deal.min_order && deal.min_order > 0 ? formatMoney(deal.min_order) : '0 ₫'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn dùng: {deal.expiry || 'Vô thời hạn'}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(originalIndex)}
                    className={`font-medium transition-colors cursor-pointer ${isActive ? 'text-amber-700 hover:text-amber-800' : 'text-emerald-700 hover:text-emerald-800'
                      }`}
                  >
                    {isActive ? 'Tạm tắt voucher' : 'Kích hoạt voucher'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(deal, originalIndex)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
                      title="Chỉnh sửa voucher"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeal(originalIndex)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-100/60 rounded transition-colors cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 5. LIVE SIMULATOR PREVIEW BOX ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Mô phỏng hiển thị trên Giỏ hàng (Live Storefront Preview)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra thẻ deal hiển thị khi khách hàng ĐỦ ĐIỀU KIỆN và CHƯA ĐỦ ĐIỀU KIỆN (kèm dòng nhắc mua thêm).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono">Giả lập giá trị giỏ:</span>
            <div className="flex items-center gap-1 border border-slate-300 rounded-md px-2 py-1 bg-slate-50">
              <input
                type="number"
                step="50000"
                min="0"
                value={previewSubtotal}
                onChange={(e) => setPreviewSubtotal(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 text-xs font-mono font-bold bg-transparent outline-none"
              />
              <span className="text-[11px] font-mono text-slate-500">₫</span>
            </div>
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.slice(0, 2).map(deal => {
            const minOrder = deal.min_order || 0;
            const isEligible = minOrder === 0 || previewSubtotal >= minOrder;
            const remaining = minOrder - previewSubtotal;

            return (
              <div key={deal.code} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>MÃ {deal.code} (Tối thiểu: {formatMoney(minOrder)})</span>
                  <span className={isEligible ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {isEligible ? '✓ Đủ điều kiện' : `✗ Thiếu ${formatMoney(remaining)}`}
                  </span>
                </div>

                {isEligible ? (
                  /* ELIGIBLE STATE */
                  <div className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{deal.code}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            {deal.discount}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-medium">Áp dụng →</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {deal.title} • {deal.condition}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* INELIGIBLE STATE - MATCHING SCREENSHOT EXACTLY */
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 select-none">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">{deal.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-200/70 text-slate-500">
                          {deal.discount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 italic">Chưa đủ điều kiện</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {deal.title} • {deal.condition}
                    </div>
                    <p className="text-[10px] text-amber-700/80 font-medium mt-1">
                      Mua thêm {formatMoney(remaining)} để áp dụng mã này
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 6. CREATE / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingDealIndex !== null ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Khuyến Mãi Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveModal();
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Mã Voucher */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mã Voucher (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: CAISHOP50K, FREESHIP, VIP100..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white uppercase placeholder:font-normal"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Tự động viết hoa, không dấu cách. Khách hàng sẽ nhập hoặc chọn mã này.</span>
              </div>

              {/* Tiêu đề chương trình */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên / Tiêu đề Voucher <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Voucher Độc Quyền Tài Khoản, Ưu Đãi Đơn Hàng VIP..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Loại giảm giá */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Loại ưu đãi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountTypeMode('CASH');
                      setFormData({
                        ...formData,
                        is_freeship: false,
                        discount: formData.discount_amount ? `Giảm ${new Intl.NumberFormat('vi-VN').format(formData.discount_amount)}đ` : 'Giảm 50.000đ'
                      });
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${discountTypeMode === 'CASH'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    Giảm số tiền cụ thể (₫)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountTypeMode('FREESHIP');
                      setFormData({
                        ...formData,
                        is_freeship: true,
                        discount: 'Freeship toàn quốc'
                      });
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${discountTypeMode === 'FREESHIP'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    Freeship toàn quốc
                  </button>
                </div>
              </div>

              {/* Số tiền giảm nếu là CASH */}
              {discountTypeMode === 'CASH' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số tiền giảm (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="5000"
                    min="1000"
                    value={formData.discount_amount || 50000}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        discount_amount: val,
                        discount: `Giảm ${new Intl.NumberFormat('vi-VN').format(val)}đ`
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              )}

              {/* Đơn hàng tối thiểu */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Giá trị đơn hàng tối thiểu (min_order)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={formData.min_order ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      min_order: val,
                      condition: val > 0 ? `Áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN').format(val)}đ trở lên` : 'Áp dụng cho mọi giá trị đơn hàng'
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Nhập 0 nếu không yêu cầu giá trị đơn tối thiểu.</span>
              </div>

              {/* Điều kiện mô tả hiển thị */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mô tả điều kiện áp dụng
                </label>
                <input
                  type="text"
                  placeholder="VD: Áp dụng cho đơn hàng từ 350.000đ trở lên"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Ngày hết hạn */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Hạn sử dụng (dd/mm/yyyy)
                </label>
                <input
                  type="text"
                  placeholder="31/12/2026"
                  value={formData.expiry}
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Trạng thái kích hoạt */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="deal_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <label htmlFor="deal_active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Kích hoạt voucher ngay lập tức trên storefront
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {saving ? 'Đang lưu...' : editingDealIndex !== null ? 'Lưu thay đổi' : 'Thêm Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs font-medium border border-slate-700/60 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-sans leading-relaxed">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
