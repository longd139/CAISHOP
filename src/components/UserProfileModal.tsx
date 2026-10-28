'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AuthUser } from '@/lib/useAuth';
import { MEMBERSHIP_TIERS, calculateTier, getNextTierInfo, MembershipTier } from '@/lib/membership';
import {
  Shield,
  ShoppingBag,
  LogOut,
  ExternalLink,
  X,
  Package,
  CheckCircle2,
  Check,
  ArrowRight,
  Loader2,
  CreditCard,
  Clock,
  AlertCircle,
  RotateCcw,
  Truck,
  MapPin,
  Tag,
  Copy,
  FileText,
} from 'lucide-react';
import { useCart, AVAILABLE_DEALS } from '@/lib/useCart';
import { getPrimaryImageUrl } from '@/lib/productImages';
import { parseOrderAddressDetails } from '@/components/ExecutiveDashboard';
import ReturnRequestModal from '@/components/ReturnRequestModal';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/**
 * Đồng hồ đếm ngược 1 tiếng cho đơn hàng PENDING chưa thanh toán
 */
function OrderCountdownBadge({
  createdAt,
  orderId,
  onExpired,
}: {
  createdAt: string;
  orderId: string;
  onExpired?: () => void;
}) {
  const calculateRemaining = useCallback(() => {
    if (!createdAt) return 0;
    const createdAtStr = String(createdAt);
    const createdAtMs = new Date(
      createdAtStr.endsWith('Z') ? createdAtStr : createdAtStr.replace(' ', 'T') + 'Z'
    ).getTime();
    return Math.max(0, Math.floor((createdAtMs + 3600 * 1000 - Date.now()) / 1000));
  }, [createdAt]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemaining);
  const hasTriggeredRef = useRef<boolean>(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const initial = calculateRemaining();
    setTimeLeft(initial);
    // Nếu đơn đã hết hạn từ trước khi mount, tuyệt đối không kích hoạt timer hay gọi xóa/refresh lặp lại
    if (initial <= 0) {
      hasTriggeredRef.current = true;
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: 'DELETE' })
            .catch(() => {})
            .finally(() => {
              onExpiredRef.current?.();
            });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemaining, orderId]);

  if (timeLeft <= 0) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Đã hết hạn
      </span>
    );
  }

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const isUrgent = timeLeft < 600;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          : 'bg-amber-50 text-amber-800 border-amber-300'
      }`}
      title="Đơn hàng được lưu giữ trong 1 tiếng. Hết thời gian sẽ tự động bị xóa và hoàn trả hàng vào kho."
    >
      <Clock className="w-3 h-3 shrink-0" />
      <span>Hủy sau {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
    </span>
  );
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  logout: () => Promise<void>;
  onOpenCart?: () => void;
  cartCount?: number;
  initialTab?: 'profile' | 'orders';
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  logout,
  onOpenCart,
  cartCount = 0,
  initialTab = 'profile',
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<any | null>(null);
  const [returnRequestOrder, setReturnRequestOrder] = useState<any | null>(null);
  const [redirectingOrderId, setRedirectingOrderId] = useState<string | null>(null);
  const [membershipStats, setMembershipStats] = useState<{ past_orders: number } | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>('BRONZE');
  const { appliedDealCode, setAppliedDealCode, cart } = useCart();
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tabs lọc đơn hàng: đã xác nhận, đang giao, đã giao, hoàn đổi
  type OrderSubTab = 'all' | 'confirmed' | 'delivering' | 'delivered' | 'returned';
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('all');

  const getOrderCategory = useCallback((ord: any): 'confirmed' | 'delivering' | 'delivered' | 'returned' => {
    const isReturned = ord.fulfillment_status === 'RETURNED' || 
                       ord.fulfillment_status === 'RETURNING' || 
                       ord.fulfillment_status === 'RETURN_REQUESTED' || 
                       Boolean(ord.return_status);
    if (isReturned) return 'returned';

    const isDelivered = ord.fulfillment_status === 'DELIVERED';
    if (isDelivered) return 'delivered';

    const isDispatched = ord.fulfillment_status === 'DISPATCHED' || Boolean(ord.tracking_code);
    if (isDispatched) return 'delivering';

    return 'confirmed';
  }, []);

  const orderCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      confirmed: 0,
      delivering: 0,
      delivered: 0,
      returned: 0,
    };
    orders.forEach((ord) => {
      const cat = getOrderCategory(ord);
      counts[cat]++;
    });
    return counts;
  }, [orders, getOrderCategory]);

  const filteredOrders = useMemo(() => {
    if (orderSubTab === 'all') return orders;
    return orders.filter((ord) => getOrderCategory(ord) === orderSubTab);
  }, [orders, orderSubTab, getOrderCategory]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Fetch orders when modal opens
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setIsLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (user.phone) params.set('phone', user.phone);
      if (user.email) params.set('email', user.email);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user orders', err);
    } finally {
      if (!isSilent) setIsLoadingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user, fetchOrders]);

  const handleContinuePayment = async (ord: any) => {
    setRedirectingOrderId(ord.id);
    try {
      const pRes = await fetch('/api/payos/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: ord.id,
          order_code: ord.order_code,
          total_amount: ord.total_amount,
          customer_name: ord.customer_name || user?.name || 'Khách hàng',
          customer_phone: ord.customer_phone || user?.phone || '',
        }),
      });
      const pData = await pRes.json();
      if (pData.success && pData.data?.checkoutUrl) {
        window.location.href = pData.data.checkoutUrl;
      } else {
        window.location.href = `/checkout?order_id=${encodeURIComponent(ord.id)}`;
      }
    } catch (e) {
      console.error('Lỗi khi tiếp tục thanh toán PayOS:', e);
      window.location.href = `/checkout?order_id=${encodeURIComponent(ord.id)}`;
    } finally {
      setRedirectingOrderId(null);
    }
  };

  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  const handleConfirmDelivered = async (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && !targetOrder.tracking_code) {
      alert('Đơn hàng chưa có mã vận chuyển, chưa thể xác nhận nhận hàng.');
      return;
    }
    setConfirmingOrderId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          action: 'CONFIRM_DELIVERY',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders();
      } else {
        alert(data.message || 'Không thể xác nhận nhận hàng');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xác nhận nhận hàng');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleToggleDeal = (code: string) => {
    if (appliedDealCode === code) {
      setAppliedDealCode(null);
      return;
    }
    const deal = AVAILABLE_DEALS.find((d) => d.code === code);
    if (deal && deal.min_order && cartSubtotal < deal.min_order) {
      return;
    }
    setAppliedDealCode(code);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch real membership stats for current user based on completed orders
  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (user.phone) params.set('phone', user.phone);
        if (user.email) params.set('email', user.email);

        const res = await fetch(`/api/membership?${params.toString()}`);
        const json = (await res.json()) as any;
        if (active && json.success && json.data) {
          setMembershipStats({
            past_orders: json.data.order_count || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch membership stats', err);
      }
    };
    fetchStats();
    return () => {
      active = false;
    };
  }, [isOpen, user]);

  const completedOrders = membershipStats?.past_orders || 0;
  const currentTier = calculateTier(completedOrders);
  const nextTierInfo = getNextTierInfo(completedOrders);

  // Sync selected tier to current active tier initially
  useEffect(() => {
    if (currentTier?.id) {
      setSelectedTierId(currentTier.id);
    }
  }, [currentTier?.id]);

  const selectedTier = MEMBERSHIP_TIERS.find((t) => t.id === selectedTierId) || currentTier;

  // Percentage calculation along the 4 milestones: 0, 3, 5, 10 orders
  const getProgressPercent = (orders: number) => {
    if (orders <= 0) return 0;
    if (orders < 3) return (orders / 3) * 33.33;
    if (orders < 5) return 33.33 + ((orders - 3) / 2) * 33.33;
    if (orders < 10) return 66.66 + ((orders - 5) / 5) * 33.34;
    return 100;
  };
  const progressPercent = Math.min(100, Math.max(0, getProgressPercent(completedOrders)));

  if (!isOpen || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity"
    >
      <div
        className="w-full max-w-2xl md:max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            {activeTab === 'orders' ? (
              <Package className="w-5 h-5 text-slate-800" />
            ) : (
              <Shield className="w-5 h-5 text-slate-800" />
            )}
            <h2 id="profile-modal-title" className="text-base font-semibold text-slate-900">
              {activeTab === 'orders' ? 'Đơn hàng của tôi' : 'Hồ sơ & Hội viên VIP'}
            </h2>
            {activeTab === 'orders' && orders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold font-mono">
                {orders.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Status Tabs Navigation */}
        {activeTab === 'orders' && !isLoadingOrders && orders.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'all', label: 'Tất cả', count: orderCounts.all },
              { id: 'confirmed', label: 'Đã xác nhận', count: orderCounts.confirmed },
              { id: 'delivering', label: 'Đang giao', count: orderCounts.delivering },
              { id: 'delivered', label: 'Đã giao', count: orderCounts.delivered },
              { id: 'returned', label: 'Hoàn đổi', count: orderCounts.returned },
            ].map((tab) => {
              const isActive = orderSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderSubTab(tab.id as OrderSubTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'profile' ? (
            <>
          {/* Identity & VIP Membership Card (Custom unique theme per tier) */}
          {(() => {
            const isPreview = selectedTier.id !== currentTier.id;
            const displayTier = selectedTier;

            // Tier card theme configurations: distinct luxury visual identity per rank
            const cardTheme = {
              BRONZE: {
                wrapperClass: 'bg-gradient-to-br from-[#faf6f0] via-[#f5efe6] to-[#eddcc9] border-[#e2cebc] text-slate-800 shadow-xs',
                watermark: 'BRONZE TIER',
                watermarkColor: 'text-[#92400e]/60',
                avatarClass: 'bg-gradient-to-br from-[#92400e] to-[#78350f] text-[#fef3c7] ring-2 ring-[#d97706]/35 shadow-xs',
                nameColor: 'text-slate-900 font-bold',
                contactColor: 'text-slate-600',
              },
              SILVER: {
                wrapperClass: 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border-[#cbd5e1] text-slate-800 shadow-xs',
                watermark: 'SILVER TIER',
                watermarkColor: 'text-slate-500',
                avatarClass: 'bg-gradient-to-br from-slate-700 to-slate-900 text-slate-100 ring-2 ring-slate-400/50 shadow-xs',
                nameColor: 'text-slate-900 font-bold',
                contactColor: 'text-slate-600',
              },
              GOLD: {
                wrapperClass: 'bg-gradient-to-br from-[#fffdf5] via-[#fef9c3]/35 to-[#fef08a]/30 border-[#facc15]/70 text-slate-900 shadow-xs relative',
                watermark: 'GOLD TIER',
                watermarkColor: 'text-[#854d0e]/70',
                avatarClass: 'bg-gradient-to-br from-[#ca8a04] to-[#854d0e] text-[#fef9c3] ring-2 ring-[#eab308]/70 shadow-2xs',
                nameColor: 'text-slate-900 font-bold',
                contactColor: 'text-slate-700',
              },
              DIAMOND: {
                wrapperClass: 'bg-gradient-to-br from-[#090d16] via-[#111827] to-[#1e1b4b] border-[#4338ca]/60 text-white shadow-lg relative',
                watermark: 'DIAMOND TIER',
                watermarkColor: 'text-indigo-300/80',
                avatarClass: 'bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#4338ca] text-white ring-2 ring-indigo-400/60 shadow-md',
                nameColor: 'text-white font-bold',
                contactColor: 'text-slate-300',
              },
            }[displayTier.id] || {
              wrapperClass: 'bg-slate-50 border-slate-200 text-slate-800',
              watermark: 'MEMBER PRIVÉ',
              watermarkColor: 'text-slate-400',
              avatarClass: 'bg-slate-900 text-white',
              nameColor: 'text-slate-900 font-bold',
              contactColor: 'text-slate-500',
            };

            return (
              <div
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${cardTheme.wrapperClass}`}
              >
                {/* Background ambient glow for Diamond & Gold */}
                {displayTier.id === 'DIAMOND' && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                )}
                {displayTier.id === 'GOLD' && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Top header row: Watermark & Preview toggle */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-black/5 dark:border-white/10 relative z-10">
                  <span className={`text-[10px] tracking-wider uppercase font-semibold ${cardTheme.watermarkColor}`}>
                    {cardTheme.watermark}
                  </span>
                  {isPreview ? (
                    <button
                      type="button"
                      onClick={() => setSelectedTierId(currentTier.id)}
                      className="text-[10px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer underline decoration-dotted"
                      title="Quay lại hạng thực tế của bạn"
                    >
                      (Xem trước - Bấm về cấp bạn)
                    </button>
                  ) : (
                    <span className="text-[10px] opacity-60 uppercase tracking-wider font-medium">
                      Cấp hiện tại
                    </span>
                  )}
                </div>

                {/* Main card info */}
                <div className="flex items-center gap-3.5 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm shrink-0 transition-all duration-300 ${cardTheme.avatarClass}`}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm truncate ${cardTheme.nameColor}`}>
                        {user.name}
                      </h3>
                      {user.role === 'ADMIN' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          Quản trị
                        </span>
                      )}
                    </div>

                    <p className={`text-xs truncate mt-1 ${cardTheme.contactColor}`}>
                      {user.phone ? `SĐT: ${user.phone}` : ''}
                      {user.phone && user.email ? ' - ' : ''}
                      {user.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Membership Tier Progression Roadmap & Milestone Perks */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4 shadow-xs">
            {/* Header info */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                Cấp bậc Hội viên
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tích lũy số đơn hàng thành công để thăng hạng & nhận chiết khấu cao hơn
              </p>
            </div>

            {/* Statistics pill */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white rounded-lg p-2.5 border border-slate-200/70">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Tổng đơn tích lũy
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">
                  {completedOrders} <span className="text-xs font-normal text-slate-500">đơn hàng</span>
                </span>
              </div>
              <div className="flex flex-col justify-center border-l border-slate-100 pl-2.5">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Mức chiết khấu hiện tại
                </span>
                <span className="text-sm font-bold text-emerald-600 mt-0.5">
                  {currentTier.discount_percent > 0 ? `Giảm ${currentTier.discount_percent}%` : 'Giá niêm yết (0%)'}
                </span>
              </div>
            </div>

            {/* Visual Progression Chart */}
            <div className="pt-8 pb-2 px-1">
              {/* Stepper milestone bar */}
              <div className="relative">
                {/* Background track line: clean, elegant neutral track */}
                <div
                  className="absolute top-4 h-1 rounded-full -translate-y-1/2 bg-slate-200"
                  style={{ left: '12.5%', right: '12.5%' }}
                />

                {/* Active progress fill line: solid warm amber-gold, clean with no color smudges */}
                {progressPercent > 0 && (
                  <div
                    className="absolute top-4 h-1 rounded-full -translate-y-1/2 bg-amber-500 shadow-xs transition-all duration-500"
                    style={{
                      left: '12.5%',
                      width: `${progressPercent * 0.75}%`,
                    }}
                  />
                )}

                {/* 4 Milestone Nodes */}
                <div className="relative flex justify-between items-start">
                  {MEMBERSHIP_TIERS.map((tier) => {
                    const isPassed = completedOrders >= tier.min_orders;
                    const isCurrent = currentTier.id === tier.id;
                    const isSelected = selectedTier.id === tier.id;

                    // Clean luxury color mappings per tier
                    const tierStyles: Record<string, {
                      activeBg: string;
                      unreachedBg: string;
                      textColor: string;
                      accentDot: string;
                    }> = {
                      BRONZE: {
                        activeBg: 'bg-amber-600 text-white shadow-sm ring-4 ring-amber-500/20',
                        unreachedBg: 'bg-white border-2 border-amber-300 text-amber-800 hover:border-amber-400',
                        textColor: 'text-amber-900',
                        accentDot: 'bg-amber-600',
                      },
                      SILVER: {
                        activeBg: 'bg-slate-700 text-white shadow-sm ring-4 ring-slate-400/25',
                        unreachedBg: 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400',
                        textColor: 'text-slate-900',
                        accentDot: 'bg-slate-500',
                      },
                      GOLD: {
                        activeBg: 'bg-amber-500 text-white shadow-sm ring-4 ring-amber-400/25',
                        unreachedBg: 'bg-white border-2 border-amber-300 text-amber-900 hover:border-amber-400',
                        textColor: 'text-amber-900',
                        accentDot: 'bg-amber-500',
                      },
                      DIAMOND: {
                        activeBg: 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-400/25',
                        unreachedBg: 'bg-white border-2 border-indigo-200 text-indigo-900 hover:border-indigo-400',
                        textColor: 'text-indigo-900',
                        accentDot: 'bg-indigo-600',
                      },
                    };

                    const style = tierStyles[tier.id] || tierStyles.BRONZE;

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        className="group flex flex-col items-center focus:outline-none cursor-pointer text-center relative"
                        style={{ width: '25%' }}
                      >
                        {/* "Bạn ở đây" Indicator badge */}
                        {isCurrent && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full shadow-md tracking-wider z-20">
                            Bạn ở đây
                          </span>
                        )}

                        {/* Node circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 relative z-10 ${
                            isCurrent
                              ? `${style.activeBg} scale-105`
                              : isPassed
                              ? `${style.activeBg.split(' ')[0]} text-white shadow-xs`
                              : style.unreachedBg
                          } ${isSelected && !isCurrent ? 'ring-2 ring-amber-400/80 scale-105' : ''}`}
                        >
                          <span className="text-[11px] font-bold">{tier.min_orders}</span>
                        </div>

                        {/* Node labels */}
                        <span className={`text-[11px] mt-2 transition-colors ${
                          isSelected
                            ? 'font-bold text-slate-900'
                            : isCurrent
                            ? `font-bold ${style.textColor}`
                            : 'font-medium text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {tier.tag_text}
                        </span>

                        <span className={`text-[11px] mt-0.5 transition-colors ${
                          tier.discount_percent > 0
                            ? isSelected || isCurrent
                              ? 'text-emerald-700 font-semibold'
                              : 'text-slate-500 font-medium'
                            : 'text-slate-400 font-medium'
                        }`}>
                          {tier.discount_percent > 0 ? `Giảm ${tier.discount_percent}%` : 'Giá chuẩn'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Motivation Callout */}
            {nextTierInfo ? (
              <div className="text-[11px] bg-amber-500/10 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg leading-relaxed">
                Hoàn thành thêm <strong>{nextTierInfo.orders_needed} đơn hàng</strong> nữa để thăng hạng <strong>{nextTierInfo.next_tier.name}</strong> ({nextTierInfo.benefit})
              </div>
            ) : (
              <div className="text-[11px] bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-2 rounded-lg leading-relaxed">
                Chúc mừng! Bạn đã đạt Cấp bậc Kim Cương với chiết khấu độc quyền tối đa 15%.
              </div>
            )}
          </div>

          {/* Deal giảm giá riêng (Voucher & Exclusive Deals) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                  Deal giảm giá
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Các mã ưu đãi và deal giảm giá riêng được cấp cho tài khoản của bạn
                </p>
              </div>
              <div className="shrink-0">
                {appliedDealCode ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Đang chọn 1 deal</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    {AVAILABLE_DEALS.length} deal khả dụng
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {AVAILABLE_DEALS.map((deal) => {
                const isSelected = appliedDealCode === deal.code;
                const isEligible = !deal.min_order || cartSubtotal >= deal.min_order;

                if (!isEligible) {
                  return (
                    <div
                      key={deal.code}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 select-none cursor-not-allowed"
                    >
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
                        Mua thêm {formatMoney((deal.min_order || 0) - cartSubtotal)} để áp dụng mã này
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={deal.code}
                    onClick={() => handleToggleDeal(deal.code)}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap cursor-pointer ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-300'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {deal.title}
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          {deal.discount}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {deal.condition}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Hạn dùng: {deal.expiry}</span>
                        <span>-</span>
                        <span className="text-slate-600 font-medium">Mã: {deal.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDeal(deal.code);
                        }}
                        className={`min-w-[88px] h-8 px-3 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                          isSelected
                            ? 'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 shadow-xs'
                            : 'border border-slate-300 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span>Đã chọn</span>
                          </>
                        ) : (
                          <span>Chọn</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            {/* Open Cart */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenCart) onOpenCart();
              }}
              className="w-full h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <span>Xem giỏ hàng hiện tại</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-900">
                {cartCount} món
              </span>
            </button>

            {/* Admin Dashboard shortcut if admin */}
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full h-10 px-4 rounded-md border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-900 text-xs font-medium flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Vào Bảng điều hành Admin</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </Link>
            )}

            {/* Catalog browse */}
            <Link
              href="/products"
              onClick={onClose}
              className="w-full h-10 px-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Khám phá bộ sưu tập sản phẩm</span>
              </span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
            </>
          ) : (
            /* ORDERS TAB */
            <div className="space-y-4">
              {isLoadingOrders ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-600" />
                  <p className="text-xs">Đang tải lịch sử đơn hàng...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-14 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3.5">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">Bạn chưa có đơn hàng nào</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Các đơn hàng bạn đặt tại DE&apos;GENT sẽ được lưu trữ và cập nhật trạng thái chi tiết tại đây.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-all shadow-xs"
                  >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Không có đơn hàng nào ở trạng thái này</h4>
                    <p className="text-[11px] text-slate-500">
                      Hiện tại bạn không có đơn hàng nào trong mục{' '}
                      <span className="font-semibold text-slate-700">
                        {orderSubTab === 'confirmed' ? 'Đã xác nhận' : orderSubTab === 'delivering' ? 'Đang giao' : orderSubTab === 'delivered' ? 'Đã giao' : 'Hoàn đổi'}
                      </span>.
                    </p>
                  </div>
                  <button
                    onClick={() => setOrderSubTab('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all"
                  >
                    Xem tất cả đơn hàng ({orders.length})
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredOrders.map((ord: any) => {
                    const isPaid = ord.payment_status === 'PAID';
                    const isDelivered = ord.fulfillment_status === 'DELIVERED';
                    const isReturned = ord.fulfillment_status === 'RETURNED' || ord.fulfillment_status === 'RETURNING' || ord.fulfillment_status === 'RETURN_REQUESTED' || !!ord.return_status;
                    const returnNotesLower = (ord.return_notes || '').toLowerCase();
                    const isExchange = isReturned && (
                      ord.return_notes?.includes('ĐỔI HÀNG') || 
                      returnNotesLower.includes('đổi size') || 
                      returnNotesLower.includes('đổi mẫu') ||
                      returnNotesLower.includes('đổi hàng')
                    );
                    const isRefund = isReturned && !isExchange;
                    const isCancelled = ord.fulfillment_status === 'CANCELLED';
                    const isDispatched = ord.fulfillment_status === 'DISPATCHED';
                    const isPacking = ord.fulfillment_status === 'PACKING' || (!isDispatched && !isDelivered && !isCancelled && !isReturned && isPaid);

                    return (
                      <div
                        key={ord.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono tracking-wide">
                              #{ord.order_code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(ord.created_at).toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </span>

                            {/* Live 1-hour countdown timer badge (Chỉ áp dụng cho đơn thanh toán online chưa trả tiền, không áp dụng COD) */}
                            {!isPaid && !isCancelled && ord.payment_method !== 'cod' && (
                              <OrderCountdownBadge
                                createdAt={ord.created_at}
                                orderId={ord.id}
                                onExpired={() => fetchOrders(true)}
                              />
                            )}

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCancelled
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isExchange
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : isRefund
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : isDelivered
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDispatched
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : isPacking
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isCancelled
                                ? 'Đã hủy'
                                : isExchange
                                ? 'Đang đổi hàng'
                                : isRefund
                                ? 'Đang trả hàng'
                                : isDelivered
                                ? 'Đã nhận'
                                : isDispatched
                                ? 'Đang vận chuyển'
                                : isPacking
                                ? 'Chờ vận chuyển'
                                : 'Chưa xử lý'}
                            </span>
                          </div>
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-xs">
                            <span className="text-slate-500">Tổng thanh toán: </span>
                            <span className="font-bold text-slate-900 tabular-nums text-sm">
                              {formatMoney(ord.total_amount)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick Action: Confirm Received if active, not delivered, has tracking code, and not in return/exchange */}
                            {!isDelivered && !isCancelled && !isReturned && (isPaid || ord.payment_method === 'cod') && Boolean(ord.tracking_code) && (
                              <button
                                type="button"
                                disabled={confirmingOrderId === ord.id}
                                onClick={() => handleConfirmDelivered(ord.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {confirmingOrderId === ord.id ? (
                                   <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang xử lý...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Đã nhận hàng</span>
                                  </>
                                )}
                              </button>
                            )}

                            {!isPaid && !isCancelled && !isReturned && (
                              <button
                                type="button"
                                disabled={redirectingOrderId === ord.id}
                                onClick={() => handleContinuePayment(ord)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                              >
                                {redirectingOrderId === ord.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang mở PayOS...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Tiếp tục thanh toán</span>
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedDetailOrder(ord)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Chi tiết đơn</span>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Logout */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Phiên ID: #{user.id.slice(-6).toUpperCase()}
          </span>
          {activeTab !== 'orders' && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Popup: Chi tiết đơn hàng */}
      {selectedDetailOrder && (() => {
        const det = selectedDetailOrder;
        const parsed = parseOrderAddressDetails(det.shipping_address);
        const isPaid = det.payment_status === 'PAID';
        const returnNotesLower = det.return_notes?.toLowerCase() || '';
        const isReturned = det.fulfillment_status === 'RETURNED' || 
                           det.fulfillment_status === 'RETURNING' || 
                           det.fulfillment_status === 'RETURN_REQUESTED' || 
                           Boolean(det.return_status);
        const isExchange = isReturned && (
          det.return_notes?.includes('ĐỔI HÀNG') || 
          returnNotesLower.includes('đổi size') || 
          returnNotesLower.includes('đổi mẫu') ||
          returnNotesLower.includes('đổi hàng')
        );
        const isRefund = isReturned && !isExchange;
        const isCancelled = det.fulfillment_status === 'CANCELLED';
        const isDispatched = det.fulfillment_status === 'DISPATCHED';
        const isDelivered = det.fulfillment_status === 'DELIVERED';
        const isPacking = det.fulfillment_status === 'PACKING' || (!isDispatched && !isDelivered && !isCancelled && !isReturned && isPaid);

        // Tính tạm tính tiền hàng từ danh sách items
        const subtotal = Array.isArray(det.items)
          ? det.items.reduce((sum: number, it: any) => sum + (it.total_price || (it.unit_price * it.quantity)), 0)
          : 0;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono tracking-wide">
                      Chi tiết đơn hàng #{det.order_code}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Đặt lúc: {new Date(det.created_at).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailOrder(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Trạng thái đơn hàng */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Tiến trình đơn:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        isCancelled
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isExchange
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : isRefund
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isDelivered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDispatched
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : isPacking
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-200/80 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isCancelled
                        ? 'Đã hủy'
                        : isExchange
                        ? 'Đang đổi hàng'
                        : isRefund
                        ? 'Đang trả hàng'
                        : isDelivered
                        ? 'Đã nhận hàng'
                        : isDispatched
                        ? 'Đang vận chuyển'
                        : isPacking
                        ? 'Chờ vận chuyển'
                        : 'Chưa xử lý'}
                    </span>
                  </div>

                  {!isPaid && !isCancelled && det.payment_method !== 'cod' && (
                    <OrderCountdownBadge
                      createdAt={det.created_at}
                      orderId={det.id}
                      onExpired={() => {
                        fetchOrders(true);
                        setSelectedDetailOrder(null);
                      }}
                    />
                  )}
                </div>

                {/* 🚚 Thông tin Đơn vị vận chuyển & Mã vận đơn */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {det.carrier === 'VIETTEL_POST' || !det.carrier ? (
                        <img
                          src="https://inkythuatso.com/uploads/thumbnails/800/2023/05/logo-viettelpost-inkythuatso-27-14-52-01.jpg"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863870/degent/viettelpost-logo.jpg'; }}
                          alt="Viettel Post"
                          className="w-5 h-5 rounded object-cover shadow-2xs border border-red-200 shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        {det.carrier === 'GHTK' ? 'Giao Hàng Tiết Kiệm (GHTK)' : det.carrier === 'GHN' ? 'Giao Hàng Nhanh (GHN)' : det.carrier === 'SHIPPER' ? 'Shipper riêng DE\'GENT' : 'Viettel Post'}
                      </span>
                    </div>

                    {det.tracking_code ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        {isDelivered ? 'Đã giao thành công' : 'Đang vận chuyển'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 italic">
                        Chờ cập nhật mã vận chuyển
                      </span>
                    )}
                  </div>

                  {det.tracking_code ? (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">Mã vận đơn:</span>
                        <span className="font-mono font-bold text-xs text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-300 tracking-wider">
                          {det.tracking_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(det.tracking_code);
                            alert(`Đã sao chép mã vận đơn: ${det.tracking_code}`);
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Sao chép mã"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                        <a
                          href={
                            det.carrier === 'GHTK' ? `https://i.ghtk.vn/${det.tracking_code}` :
                            det.carrier === 'GHN' ? `https://tracking.ghn.vn/?order_code=${det.tracking_code}` :
                            `https://viettelpost.vn/tra-cuu-hanh-trinh-don-hang?id=${det.tracking_code}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-red-700 hover:text-red-900 bg-white px-2 py-1 rounded border border-red-200 shadow-2xs hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <span>Tra cứu bưu gửi</span>
                          <ExternalLink className="w-3 h-3 text-red-500" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      DE&apos;GENT đang chuẩn bị gói hàng và sẽ cập nhật mã vận đơn khi bàn giao cho đối tác vận chuyển.
                    </p>
                  )}
                </div>

                {/* 📍 Thông tin người nhận & Địa chỉ */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Thông tin nhận hàng</span>
                  </div>
                  <div className="text-slate-700 space-y-0.5 pl-5">
                    <p className="font-semibold text-slate-900">
                      {det.customer_name || user?.name || 'Khách hàng'} - <span className="font-mono text-slate-600">{det.customer_phone || user?.phone || 'Chưa có SĐT'}</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {parsed.cleanAddress}
                    </p>
                    {parsed.orderNote && (
                      <p className="text-slate-500 italic text-[11px]">
                        Ghi chú: {parsed.orderNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* 🛍️ Danh sách sản phẩm */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">
                    Sản phẩm đã đặt ({Array.isArray(det.items) ? det.items.length : 0})
                  </span>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    {Array.isArray(det.items) && det.items.map((it: any) => (
                      <div key={it.id} className="p-3 flex items-center gap-3">
                        <img
                          src={getPrimaryImageUrl(it.product_images)}
                          alt={it.product_name}
                          className="w-12 h-14 object-cover rounded border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {it.product_name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {it.color} / Size {it.size} × {it.quantity}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Đơn giá: {formatMoney(it.unit_price)}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 tabular-nums text-right">
                          {formatMoney(it.total_price || (it.unit_price * it.quantity))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 💰 Chi tiết thanh toán & Các khoản giảm trừ */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <span className="font-bold text-slate-900 block pb-1 border-b border-slate-200">
                    Chi tiết thanh toán
                  </span>

                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Tiền hàng (Tạm tính):</span>
                      <span className="tabular-nums font-medium text-slate-900">{formatMoney(subtotal)}</span>
                    </div>

                    {/* Các khoản trừ: Voucher, Deal, Hội viên */}
                    {parsed.voucherCode && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Voucher áp dụng:</span>
                        </span>
                        <span>{parsed.voucherCode}</span>
                      </div>
                    )}

                    {parsed.dealTag && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Khuyến mãi:</span>
                        <span>{parsed.dealTag}</span>
                      </div>
                    )}

                    {parsed.membershipTag && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Ưu đãi hội viên:</span>
                        <span>{parsed.membershipTag}</span>
                      </div>
                    )}

                    {parsed.shippingMethod && (
                      <div className="flex justify-between">
                        <span>Hình thức vận chuyển:</span>
                        <span className="font-medium text-slate-800">{parsed.shippingMethod}</span>
                      </div>
                    )}

                    {parsed.shippingFee && (
                      <div className="flex justify-between">
                        <span>Phí vận chuyển:</span>
                        <span className="tabular-nums font-medium text-slate-800">{parsed.shippingFee}</span>
                      </div>
                    )}

                    {parsed.codInfo && (
                      <div className="pt-1.5 border-t border-dashed border-slate-200 space-y-1">
                        <div className="flex justify-between text-amber-800 font-medium">
                          <span>Tiền cọc COD ({parsed.codInfo.percent || '50%'}):</span>
                          <span>{parsed.codInfo.deposited || 'Đã cọc'}</span>
                        </div>
                        {parsed.codInfo.remaining && (
                          <div className="flex justify-between text-slate-700 font-semibold">
                            <span>Thu shipper khi nhận hàng:</span>
                            <span className="text-slate-950">{parsed.codInfo.remaining}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Tổng thanh toán:</span>
                      <span className="text-base text-slate-950 font-bold tabular-nums">
                        {formatMoney(det.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedDetailOrder(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <div className="flex items-center gap-2">
                  {/* Confirm Delivered inside modal */}
                  {!isDelivered && !isCancelled && !isReturned && (isPaid || det.payment_method === 'cod') && Boolean(det.tracking_code) && (
                    <button
                      type="button"
                      disabled={confirmingOrderId === det.id}
                      onClick={async () => {
                        await handleConfirmDelivered(det.id);
                        setSelectedDetailOrder((prev: any) => prev ? { ...prev, fulfillment_status: 'DELIVERED' } : null);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {confirmingOrderId === det.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Đã nhận hàng</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Continue Payment inside modal */}
                  {!isPaid && !isCancelled && !isReturned && (
                    <button
                      type="button"
                      disabled={redirectingOrderId === det.id}
                      onClick={() => handleContinuePayment(det)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {redirectingOrderId === det.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang mở PayOS...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Tiếp tục thanh toán</span>
                        </>
                      )}
                    </button>
                  )}

                  {isDelivered && !isReturned && (
                    <button
                      type="button"
                      onClick={() => setReturnRequestOrder(det)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Yêu cầu đổi / trả hàng</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Return Request Modal with 2-Column layout */}
      <ReturnRequestModal
        isOpen={Boolean(returnRequestOrder)}
        onClose={() => setReturnRequestOrder(null)}
        order={returnRequestOrder}
        onSuccess={() => {
          fetchOrders();
          setReturnRequestOrder(null);
          setSelectedDetailOrder(null);
        }}
      />
    </div>
  );
}
