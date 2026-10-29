'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Search,
  Users,
  Database,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layout,
  Globe,
  Plus,
  Trash2,
  Save,
  Check,
  Layers,
  Eye,
  SlidersHorizontal,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Tag,
  FolderTree,
  CreditCard,
  QrCode,
  Ticket,
  LayoutDashboard,
  Palette,
  Sun,
  Moon,
  Activity,
  RotateCcw,
  Zap,
  Sparkles,
  Clock,
  Copy,
  Download,
  ExternalLink,
  ZoomIn,
  Loader2
} from 'lucide-react';
import OverviewSection from '@/components/OverviewSection';
import ProductManagementSection from '@/components/ProductManagementSection';
import CollectionManagementSection from '@/components/CollectionManagementSection';
import ProductMonitoringSection from '@/components/ProductMonitoringSection';
import PaymentManagementSection from '@/components/PaymentManagementSection';
import DealManagementSection from '@/components/DealManagementSection';
import { CustomSelect } from '@/components/CustomSelect';
import { getPrimaryImageUrl } from '@/lib/productImages';

interface InventoryItem {
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

interface CashFlowSummary {
  total_revenue: number;
  total_cogs: number;
  total_shipping_fee: number;
  total_gateway_fee: number;
  net_profit: number;
  gross_margin_percentage: number;
  paid_orders_count: number;
  pending_orders_count: number;
}

interface FinancialTransaction {
  id: string;
  order_id: string | null;
  transaction_type: string;
  amount: number;
  direction: 'INFLOW' | 'OUTFLOW';
  payment_gateway: string | null;
  bank_ref_code: string | null;
  notes: string | null;
  recorded_at: string;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  fulfillment_status: string;
  created_at: string;
  items_count?: number;
  items?: any[];
  return_notes?: string;
  return_reason?: string;
  return_created_at?: string;
  customer_email?: string;
  tracking_code?: string;
  carrier?: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface CustomerRankItem {
  phone: string;
  name: string;
  email: string | null;
  order_count: number;
  total_items: number;
  total_spent: number;
  last_order_date: string;
  tier: string;
  tier_id: string;
  tag_text: string;
  discount_percent: number;
  badge_class: string;
  dot_color: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  is_active: boolean;
  order: number;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: 'Admin Quản trị',
  email: 'admin@degent.vn',
  phone: '0988 123 456',
  address: 'Tầng 5, Tòa nhà DE\'GENT, 12 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
};

type AdminTab = 'overview' | 'products' | 'collections' | 'monitor' | 'cashflow' | 'orders' | 'pricing' | 'deals' | 'customers' | 'content' | 'payment' | 'settings';
type ContentSubTab = 'header' | 'home' | 'products' | 'studio' | 'about';
export type MonitorSubTab = 'returns' | 'behavior';

export type ThemeMode = 'light' | 'dark';

export const getTransactionTypeInfo = (type: string) => {
  switch (type) {
    case 'REVENUE':
      return {
        label: 'Doanh thu',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
      };
    case 'COGS':
      return {
        label: 'Giá vốn (COGS)',
        className: 'bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
      };
    case 'SHIPPING_FEE':
      return {
        label: 'Phí vận chuyển',
        className: 'bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60'
      };
    case 'GATEWAY_FEE':
      return {
        label: 'Phí thanh toán',
        className: 'bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60'
      };
    case 'REFUND':
      return {
        label: 'Hoàn tiền',
        className: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
      };
    default:
      return {
        label: type,
        className: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      };
  }
};

export interface ParsedShippingDetails {
  cleanAddress: string;
  orderNote?: string;
  shippingMethod?: string;
  shippingFee?: string;
  deliveryTimeSlot?: string;
  isExpress?: boolean;
  dealTag?: string;
  voucherCode?: string;
  membershipTag?: string;
  codInfo?: {
    raw?: string;
    percent?: string;
    deposited?: string;
    remaining?: string;
  };
}

export function parseOrderAddressDetails(rawAddress: string | null | undefined): ParsedShippingDetails {
  if (!rawAddress) {
    return { cleanAddress: 'Chưa có thông tin địa chỉ' };
  }

  let remainingText = rawAddress;
  let orderNote: string | undefined;
  let shippingMethod: string | undefined;
  let shippingFee: string | undefined;
  let deliveryTimeSlot: string | undefined;
  let isExpress = false;
  let dealTag: string | undefined;
  let voucherCode: string | undefined;
  let membershipTag: string | undefined;
  let codInfo: ParsedShippingDetails['codInfo'];

  // 1. Bóc tách [CỌC COD: ...]
  const codMatch = remainingText.match(/\[CỌC COD:\s*([^\]]+)\]/i);
  if (codMatch) {
    const rawCod = codMatch[1].trim();
    const percentMatch = rawCod.match(/(\d+%\s*(?:cọc)?)/i);
    const depositedMatch = rawCod.match(/ĐÃ CỌC:\s*([^\-]+?)(?=\s*-\s*THU SHIPPER:|$)/i);
    const remainingMatch = rawCod.match(/THU SHIPPER:\s*([^\]]+)/i);

    codInfo = {
      raw: rawCod,
      percent: percentMatch ? percentMatch[1].trim() : undefined,
      deposited: depositedMatch ? depositedMatch[1].trim() : undefined,
      remaining: remainingMatch ? remainingMatch[1].trim() : undefined,
    };
    remainingText = remainingText.replace(codMatch[0], '');
  }

  // 2. Bóc tách [VOUCHER: ...] hoặc [DEAL: ...] hoặc [KM: ...]
  const voucherMatch = remainingText.match(/\[VOUCHER:\s*([^\]]+)\]/i);
  if (voucherMatch) {
    voucherCode = voucherMatch[1].trim();
    remainingText = remainingText.replace(voucherMatch[0], '');
  }

  const dealMatch = remainingText.match(/\[DEAL:\s*([^\]]+)\]/i);
  if (dealMatch) {
    dealTag = dealMatch[1].trim();
    remainingText = remainingText.replace(dealMatch[0], '');
  }

  // 3. Bóc tách [HỘI VIÊN: ...]
  const membershipMatch = remainingText.match(/\[HỘI VIÊN:\s*([^\]]+)\]/i);
  if (membershipMatch) {
    membershipTag = membershipMatch[1].trim();
    remainingText = remainingText.replace(membershipMatch[0], '');
  }

  // 4. Bóc tách [VẬN CHUYỂN: ...]
  const shippingMatch = remainingText.match(/\[VẬN CHUYỂN:\s*([^\]]+)\]/i);
  if (shippingMatch) {
    const rawShipping = shippingMatch[1].trim();
    // Phát hiện phí ship: - Phí: 0đ hoặc (40k) hoặc (30.000 ₫)
    const feeMatch = rawShipping.match(/[-–]\s*(?:Phí|Cước):\s*([^\)]+?)(?=\s*[-–]|$)/i) || rawShipping.match(/\((?:Phí\s*)?([0-9.,kK₫đ\s]+)\)/i);
    if (feeMatch) {
      shippingFee = feeMatch[1].trim();
    }

    // Phát hiện slot giờ giao hàng: (Hôm nay lúc 14h00 - 16h00)
    const slotMatch = rawShipping.match(/\((Hôm nay|Ngày mai)[^)]+\)/i) || rawShipping.match(/\(lúc\s+[^)]+\)/i);
    if (slotMatch) {
      deliveryTimeSlot = slotMatch[0].replace(/[()]/g, '').trim();
    }

    if (/nhanh|hỏa tốc|express/i.test(rawShipping)) {
      isExpress = true;
      shippingMethod = "Ship nhanh (Hỏa tốc hẹn giờ - Shipper riêng DE'GENT)";
    } else if (/shipper riêng/i.test(rawShipping)) {
      shippingMethod = "Ship thường trong ngày (Shipper riêng DE'GENT)";
    } else {
      shippingMethod = rawShipping.replace(/[-–]\s*Phí:\s*[^\)]+/i, '').trim();
    }

    remainingText = remainingText.replace(shippingMatch[0], '');
  }

  // 5. Bóc tách Ghi chú: (Ghi chú: ...) hoặc [GHI CHÚ: ...]
  const noteMatch = remainingText.match(/\((?:Ghi chú|Note):\s*([^)]+)\)/i) || remainingText.match(/\[(?:Ghi chú|Note):\s*([^\]]+)\]/i);
  if (noteMatch) {
    orderNote = noteMatch[1].trim();
    remainingText = remainingText.replace(noteMatch[0], '');
  }

  // Làm sạch các dấu gạch nối và khoảng trắng thừa còn lại, bóc sạch mọi thẻ vuông còn sót lại
  const cleanAddress = remainingText
    .replace(/\[[^\]]+\]/g, '')
    .replace(/^(\s*-\s*)+/, '')
    .replace(/(\s*-\s*)+$/, '')
    .replace(/\s*-\s*-\s*/g, ' - ')
    .trim();

  // 6. Fallback thông minh nếu không có thẻ [VẬN CHUYỂN] từ trước
  if (!shippingMethod) {
    const isHcm = /hồ chí minh|tp\.hcm|tphcm|tp hcm|sài gòn|bình thạnh|gò vấp|tân bình|phú nhuận|quận\s*[1-9]|q\.[1-9]/i.test(cleanAddress);
    if (isHcm) {
      shippingMethod = "Shipper riêng DE'GENT - Ship thường trong ngày";
      shippingFee = shippingFee || '40.000 ₫';
    } else {
      shippingMethod = "Giao hàng tiêu chuẩn toàn quốc (Viettel Post)";
      shippingFee = shippingFee || '30.000 ₫';
    }
  }

  return {
    cleanAddress: cleanAddress || 'Chưa có thông tin địa chỉ',
    orderNote,
    shippingMethod,
    shippingFee,
    deliveryTimeSlot,
    isExpress,
    dealTag,
    voucherCode,
    membershipTag,
    codInfo,
  };
}

function ZaloIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 2.22.724 4.27 1.95 5.935L2.55 21.432a.6.6 0 00.77.77l3.51-1.394A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
        fill="white"
      />
      <path
        d="M13.8 15h-4.3a.7.7 0 01-.56-1.12l2.6-3.48H9.3a.7.7 0 010-1.4h4.3a.7.7 0 01.56 1.12l-2.6 3.48h2.24a.7.7 0 110 1.4z"
        fill="#0068FF"
      />
    </svg>
  );
}

interface PhoneZaloContactProps {
  phone?: string | null;
  className?: string;
  badgeSize?: 'sm' | 'md';
}

function PhoneZaloContact({ phone, className = '' }: PhoneZaloContactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean; arrowLeft: number }>({
    top: 0,
    left: 0,
    openUp: true,
    arrowLeft: 110,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const cleanPhone = (phone || '').replace(/\D/g, '');

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 230;
    const popoverHeight = 44;

    const openUp = rect.top >= popoverHeight + 12;
    const top = openUp ? rect.top - popoverHeight - 8 : rect.bottom + 8;

    const centerLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    const left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, centerLeft));
    const arrowLeft = rect.left + rect.width / 2 - left;

    setCoords({ top, left, openUp, arrowLeft });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        (!popoverRef.current || !popoverRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanPhone || phone || '');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!phone || !cleanPhone) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer inline-flex items-center gap-1 select-none ${
          isOpen
            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 font-bold shadow-xs'
            : 'text-slate-800 hover:text-blue-600 hover:bg-blue-50/80 active:scale-95'
        }`}
        title={isOpen ? 'Nhấn để đóng thao tác' : 'Nhấn để mở liên hệ Zalo & sao chép'}
      >
        <span>{phone}</span>
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className="animate-zalo-pop pointer-events-auto"
        >
          <div className="relative bg-slate-900/95 text-white backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-1.5 select-none text-xs">
            {/* Zalo Button */}
            <a
              href={`https://zalo.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0068FF] hover:bg-[#0054d1] text-white font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
              title={`Mở Zalo chat với số ${phone}`}
            >
              <ZaloIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Zalo</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80 shrink-0" />
            </a>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-700 shrink-0" />

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                copied
                  ? 'bg-emerald-500/25 text-emerald-400 font-bold'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Sao chép số điện thoại"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>Sao chép</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-700 shrink-0" />

            {/* Call Button */}
            <a
              href={`tel:${cleanPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title={`Gọi điện đến số ${phone}`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Gọi</span>
            </a>

            {/* Arrow pointing at the phone button */}
            {coords.openUp ? (
              <div
                style={{ left: `${Math.max(12, Math.min(coords.arrowLeft, 218))}px` }}
                className="absolute top-full -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900"
              />
            ) : (
              <div
                style={{ left: `${Math.max(12, Math.min(coords.arrowLeft, 218))}px` }}
                className="absolute bottom-full -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-slate-900"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('header');
  const [monitorSubTab, setMonitorSubTab] = useState<MonitorSubTab>('returns');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // System Theme Mode (Light / Dark)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('caishop_admin_theme_mode') as ThemeMode;
      if (savedMode === 'dark' || savedMode === 'light') {
        setThemeMode(savedMode);
        document.documentElement.setAttribute('data-theme', savedMode);
        document.documentElement.classList.toggle('dark', savedMode === 'dark');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setThemeMode('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.classList.toggle('dark', true);
        }
      }
    }
  }, []);

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caishop_admin_theme_mode', mode);
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
    setContentToast(mode === 'dark' ? '✓ Đã kích hoạt Giao diện Tối (Dark Mode)' : '✓ Đã kích hoạt Giao diện Sáng (Light Mode)');
    setTimeout(() => setContentToast(null), 3000);
    setIsThemeMenuOpen(false);
  };

  const getNavTabStyle = (tabId: AdminTab) => {
    if (activeTab === tabId) {
      return themeMode === 'dark'
        ? {
          backgroundColor: '#1e293b',
          color: '#38bdf8',
          borderLeft: '2.5px solid #38bdf8',
          paddingLeft: '0.625rem'
        }
        : {
          backgroundColor: '#f1f5f9',
          color: '#0f172a',
          borderLeft: '2.5px solid #0f172a',
          paddingLeft: '0.625rem'
        };
    }
    return undefined;
  };

  const getNavIconStyle = (tabId: AdminTab) => {
    if (activeTab === tabId) {
      return { color: themeMode === 'dark' ? '#38bdf8' : '#0f172a' };
    }
    return undefined;
  };

  // Data States
  const [cashflow, setCashflow] = useState<CashFlowSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [customers, setCustomers] = useState<CustomerRankItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'RETURNED' | 'PACKING' | 'DELIVERED' | 'UNFULFILLED'>('ALL');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Order Detail Modal State
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [isCustomerInfoCollapsed, setIsCustomerInfoCollapsed] = useState(false);

  useEffect(() => {
    if (selectedOrderForDetail?.id) {
      if (!Array.isArray(selectedOrderForDetail.items) || selectedOrderForDetail.items.length === 0) {
        setLoadingOrderDetail(true);
        fetch(`/api/orders?id=${encodeURIComponent(selectedOrderForDetail.id)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setSelectedOrderForDetail((prev: any) => ({
                ...prev,
                ...data.data,
              }));
            }
          })
          .catch(console.error)
          .finally(() => setLoadingOrderDetail(false));
      }
    }
  }, [selectedOrderForDetail?.id]);

  // Zoomed Image Lightbox State
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title?: string; subtitle?: string } | null>(null);
  const [copyImageToast, setCopyImageToast] = useState<string | null>(null);
  const [isCopyingImage, setIsCopyingImage] = useState(false);

  // Dispatch / Tracking Modal State
  const [dispatchOrderModal, setDispatchOrderModal] = useState<{
    order: any;
    carrier: string;
    trackingCode: string;
  } | null>(null);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  const handleOpenDispatchModal = (order: any) => {
    const initialCarrier = order.carrier || 'VIETTEL_POST';
    const defaultTracking = order.tracking_code || '';
    setDispatchOrderModal({
      order,
      carrier: initialCarrier,
      trackingCode: defaultTracking,
    });
  };

  const handleCarrierChange = (newCarrier: string) => {
    if (!dispatchOrderModal) return;
    const rawOrderCode = (dispatchOrderModal.order.order_code || '').replace(/\D/g, '') || '881865';
    let suggestedCode = dispatchOrderModal.trackingCode;
    if (suggestedCode && (suggestedCode.startsWith('VTP') || suggestedCode.startsWith('S') || suggestedCode.startsWith('GHN') || suggestedCode.startsWith('DGT'))) {
      suggestedCode = newCarrier === 'VIETTEL_POST' ? `VTP${rawOrderCode}VN` :
        newCarrier === 'GHTK' ? `S${rawOrderCode}.GHTK` :
        newCarrier === 'GHN' ? `GHN${rawOrderCode}` :
        `DGT-SHIP-${rawOrderCode}`;
    }
    setDispatchOrderModal({
      ...dispatchOrderModal,
      carrier: newCarrier,
      trackingCode: suggestedCode,
    });
  };

  const handleSubmitDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dispatchOrderModal) return;
    const { order, carrier, trackingCode } = dispatchOrderModal;
    if (!trackingCode.trim()) {
      showToast('Vui lòng nhập mã vận đơn.', 'warning');
      return;
    }

    setIsSubmittingDispatch(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH_ORDER',
          order_id: order.id,
          carrier,
          tracking_code: trackingCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? {
          ...o,
          fulfillment_status: 'DISPATCHED',
          carrier,
          tracking_code: trackingCode.trim().toUpperCase(),
        } : o));

        if (selectedOrderForDetail?.id === order.id) {
          setSelectedOrderForDetail((prev: any) => ({
            ...prev,
            fulfillment_status: 'DISPATCHED',
            carrier,
            tracking_code: trackingCode.trim().toUpperCase(),
          }));
        }
        setDispatchOrderModal(null);
        showToast(data.message || `Đã lên đơn thành công! Mã vận đơn ${trackingCode.trim().toUpperCase()} (${carrier}) đã được lưu và gửi đến khách hàng.`, 'success', 5000);
      } else {
        showToast(data.message || 'Lỗi khi lên đơn.', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const [isConfirmingDelivered, setIsConfirmingDelivered] = useState(false);

  const handleAdminConfirmDelivered = async (order: any) => {
    if (!order?.id) return;
    if (order.fulfillment_status === 'DELIVERED') {
      showToast('Đơn hàng này đã được xác nhận nhận hàng trước đó.', 'warning');
      return;
    }
    setIsConfirmingDelivered(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_DELIVERY',
          order_id: order.id,
          is_admin: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? {
          ...o,
          fulfillment_status: 'DELIVERED',
          payment_status: 'PAID',
        } : o));

        if (selectedOrderForDetail?.id === order.id) {
          setSelectedOrderForDetail((prev: any) => ({
            ...prev,
            fulfillment_status: 'DELIVERED',
            payment_status: 'PAID',
          }));
        }
        showToast(data.message || `Đã xác nhận khách đã nhận đơn ${order.order_code || ''} thành công!`, 'success', 5000);
      } else {
        showToast(data.message || 'Không thể xác nhận nhận hàng.', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
    } finally {
      setIsConfirmingDelivered(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) {
        setZoomedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

  const handleCopyImageToClipboard = async (imageUrl: string) => {
    setIsCopyingImage(true);
    try {
      const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : (typeof window !== 'undefined' ? window.location.origin + imageUrl : imageUrl);

      const res = await fetch(fullUrl);
      const blob = await res.blob();

      let pngBlob: Blob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = fullUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const converted = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
          if (converted) pngBlob = converted;
        }
      }

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob })
        ]);
        setCopyImageToast('✓ Đã sao chép hình ảnh vào Clipboard! Bạn có thể dán (Ctrl+V) vào Zalo, chat.');
      } else {
        await navigator.clipboard.writeText(fullUrl);
        setCopyImageToast('✓ Đã sao chép liên kết hình ảnh vào Clipboard!');
      }
    } catch (err) {
      console.warn('Direct image copy failed, copying URL fallback:', err);
      try {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : window.location.origin + imageUrl;
        await navigator.clipboard.writeText(fullUrl);
        setCopyImageToast('✓ Đã sao chép link ảnh (hoặc nhấp chuột phải vào ảnh chọn "Sao chép hình ảnh")');
      } catch {
        setCopyImageToast('Vui lòng nhấp chuột phải vào ảnh và chọn "Sao chép hình ảnh" (Copy image).');
      }
    } finally {
      setIsCopyingImage(false);
      setTimeout(() => setCopyImageToast(null), 3500);
    }
  };

  const handleCopyImageUrl = async (imageUrl: string) => {
    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : window.location.origin + imageUrl;
      await navigator.clipboard.writeText(fullUrl);
      setCopyImageToast('✓ Đã sao chép liên kết hình ảnh!');
      setTimeout(() => setCopyImageToast(null), 3000);
    } catch {
      setCopyImageToast('Không thể sao chép liên kết.');
      setTimeout(() => setCopyImageToast(null), 3000);
    }
  };

  const handleDownloadImage = (imageUrl: string, title?: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = (title || 'san-pham').toLowerCase().replace(/\s+/g, '-') + '.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // CMS Content States
  const [cmsContent, setCmsContent] = useState<any>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success', duration = 4000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    const cleanMsg = message.replace(/^[✓⚠✅❌\s]+/, '');
    setNotificationToast({ message: cleanMsg, type });
    toastTimeoutRef.current = setTimeout(() => {
      setNotificationToast(null);
    }, duration);
  };

  const setContentToast = (msg: string | null) => {
    if (!msg) {
      setNotificationToast(null);
    } else {
      const type = msg.includes('⚠') || msg.toLowerCase().includes('lỗi') ? 'warning' : 'success';
      showToast(msg, type);
    }
  };

  const [homeActiveSection, setHomeActiveSection] = useState<'all' | 'hero' | 'marquee' | 'collection' | 'studio' | 'manifesto' | 'cta' | 'footer'>('all');

  // Admin Profile Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [tempProfile, setTempProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caishop_admin_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAdminProfile(parsed);
          setTempProfile(parsed);
        } catch (e) { }
      }
    }
  }, []);

  const handleOpenProfileModal = () => {
    setTempProfile({ ...adminProfile });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    setAdminProfile(tempProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caishop_admin_profile', JSON.stringify(tempProfile));
    }
    setTimeout(() => {
      setIsSavingProfile(false);
      setContentToast('✓ Cập nhật hồ sơ quản trị viên thành công!');
      setTimeout(() => setContentToast(null), 3000);
      setIsProfileModalOpen(false);
    }, 300);
  };

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Price Edit State
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [priceMessage, setPriceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stock Edit State
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStockQty, setNewStockQty] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfRes, invRes, ordRes, usrRes, cntRes, prdRes] = await Promise.all([
        fetch('/api/cashflow'),
        fetch('/api/inventory'),
        fetch('/api/orders'),
        fetch('/api/users'),
        fetch('/api/content'),
        fetch('/api/pricing')
      ]);

      const cfData = await cfRes.json();
      const invData = await invRes.json();
      const ordData = await ordRes.json();
      const usrData = await usrRes.json().catch(() => ({ success: false, data: [] }));
      const cntData = await cntRes.json().catch(() => ({ success: false, data: null }));
      const prdData = await prdRes.json().catch(() => ({ success: false, data: [] }));

      if (cfData.success) {
        setCashflow(cfData.summary);
        setTransactions(cfData.transactions);
      }
      if (invData.success) {
        setInventory(invData.data);
      }
      if (ordData.success) {
        setOrders(ordData.data);
      }
      if (usrData.success) {
        setUsers(usrData.data);
        if (usrData.customers) {
          setCustomers(usrData.customers);
        }
      }
      if (cntData.success && cntData.data) {
        setCmsContent(cntData.data);
      }
      if (prdData.success && prdData.data) {
        setAvailableProducts(prdData.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePriceUpdate = async (variantId: string) => {
    const priceNum = Number(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setPriceMessage({ type: 'error', text: 'Vui lòng nhập giá hợp lệ.' });
      return;
    }

    try {
      const res = await fetch('/api/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, selling_price: priceNum })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPriceMessage({ type: 'error', text: data.error || 'Cập nhật giá thất bại.' });
      } else {
        setPriceMessage({
          type: 'success',
          text: `Đã cập nhật giá thành công (${formatMoney(priceNum)})!`
        });
        setEditingVariant(null);
        setNewPrice('');
        fetchData();
      }
    } catch (err) {
      setPriceMessage({ type: 'error', text: 'Lỗi mạng khi cập nhật giá.' });
    }

    setTimeout(() => {
      setPriceMessage(null);
    }, 4000);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const existing = orders.find(o => o.id === orderId);
    if (existing && existing.fulfillment_status === 'DELIVERED' && newStatus !== 'DELIVERED') {
      showToast('Đơn hàng đã nhận thành công, không thể chuyển sang trạng thái khác!', 'warning');
      return;
    }

    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fulfillment_status: newStatus } : o));
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, fulfillment_status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Lỗi cập nhật trạng thái đơn hàng!', 'error');
        fetchData();
      } else {
        showToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
      fetchData();
    }
  };

  const isMockPaymentEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === 'true';
  const [mockLoadingId, setMockLoadingId] = useState<string | null>(null);
  const [confirmStockLoadingId, setConfirmStockLoadingId] = useState<string | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  const handleShopConfirmStock = async (orderId: string) => {
    setConfirmStockLoadingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action: 'SHOP_CONFIRM_STOCK' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => (o.id === orderId || o.order_code === orderId) ? { ...o, fulfillment_status: 'PACKING' } : o));
        if (selectedOrderForDetail?.id === orderId || selectedOrderForDetail?.order_code === orderId) {
          setSelectedOrderForDetail((prev: any) => ({ ...prev, fulfillment_status: 'PACKING' }));
        }
        await fetchData();
        showToast(data.message || 'Đã xác nhận còn hàng! Đơn hàng chuyển sang Chờ xử lý.', 'success');
      } else {
        showToast(data.message || 'Không thể xác nhận đơn hàng.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi kết nối khi xác nhận đơn.', 'error');
    } finally {
      setConfirmStockLoadingId(null);
    }
  };

  const handleOpenRefundModal = (order: any) => {
    setRefundModalOrder(order);
    setRefundNotes(`Shop hết hàng - Hoàn tiền ${formatMoney(order.total_amount)} về tài khoản ngân hàng của khách ${order.customer_name}`);
  };

  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return;
    setIsRefunding(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: refundModalOrder.id,
          action: 'SHOP_OUT_OF_STOCK_REFUND',
          refund_notes: refundNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => (o.id === refundModalOrder.id) ? { ...o, fulfillment_status: 'CANCELLED', payment_status: 'REFUNDED' } : o));
        if (selectedOrderForDetail?.id === refundModalOrder.id) {
          setSelectedOrderForDetail((prev: any) => ({ ...prev, fulfillment_status: 'CANCELLED', payment_status: 'REFUNDED' }));
        }
        await fetchData();
        showToast(data.message || 'Đã hủy đơn và hoàn tiền thành công!', 'success');
        setRefundModalOrder(null);
      } else {
        showToast(data.message || 'Không thể thực hiện hoàn tiền.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gửi yêu cầu hoàn tiền.', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleMockPayOrder = async (orderId: string) => {
    setMockLoadingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action: 'CONFIRM_PAYMENT' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData();
        showToast('Giả lập xác nhận thanh toán đơn hàng thành công!', 'success');
      } else {
        showToast(data.message || 'Không thể thực hiện thanh toán ảo.', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi khi giả lập thanh toán:', err);
      showToast('Lỗi kết nối khi giả lập thanh toán.', 'error');
    } finally {
      setMockLoadingId(null);
    }
  };

  const handleCreateMockOrder = async () => {
    setMockLoadingId('CREATE_NEW');
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_MOCK_ORDER' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData();
        showToast('Đã tạo đơn hàng test mẫu thành công!', 'success');
      } else {
        showToast(data.message || 'Không thể tạo đơn test.', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo đơn test:', err);
      showToast('Lỗi kết nối khi tạo đơn test.', 'error');
    } finally {
      setMockLoadingId(null);
    }
  };

  const handleStockUpdate = async (variantId: string) => {
    const qtyNum = Number(newStockQty);
    if (isNaN(qtyNum) || qtyNum < 0) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, physical_qty: qtyNum })
      });
      const data = await res.json();
      if (data.success) {
        setEditingStock(null);
        setNewStockQty('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CMS Save Handler
  const handleSaveCMS = async (section: string, data: any) => {
    setIsSavingContent(true);
    const payload = data || (cmsContent && cmsContent[section]) || {};
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data: payload })
      });
      const resData = await res.json();
      if (resData.success) {
        if (resData.data) {
          setCmsContent((prev: any) => ({ ...prev, [section]: resData.data }));
        }
        setContentToast(`✓ Đã lưu thay đổi cho mục "${section.toUpperCase()}" thành công!`);
        setTimeout(() => setContentToast(null), 3500);
      } else {
        setContentToast(`⚠ ${resData.error || 'Lỗi khi lưu nội dung.'}`);
        setTimeout(() => setContentToast(null), 4000);
      }
    } catch (err) {
      setContentToast('⚠ Lỗi kết nối khi lưu nội dung.');
      setTimeout(() => setContentToast(null), 4000);
    } finally {
      setIsSavingContent(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLowStockOnly ? item.is_low_stock : true;
    return matchesSearch && matchesFilter;
  });

  const lowStockCount = inventory.filter(i => i.is_low_stock).length;
  const criticalCount = inventory.filter(i => i.is_critical).length;
  const restockNeededItems = inventory.filter(i => i.is_low_stock);

  const tabTitles: Record<AdminTab, string> = {
    overview: 'Tổng quan điều hành',
    products: 'Quản lý sản phẩm & Biến thể',
    collections: 'Quản lý Bộ sưu tập & Phân cấp danh mục',
    monitor: 'Giám sát Sản phẩm & Hành vi Khách hàng',
    cashflow: 'Dòng tiền & Lợi nhuận',
    orders: 'Đơn hàng vận hành',
    pricing: 'Bộ điều khiển giá',
    deals: 'Quản lý Ưu đãi & Voucher (Deals)',
    customers: 'Khách hàng & Hội viên',
    content: 'Quản lý nội dung & Giao diện (CMS)',
    payment: 'Cấu hình thanh toán & Mã VietQR',
    settings: 'Cấu hình hạ tầng & Cơ sở dữ liệu'
  };

  return (
    <div
      data-theme={themeMode}
      className={`min-h-screen ${themeMode === 'dark' ? 'dark' : ''} bg-slate-50 text-slate-900 flex transition-colors duration-200`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= LEFT SIDEBAR (256px per ui-design-skill.md) ================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-screen md:sticky md:top-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-14 border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold tracking-wider transition-colors shadow-2xs ${themeMode === 'dark' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-white'
                }`}
            >
              DG
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900">DE&apos;GENT</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Bảng điều hành</div>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Admin Navigation">

          {/* BẢNG ĐIỀU KHIỂN CHÍNH */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Bảng điều khiển
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'overview'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('overview')}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" style={getNavIconStyle('overview')} />
                <span>Tổng quan</span>
              </button>
            </div>
          </div>

          {/* Group 1: TÀI CHÍNH & ĐƠN HÀNG */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Tài chính & Đơn hàng
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('cashflow'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'cashflow'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('cashflow')}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-slate-500" style={getNavIconStyle('cashflow')} />
                  <span>Dòng tiền & P&L</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'orders'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('orders')}
              >
                <ShoppingCart className="w-4 h-4 text-slate-500" style={getNavIconStyle('orders')} />
                <span>Đơn hàng vận hành</span>
              </button>

              <button
                onClick={() => { setActiveTab('payment'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'payment'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('payment')}
              >
                <CreditCard className="w-4 h-4 text-slate-500" style={getNavIconStyle('payment')} />
                <span>Thanh toán & VietQR</span>
              </button>
            </div>
          </div>

          {/* Group 2: SẢN PHẨM & BỘ SƯU TẬP */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Sản phẩm & Danh mục
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('products'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'products'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('products')}
              >
                <Tag className="w-4 h-4 text-slate-500" style={getNavIconStyle('products')} />
                <span>Sản phẩm & Biến thể</span>
              </button>

              <button
                onClick={() => { setActiveTab('collections'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'collections'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('collections')}
              >
                <FolderTree className="w-4 h-4 text-slate-500" style={getNavIconStyle('collections')} />
                <span>Bộ sưu tập (Phân cấp)</span>
              </button>

              <button
                onClick={() => { setActiveTab('monitor'); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'monitor'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('monitor')}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-500" style={getNavIconStyle('monitor')} />
                  <span>Giám sát & Đo lường</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-sky-100 text-sky-700 font-bold">
                    Live
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'monitor' ? 'rotate-180' : 'text-slate-400'}`} style={getNavIconStyle('monitor')} />
                </div>
              </button>

              {/* SUB-SIDEBAR: Tỉ lệ hoàn hàng & Hành vi khách hàng */}
              {activeTab === 'monitor' && (
                <div className="mt-1.5 ml-2 pl-2.5 border-l-2 border-slate-200 dark:border-slate-800 space-y-1 py-1 transition-all">
                  <button
                    onClick={() => { setMonitorSubTab('returns'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${monitorSubTab === 'returns'
                        ? 'text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    style={monitorSubTab === 'returns' ? { backgroundColor: themeMode === 'dark' ? '#38bdf8' : '#0f172a', color: themeMode === 'dark' ? '#0f172a' : '#ffffff' } : undefined}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Tỉ lệ hoàn hàng</span>
                  </button>

                  <button
                    onClick={() => { setMonitorSubTab('behavior'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${monitorSubTab === 'behavior'
                        ? 'text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    style={monitorSubTab === 'behavior' ? { backgroundColor: themeMode === 'dark' ? '#38bdf8' : '#0f172a', color: themeMode === 'dark' ? '#0f172a' : '#ffffff' } : undefined}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Hành vi khách hàng</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Group 3: CHIẾN LƯỢC & HỘI VIÊN */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Chiến lược & Hội viên
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('pricing'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'pricing'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('pricing')}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-500" style={getNavIconStyle('pricing')} />
                  <span>Bộ điều khiển giá</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('deals'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'deals'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('deals')}
              >
                <Ticket className="w-4 h-4 text-slate-500" style={getNavIconStyle('deals')} />
                <span>Ưu đãi & Voucher</span>
              </button>

              <button
                onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'customers'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('customers')}
              >
                <Users className="w-4 h-4 text-slate-500" style={getNavIconStyle('customers')} />
                <span>Khách hàng & Hội viên</span>
              </button>
            </div>
          </div>

          {/* Group 4: NỘI DUNG & GIAO DIỆN (CMS) */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Nội dung & Giao diện
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('content'); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'content'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('content')}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" style={getNavIconStyle('content')} />
                  <span>Quản lý nội dung</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'content' ? 'rotate-180' : 'text-slate-400'}`} style={getNavIconStyle('content')} />
              </button>

              {/* SUB-SIDEBAR: Mở ra ngay khi chọn Quản lý nội dung */}
              {activeTab === 'content' && (
                <div className="mt-1.5 ml-2 pl-2.5 border-l-2 border-slate-200 space-y-1 py-1 transition-all">
                  <button
                    onClick={() => { setContentSubTab('header'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab === 'header'
                        ? 'text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    style={contentSubTab === 'header' ? { backgroundColor: themeMode === 'dark' ? '#38bdf8' : '#0f172a', color: themeMode === 'dark' ? '#0f172a' : '#ffffff' } : undefined}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Thanh Menu Header</span>
                  </button>

                  <button
                    onClick={() => { setContentSubTab('home'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab !== 'header'
                        ? 'text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    style={contentSubTab !== 'header' ? { backgroundColor: themeMode === 'dark' ? '#38bdf8' : '#0f172a', color: themeMode === 'dark' ? '#0f172a' : '#ffffff' } : undefined}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Nội dung</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Group 5: HẠ TẦNG */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Hạ tầng & Hệ thống
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'settings'
                    ? 'font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                style={getNavTabStyle('settings')}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-500" style={getNavIconStyle('settings')} />
                  <span>Cơ sở dữ liệu</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Hệ thống trực tuyến" />
              </button>
            </div>
          </div>

        </nav>

        {/* Sidebar Footer Area */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          {/* Profile Card Button */}
          <button
            onClick={handleOpenProfileModal}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-all text-left cursor-pointer group shadow-2xs"
            title="Bấm để xem & chỉnh sửa hồ sơ quản trị viên"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 group-hover:scale-105 transition-all shadow-2xs ${themeMode === 'dark' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-white'
                  }`}
              >
                AD
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-900 truncate group-hover:text-slate-700">
                  {adminProfile.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {adminProfile.email}
                </div>
              </div>
            </div>

            <span
              className={`text-[9px] font-semibold font-mono px-1.5 py-0.5 rounded border shrink-0 transition-colors ${themeMode === 'dark'
                  ? 'bg-sky-950/60 text-sky-400 border-sky-800'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
            >
              ADMIN
            </span>
          </button>

          {/* Logout Button below Profile Card */}
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Control Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              aria-label="Mở menu thanh điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Bảng điều hành</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 text-sm">
                {tabTitles[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Light / Dark Theme Mode Switcher */}
            <button
              type="button"
              onClick={() => handleSelectThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all cursor-pointer shadow-2xs ${
                themeMode === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title={themeMode === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
              aria-label="Đổi chế độ Sáng / Tối hệ thống"
            >
              {themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-white fill-white shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-slate-500 fill-slate-500 shrink-0" />
              )}
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Đồng bộ</span>
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 w-full">

          {/* ================= TAB: TỔNG QUAN ĐIỀU HÀNH ================= */}
          {activeTab === 'overview' && (
            <OverviewSection
              cashflow={cashflow}
              transactions={transactions}
              inventory={inventory}
              orders={orders}
              customers={customers}
              loading={loading}
              onRefresh={fetchData}
              onNavigateTab={(tab) => setActiveTab(tab)}
              themeColor={themeMode === 'dark' ? '#38bdf8' : '#0f172a'}
            />
          )}

          {/* ================= TAB: QUẢN LÝ NỘI DUNG (CMS) ================= */}
          {activeTab === 'content' && (
            <div className="space-y-5">

              {/* Top CMS Header with Breadcrumb & Quick Route Tabs */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 font-mono text-slate-400 text-xs">
                    <Layout className="w-4 h-4 text-slate-700" />
                    <span className="font-semibold text-slate-900">CMS</span>
                    <span>/</span>
                  </div>

                  {/* Quick-switch sub-tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setContentSubTab('header')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab === 'header'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                        }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Thanh Menu Header</span>
                      <span className="text-[10px] font-mono opacity-80">({cmsContent?.header?.menu_items?.length || 4})</span>
                    </button>

                    <button
                      onClick={() => setContentSubTab('home')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab !== 'header'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Nội dung</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${contentSubTab !== 'header' ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                        }`}>7 khối</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xem storefront ↗</span>
                  </Link>
                </div>
              </div>

              {/* EDITOR WORKSPACE (Full Width) */}
              <div className="space-y-6">

                {/* SUB-TAB 1: HEADER NAVIGATION MENU */}
                {contentSubTab === 'header' && (
                  <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <header className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Cấu hình các mục trên Thanh Header
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quản lý các liên kết hiển thị phía góc trái của thanh Header như hình ảnh thực tế
                        </p>
                      </div>
                      <button
                        onClick={() => handleSaveCMS('header', cmsContent?.header)}
                        disabled={isSavingContent}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingContent ? 'Đang lưu...' : 'Lưu cấu hình Header'}</span>
                      </button>
                    </header>

                    <div className="p-5 space-y-6">

                      {/* LIVE PREVIEW OF STOREFRONT HEADER */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                          Mô phỏng hiển thị trên Storefront:
                        </div>
                        <div className="p-4 rounded-md border border-slate-300 bg-white flex items-center justify-between text-xs">
                          <div className="flex items-center gap-6 font-mono font-medium tracking-wider uppercase text-slate-900">
                            {cmsContent?.header?.menu_items
                              ?.filter((item: MenuItem) => item.is_active)
                              ?.map((item: MenuItem) => (
                                <span key={item.id} className="hover:underline cursor-default">
                                  {item.label}
                                </span>
                              ))}
                          </div>
                          <div className="font-bold text-sm tracking-widest text-slate-900">
                            DE&apos;GENT
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            (Search / Bag)
                          </div>
                        </div>
                      </div>

                      {/* TABLE OF MENU ITEMS */}
                      <div className="border border-slate-200 rounded-md overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                            <tr>
                              <th className="py-2.5 px-3 w-16 text-center">Thứ tự</th>
                              <th className="py-2.5 px-3">Tên mục (Label)</th>
                              <th className="py-2.5 px-3">Đường dẫn đích (URL / Anchor)</th>
                              <th className="py-2.5 px-3 text-center">Hiển thị</th>
                              <th className="py-2.5 px-3 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {cmsContent?.header?.menu_items?.map((item: MenuItem, idx: number) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => {
                                      const updated = [...cmsContent.header.menu_items];
                                      updated[idx].label = e.target.value;
                                      setCmsContent({ ...cmsContent, header: { ...cmsContent.header, menu_items: updated } });
                                    }}
                                    className="h-8 w-full rounded border border-slate-300 px-2 text-xs font-sans focus:border-slate-900 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={item.href}
                                    onChange={(e) => {
                                      const updated = [...cmsContent.header.menu_items];
                                      updated[idx].href = e.target.value;
                                      setCmsContent({ ...cmsContent, header: { ...cmsContent.header, menu_items: updated } });
                                    }}
                                    className="h-8 w-full rounded border border-slate-300 px-2 text-xs font-mono text-slate-700 focus:border-slate-900 focus:outline-none"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.is_active}
                                    onChange={(e) => {
                                      const updated = [...cmsContent.header.menu_items];
                                      updated[idx].is_active = e.target.checked;
                                      setCmsContent({ ...cmsContent, header: { ...cmsContent.header, menu_items: updated } });
                                    }}
                                    className="w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      const updated = cmsContent.header.menu_items.filter((_: any, i: number) => i !== idx);
                                      setCmsContent({ ...cmsContent, header: { ...cmsContent.header, menu_items: updated } });
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Xóa mục này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Item Button */}
                      <div className="flex justify-between items-center pt-2">
                        <button
                          onClick={() => {
                            const newId = String(Date.now());
                            const newItem: MenuItem = {
                              id: newId,
                              label: 'NEW TAB',
                              href: '/#',
                              is_active: true,
                              order: (cmsContent?.header?.menu_items?.length || 0) + 1
                            };
                            const updated = [...(cmsContent?.header?.menu_items || []), newItem];
                            setCmsContent({ ...cmsContent, header: { ...cmsContent.header, menu_items: updated } });
                          }}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm liên kết Menu mới</span>
                        </button>

                        <span className="text-[11px] text-slate-400">
                          Các mục sẽ cập nhật tức thời khi nhấn "Lưu cấu hình Header".
                        </span>
                      </div>

                    </div>
                  </section>
                )}

                {/* SUB-TAB 2: HOME ROUTE CONTENT (FULL PAGE 7 SECTIONS) */}
                {contentSubTab === 'home' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Form Editor with Section Tabs */}
                    <div className="xl:col-span-6 space-y-4">
                      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        {/* Header with Title and Save Button */}
                        <header className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                Nội dung Toàn bộ Trang chủ (Route: <span className="font-mono text-slate-500">/</span>)
                              </h3>
                              <span className="text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded font-medium">
                                7 khối nội dung
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Chỉnh sửa toàn diện từ Hero banner, dải Marquee, Bộ sưu tập, Studio, Tuyên ngôn đến CTA & Chân trang
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveCMS('home', cmsContent?.home)}
                            disabled={isSavingContent}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingContent ? 'Đang lưu...' : 'Lưu toàn bộ Trang chủ'}</span>
                          </button>
                        </header>

                        {/* Quick Section Tabs */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50/70 overflow-x-auto">
                          <div className="flex items-center gap-1.5 min-w-max text-[11px] font-medium">
                            {[
                              { id: 'all', label: 'Tất cả (7 khối)' },
                              { id: 'hero', label: '1. Hero Banner' },
                              { id: 'marquee', label: '2. Marquee' },
                              { id: 'collection', label: '3. Bộ sưu tập' },
                              { id: 'studio', label: '4. Studio (#studio)' },
                              { id: 'manifesto', label: '5. Tuyên ngôn' },
                              { id: 'cta', label: '6. Kêu gọi CTA' },
                              { id: 'footer', label: '7. Chân trang' },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                  setHomeActiveSection(tab.id as any);
                                  if (tab.id !== 'all') {
                                    const el = document.getElementById(`preview-home-sec-${tab.id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${homeActiveSection === tab.id
                                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                                  : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-5 space-y-6 text-xs divide-y divide-slate-100">
                          {/* KHỐI 1: HERO BANNER & GIỚI THIỆU */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'hero') && (
                            <div className="space-y-4 pt-2 first:pt-0">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono">1</span>
                                  <span>Khối Hero & Mở đầu (Editorial Display Hero)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Anchor: #hero</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Dòng huy hiệu Hero (Badge):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.hero_badge || ''}
                                  placeholder="COLLECTION 01 / THE INTERFACE SERIES"
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, hero_badge: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Tiêu đề Hero lớn (Display Title):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.hero_title || ''}
                                  placeholder="DESIGN, CUT TO MEASURE."
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, hero_title: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Đoạn văn mở đầu (Hero Description):</label>
                                <textarea
                                  rows={3}
                                  value={cmsContent?.home?.hero_description || ''}
                                  placeholder="An editorial retail experiment constructed for autonomous commerce..."
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, hero_description: e.target.value }
                                  })}
                                  className="w-full rounded border border-slate-300 p-3 leading-relaxed focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                  <label className="font-medium text-slate-700">Hình ảnh minh họa Hero (Lookbook Image URL):</label>
                                  <span className="text-[10px] font-mono text-slate-400">Tỉ lệ 3:4 Monochrome</span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.hero_image_url || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1793010652/degent/hero/wciimhf9kopgdhvpmjtv.png'}
                                    placeholder="https://res.cloudinary.com/... hoặc https://..."
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, hero_image_url: e.target.value }
                                    })}
                                    className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                  {cmsContent?.home?.hero_image_url && (
                                    <div className="w-9 h-9 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                      <img
                                        src={cmsContent.home.hero_image_url}
                                        alt="Thumb"
                                        className="w-full h-full object-cover"
                                        onError={(e: any) => { e.target.style.display = 'none'; }}
                                      />
                                    </div>
                                  )}
                                </div>
                                {/* Quick Presets */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-slate-400">Gợi ý ảnh đẹp:</span>
                                  {[
                                    { label: 'Bước chân phố đêm (Mới)', url: 'https://res.cloudinary.com/tkfku9hx/image/upload/v1793010652/degent/hero/wciimhf9kopgdhvpmjtv.png' },
                                    { label: 'Atelier Model (Gốc)', url: 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg' },
                                    { label: 'Áo măng tô Đen', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85' },
                                    { label: 'Minimal Tailoring', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85' },
                                    { label: 'Studio Monochrome', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85' },
                                  ].map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() => setCmsContent({
                                        ...cmsContent,
                                        home: { ...cmsContent.home, hero_image_url: preset.url }
                                      })}
                                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                                    >
                                      + {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Nút hành động 1:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.hero_cta_1 || 'Săn đồ hiệu ngay'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, hero_cta_1: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Nút hành động 2:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.hero_cta_2 || 'Bảng chọn size chuẩn'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, hero_cta_2: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Dải 4 Khung Quy Trình / 4-Plate Process Strip */}
                              <div className="space-y-3 pt-4 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                  <label className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                                    <span>Dải 4 Khung Quy trình (Process Strip ngay dưới Hero):</span>
                                  </label>
                                  <span className="text-[10px] font-mono text-slate-400">4 Khung Monochrome</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Khung 1 */}
                                  <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Khung 1 (Dòng Cá Sấu)</span>
                                      <span className="text-[9px] font-mono text-slate-400">001 Áo Polo</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Số hiệu:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate1_num || '001'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate1_num: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Nhãn bước:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate1_tag || 'Áo Polo'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate1_tag: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Tiêu đề:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate1_title || 'DÒNG CÁ SẤU'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate1_title: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-semibold text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Logo hover:</label>
                                        <input
                                          type="text"
                                          placeholder="https://res.cloudinary.com/..."
                                          value={cmsContent?.home?.hero_plate1_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863867/degent/lacoste.png'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate1_logo: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-[11px] focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Khung 2 (Tương phản đen) */}
                                  <div className="p-3 rounded border border-slate-800 bg-slate-900 text-white space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">Khung 2 (Dòng Xi-Kê)</span>
                                      <span className="text-[9px] font-mono text-slate-400">002 Denim & Tee</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-400 block">Số hiệu:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate2_num || '002'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate2_num: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-700 px-2 font-mono text-xs focus:border-white focus:outline-none bg-slate-800 text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-400 block">Nhãn bước:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate2_tag || 'Denim & Tee'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate2_tag: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-700 px-2 font-mono text-xs focus:border-white focus:outline-none bg-slate-800 text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-400 block">Tiêu đề:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate2_title || 'DÒNG XI-KÊ'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate2_title: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-700 px-2 font-semibold text-xs focus:border-white focus:outline-none bg-slate-800 text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-400 block">Logo hover:</label>
                                        <input
                                          type="text"
                                          placeholder="https://res.cloudinary.com/..."
                                          value={cmsContent?.home?.hero_plate2_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863868/degent/ck.png'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate2_logo: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-700 px-2 font-mono text-[11px] focus:border-white focus:outline-none bg-slate-800 text-white"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Khung 3 */}
                                  <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Khung 3 (Dòng Tô-Mì)</span>
                                      <span className="text-[9px] font-mono text-slate-400">003 Phong cách Mỹ</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Số hiệu:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate3_num || '003'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate3_num: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Nhãn bước:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate3_tag || 'Phong cách Mỹ'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate3_tag: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Tiêu đề:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate3_title || 'DÒNG TÔ-MÌ'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate3_title: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-semibold text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Logo hover:</label>
                                        <input
                                          type="text"
                                          placeholder="https://res.cloudinary.com/..."
                                          value={cmsContent?.home?.hero_plate3_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863869/degent/tommy.png'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate3_logo: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-[11px] focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Khung 4 */}
                                  <div className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Khung 4 (Dòng Lê-Vy)</span>
                                      <span className="text-[9px] font-mono text-slate-400">004 Jeans Đinh Tán</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Số hiệu:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate4_num || '004'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate4_num: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Nhãn bước:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate4_tag || 'Jeans Đinh Tán'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate4_tag: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Tiêu đề:</label>
                                        <input
                                          type="text"
                                          value={cmsContent?.home?.hero_plate4_title || 'DÒNG LÊ-VY'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate4_title: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-semibold text-xs focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">Logo hover:</label>
                                        <input
                                          type="text"
                                          placeholder="https://res.cloudinary.com/..."
                                          value={cmsContent?.home?.hero_plate4_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863870/degent/levis.png'}
                                          onChange={(e) => setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, hero_plate4_logo: e.target.value }
                                          })}
                                          className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-[11px] focus:border-slate-900 focus:outline-none bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* KHỐI 2: DẢI CHỮ MARQUEE VÔ TẬN */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'marquee') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono">2</span>
                                  <span>Dải băng chữ chạy Marquee vô tận</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Continuous Ticker</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Nội dung dòng chữ chạy Marquee:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.marquee_text || ''}
                                  placeholder="ATELIER • AUTONOMOUS MONOCHROME COMMERCE • ARCHIVE EDITIONS • CUT TO MEASURE •"
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, marquee_text: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* KHỐI 3: BỘ SƯU TẬP SẢN PHẨM TRANG CHỦ & SẢN PHẨM HOT */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'collection') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-mono">3</span>
                                  <span>Khối Bộ sưu tập & Sản phẩm HOT (Editorial Grid)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Anchor: #product</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Dòng phân hiệu bộ sưu tập (Badge):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.collection_badge || 'The Product Collection'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, collection_badge: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Tiêu đề bộ sưu tập (Headline):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.collection_title || 'Looks of the season'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, collection_title: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              {/* HƯỚNG DẪN CẤU HÌNH HÌNH ẢNH SẢN PHẨM */}
                              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-2">
                                <div className="font-semibold text-amber-900 flex items-center justify-between flex-wrap gap-2">
                                  <span className="flex items-center gap-1.5 text-xs font-bold">
                                    <span>📸</span>
                                    <span>Hình ảnh sản phẩm của khối này:</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('products')}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                  >
                                    <Package className="w-3.5 h-3.5" />
                                    <span>Đến mục Kho & Sản phẩm để đổi ảnh ↗</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                  Hình ảnh hiển thị ở khối này được liên kết tự động từ <strong>ảnh đại diện của từng sản phẩm trong hệ thống</strong>. Để cập nhật hình ảnh cho từng mẫu (Áo thun, Sơ mi, Quần Jean...), bạn hãy bấm vào nút <strong>&quot;Đến mục Kho &amp; Sản phẩm để đổi ảnh&quot;</strong> ở trên, chọn sản phẩm cần sửa và tải ảnh mới lên.
                                </p>
                              </div>

                              {/* CHỌN SẢN PHẨM HOT */}
                              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                      <span className="text-sm">🔥</span>
                                      <span>Cài đặt những sản phẩm đang HOT:</span>
                                    </label>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Các sản phẩm được chọn sẽ xuất hiện tại khối Lookbook trang chủ với huy hiệu <span className="text-rose-600 font-bold font-mono">🔥 HOT</span> (Đang chọn: <strong className="text-slate-900 font-mono">{(cmsContent?.home?.collection_hot_product_ids || []).length}</strong> sản phẩm).
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const top5 = availableProducts.slice(0, 5).map((p: any) => p.id);
                                        setCmsContent({
                                          ...cmsContent,
                                          home: {
                                            ...cmsContent.home,
                                            collection_hot_products_mode: 'manual',
                                            collection_hot_product_ids: top5
                                          }
                                        });
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                                    >
                                      Chọn 5 mẫu (1 hàng)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const top10 = availableProducts.slice(0, 10).map((p: any) => p.id);
                                        setCmsContent({
                                          ...cmsContent,
                                          home: {
                                            ...cmsContent.home,
                                            collection_hot_products_mode: 'manual',
                                            collection_hot_product_ids: top10
                                          }
                                        });
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                                    >
                                      Chọn 10 mẫu (2 hàng)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCmsContent({
                                          ...cmsContent,
                                          home: {
                                            ...cmsContent.home,
                                            collection_hot_products_mode: 'manual',
                                            collection_hot_product_ids: []
                                          }
                                        });
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    >
                                      Bỏ chọn
                                    </button>
                                  </div>
                                </div>

                                {/* Chế độ lọc */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                    (cmsContent?.home?.collection_hot_products_mode || 'manual') === 'manual'
                                      ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900 ring-1 ring-slate-900/10'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-50/50'
                                  }`}>
                                    <input
                                      type="radio"
                                      name="hot_products_mode"
                                      value="manual"
                                      checked={(cmsContent?.home?.collection_hot_products_mode || 'manual') === 'manual'}
                                      onChange={() => setCmsContent({
                                        ...cmsContent,
                                        home: { ...cmsContent.home, collection_hot_products_mode: 'manual' }
                                      })}
                                      className="accent-slate-900"
                                    />
                                    <span>Ghim các sản phẩm HOT được chọn</span>
                                  </label>

                                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                    cmsContent?.home?.collection_hot_products_mode === 'all'
                                      ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900 ring-1 ring-slate-900/10'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-50/50'
                                  }`}>
                                    <input
                                      type="radio"
                                      name="hot_products_mode"
                                      value="all"
                                      checked={cmsContent?.home?.collection_hot_products_mode === 'all'}
                                      onChange={() => setCmsContent({
                                        ...cmsContent,
                                        home: { ...cmsContent.home, collection_hot_products_mode: 'all' }
                                      })}
                                      className="accent-slate-900"
                                    />
                                    <span>Hiển thị tất cả sản phẩm</span>
                                  </label>
                                </div>

                                {/* Danh sách sản phẩm cho phép toggle HOT */}
                                {(cmsContent?.home?.collection_hot_products_mode || 'manual') === 'manual' && (
                                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40 max-h-96 overflow-y-auto">
                                    {availableProducts.length === 0 ? (
                                      <div className="py-6 text-center text-xs text-slate-400">
                                        Đang tải danh sách sản phẩm từ hệ thống...
                                      </div>
                                    ) : (
                                      availableProducts.map((prod: any) => {
                                        const hotIds: string[] = cmsContent?.home?.collection_hot_product_ids || [];
                                        const isHot = hotIds.includes(prod.id);
                                        const hotIndex = hotIds.indexOf(prod.id);
                                        const minPrice = prod.variants?.length
                                          ? Math.min(...prod.variants.map((v: any) => v.selling_price))
                                          : 0;
                                        const thumbImg = prod.image_url ? prod.image_url.split(',')[0] : 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg';

                                        const toggleHot = () => {
                                          let updated = [...hotIds];
                                          if (isHot) {
                                            updated = updated.filter(id => id !== prod.id);
                                          } else {
                                            updated.push(prod.id);
                                          }
                                          setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, collection_hot_product_ids: updated }
                                          });
                                        };

                                        const moveUp = (e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          if (hotIndex <= 0) return;
                                          const updated = [...hotIds];
                                          const temp = updated[hotIndex - 1];
                                          updated[hotIndex - 1] = updated[hotIndex];
                                          updated[hotIndex] = temp;
                                          setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, collection_hot_product_ids: updated }
                                          });
                                        };

                                        const moveDown = (e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          if (hotIndex < 0 || hotIndex >= hotIds.length - 1) return;
                                          const updated = [...hotIds];
                                          const temp = updated[hotIndex + 1];
                                          updated[hotIndex + 1] = updated[hotIndex];
                                          updated[hotIndex] = temp;
                                          setCmsContent({
                                            ...cmsContent,
                                            home: { ...cmsContent.home, collection_hot_product_ids: updated }
                                          });
                                        };

                                        return (
                                          <div
                                            key={prod.id}
                                            onClick={toggleHot}
                                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                              isHot
                                                ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/40 shadow-2xs'
                                                : 'bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                                            }`}
                                          >
                                            <div className="flex items-center gap-3 min-w-0">
                                              <div className="relative w-12 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                <img
                                                  src={thumbImg}
                                                  alt={prod.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <h5 className="text-xs font-bold text-slate-900 truncate">
                                                    {prod.name}
                                                  </h5>
                                                  {isHot && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0 font-mono flex items-center gap-0.5">
                                                      <span>🔥</span>
                                                      <span>NO. 0{hotIndex + 1}</span>
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                  <span className="font-medium text-slate-600">{prod.category}</span>
                                                  <span>•</span>
                                                  <span className="font-mono text-slate-700">{formatMoney(minPrice)}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              {isHot && (
                                                <div className="flex items-center gap-0.5 mr-1" onClick={e => e.stopPropagation()}>
                                                  <button
                                                    type="button"
                                                    onClick={moveUp}
                                                    disabled={hotIndex === 0}
                                                    title="Đưa lên vị trí trước"
                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                                  >
                                                    ▲
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={moveDown}
                                                    disabled={hotIndex === hotIds.length - 1}
                                                    title="Đưa xuống vị trí sau"
                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                                  >
                                                    ▼
                                                  </button>
                                                </div>
                                              )}

                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleHot();
                                                }}
                                                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                                  isHot
                                                    ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                              >
                                                {isHot ? '🔥 Đang HOT' : '+ Đặt HOT'}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* KHỐI 4: PHÒNG THỬ ĐỒ STUDIO & FITTING ROOM */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'studio') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono">4</span>
                                  <span>Khối Phòng thử đồ Studio (Dark Split View)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Anchor: #studio</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Huy hiệu phân khu:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.studio_badge || cmsContent?.studio?.badge || 'The Fitting Room'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, studio_badge: e.target.value },
                                    studio: { ...cmsContent.studio, badge: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Tiêu đề Studio:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.studio_title || cmsContent?.studio?.title || 'Crafted at the edge. Verified by code.'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, studio_title: e.target.value },
                                    studio: { ...cmsContent.studio, title: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Đoạn văn mô tả Studio:</label>
                                <textarea
                                  rows={3}
                                  value={cmsContent?.home?.studio_narrative || cmsContent?.studio?.narrative || 'Mỗi chiếc Polo Cá Sấu, quần jeans Lê-Vy hay áo thun Xi-Kê đều được chúng tôi kiểm tra kỹ lưỡng độ co giãn, form dáng thực tế và mã vạch trước khi lên kệ. Đặt hàng qua mã VietQR động, hệ thống tự động xác thực thanh toán sau 3 giây để đóng gói giao ngay.'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, studio_narrative: e.target.value },
                                    studio: { ...cmsContent.studio, narrative: e.target.value }
                                  })}
                                  className="w-full rounded border border-slate-300 p-3 leading-relaxed focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Thông số Web Canvas:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.studio_canvas || cmsContent?.studio?.spec_canvas || 'Form Á / Âu chuẩn size'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, studio_canvas: e.target.value },
                                      studio: { ...cmsContent.studio, spec_canvas: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Thông số Inventory Engine:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.studio_ledger || cmsContent?.studio?.spec_ledger || 'Hệ thống kho vận toàn quốc (Hà Nội & TP.HCM)'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, studio_ledger: e.target.value },
                                      studio: { ...cmsContent.studio, spec_ledger: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* KHỐI 5: TUYÊN NGÔN THƯƠNG HIỆU MANIFESTO */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'manifesto') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono">5</span>
                                  <span>Khối Tuyên ngôn Thương hiệu (Centered Manifesto)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Anchor: #manifesto</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Dòng huy hiệu (Badge):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.manifesto_badge || cmsContent?.about?.badge || 'Manifesto'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, manifesto_badge: e.target.value },
                                    about: { ...cmsContent.about, badge: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Trích dẫn tuyên ngôn (Quote):</label>
                                <textarea
                                  rows={3}
                                  value={cmsContent?.home?.manifesto_quote || cmsContent?.about?.body_text || 'True luxury is not ornament. It is the absolute precision of cut, material integrity, and silent execution.'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, manifesto_quote: e.target.value },
                                    about: { ...cmsContent.about, body_text: e.target.value }
                                  })}
                                  className="w-full rounded border border-slate-300 p-3 leading-relaxed focus:border-slate-900 focus:outline-none italic"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Dòng chữ ký thương hiệu:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.manifesto_signature || cmsContent?.about?.signature || "DE'GENT Architecture 2026"}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, manifesto_signature: e.target.value },
                                    about: { ...cmsContent.about, signature: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* KHỐI 6: KÊU GỌI HÀNH ĐỘNG (CTA) */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'cta') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-mono">6</span>
                                  <span>Khối Kêu gọi Hành động (Dark Full-Bleed CTA)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Fitting Sequence</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Huy hiệu CTA:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.cta_badge || 'Begin the sequence'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, cta_badge: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Tiêu đề kêu gọi (Headline):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.cta_title || 'Begin your first fitting.'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, cta_title: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Nhãn nút mua sắm:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.cta_button_text || 'Start shopping'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, cta_button_text: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-medium text-slate-700">Ghi chú thanh toán VietQR:</label>
                                  <input
                                    type="text"
                                    value={cmsContent?.home?.cta_note || 'Direct VietQR dynamic settlement • Instant ledger confirmation'}
                                    onChange={(e) => setCmsContent({
                                      ...cmsContent,
                                      home: { ...cmsContent.home, cta_note: e.target.value }
                                    })}
                                    className="h-8 w-full rounded border border-slate-300 px-2.5 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* KHỐI 7: CHÂN TRANG FOOTER */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'footer') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono">7</span>
                                  <span>Chân trang Storefront (Dark Editorial Footer)</span>
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">Global Footer</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Thông tin bản quyền (Copyright):</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.footer_copyright || "© 2026 DE'GENT. ALL RIGHTS RESERVED."}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, footer_copyright: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-medium text-slate-700">Địa chỉ xưởng & Studio:</label>
                                <input
                                  type="text"
                                  value={cmsContent?.home?.footer_address || 'Hanoi Flagship Studio • Edge Cloud Delivery'}
                                  onChange={(e) => setCmsContent({
                                    ...cmsContent,
                                    home: { ...cmsContent.home, footer_address: e.target.value }
                                  })}
                                  className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Right: Full-Length Scrollable Live Preview */}
                    <div className="xl:col-span-6 sticky top-20 space-y-2">
                      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
                        {/* Browser Mockup Chrome Bar with Quick Jump Navigation */}
                        <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                              </div>
                              <div className="bg-white border border-slate-200 px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-600 flex items-center gap-1.5 shadow-2xs">
                                <span className="text-emerald-500 font-bold">https://</span>
                                <span>degent.vn/</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Full-Page Preview
                            </span>
                          </div>

                          {/* Anchor Quick Jump Pills in Preview Header */}
                          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono pt-1 text-slate-500">
                            <span className="font-semibold text-slate-700 shrink-0">Cuộn nhanh:</span>
                            {[
                              { id: 'hero', label: '#Hero' },
                              { id: 'marquee', label: '#Marquee' },
                              { id: 'collection', label: '#SảnPhẩm' },
                              { id: 'studio', label: '#Studio' },
                              { id: 'manifesto', label: '#TuyênNgôn' },
                              { id: 'cta', label: '#CTA' },
                              { id: 'footer', label: '#Footer' },
                            ].map((pill) => (
                              <button
                                key={pill.id}
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`preview-home-sec-${pill.id}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="px-1.5 py-0.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Continuous Full-Page Scrollable Viewport */}
                        <div
                          id="home-full-preview-container"
                          className="max-h-[720px] overflow-y-auto scrollbar-thin bg-white divide-y divide-neutral-200"
                        >
                          {/* STOREFRONT NAVBAR MOCKUP */}
                          <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between text-[10px] uppercase font-mono tracking-wider bg-white/95 sticky top-0 z-20 backdrop-blur-xs">
                            <div className="flex gap-4 font-semibold text-neutral-800">
                              <span className="underline">NEW</span>
                              <span>PRODUCT</span>
                              <span>STUDIO</span>
                              <span>ABOUT</span>
                            </div>
                            <div className="font-bold text-xs tracking-widest text-neutral-900">
                              DE&apos;GENT
                            </div>
                            <div className="text-neutral-500">
                              BAG (0)
                            </div>
                          </div>

                          {/* SECTION 1: HERO DISPLAY */}
                          <div id="preview-home-sec-hero" className="p-6 relative overflow-hidden bg-black text-white space-y-4">
                            {/* Background Image Layer */}
                            <div className="absolute inset-0 z-0 pointer-events-none select-none">
                              <img
                                src={cmsContent?.home?.hero_image_url || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1793010652/degent/hero/wciimhf9kopgdhvpmjtv.png'}
                                alt="Hero Background"
                                className="w-full h-full object-cover object-center contrast-105 brightness-[0.7]"
                                onError={(e: any) => { e.target.src = 'https://res.cloudinary.com/tkfku9hx/image/upload/v1793010652/degent/hero/wciimhf9kopgdhvpmjtv.png'; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                            </div>

                            <div className="relative z-10 space-y-3 max-w-sm">
                              <div className="text-[9px] font-mono font-bold text-white bg-white/20 border border-white/30 backdrop-blur-xs w-fit px-1.5 py-0.5 rounded">
                                [KHỐI 1: HERO BANNER (ẢNH NỀN TOÀN BỘ)]
                              </div>
                              <div className="text-[9px] font-mono tracking-wider uppercase text-white/80 flex items-center gap-1.5">
                                <span>{cmsContent?.home?.hero_badge || 'TUYỂN TẬP ĐỒ HIỆU ĐƯƠNG ĐẠI / CÁ SẤU • XI-KÊ • TÔ-MÌ • LÊ-VY'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white leading-tight drop-shadow-sm">
                                {cmsContent?.home?.hero_title || 'ĐỒ HIỆU CHẤT LƯỢNG. ĐỊNH HÌNH PHONG CÁCH.'}
                              </h2>
                              <p className="text-[11px] leading-relaxed text-white/85 font-light line-clamp-3">
                                {cmsContent?.home?.hero_description || 'Bộ tứ kinh điển hội tụ tại DE\'GENT: từ chất vải pique dệt kim trứ danh nhà Cá Sấu, đường nét denim tối giản phong trần của Xi-Kê, năng động chất Mỹ cùng Tô-Mì đến những mẫu quần bò đinh tán bất hủ của Lê-Vy. Hàng có sẵn kho, cập nhật số lượng thời gian thực.'}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] font-medium tracking-wider uppercase pt-1 text-white">
                                <span className="px-3 py-1 bg-white text-black font-semibold rounded-xs shadow-xs cursor-pointer">
                                  {cmsContent?.home?.hero_cta_1 || 'Săn đồ hiệu ngay'} →
                                </span>
                                <span className="px-3 py-1 border border-white/60 text-white rounded-xs cursor-pointer">
                                  {cmsContent?.home?.hero_cta_2 || 'Bảng chọn size chuẩn'}
                                </span>
                              </div>
                            </div>

                            {/* 4-Plate Process Preview (Frosted Dark Glass) */}
                            <div className="relative z-10 border border-white/20 mt-4 rounded-sm overflow-hidden bg-black/75 backdrop-blur-xs shadow-2xs">
                              <div className="grid grid-cols-4 divide-x divide-white/15">
                                {/* Plate 1 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate1_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863867/degent/lacoste.png'} alt="Lacoste" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate1_tag || 'Áo Polo'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate1_title || 'DÒNG CÁ SẤU'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 2 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate2_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863868/degent/ck.png'} alt="Calvin Klein" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate2_tag || 'Denim & Tee'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate2_title || 'DÒNG XI-KÊ'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 3 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate3_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863869/degent/tommy.png'} alt="Tommy Hilfiger" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate3_tag || 'Phong cách Mỹ'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate3_title || 'DÒNG TÔ-MÌ'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 4 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate4_logo || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863870/degent/levis.png'} alt="Levi's" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate4_tag || 'Jeans Đinh Tán'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate4_title || 'DÒNG LÊ-VY'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2: MARQUEE TICKER */}
                          <div id="preview-home-sec-marquee" className="bg-[#0a0a0a] text-white py-2.5 px-3 text-[10px] font-mono tracking-widest overflow-hidden whitespace-nowrap flex items-center gap-3">
                            <span className="text-amber-400 font-bold shrink-0">[KHỐI 2: MARQUEE] ●</span>
                            <span className="truncate opacity-95">
                              {cmsContent?.home?.marquee_text || 'ATELIER • AUTONOMOUS MONOCHROME COMMERCE • ARCHIVE EDITIONS • CUT TO MEASURE'}
                            </span>
                          </div>

                          {/* SECTION 3: EDITORIAL PRODUCT COLLECTION */}
                          <div id="preview-home-sec-collection" className="p-6 bg-white space-y-4">
                            <div className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 w-fit px-1.5 py-0.5 rounded">
                              [KHỐI 3: BỘ SƯU TẬP SẢN PHẨM]
                            </div>
                            <div className="flex items-end justify-between border-b border-neutral-100 pb-3">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                                  {cmsContent?.home?.collection_badge || 'The Product Collection'}
                                </span>
                                <h3 className="text-lg font-bold uppercase text-neutral-900 tracking-tight">
                                  {cmsContent?.home?.collection_title || 'Looks of the season'}
                                </h3>
                              </div>
                            </div>

                            {/* Hot Product Cards Live Preview (5 items per row, max 2 rows = 10 items) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                              {(() => {
                                const hotIds: string[] = cmsContent?.home?.collection_hot_product_ids || [];
                                const hotMode: string = cmsContent?.home?.collection_hot_products_mode || 'manual';

                                let previewProds = availableProducts;
                                if (hotMode === 'manual' && hotIds.length > 0) {
                                  const pMap = new Map(availableProducts.map((p: any) => [p.id, p]));
                                  const filtered = hotIds.map((id: string) => pMap.get(id)).filter(Boolean);
                                  const filteredSet = new Set(filtered.map((p: any) => p.id));
                                  const remaining = availableProducts.filter((p: any) => !filteredSet.has(p.id));
                                  previewProds = [...filtered, ...remaining];
                                }

                                const list = previewProds.slice(0, 10);
                                if (list.length === 0) {
                                  return (
                                    <div className="col-span-full py-6 text-center text-xs text-neutral-400 font-mono">
                                      Chưa có sản phẩm nào được chọn.
                                    </div>
                                  );
                                }

                                return list.map((prod: any, idx: number) => {
                                  const minPrice = prod.variants?.length
                                    ? Math.min(...prod.variants.map((v: any) => v.selling_price))
                                    : 0;
                                  const imgUrl = prod.image_url ? prod.image_url.split(',')[0] : 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg';

                                  return (
                                    <div key={prod.id || idx} className="border border-neutral-200 rounded p-1.5 bg-neutral-50/50 space-y-1 relative overflow-hidden group">
                                      <div className="aspect-[4/5] bg-neutral-200/80 rounded relative overflow-hidden">
                                        <img
                                          src={imgUrl}
                                          alt={prod.name}
                                          className="w-full h-full object-cover"
                                          onError={(e: any) => {
                                            e.currentTarget.src = 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg';
                                          }}
                                        />
                                      </div>
                                      <div className="text-[10px] font-semibold text-neutral-900 truncate" title={prod.name}>
                                        {prod.name}
                                      </div>
                                      <div className="text-[9px] font-mono font-semibold text-slate-700">
                                        {formatMoney(minPrice)}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* SECTION 4: DARK SPLIT STUDIO SECTION */}
                          <div id="preview-home-sec-studio" className="p-6 bg-[#0a0a0a] text-white space-y-4">
                            <div className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950 border border-amber-800 w-fit px-1.5 py-0.5 rounded">
                              [KHỐI 4: PHÒNG THỬ ĐỒ STUDIO (#studio)]
                            </div>
                            <div className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                              {cmsContent?.home?.studio_badge || cmsContent?.studio?.badge || 'The Fitting Room'}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white leading-tight">
                              {cmsContent?.home?.studio_title || cmsContent?.studio?.title || 'Crafted at the edge. Verified by code.'}
                            </h3>
                            <p className="text-xs text-neutral-400 leading-relaxed font-light">
                              {cmsContent?.home?.studio_narrative || cmsContent?.studio?.narrative || 'Mỗi chiếc Polo Cá Sấu, quần jeans Lê-Vy hay áo thun Xi-Kê đều được chúng tôi kiểm tra kỹ lưỡng độ co giãn, form dáng thực tế và mã vạch trước khi lên kệ.'}
                            </p>

                            {/* Specs Definition List */}
                            <div className="grid grid-cols-2 gap-2 font-mono text-[9px] pt-1">
                              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                                <div className="text-neutral-500 text-[8px] uppercase">WEB CANVAS</div>
                                <div className="text-neutral-200 font-semibold truncate mt-0.5">
                                  {cmsContent?.home?.studio_canvas || cmsContent?.studio?.spec_canvas || 'Form Á / Âu chuẩn size'}
                                </div>
                              </div>
                              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                                <div className="text-neutral-500 text-[8px] uppercase">KHO VẬN</div>
                                <div className="text-emerald-400 font-semibold truncate mt-0.5">
                                  {cmsContent?.home?.studio_ledger || cmsContent?.studio?.spec_ledger || 'Hệ thống kho toàn quốc'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 5: MANIFESTO */}
                          <div id="preview-home-sec-manifesto" className="p-8 bg-stone-50 text-stone-900 text-center space-y-3">
                            <div className="text-[9px] font-mono font-bold text-stone-700 bg-stone-200 border border-stone-300 w-fit mx-auto px-1.5 py-0.5 rounded">
                              [KHỐI 5: TUYÊN NGÔN MANIFESTO (#manifesto)]
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">
                              {cmsContent?.home?.manifesto_badge || cmsContent?.about?.badge || 'Manifesto'}
                            </span>
                            <blockquote className="text-sm md:text-base font-serif italic text-stone-800 leading-relaxed max-w-md mx-auto">
                              "{cmsContent?.home?.manifesto_quote || cmsContent?.about?.body_text || 'True luxury is not ornament. It is the absolute precision of cut, material integrity, and silent execution.'}"
                            </blockquote>
                            <div className="text-[10px] font-mono uppercase text-stone-500 pt-1">
                              {cmsContent?.home?.manifesto_signature || cmsContent?.about?.signature || "DE'GENT Architecture 2026"}
                            </div>
                          </div>

                          {/* SECTION 6: DARK FULL-BLEED CTA */}
                          <div id="preview-home-sec-cta" className="p-6 bg-[#0a0a0a] text-white text-center space-y-3">
                            <div className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950 border border-amber-800 w-fit mx-auto px-1.5 py-0.5 rounded">
                              [KHỐI 6: KÊU GỌI HÀNH ĐỘNG (CTA)]
                            </div>
                            <span className="text-[10px] font-mono uppercase text-white/50 block">
                              {cmsContent?.home?.cta_badge || 'Begin the sequence'}
                            </span>
                            <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white">
                              {cmsContent?.home?.cta_title || 'Begin your first fitting.'}
                            </h3>
                            <div className="flex justify-center pt-1">
                              <span className="px-5 py-2 bg-white text-[#0a0a0a] text-[10px] uppercase font-bold rounded">
                                {cmsContent?.home?.cta_button_text || 'CHỐT ĐƠN NGAY'}
                              </span>
                            </div>
                            <p className="text-[9px] font-mono text-white/40 pt-1">
                              {cmsContent?.home?.cta_note || 'Direct VietQR dynamic settlement • Instant ledger confirmation'}
                            </p>
                          </div>

                          {/* SECTION 7: STOREFRONT FOOTER */}
                          <div id="preview-home-sec-footer" className="p-5 bg-neutral-950 text-neutral-400 text-xs space-y-2">
                            <div className="text-[9px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 w-fit px-1.5 py-0.5 rounded">
                              [KHỐI 7: CHÂN TRANG STOREFRONT]
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 pt-1">
                              <span className="font-bold text-white tracking-wider">DE&apos;GENT</span>
                              <span>{cmsContent?.home?.footer_address || 'Hanoi Flagship Studio • Edge Cloud Delivery'}</span>
                            </div>
                            <div className="text-[9px] font-mono text-neutral-500 pt-1 border-t border-neutral-800 flex justify-between">
                              <span>{cmsContent?.home?.footer_copyright || "© 2026 DE'GENT. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY."}</span>
                              <span>LIVE INVENTORY</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: PRODUCTS ROUTE CONTENT */}
                {contentSubTab === 'products' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Form Editor */}
                    <div className="xl:col-span-6 space-y-4">
                      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        <header className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              Nội dung Danh mục (Route: <span className="font-mono text-slate-500">/products</span>)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Cấu hình tiêu đề danh mục lưu trữ, phụ đề và thông điệp kho vận
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveCMS('products', cmsContent?.products)}
                            disabled={isSavingContent}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingContent ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                          </button>
                        </header>

                        <div className="p-5 space-y-5 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Dòng phân hiệu (Category Badge):</label>
                            <input
                              type="text"
                              value={cmsContent?.products?.badge || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                products: { ...cmsContent.products, badge: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Tiêu đề trang sản phẩm (Header Title):</label>
                            <input
                              type="text"
                              value={cmsContent?.products?.title || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                products: { ...cmsContent.products, title: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Vị trí trung tâm hoàn tất đơn hàng (Fulfillment Tag):</label>
                            <input
                              type="text"
                              value={cmsContent?.products?.fulfillment_tag || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                products: { ...cmsContent.products, fulfillment_tag: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Thông báo khi không tìm thấy sản phẩm (Empty State):</label>
                            <input
                              type="text"
                              value={cmsContent?.products?.empty_state_text || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                products: { ...cmsContent.products, empty_state_text: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="xl:col-span-6 sticky top-20 space-y-2">
                      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
                        {/* Browser Mockup Chrome Bar */}
                        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            </div>
                            <div className="bg-white border border-slate-200 px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-600 flex items-center gap-1.5 shadow-2xs">
                              <span className="text-emerald-500 font-bold">https://</span>
                              <span>degent.vn/products</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Preview
                          </span>
                        </div>

                        {/* Live Storefront Mockup Canvas */}
                        <div className="p-5 bg-white space-y-4">

                          {/* Header Title Section */}
                          <div className="space-y-1.5 border-b border-neutral-100 pb-3">
                            <span className="text-[10px] tracking-wider uppercase text-neutral-500 font-mono block">
                              {cmsContent?.products?.badge || 'DANH MỤC'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 uppercase">
                              {cmsContent?.products?.title || 'BỘ SƯU TẬP'}
                            </h2>
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                              <div>INVENTORY: <span className="text-emerald-600 font-semibold">SYNCHRONIZED</span></div>
                              <div className="text-right">LOCATIONS: {cmsContent?.products?.fulfillment_tag || 'WH-HN-01 (HA NOI FULFILLMENT)'}</div>
                            </div>
                          </div>

                          {/* Mock Product Cards */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="border border-neutral-200 rounded p-2.5 space-y-1.5 bg-neutral-50/50">
                              <div className="aspect-[4/3] bg-neutral-200/70 rounded flex items-center justify-center text-[10px] font-mono text-neutral-400">
                                SAMPLE IMAGE 01
                              </div>
                              <div className="text-[11px] font-semibold text-neutral-900 truncate">Atelier Oversized Coat</div>
                              <div className="text-[10px] font-mono text-neutral-600">3,450,000₫</div>
                            </div>
                            <div className="border border-neutral-200 rounded p-2.5 space-y-1.5 bg-neutral-50/50">
                              <div className="aspect-[4/3] bg-neutral-200/70 rounded flex items-center justify-center text-[10px] font-mono text-neutral-400">
                                SAMPLE IMAGE 02
                              </div>
                              <div className="text-[11px] font-semibold text-neutral-900 truncate">Pleated Structured Pant</div>
                              <div className="text-[10px] font-mono text-neutral-600">1,850,000₫</div>
                            </div>
                          </div>

                          {/* Empty state notice preview */}
                          <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200/70 text-[10px] text-amber-900 flex items-center justify-between">
                            <span className="font-medium shrink-0">Thông báo bộ lọc trống:</span>
                            <span className="italic truncate ml-2">"{cmsContent?.products?.empty_state_text || 'Không tìm thấy sản phẩm phù hợp với bộ lọc.'}"</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 4: STUDIO SECTION CONTENT */}
                {contentSubTab === 'studio' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Form Editor */}
                    <div className="xl:col-span-6 space-y-4">
                      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        <header className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              Nội dung Studio & Fitting Room (Route: <span className="font-mono text-slate-500">/#studio</span>)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Chỉnh sửa phần studio nền đen đơn sắc và các thông số vận hành
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveCMS('studio', cmsContent?.studio)}
                            disabled={isSavingContent}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingContent ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                          </button>
                        </header>

                        <div className="p-5 space-y-5 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Huy hiệu phân khu:</label>
                            <input
                              type="text"
                              value={cmsContent?.studio?.badge || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                studio: { ...cmsContent.studio, badge: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Tiêu đề chính:</label>
                            <input
                              type="text"
                              value={cmsContent?.studio?.title || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                studio: { ...cmsContent.studio, title: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Đoạn văn diễn giải:</label>
                            <textarea
                              rows={3}
                              value={cmsContent?.studio?.narrative || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                studio: { ...cmsContent.studio, narrative: e.target.value }
                              })}
                              className="w-full rounded border border-slate-300 p-3 leading-relaxed focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-medium text-slate-700">Chỉ số Web Canvas:</label>
                              <input
                                type="text"
                                value={cmsContent?.studio?.spec_canvas || ''}
                                onChange={(e) => setCmsContent({
                                  ...cmsContent,
                                  studio: { ...cmsContent.studio, spec_canvas: e.target.value }
                                })}
                                className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="font-medium text-slate-700">Chỉ số Data Ledger:</label>
                              <input
                                type="text"
                                value={cmsContent?.studio?.spec_ledger || ''}
                                onChange={(e) => setCmsContent({
                                  ...cmsContent,
                                  studio: { ...cmsContent.studio, spec_ledger: e.target.value }
                                })}
                                className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="xl:col-span-6 sticky top-20 space-y-2">
                      <div className="rounded-lg border border-neutral-800 bg-[#0a0a0a] text-white overflow-hidden shadow-xs">
                        {/* Browser Mockup Chrome Bar */}
                        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                            </div>
                            <div className="bg-black border border-neutral-800 px-2.5 py-0.5 rounded text-[11px] font-mono text-neutral-300 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-bold">https://</span>
                              <span>degent.vn/#studio</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Studio View
                          </span>
                        </div>

                        {/* Dark Mode Studio Canvas Preview */}
                        <div className="p-6 space-y-4">
                          <div className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                            {cmsContent?.studio?.badge || '03 / VIRTUAL FITTING ENGINE'}
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-white leading-tight">
                            {cmsContent?.studio?.title || 'PRECISION METRICS, REAL-TIME FIT.'}
                          </h2>
                          <p className="text-xs text-neutral-400 leading-relaxed font-light">
                            {cmsContent?.studio?.narrative || 'Trải nghiệm thử size thông minh, cập nhật số đo chuẩn xác và đồng bộ tồn kho thực tế.'}
                          </p>

                          {/* Tech Specs Badges */}
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px]">
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                              <div className="text-neutral-500 text-[8px] uppercase">RENDER ENGINE</div>
                              <div className="text-neutral-200 font-semibold truncate mt-0.5">
                                {cmsContent?.studio?.spec_canvas || 'Form Á / Âu chuẩn size'}
                              </div>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                              <div className="text-neutral-500 text-[8px] uppercase">KHO HÀNG</div>
                              <div className="text-emerald-400 font-semibold truncate mt-0.5">
                                {cmsContent?.studio?.spec_ledger || 'Kho vận trung tâm (Hà Nội & TP.HCM)'}
                              </div>
                            </div>
                          </div>

                          {/* Simulated 3D mannequin canvas wireframe */}
                          <div className="border border-neutral-800 bg-neutral-950 rounded p-4 text-center text-neutral-500 font-mono text-[10px] flex flex-col items-center justify-center gap-1">
                            <span className="text-neutral-400">▤ 3D AVATAR FITTING MESH [REALTIME]</span>
                            <span className="text-[8px] text-neutral-600">DRAG TO ROTATE 360° • MEASUREMENTS SYNCHRONIZED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 5: ABOUT SECTION CONTENT */}
                {contentSubTab === 'about' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Form Editor */}
                    <div className="xl:col-span-6 space-y-4">
                      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        <header className="border-b border-slate-200 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              Tuyên ngôn thương hiệu (Route: <span className="font-mono text-slate-500">/#about</span>)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Chỉnh sửa tuyên ngôn tôn chỉ thiết kế và cam kết chất lượng
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveCMS('about', cmsContent?.about)}
                            disabled={isSavingContent}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingContent ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                          </button>
                        </header>

                        <div className="p-5 space-y-5 text-xs">
                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Khẩu hiệu chính (Headline):</label>
                            <input
                              type="text"
                              value={cmsContent?.about?.headline || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                about: { ...cmsContent.about, headline: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-semibold text-sm focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Nội dung tuyên ngôn (Body Text):</label>
                            <textarea
                              rows={4}
                              value={cmsContent?.about?.body_text || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                about: { ...cmsContent.about, body_text: e.target.value }
                              })}
                              className="w-full rounded border border-slate-300 p-3 leading-relaxed focus:border-slate-900 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-slate-700">Chữ ký bản quyền (Signature):</label>
                            <input
                              type="text"
                              value={cmsContent?.about?.signature || ''}
                              onChange={(e) => setCmsContent({
                                ...cmsContent,
                                about: { ...cmsContent.about, signature: e.target.value }
                              })}
                              className="h-9 w-full rounded border border-slate-300 px-3 font-mono text-xs focus:border-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="xl:col-span-6 sticky top-20 space-y-2">
                      <div className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden shadow-xs">
                        {/* Browser Mockup Chrome Bar */}
                        <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                            </div>
                            <div className="bg-white border border-stone-200 px-2.5 py-0.5 rounded text-[11px] font-mono text-stone-600 flex items-center gap-1.5">
                              <span className="text-emerald-600 font-bold">https://</span>
                              <span>degent.vn/#about</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-semibold text-stone-800 bg-stone-200/80 border border-stone-300 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-600 animate-pulse" />
                            Manifesto
                          </span>
                        </div>

                        {/* Editorial Manifesto Canvas Preview */}
                        <div className="p-7 space-y-4 text-stone-900">
                          <div className="text-[10px] font-mono tracking-wider uppercase text-stone-500">
                            04 / EDITORIAL MANIFESTO
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight leading-snug">
                            {cmsContent?.about?.headline || 'MINIMAL FORM, STRICT DISCIPLINE.'}
                          </h2>
                          <blockquote className="border-l-2 border-stone-400 pl-4 italic text-stone-700 text-xs leading-relaxed py-1">
                            &quot;{cmsContent?.about?.body_text || "We reject ornamental excess in e-commerce interfaces. DE'GENT treats code, data integrity, and typography as singular architectural elements."}&quot;
                          </blockquote>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-stone-200 text-stone-600">
                            <div>SIGNATURE: <span className="font-semibold text-stone-900">{cmsContent?.about?.signature || "DE'GENT ATELIER / STUDIO LABS"}</span></div>
                            <div className="text-[9px] bg-stone-200 px-1.5 py-0.5 rounded">SEAL • VERIFIED</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ================= TAB: PRODUCTS MANAGEMENT ================= */}
          {activeTab === 'products' && (
            <ProductManagementSection onDataChanged={fetchData} />
          )}

          {/* ================= TAB: COLLECTIONS & TAXONOMY ================= */}
          {activeTab === 'collections' && (
            <CollectionManagementSection />
          )}

          {/* ================= TAB: PRODUCT MONITORING & ANALYTICS ================= */}
          {activeTab === 'monitor' && (
            <ProductMonitoringSection
              activeSectionTab={monitorSubTab}
              onSectionTabChange={(tab) => setMonitorSubTab(tab)}
            />
          )}

          {/* ================= TAB 1: CASH FLOW & P&L ================= */}
          {activeTab === 'cashflow' && cashflow && (
            <div className="space-y-6">
              {/* Plain Metrics Row (Domain Preset: Admin Dashboard) */}
              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">

                  {/* Total Revenue */}
                  <div className="p-4 sm:p-5">
                    <div className="text-xs font-medium text-slate-500">Tổng doanh thu</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {formatMoney(cashflow.total_revenue)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <span className="font-medium text-emerald-600">{cashflow.paid_orders_count} đơn</span>
                      <span>đã hoàn tất thanh toán</span>
                    </div>
                  </div>

                  {/* COGS */}
                  <div className="p-4 sm:p-5">
                    <div className="text-xs font-medium text-slate-500">Giá vốn hàng bán (COGS)</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {formatMoney(cashflow.total_cogs)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Ghi nhận vốn tự động khi xuất kho
                    </div>
                  </div>

                  {/* Shipping & Fees */}
                  <div className="p-4 sm:p-5">
                    <div className="text-xs font-medium text-slate-500">Cước vận chuyển & Phí sàn</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">
                      {formatMoney(cashflow.total_shipping_fee + cashflow.total_gateway_fee)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Cước ship đối soát thời gian thực
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Lợi nhuận ròng thực tế</span>
                      <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        Biên {cashflow.gross_margin_percentage}%
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(cashflow.net_profit)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Đã khấu trừ toàn bộ vốn và phí
                    </div>
                  </div>

                </div>
              </section>

              {/* Financial Ledger Table */}
              <section className="rounded-lg border border-slate-200 bg-white">
                <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Sổ cái dòng tiền (Inflow & Outflow)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Lịch sử thu chi theo chuẩn kế toán kép thời gian thực</p>
                  </div>
                </header>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Thời gian</th>
                        <th className="py-2.5 px-4">Tham chiếu đơn</th>
                        <th className="py-2.5 px-4">Phân loại</th>
                        <th className="py-2.5 px-4">Nội dung diễn giải</th>
                        <th className="py-2.5 px-4 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{tx.recorded_at}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono font-medium text-slate-900">{tx.order_id || 'Hệ thống'}</span>
                            {tx.payment_gateway && (
                              <span className="ml-1.5 text-[11px] text-slate-500">({tx.payment_gateway})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {(() => {
                              const badge = getTransactionTypeInfo(tx.transaction_type);
                              return (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-md truncate">{tx.notes}</td>
                          <td className={`py-2.5 px-4 text-right font-mono font-semibold ${tx.direction === 'INFLOW' ? 'text-emerald-700' : 'text-slate-600'
                            }`}>
                            {tx.direction === 'INFLOW' ? '+' : '-'}{formatMoney(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB 4: PRICING CONTROLLER ================= */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {/* Context Note */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-semibold text-slate-900">Quy tắc điều chỉnh giá bán & Khóa giá sàn</h3>
                  <p className="text-slate-500 mt-0.5">
                    Giá sàn an toàn là mốc tối thiểu (Giá vốn + Chi phí vận hành). Hệ thống từ chối cập nhật nếu mức giá mới gây lỗ vốn.
                  </p>
                </div>

                {priceMessage && (
                  <div className={`rounded-md px-3 py-1.5 font-medium border ${priceMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                    {priceMessage.text}
                  </div>
                )}
              </div>

              {/* Pricing Matrix Table */}
              <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Sản phẩm & Biến thể</th>
                        <th className="py-2.5 px-4">Giá vốn (COGS)</th>
                        <th className="py-2.5 px-4">Giá sàn an toàn</th>
                        <th className="py-2.5 px-4">Giá niêm yết</th>
                        <th className="py-2.5 px-4">Lãi gộp / Chiếc</th>
                        <th className="py-2.5 px-4 text-right">Điều chỉnh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {inventory.map(item => {
                        const marginPerUnit = item.selling_price - item.cost_price;
                        const marginPercent = Math.round((marginPerUnit / item.selling_price) * 100);

                        return (
                          <tr key={item.variant_id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4">
                              <div className="font-medium text-slate-900">{item.product_name}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {item.sku} • {item.color} - Size {item.size}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">
                              {formatMoney(item.cost_price)}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-amber-700 font-medium">
                              {formatMoney(item.floor_price)}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                              {formatMoney(item.selling_price)}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-emerald-700">
                              +{formatMoney(marginPerUnit)} ({marginPercent}%)
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {editingVariant === item.variant_id ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    placeholder="Giá mới..."
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="w-24 h-7 rounded border border-slate-400 px-1.5 text-right text-xs"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handlePriceUpdate(item.variant_id)}
                                    className="h-7 rounded bg-slate-900 px-2.5 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingVariant(null);
                                      setNewPrice('');
                                    }}
                                    className="h-7 rounded border border-slate-300 px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingVariant(item.variant_id);
                                    setNewPrice(String(item.selling_price));
                                  }}
                                  className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  Đổi giá
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB 5: ORDERS ================= */}
          {activeTab === 'orders' && (() => {
            const totalOrdersCount = orders.length;
            const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

            const packingOrders = orders.filter(o => o.fulfillment_status === 'PACKING' || o.fulfillment_status === 'DISPATCHED');
            const packingRevenue = packingOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

            const deliveredOrders = orders.filter(o => o.fulfillment_status === 'DELIVERED');
            const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

            const returnedOrders = orders.filter(o => o.fulfillment_status === 'RETURNED');
            const exchangeOrdersCount = returnedOrders.filter(o => {
              const notes = (o.return_notes || '').toLowerCase();
              return o.return_notes?.includes('ĐỔI HÀNG') || notes.includes('đổi size') || notes.includes('đổi mẫu') || notes.includes('đổi hàng');
            }).length;
            const refundOrdersCount = returnedOrders.length - exchangeOrdersCount;

            const unfulfilledOrders = orders.filter(o => o.fulfillment_status === 'UNFULFILLED' || !o.fulfillment_status);
            const unfulfilledRevenue = unfulfilledOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

            const orderMetricCards = [
              {
                id: 'ALL' as const,
                label: 'Tổng đơn hàng',
                count: totalOrdersCount,
                subtext: formatMoney(totalRevenue),
                icon: ShoppingCart,
                iconBg: 'bg-slate-100 text-slate-700',
              },
              {
                id: 'PACKING' as const,
                label: 'Đang xử lý',
                count: packingOrders.length,
                subtext: formatMoney(packingRevenue),
                icon: Truck,
                iconBg: 'bg-blue-50 text-blue-700 border border-blue-200/60',
              },
              {
                id: 'DELIVERED' as const,
                label: 'Đã nhận hàng',
                count: deliveredOrders.length,
                subtext: formatMoney(deliveredRevenue),
                icon: CheckCircle2,
                iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
              },
              {
                id: 'RETURNED' as const,
                label: 'Yêu cầu đổi / hoàn',
                count: returnedOrders.length,
                subtext: `Đổi: ${exchangeOrdersCount} • Trả: ${refundOrdersCount}`,
                icon: RotateCcw,
                iconBg: 'bg-amber-50 text-amber-700 border border-amber-200/60',
              },
              {
                id: 'UNFULFILLED' as const,
                label: 'Chưa xử lý',
                count: unfulfilledOrders.length,
                subtext: formatMoney(unfulfilledRevenue),
                icon: Clock,
                iconBg: 'bg-slate-100 text-slate-600 border border-slate-200/60',
              },
            ];

            return (
              <div className="space-y-4">
                {/* Indicator Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {orderMetricCards.map((card) => {
                    const isActive = orderStatusFilter === card.id;
                    const IconComp = card.icon;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(card.id)}
                        className={`group text-left p-4 sm:p-4.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isActive
                            ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-slate-950'
                            : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                        title={`Lọc theo: ${card.label}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider truncate transition-colors ${
                              isActive ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {card.label}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isActive
                                ? 'bg-white/15 text-white border border-white/20'
                                : card.iconBg
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1.5 my-1">
                            <span
                              className={`text-3xl sm:text-4xl font-black tracking-tight leading-none transition-colors ${
                                isActive ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {card.count}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-bold transition-colors ${
                                isActive ? 'text-zinc-400' : 'text-slate-500'
                              }`}
                            >
                              đơn
                            </span>
                          </div>

                          <div
                            className={`mt-2 pt-2 border-t flex items-center justify-between gap-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? 'border-white/15 text-zinc-300'
                                : 'border-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`truncate font-bold transition-colors ${
                                isActive ? 'text-white' : 'text-slate-800'
                              }`}
                              title={card.subtext}
                            >
                              {card.subtext}
                            </span>

                          </div>
                        </div>


                      </button>
                    );
                  })}
                </div>

                <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <header className="border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-slate-900">Danh sách đơn hàng vận hành</h2>
                    {isMockPaymentEnabled && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase tracking-wider">
                        🧪 Test Ảo Bật
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Tiến trình thanh toán VietQR và xử lý đóng gói xuất kho & đổi/trả hàng</p>
                </div>
                <div className="flex items-center gap-2.5">
                  {isMockPaymentEnabled && (
                    <button
                      type="button"
                      onClick={handleCreateMockOrder}
                      disabled={mockLoadingId === 'CREATE_NEW'}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      title="Tạo nhanh 1 đơn hàng test VietQR để thử nghiệm thanh toán ảo"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{mockLoadingId === 'CREATE_NEW' ? 'Đang tạo...' : '+ Tạo đơn test'}</span>
                    </button>
                  )}
                  <div className="text-xs text-slate-500 font-mono">
                    Tổng {orders.length} đơn hàng
                  </div>
                </div>
              </header>



              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[1080px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <tr>
                      <th className="py-2.5 px-4 whitespace-nowrap">Mã đơn</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Khách hàng</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Số điện thoại</th>
                      <th className="py-2.5 px-4 whitespace-nowrap max-w-[140px]">Địa chỉ giao hàng</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Mã đơn ĐVVC</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Thanh toán</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Trạng thái</th>
                      <th className="py-2.5 px-4 text-right whitespace-nowrap">Tổng thanh toán</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap sticky right-0 z-20 bg-slate-50 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(() => {
                      const displayedOrders = orders.filter(ord => {
                        if (orderStatusFilter === 'RETURNED') return ord.fulfillment_status === 'RETURNED';
                        if (orderStatusFilter === 'PACKING') return ord.fulfillment_status === 'PACKING' || ord.fulfillment_status === 'DISPATCHED';
                        if (orderStatusFilter === 'DELIVERED') return ord.fulfillment_status === 'DELIVERED';
                        if (orderStatusFilter === 'UNFULFILLED') return ord.fulfillment_status === 'UNFULFILLED' || !ord.fulfillment_status;
                        return true;
                      });

                      if (displayedOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500">
                              Không có đơn hàng nào phù hợp với bộ lọc hiện tại.
                            </td>
                          </tr>
                        );
                      }

                      return displayedOrders.map(ord => {
                        const isReturned = ord.fulfillment_status === 'RETURNED';
                        const returnNotesLower = (ord.return_notes || '').toLowerCase();
                        const isExchange = isReturned && (
                          ord.return_notes?.includes('ĐỔI HÀNG') || 
                          returnNotesLower.includes('đổi size') || 
                          returnNotesLower.includes('đổi mẫu') ||
                          returnNotesLower.includes('đổi hàng')
                        );
                        const isRefund = isReturned && !isExchange;
                        const cleanPhone = (ord.customer_phone || '').replace(/\D/g, '');

                        return (
                          <tr
                            key={ord.id}
                            className={`group transition-colors ${
                              isExchange
                                ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-l-blue-600'
                                : isRefund
                                ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500'
                                : 'hover:bg-slate-50/60'
                            }`}
                          >
                            <td className="py-2.5 px-4 font-semibold whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(ord)}
                                  className={`font-bold hover:underline cursor-pointer text-left transition-colors ${
                                    isExchange
                                      ? 'text-blue-600 hover:text-blue-800'
                                      : isRefund
                                      ? 'text-amber-600 hover:text-amber-800'
                                      : 'text-slate-900 hover:text-black'
                                  }`}
                                  title="Nhấn để xem chi tiết đơn hàng"
                                >
                                  {ord.order_code}
                                </button>
                                {isExchange ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForDetail(ord)}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0 shadow-2xs hover:bg-blue-700 cursor-pointer transition-colors"
                                    title="Xem chi tiết đổi hàng"
                                  >
                                    Đổi hàng
                                  </button>
                                ) : isRefund ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForDetail(ord)}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white shrink-0 shadow-2xs hover:bg-amber-700 cursor-pointer transition-colors"
                                    title="Xem chi tiết trả hàng"
                                  >
                                    Trả hàng
                                  </button>
                                ) : null}
                              </div>
                            </td>

                            <td className="py-2.5 px-4 whitespace-nowrap min-w-[140px]">
                              <div className="font-semibold text-slate-900 whitespace-pre-line">{ord.customer_name}</div>
                            </td>

                            <td className="py-2.5 px-4 whitespace-nowrap min-w-[140px]">
                              <PhoneZaloContact phone={ord.customer_phone} />
                            </td>

                            <td className="py-2.5 px-4 text-slate-600 max-w-[140px] truncate" title={ord.shipping_address}>
                              {ord.shipping_address}
                            </td>

                            <td className="py-2.5 px-4 whitespace-nowrap min-w-[130px]">
                              {ord.tracking_code ? (
                                <span className="text-xs font-semibold text-slate-800">
                                  {ord.tracking_code}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`inline-flex px-2 py-0.5 rounded-sm text-[11px] font-medium ${ord.payment_status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800'
                                  }`}>
                                  {ord.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                </span>

                                {isMockPaymentEnabled && ord.payment_status !== 'PAID' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMockPayOrder(ord.id)}
                                    disabled={mockLoadingId === ord.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-[0.97]"
                                    title="Giả lập ngân hàng báo tiền về thành công (Chỉ bật khi có biến NEXT_PUBLIC_ENABLE_MOCK_PAYMENT)"
                                  >
                                    <Zap className="w-3 h-3 text-indigo-500" />
                                    <span>{mockLoadingId === ord.id ? 'Đang nạp...' : 'Thanh toán test'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              {(() => {
                                // Tự động cập nhật theo tiến trình đơn hàng (không chỉnh tay)
                                // { value: 'DELIVERED', label: 'Đã nhận' }
                                const isDelivered = ord.fulfillment_status === 'DELIVERED';
                                const isDispatched = ord.fulfillment_status === 'DISPATCHED' || Boolean(ord.tracking_code);
                                const isPaid = ord.payment_status === 'PAID' || (ord as any).deposit_status === 'PAID';
                                const isConfirming = ord.fulfillment_status === 'CONFIRMING';
                                const isPacking = ord.fulfillment_status === 'PACKING';
                                const isCancelled = ord.fulfillment_status === 'CANCELLED';
                                const isRefunded = ord.payment_status === 'REFUNDED';

                                if (isExchange) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs">
                                      Đang đổi hàng
                                    </span>
                                  );
                                }

                                if (isRefund) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                      Đang trả hàng
                                    </span>
                                  );
                                }

                                if (isReturned) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                      Yêu cầu đổi/trả
                                    </span>
                                  );
                                }

                                if (isRefunded) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                      Đã hoàn tiền
                                    </span>
                                  );
                                }

                                if (isCancelled) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                      Đã hủy
                                    </span>
                                  );
                                }

                                if (isDelivered) {
                                  return (
                                    <span
                                      className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300/80 cursor-default select-none shadow-2xs"
                                      title="Đơn hàng đã nhận thành công"
                                    >
                                      Đã nhận
                                    </span>
                                  );
                                }

                                if (isDispatched) {
                                  return (
                                    <span
                                      className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                                      title="Đơn hàng đã có mã vận đơn và bàn giao cho ĐVVC"
                                    >
                                      Đã bàn giao ĐVVC
                                    </span>
                                  );
                                }

                                if (isConfirming) {
                                  return (
                                    <span
                                      className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
                                      title="Khách đã thanh toán, chờ shop xác nhận còn hàng"
                                    >
                                      Chờ shop xác nhận
                                    </span>
                                  );
                                }

                                if (isPacking) {
                                  return (
                                    <span
                                      className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
                                      title="Shop đã xác nhận còn hàng, đang chuẩn bị gói hàng"
                                    >
                                      Chờ xử lý
                                    </span>
                                  );
                                }

                                return (
                                  <span
                                    className="inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                                    title="Đơn hàng đang chờ thanh toán"
                                  >
                                    Chờ thanh toán
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                              {formatMoney(ord.total_amount)}
                            </td>
                            <td
                              className={`py-2.5 px-4 text-center whitespace-nowrap sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors ${
                                isExchange
                                  ? 'bg-[#f0f6ff] group-hover:bg-[#e4efff]'
                                  : isRefund
                                  ? 'bg-[#fffaf0] group-hover:bg-[#fef3c7]'
                                  : 'bg-white group-hover:bg-slate-50'
                              }`}
                            >
                              {(() => {
                                const isPaid = ord.payment_status === 'PAID';
                                const isDispatched = ord.fulfillment_status === 'DISPATCHED' || Boolean(ord.tracking_code);
                                const isCancelled = ord.fulfillment_status === 'CANCELLED' || ord.payment_status === 'REFUNDED';

                                // 1. Đơn đã hủy hoặc đã hoàn tiền
                                if (isCancelled) {
                                  return (
                                    <span className="text-xs text-slate-400 italic">Đã hủy / Hoàn tiền</span>
                                  );
                                }

                                // 2. Nếu đơn CHỜ THANH TOÁN: Ẩn nút gửi mã ĐVVC
                                if (!isPaid && ord.payment_method !== 'cod') {
                                  return (
                                    <span className="text-xs text-slate-400 italic select-none">
                                      Chờ thanh toán
                                    </span>
                                  );
                                }

                                // 3. Nếu đơn ĐANG CHỜ SHOP XÁC NHẬN (CONFIRMING): Hiển thị 2 nút Còn hàng / Hết hàng
                                if (ord.fulfillment_status === 'CONFIRMING') {
                                  return (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleShopConfirmStock(ord.id)}
                                        disabled={confirmStockLoadingId === ord.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                        title="Xác nhận còn hàng và chuyển sang đóng gói"
                                      >
                                        <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                                        <span>{confirmStockLoadingId === ord.id ? 'Đang duyệt...' : 'Còn hàng'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRefundModal(ord)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                        title="Báo hết hàng và tạo lệnh hoàn tiền về tài khoản ngân hàng"
                                      >
                                        <X className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                        <span>Hết hàng</span>
                                      </button>
                                    </div>
                                  );
                                }

                                // 4. Nếu đã có mã vận đơn
                                if (isDispatched) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDispatchModal(ord)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
                                      title="Bấm để xem hoặc chỉnh sửa mã vận đơn"
                                    >
                                      <Truck className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                                      <span>Sửa mã ĐVVC</span>
                                    </button>
                                  );
                                }

                                // 5. Nếu đang ở PACKING (Chờ xử lý / Đóng gói) -> Mới hiển thị Gửi mã ĐVVC
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDispatchModal(ord)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                    title="Gửi mã vận chuyển của ĐVVC vào đơn hàng cho khách"
                                  >
                                    <Truck className="w-3.5 h-3.5 shrink-0 text-white" />
                                    <span>Gửi mã ĐVVC</span>
                                  </button>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      })()}

          {/* ================= TAB 6: CUSTOMERS & USERS ================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>Hệ Thống Cấp Bậc Hội Viên & Khách Hàng Thân Thiết</span>
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono uppercase">
                      Tự động tính Rank
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động nâng hạng theo số lượng sản phẩm (áo/quần) tích lũy và áp dụng chiết khấu sâu cho khách hàng & CTV.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Tổng <strong>{customers.length}</strong> khách mua hàng • <strong>{users.length}</strong> tài khoản
                </div>
              </div>

              {/* 4 Cards Cấp bậc Hội viên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Hội Viên Đồng
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                      0 - 2 đơn
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">0% <span className="text-xs font-normal text-slate-500">giảm giá</span></div>
                  <p className="text-[11px] text-slate-600">Khách hàng mới dưới 3 đơn hàng, áp dụng giá niêm yết chuẩn.</p>
                </div>

                <div className="rounded-lg border border-slate-300 bg-slate-50/80 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Hội Viên Bạc
                    </span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-semibold">
                      Từ 3 đơn
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">5% <span className="text-xs font-normal text-emerald-600 font-medium">chiết khấu</span></div>
                  <p className="text-[11px] text-slate-600">Khách tích lũy từ 3 đơn hàng thành công, giảm ngay 5% toàn bộ giỏ hàng.</p>
                </div>

                <div className="rounded-lg border border-yellow-300 bg-yellow-50/60 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-900">
                      Hội Viên Vàng
                    </span>
                    <span className="text-[10px] font-mono bg-yellow-200 text-yellow-900 px-1.5 py-0.5 rounded font-semibold">
                      Từ 5 đơn
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">10% <span className="text-xs font-normal text-emerald-600 font-medium">chiết khấu</span></div>
                  <p className="text-[11px] text-slate-600">Khách VIP hoàn thành từ 5 đơn hàng, giảm 10% cho mọi đơn tiếp theo.</p>
                </div>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">
                      Kim Cương / CTV VIP
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                      Từ 10 đơn
                    </span>
                  </div>
                  <div className="text-xl font-bold text-indigo-950">15% <span className="text-xs font-normal text-emerald-600 font-medium">giảm sâu</span></div>
                  <p className="text-[11px] text-slate-600">Dành riêng cho khách hàng thân thiết từ 10 đơn hàng thành công trở lên.</p>
                </div>
              </div>

              {/* Bảng Danh sách Khách hàng & Cấp bậc Rank */}
              <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Danh Sách Khách Hàng & Cấp Bậc Rank Tích Lũy ({customers.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tự động nhận diện qua Số điện thoại đặt hàng
                  </span>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Khách hàng</th>
                        <th className="py-2.5 px-4">Số điện thoại</th>
                        <th className="py-2.5 px-4 text-center">Cấp bậc Rank</th>
                        <th className="py-2.5 px-4 text-center">Số áo đã mua</th>
                        <th className="py-2.5 px-4 text-center">Chiết khấu</th>
                        <th className="py-2.5 px-4 text-center">Số đơn</th>
                        <th className="py-2.5 px-4 text-right">Tổng chi tiêu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Chưa có dữ liệu khách mua hàng. Khách hàng khi đặt đơn sẽ tự động xuất hiện tại đây kèm Rank tương ứng.
                          </td>
                        </tr>
                      ) : (
                        customers.map(c => (
                          <tr key={c.phone} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-900">{c.name}</div>
                              {c.email && <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                              {c.phone}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.badge_class}`}>
                                {c.tier}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                              {c.total_items} chiếc
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-emerald-600">
                              {c.discount_percent > 0 ? `-${c.discount_percent}%` : '0%'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                              {c.order_count} đơn
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                              {formatMoney(c.total_spent)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Bảng Danh bạ Tài khoản Hệ thống (Users) */}
              <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <header className="border-b border-slate-200 px-4 py-3 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Tài Khoản Đăng Ký Hệ Thống ({users.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Bảo mật JWT Authentication</span>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                      <tr>
                        <th className="py-2.5 px-4">Tên tài khoản</th>
                        <th className="py-2.5 px-4">Email đăng nhập</th>
                        <th className="py-2.5 px-4 text-center">Vai trò</th>
                        <th className="py-2.5 px-4">Ngày tạo</th>
                        <th className="py-2.5 px-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            Chưa có dữ liệu người dùng.
                          </td>
                        </tr>
                      ) : (
                        users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-medium text-slate-900">{u.name}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{u.email}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium ${u.role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono">{u.created_at || 'Mặc định'}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB 7: SETTINGS & D1 INFRASTRUCTURE ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* CHẾ ĐỘ HIỂN THỊ GIAO DIỆN HỆ THỐNG (SÁNG / TỐI) */}
              <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {themeMode === 'dark' ? (
                      <Moon className="w-5 h-5 text-sky-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Chế độ Hiển thị Giao diện Hệ thống</h2>
                      <p className="text-xs text-slate-500">Chuyển đổi linh hoạt giữa giao diện Sáng và Tối cho toàn bộ màn hình điều hành</p>
                    </div>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    <span className={`w-2 h-2 rounded-full ${themeMode === 'dark' ? 'bg-sky-400' : 'bg-amber-500'}`} />
                    <span>Đang kích hoạt: {themeMode === 'dark' ? 'Chế độ Tối (Dark Mode)' : 'Chế độ Sáng (Light Mode)'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Sáng */}
                  <div
                    onClick={() => handleSelectThemeMode('light')}
                    className={`p-4 rounded-lg border transition-all cursor-pointer relative group text-xs ${themeMode === 'light'
                        ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">Chế độ Sáng (Light Mode)</div>
                          <div className="text-[11px] text-slate-500">Nền trắng thanh lịch, tương phản chuẩn Atelier</div>
                        </div>
                      </div>
                      {themeMode === 'light' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white">
                          <Check className="w-3 h-3" />
                          Đang dùng
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-600 font-medium">
                          Chọn dùng
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3">
                      Tối ưu độ rõ nét khi làm việc ban ngày hoặc trong văn phòng đủ sáng, chuẩn typography cao cấp.
                    </p>
                    <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800">Mẫu giao diện sáng</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-medium">Nút mẫu</span>
                    </div>
                  </div>

                  {/* Card Tối */}
                  <div
                    onClick={() => handleSelectThemeMode('dark')}
                    className={`p-4 rounded-lg border transition-all cursor-pointer relative group text-xs ${themeMode === 'dark'
                        ? 'border-sky-400 ring-2 ring-sky-400/30 bg-slate-800/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center border border-slate-700">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">Chế độ Tối (Dark Mode)</div>
                          <div className="text-[11px] text-slate-500">Nền tối Onyx Slate chuyên nghiệp</div>
                        </div>
                      </div>
                      {themeMode === 'dark' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500 text-slate-950 font-bold">
                          <Check className="w-3 h-3" />
                          Đang dùng
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-600 font-medium">
                          Chọn dùng
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3">
                      Bảo vệ mắt, giảm chói sáng khi làm việc ban đêm, tăng sự tập trung và tiết kiệm điện năng màn hình OLED.
                    </p>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-200">Mẫu giao diện tối</span>
                      <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px] font-bold">Nút mẫu</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 text-slate-700" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Trạng thái Cơ sở dữ liệu hệ thống</h2>
                    <p className="text-xs text-slate-500">Cấu hình kết nối và phân bổ phân vùng địa lý</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="text-slate-500 font-medium">Tên Database</div>
                    <div className="font-mono font-semibold text-slate-900 text-sm">caishop-db</div>
                    <div className="text-slate-400 font-mono text-[11px]">UUID: eabc574a-2bf1-4f1a-8dc4-89072f910ddb</div>
                  </div>

                  <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="text-slate-500 font-medium">Khu vực phân tán (Region)</div>
                    <div className="font-mono font-semibold text-emerald-700 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      APAC (Singapore - sin)
                    </div>
                    <div className="text-slate-400 text-[11px]">Độ trễ thấp tối ưu cho thị trường Việt Nam</div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-slate-700" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Bảo mật & Phiên xác thực (JWT Auth)</h2>
                    <p className="text-xs text-slate-500">Phân quyền chặt chẽ giữa khách hàng và người điều hành</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-900">Thuật toán mã hóa JWT</span>
                    <span className="font-mono text-slate-700">HS256 (HMAC with SHA-256)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-900">Cơ chế lưu trữ Token</span>
                    <span className="font-mono text-slate-700">HTTP-Only Cookie (`caishop_token`)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-900">Khóa an toàn giá sàn (Floor Price Lock)</span>
                    <span className="font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Kích hoạt (Ngăn chặn bán dưới giá sàn)
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB: CẤU HÌNH THANH TOÁN (VIETQR & COD) ================= */}
          {activeTab === 'payment' && <PaymentManagementSection />}

          {/* ================= TAB: QUẢN LÝ ƯU ĐÃI & VOUCHER (DEALS) ================= */}
          {activeTab === 'deals' && <DealManagementSection />}

        </main>
      </div>

      {/* Floating Slide-in Toast Notification (Top-Right, Highest z-index) */}
      {notificationToast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-[99999] flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md border transition-all duration-300 animate-in fade-in slide-in-from-top-5 max-w-md ${
            notificationToast.type === 'success'
              ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20 ring-1 ring-emerald-500/30'
              : notificationToast.type === 'error'
              ? 'bg-slate-900/95 text-white border-rose-500/50 shadow-rose-950/20 ring-1 ring-rose-500/30'
              : 'bg-slate-900/95 text-white border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/30'
          }`}
        >
          <div className="shrink-0">
            {notificationToast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            ) : notificationToast.type === 'error' ? (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>

          <div className="flex-1 font-sans leading-relaxed text-slate-100">
            {notificationToast.message}
          </div>

          <button
            onClick={() => setNotificationToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Profile Modal Popup */}
      {isProfileModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsProfileModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  AD
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Hồ sơ Quản trị viên</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Thông tin tài khoản & quyền điều hành</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Họ và tên</span>
                </label>
                <input
                  type="text"
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="h-9 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa chỉ Email</span>
                </label>
                <input
                  type="email"
                  value={tempProfile.email}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                  placeholder="admin@degent.vn"
                  className="h-9 w-full rounded border border-slate-300 px-3 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Số điện thoại (SĐT)</span>
                </label>
                <input
                  type="text"
                  value={tempProfile.phone}
                  onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                  placeholder="0988 123 456"
                  className="h-9 w-full rounded border border-slate-300 px-3 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa chỉ</span>
                </label>
                <textarea
                  rows={2}
                  value={tempProfile.address}
                  onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })}
                  placeholder="Địa chỉ văn phòng / trụ sở điều hành..."
                  className="w-full rounded border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Readonly info badges */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quyền hạn hệ thống:</span>
                  </span>
                  <span className="font-semibold font-mono text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px]">
                    ADMIN (Root Access)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Trạng thái phiên:</span>
                  </span>
                  <span className="font-medium text-emerald-700 flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đang hoạt động (JWT 7 Days)
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAIL MODAL POPUP ================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-0 overflow-hidden my-8 text-left space-y-0">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold tracking-wider text-white">
                    #{selectedOrderForDetail.order_code}
                  </span>

                  {(() => {
                    const isRet = selectedOrderForDetail.fulfillment_status === 'RETURNED';
                    const retNotesLower = (selectedOrderForDetail.return_notes || '').toLowerCase();
                    const isEx = isRet && (
                      selectedOrderForDetail.return_notes?.includes('ĐỔI HÀNG') || 
                      retNotesLower.includes('đổi size') || 
                      retNotesLower.includes('đổi mẫu') ||
                      retNotesLower.includes('đổi hàng')
                    );
                    const isRef = isRet && !isEx;

                    if (isEx) {
                      return (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                          ĐỔI HÀNG
                        </span>
                      );
                    }
                    if (isRef) {
                      return (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          TRẢ HÀNG
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="text-[11px] text-slate-300">
                  Đặt lúc: {new Date(selectedOrderForDetail.created_at).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
              {/* Box YÊU CẦU ĐỔI / TRẢ (Nếu có) */}
              {(() => {
                const isRet = selectedOrderForDetail.fulfillment_status === 'RETURNED';
                const retNotesLower = (selectedOrderForDetail.return_notes || '').toLowerCase();
                const isEx = isRet && (
                  selectedOrderForDetail.return_notes?.includes('ĐỔI HÀNG') || 
                  retNotesLower.includes('đổi size') || 
                  retNotesLower.includes('đổi mẫu') ||
                  retNotesLower.includes('đổi hàng')
                );
                const isRef = isRet && !isEx;

                if (!isRet) return null;

                return (
                  <div className={`p-4 rounded-xl border text-xs space-y-2.5 shadow-sm ${
                    isEx
                      ? 'bg-blue-50/90 border-blue-300 text-blue-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className={`font-bold flex items-center gap-1.5 text-sm ${
                        isEx ? 'text-blue-900 border-blue-200' : 'text-amber-900 border-amber-200'
                      }`}>
                        <RotateCcw className={`w-4 h-4 ${isEx ? 'text-blue-700' : 'text-amber-700'}`} />
                        <span>
                          {isEx ? 'CHI TIẾT YÊU CẦU: ĐỔI HÀNG (ĐỔI SIZE / MẪU)' : 'CHI TIẾT YÊU CẦU: TRẢ HÀNG (HOÀN TIỀN)'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isEx ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {isEx ? 'Đổi hàng' : 'Trả hàng'}
                      </span>
                    </div>

                    <div className="space-y-1.5 leading-relaxed">
                      <div>
                        <span className="font-semibold text-slate-700">Lý do & Ghi chú từ khách:</span>
                        <div className={`mt-1 p-3 rounded-lg border bg-white font-medium text-xs leading-relaxed ${
                          isEx ? 'border-blue-200 text-blue-950' : 'border-amber-200 text-amber-950'
                        }`}>
                          {selectedOrderForDetail.return_notes || (isEx ? 'Khách yêu cầu đổi sản phẩm / đổi size vừa vặn.' : 'Khách yêu cầu trả sản phẩm / nhận lại tiền.')}
                        </div>
                      </div>

                      {selectedOrderForDetail.return_created_at && (
                        <div className="text-[11px] text-slate-500 pt-0.5">
                          Thời gian gửi yêu cầu: {new Date(selectedOrderForDetail.return_created_at).toLocaleString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Thông tin Khách hàng, Sản phẩm & Gói giao hàng/Thanh toán */}
              {(() => {
                const parsed = parseOrderAddressDetails(selectedOrderForDetail.shipping_address);
                return (
                  <>
                    {/* 1. KHỐI THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ GIAO HÀNG (Full Width, rộng rãi, dễ đọc) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center justify-between uppercase text-[11px] tracking-wide border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-900" />
                          <span>Thông tin người nhận & Liên hệ</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCustomerInfoCollapsed(!isCustomerInfoCollapsed)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <span>{isCustomerInfoCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                          {isCustomerInfoCollapsed ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronUp className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {isCustomerInfoCollapsed ? (
                        <div
                          onClick={() => setIsCustomerInfoCollapsed(false)}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-900">{selectedOrderForDetail.customer_name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-slate-700">{selectedOrderForDetail.customer_phone}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 truncate max-w-md">{parsed.cleanAddress}</span>
                          </div>
                          <span className="text-[11px] font-mono text-blue-600 shrink-0 font-medium ml-2">Chạm mở rộng</span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-slate-900 font-bold text-sm">
                                  {selectedOrderForDetail.customer_name}
                                </span>
                                <PhoneZaloContact phone={selectedOrderForDetail.customer_phone} badgeSize="md" />
                              </div>
                              {selectedOrderForDetail.customer_email && (
                                <div className="text-slate-500 text-[11px] truncate pt-0.5">
                                  {selectedOrderForDetail.customer_email}
                                </div>
                              )}
                            </div>

                            {/* Địa chỉ giao hàng chi tiết */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-900" />
                                <span>Địa chỉ giao hàng:</span>
                              </div>
                              <div className="text-slate-800 font-semibold leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                                {parsed.cleanAddress}
                              </div>
                            </div>
                          </div>

                          {/* Ghi chú đơn hàng nếu có */}
                          {parsed.orderNote && (
                            <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-1.5">
                              <span className="font-bold shrink-0">Ghi chú từ khách:</span>
                              <span className="font-medium">{parsed.orderNote}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Mã ĐVVC & Nút gửi / sửa mã ĐVVC nằm ngay dưới thông tin khách hàng */}
                      <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-wrap bg-white/70 -mx-4 -mb-4 p-3 rounded-b-xl border-b-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                            <span>Mã vận đơn (ĐVVC):</span>
                          </span>
                          {selectedOrderForDetail.tracking_code ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 text-xs font-semibold">
                              <span>{selectedOrderForDetail.carrier || 'Viettel Post'}:</span>
                              <span className="font-bold font-mono">{selectedOrderForDetail.tracking_code}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa có mã vận đơn</span>
                          )}
                        </div>

                        {(() => {
                          const isPaid = selectedOrderForDetail.payment_status === 'PAID';
                          const isCancelled = selectedOrderForDetail.fulfillment_status === 'CANCELLED' || selectedOrderForDetail.payment_status === 'REFUNDED';

                          if (isCancelled) {
                            return <span className="text-xs text-rose-600 font-semibold">Đã hủy / Đã hoàn tiền</span>;
                          }

                          if (!isPaid && selectedOrderForDetail.payment_method !== 'cod') {
                            return <span className="text-xs text-slate-400 italic select-none">Chờ thanh toán</span>;
                          }

                          if (selectedOrderForDetail.fulfillment_status === 'CONFIRMING') {
                            return (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleShopConfirmStock(selectedOrderForDetail.id)}
                                  disabled={confirmStockLoadingId === selectedOrderForDetail.id}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                  <span>{confirmStockLoadingId === selectedOrderForDetail.id ? 'Đang duyệt...' : 'Còn hàng'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRefundModal(selectedOrderForDetail)}
                                  className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Hết hàng & Hoàn tiền</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenDispatchModal(selectedOrderForDetail)}
                              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold border border-slate-900 inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                              title="Cập nhật hoặc chỉnh sửa mã vận đơn đơn vị vận chuyển"
                            >
                              <Truck className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>{selectedOrderForDetail.tracking_code ? 'Sửa mã ĐVVC' : 'Gửi mã ĐVVC'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 2. CHI TIẾT SẢN PHẨM ĐÃ ĐẶT */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-900" />
                          <span>Sản phẩm trong đơn ({Array.isArray(selectedOrderForDetail.items) ? selectedOrderForDetail.items.length : selectedOrderForDetail.items_count || 0})</span>
                        </h4>
                      </div>

                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                        {loadingOrderDetail ? (
                          <div className="p-6 text-center text-xs text-slate-500">Đang tải chi tiết sản phẩm...</div>
                        ) : Array.isArray(selectedOrderForDetail.items) && selectedOrderForDetail.items.length > 0 ? (
                          selectedOrderForDetail.items.map((it: any, idx: number) => {
                            const imgUrl = getPrimaryImageUrl(it.product_images);
                            return (
                              <div key={it.id || idx} className="p-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                                <button
                                  type="button"
                                  onClick={() => setZoomedImage({
                                    url: imgUrl,
                                    title: it.product_name,
                                    subtitle: `Màu: ${it.color} • Size: ${it.size}${it.variant_sku ? ` • SKU: ${it.variant_sku}` : ''}`
                                  })}
                                  className="relative group/img shrink-0 cursor-zoom-in rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 transition-all focus:outline-none shadow-2xs"
                                  title="Nhấp để phóng to & sao chép ảnh"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={it.product_name}
                                    className="w-12 h-14 object-cover group-hover/img:scale-110 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <ZoomIn className="w-4 h-4 drop-shadow-sm" />
                                  </div>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-slate-900 text-xs truncate">
                                    {it.product_name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span>Màu: <strong className="text-slate-700">{it.color}</strong></span>
                                    <span>•</span>
                                    <span>Size: <strong className="text-slate-700">{it.size}</strong></span>
                                    {it.variant_sku && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[10px] text-slate-400">SKU: {it.variant_sku}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    {formatMoney(it.unit_price)} × {it.quantity}
                                  </div>
                                </div>
                                <div className="text-right font-bold text-xs text-slate-900 tabular-nums">
                                  {formatMoney(it.total_price || (it.unit_price * it.quantity))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-500">
                            Không có thông tin chi tiết sản phẩm.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. GÓI VẬN CHUYỂN, VOUCHER ÁP DỤNG & TỔNG THANH TOÁN (Nằm bên dưới dòng sản phẩm) */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center justify-between uppercase text-[11px] tracking-wide border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-900" />
                          <span>Gói giao hàng & Thanh toán</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-2xs ${
                          selectedOrderForDetail.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {selectedOrderForDetail.payment_status === 'PAID' ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Gói giao hàng khách đã chọn */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                              <Truck className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                              <span>Gói vận chuyển:</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {parsed.shippingFee ? `Phí ship: ${parsed.shippingFee}` : 'Freeship 0đ'}
                            </span>
                          </div>

                          <div className="text-slate-800 font-semibold text-xs leading-normal">
                            {parsed.shippingMethod || "Giao hàng tiêu chuẩn toàn quốc (Viettel Post)"}
                          </div>

                          {parsed.deliveryTimeSlot && (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Hẹn giờ giao: {parsed.deliveryTimeSlot}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Khuyến mãi & Voucher đã áp dụng */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 shadow-2xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                              <Ticket className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                              <span>Voucher & Khuyến mãi:</span>
                            </div>
                            {(parsed.voucherCode || parsed.dealTag || parsed.membershipTag) ? (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                                {parsed.voucherCode && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                                    <Tag className="w-3 h-3 text-emerald-600" />
                                    <span>{parsed.voucherCode}</span>
                                  </span>
                                )}
                                {parsed.dealTag && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                                    <Sparkles className="w-3 h-3 text-emerald-700" />
                                    <span>{parsed.dealTag}</span>
                                  </span>
                                )}
                                {parsed.membershipTag && (
                                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200">
                                    <span>👑 {parsed.membershipTag}</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 italic pt-1">
                                Đơn hàng nguyên giá (Không áp dụng voucher)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết Cọc COD & Tiền thu Shipper nếu có */}
                      {parsed.codInfo && (
                        <div className="bg-amber-50/90 border border-amber-300/80 rounded-lg p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950 text-[11px] uppercase tracking-wide">
                              Chi tiết thanh toán COD:
                            </span>
                            {parsed.codInfo.percent && (
                              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                                Cọc {parsed.codInfo.percent}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/80">
                            {parsed.codInfo.deposited && (
                              <div>
                                <div className="text-[10px] text-slate-500 font-medium">Đã cọc trước:</div>
                                <div className="font-bold text-emerald-700">{parsed.codInfo.deposited}</div>
                              </div>
                            )}
                            {parsed.codInfo.remaining && (
                              <div>
                                <div className="text-[10px] text-rose-700 font-bold uppercase">Shipper cần thu:</div>
                                <div className="font-black text-rose-700 text-sm">{parsed.codInfo.remaining}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tổng thanh toán */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                        <span className="font-bold text-slate-700">Tổng thanh toán:</span>
                        <span className="font-black text-slate-950 text-base tabular-nums">
                          {formatMoney(selectedOrderForDetail.total_amount)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}


            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {selectedOrderForDetail.fulfillment_status === 'DELIVERED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Khách đã nhận hàng</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAdminConfirmDelivered(selectedOrderForDetail)}
                    disabled={isConfirmingDelivered}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                    title="Xác nhận khách đã nhận được hàng (dành cho trường hợp khách quên bấm xác nhận)"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isConfirmingDelivered ? 'Đang cập nhật...' : 'Khách đã nhận hàng'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX ZOOM & COPY IMAGE MODAL ================= */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with title & close button */}
            <div className="w-full flex items-center justify-between text-white/90 px-1">
              <div className="min-w-0 pr-4">
                <div className="font-semibold text-sm truncate">{zoomedImage.title || 'Hình ảnh sản phẩm'}</div>
                {zoomedImage.subtitle && (
                  <div className="text-xs text-white/60 font-mono mt-0.5 truncate">{zoomedImage.subtitle}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Đóng cửa sổ xem ảnh (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Enlarged Image */}
            <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-2xl p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title || 'Phóng to ảnh sản phẩm'}
                className="max-h-[70vh] max-w-full object-contain rounded-lg select-auto cursor-default"
                title="Chuột phải để chọn 'Sao chép hình ảnh' hoặc bấm nút bên dưới"
              />
            </div>

            {/* Action Buttons Bar */}
            <div className="flex items-center gap-2 flex-wrap justify-center bg-slate-900/90 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl">
              <button
                type="button"
                onClick={() => handleCopyImageToClipboard(zoomedImage.url)}
                disabled={isCopyingImage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Sao chép trực tiếp hình ảnh vào Clipboard để dán (Ctrl+V) vào Zalo, Facebook, chat"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopyingImage ? 'Đang sao chép...' : 'Sao chép ảnh'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyImageUrl(zoomedImage.url)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                title="Sao chép đường dẫn link ảnh"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sao chép link</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadImage(zoomedImage.url, zoomedImage.title)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                title="Tải ảnh về máy tính"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh</span>
              </button>

              <a
                href={zoomedImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tab mới</span>
              </a>
            </div>

            {/* Notification Toast */}
            {copyImageToast && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{copyImageToast}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Out Of Stock Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Báo hết hàng & Hoàn tiền cho khách
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">
                    Đơn hàng #{refundModalOrder.order_code || refundModalOrder.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Khách hàng:</span>
                  <span className="font-bold text-slate-900">{refundModalOrder.customer_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Số điện thoại:</span>
                  <span className="font-mono text-slate-900">{refundModalOrder.customer_phone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <span className="font-semibold text-slate-700">Số tiền hoàn về STK:</span>
                  <span className="font-bold text-rose-600 text-sm">{formatMoney(refundModalOrder.total_amount)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ghi chú hoàn tiền / Lý do hết hàng
                </label>
                <textarea
                  rows={3}
                  value={refundNotes}
                  onChange={e => setRefundNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                  placeholder="Nhập ghi chú hoặc thông tin đối soát chuyển khoản hoàn trả khách..."
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                ℹ️ Sau khi bấm xác nhận, trạng thái đơn sẽ chuyển sang <strong className="text-rose-600">Đã hủy / Đã hoàn tiền</strong>, đồng thời hệ thống ghi nhận khoản tiền hoàn vào sổ cái tài chính.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                disabled={isRefunding}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isRefunding}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang hoàn tiền...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xác nhận hoàn tiền ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Order / Tracking Modal */}
      {dispatchOrderModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lên đơn & Gửi mã vận chuyển
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Đơn hàng #{dispatchOrderModal.order.order_code} • {dispatchOrderModal.order.customer_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrderModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitDispatch} className="p-6 space-y-4">
              {/* Order quick summary */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Khách nhận:</span>
                  <span className="font-semibold text-slate-900">{dispatchOrderModal.order.customer_name} ({dispatchOrderModal.order.customer_phone})</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 shrink-0 mr-2">Địa chỉ:</span>
                  <span className="font-medium text-slate-900 text-right leading-relaxed">{dispatchOrderModal.order.shipping_address}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Thu hộ / Tổng tiền:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {dispatchOrderModal.order.payment_method === 'cod' ? `COD ${formatMoney(dispatchOrderModal.order.total_amount)}` : 'Đã thanh toán (0đ)'}
                  </span>
                </div>
              </div>

              {/* Carrier Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Chọn Đơn vị vận chuyển
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'VIETTEL_POST', label: 'Viettel Post', hasLogo: true },
                    { id: 'GHTK', label: 'Giao Hàng Tiết Kiệm (GHTK)', hasLogo: false },
                    { id: 'GHN', label: 'Giao Hàng Nhanh (GHN)', hasLogo: false },
                    { id: 'SHIPPER', label: 'Shipper riêng DE\'GENT', hasLogo: false },
                  ].map(c => {
                    const isSelected = dispatchOrderModal.carrier === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCarrierChange(c.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {c.hasLogo ? (
                          <img
                            src="https://inkythuatso.com/uploads/thumbnails/800/2023/05/logo-viettelpost-inkythuatso-27-14-52-01.jpg"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863870/degent/viettelpost-logo.jpg'; }}
                            alt="Viettel Post"
                            className="w-4 h-4 rounded object-cover shrink-0"
                          />
                        ) : (
                          <Truck className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        )}
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Mã vận đơn của ĐVVC
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rawCode = (dispatchOrderModal.order.order_code || '').replace(/\D/g, '') || '881865';
                      const prefix = dispatchOrderModal.carrier === 'VIETTEL_POST' ? 'VTP' : dispatchOrderModal.carrier === 'GHTK' ? 'S' : dispatchOrderModal.carrier === 'GHN' ? 'GHN' : 'DGT-';
                      const suffix = dispatchOrderModal.carrier === 'VIETTEL_POST' ? 'VN' : dispatchOrderModal.carrier === 'GHTK' ? '.GHTK' : '';
                      setDispatchOrderModal({
                        ...dispatchOrderModal,
                        trackingCode: `${prefix}${rawCode}${suffix}`,
                      });
                    }}
                    className="text-[11px] text-slate-900 hover:text-black underline cursor-pointer font-bold"
                  >
                    Tạo mã gợi ý
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={dispatchOrderModal.trackingCode}
                    onChange={e => setDispatchOrderModal({ ...dispatchOrderModal, trackingCode: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: VTP881865VN hoặc S12345.GHTK"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-wider uppercase text-slate-900 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ✓ Mã này sẽ được lưu vào đơn hàng. Khách hàng khi kiểm tra đơn hàng sẽ thấy mã vận đơn và link tra cứu trực tiếp.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchOrderModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispatch}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingDispatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang lưu & gửi mã...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4 text-white" />
                      <span>Xác nhận lên đơn & Gửi mã</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
