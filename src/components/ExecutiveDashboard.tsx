'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Tag,
  FolderTree
} from 'lucide-react';
import ProductManagementSection from '@/components/ProductManagementSection';
import CollectionManagementSection from '@/components/CollectionManagementSection';
import { CustomSelect } from '@/components/CustomSelect';

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
  fulfillment_status: string;
  created_at: string;
  items_count?: number;
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
  email: 'admin@caishop.vn',
  phone: '0988 123 456',
  address: 'Tầng 5, Tòa nhà Atelier, 12 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
};

type AdminTab = 'products' | 'collections' | 'cashflow' | 'orders' | 'pricing' | 'customers' | 'content' | 'settings';
type ContentSubTab = 'header' | 'home' | 'products' | 'studio' | 'about';

export default function ExecutiveDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('cashflow');
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>('header');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [cashflow, setCashflow] = useState<CashFlowSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [customers, setCustomers] = useState<CustomerRankItem[]>([]);

  // CMS Content States
  const [cmsContent, setCmsContent] = useState<any>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentToast, setContentToast] = useState<string | null>(null);
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
      const [cfRes, invRes, ordRes, usrRes, cntRes] = await Promise.all([
        fetch('/api/cashflow'),
        fetch('/api/inventory'),
        fetch('/api/orders'),
        fetch('/api/users'),
        fetch('/api/content')
      ]);

      const cfData = await cfRes.json();
      const invData = await invRes.json();
      const ordData = await ordRes.json();
      const usrData = await usrRes.json().catch(() => ({ success: false, data: [] }));
      const cntData = await cntRes.json().catch(() => ({ success: false, data: null }));

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
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fulfillment_status: newStatus } : o));
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, fulfillment_status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
      fetchData();
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
        setContentToast(`✓ Đã lưu thay đổi cho mục "${section.toUpperCase()}" vào Cloudflare D1 thành công!`);
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
    products: 'Quản lý sản phẩm & Biến thể',
    collections: 'Quản lý Bộ sưu tập & Phân cấp danh mục',
    cashflow: 'Dòng tiền & Lợi nhuận',
    orders: 'Đơn hàng vận hành',
    pricing: 'Bộ điều khiển giá',
    customers: 'Khách hàng & Hội viên',
    content: 'Quản lý nội dung & Giao diện (CMS)',
    settings: 'Cấu hình hạ tầng & D1'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
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
            <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center rounded text-xs font-semibold tracking-wider">
              CS
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900">CAISHOP</div>
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

          {/* Group 1: TÀI CHÍNH & ĐƠN HÀNG */}
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Tài chính & Đơn hàng
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveTab('cashflow'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'cashflow'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span>Dòng tiền & P&L</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'orders'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-slate-500" />
                  <span>Đơn hàng vận hành</span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {orders.length}
                </span>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'products'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-slate-500" />
                  <span>Sản phẩm & Biến thể</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-white font-medium">
                  Quản lý
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('collections'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'collections'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderTree className="w-4 h-4 text-slate-500" />
                  <span>Bộ sưu tập (Phân cấp)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  Tree
                </span>
              </button>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'pricing'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Bộ điều khiển giá</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'customers'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Khách hàng & Hội viên</span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {users.length}
                </span>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'content'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Quản lý nội dung</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                    CMS
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeTab === 'content' ? 'rotate-180 text-slate-900' : ''}`} />
                </div>
              </button>

              {/* SUB-SIDEBAR: Mở ra ngay khi chọn Quản lý nội dung */}
              {activeTab === 'content' && (
                <div className="mt-1.5 ml-2 pl-2.5 border-l-2 border-slate-200 space-y-1 py-1 transition-all">
                  <button
                    onClick={() => { setContentSubTab('header'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab === 'header'
                        ? 'bg-slate-900 text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Thanh Menu Header</span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${contentSubTab === 'header' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {cmsContent?.header?.menu_items?.length || 4} mục
                    </span>
                  </button>

                  <button
                    onClick={() => { setContentSubTab('home'); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${contentSubTab !== 'header'
                        ? 'bg-slate-900 text-white shadow-2xs font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Nội dung</span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 font-medium ${contentSubTab !== 'header'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-emerald-50 text-emerald-700'
                      }`}>
                      7 khối
                    </span>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'settings'
                    ? 'bg-slate-100 text-slate-900 font-semibold border-l-2 border-slate-900 pl-2.5'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span>Cơ sở dữ liệu D1</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="D1 Trực tuyến" />
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
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold shrink-0 group-hover:scale-105 transition-transform">
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

            <span className="text-[9px] font-semibold font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Cloudflare D1 APAC</span>
            </div>

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

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
                            ATELIER
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
                                    value={cmsContent?.home?.hero_image_url || '/images/hero-atelier.jpg'}
                                    placeholder="/images/hero-atelier.jpg hoặc https://..."
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
                                    { label: 'Atelier Model (Gốc)', url: '/images/hero-atelier.jpg' },
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
                                    value={cmsContent?.home?.hero_cta_1 || 'Enter the studio'}
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
                                    value={cmsContent?.home?.hero_cta_2 || 'Browse the library'}
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
                                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">Khung 1 (Sáng)</span>
                                      <span className="text-[9px] font-mono text-slate-400">001 Concept</span>
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
                                          value={cmsContent?.home?.hero_plate1_tag || 'Concept'}
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
                                          value={cmsContent?.home?.hero_plate1_title || 'Canvas'}
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
                                          placeholder="/image/lacoste.png"
                                          value={cmsContent?.home?.hero_plate1_logo || ''}
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
                                      <span className="text-[9px] font-mono text-slate-400">002 Drape</span>
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
                                          value={cmsContent?.home?.hero_plate2_tag || 'Drape'}
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
                                          value={cmsContent?.home?.hero_plate2_title || 'Compose'}
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
                                          placeholder="/image/CK.png"
                                          value={cmsContent?.home?.hero_plate2_logo || ''}
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
                                      <span className="text-[9px] font-mono text-slate-400">003 Craft</span>
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
                                          value={cmsContent?.home?.hero_plate3_tag || 'Craft'}
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
                                          value={cmsContent?.home?.hero_plate3_title || 'Refine'}
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
                                          placeholder="/image/tommy.png"
                                          value={cmsContent?.home?.hero_plate3_logo || ''}
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
                                      <span className="text-[9px] font-mono text-slate-400">004 Dispatch</span>
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
                                          value={cmsContent?.home?.hero_plate4_tag || 'Dispatch'}
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
                                          value={cmsContent?.home?.hero_plate4_title || 'Ship'}
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
                                          placeholder="/image/LEVIS.png"
                                          value={cmsContent?.home?.hero_plate4_logo || ''}
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

                          {/* KHỐI 3: BỘ SƯU TẬP SẢN PHẨM TRANG CHỦ */}
                          {(homeActiveSection === 'all' || homeActiveSection === 'collection') && (
                            <div className="space-y-4 pt-5">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono">3</span>
                                  <span>Khối Bộ sưu tập Sản phẩm Trang chủ (Editorial Grid)</span>
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
                                  value={cmsContent?.home?.studio_narrative || cmsContent?.studio?.narrative || 'Every garment is linked to Cloudflare D1 distributed edge storage. Zero speculative inventory, instant double-entry accounting records, and automated dispatch upon bank confirmation.'}
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
                                    value={cmsContent?.home?.studio_canvas || cmsContent?.studio?.spec_canvas || 'Full-bleed monochrome UI'}
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
                                    value={cmsContent?.home?.studio_ledger || cmsContent?.studio?.spec_ledger || 'Cloudflare D1 APAC (SIN)'}
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
                                  value={cmsContent?.home?.manifesto_signature || cmsContent?.about?.signature || 'Atelier / Caishop Architecture 2026'}
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
                                  value={cmsContent?.home?.footer_copyright || '© 2026 ATELIER CAISHOP. ALL RIGHTS RESERVED.'}
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
                                <span>caishop.vn/</span>
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
                              ATELIER
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
                                src={cmsContent?.home?.hero_image_url || '/images/hero-atelier.jpg'}
                                alt="Hero Background"
                                className="w-full h-full object-cover object-center contrast-105 brightness-[0.7]"
                                onError={(e: any) => { e.target.src = '/images/hero-atelier.jpg'; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                            </div>

                            <div className="relative z-10 space-y-3 max-w-sm">
                              <div className="text-[9px] font-mono font-bold text-white bg-white/20 border border-white/30 backdrop-blur-xs w-fit px-1.5 py-0.5 rounded">
                                [KHỐI 1: HERO BANNER (ẢNH NỀN TOÀN BỘ)]
                              </div>
                              <div className="text-[9px] font-mono tracking-wider uppercase text-white/80 flex items-center gap-1.5">
                                <span>{cmsContent?.home?.hero_badge || 'COLLECTION 01 / THE INTERFACE SERIES'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white leading-tight drop-shadow-sm">
                                {cmsContent?.home?.hero_title || 'DESIGN, CUT TO MEASURE.'}
                              </h2>
                              <p className="text-[11px] leading-relaxed text-white/85 font-light line-clamp-3">
                                {cmsContent?.home?.hero_description || 'An editorial retail experiment constructed for autonomous commerce. Pure monochrome plates, real-time inventory locking, and zero excess ornament.'}
                              </p>
                              <div className="flex items-center gap-3 text-[9px] font-medium tracking-wider uppercase pt-1 text-white">
                                <span className="px-3 py-1 bg-white text-black font-semibold rounded-xs shadow-xs cursor-pointer">
                                  {cmsContent?.home?.hero_cta_1 || 'Enter the studio'} →
                                </span>
                                <span className="px-3 py-1 border border-white/60 text-white rounded-xs cursor-pointer">
                                  {cmsContent?.home?.hero_cta_2 || 'Browse the library'}
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
                                      <img src={cmsContent?.home?.hero_plate1_logo || '/image/lacoste.png'} alt="Lacoste" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate1_tag || 'Concept'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate1_title || 'Canvas'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 2 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate2_logo || '/image/CK.png'} alt="Calvin Klein" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate2_tag || 'Drape'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate2_title || 'Compose'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 3 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate3_logo || '/image/tommy.png'} alt="Tommy Hilfiger" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate3_tag || 'Craft'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate3_title || 'Refine'}
                                    </span>
                                  </div>
                                </div>

                                {/* Plate 4 */}
                                <div className="group relative overflow-hidden p-2.5 flex flex-col justify-between h-20 bg-white/5 hover:bg-white transition-all cursor-pointer">
                                  <div className="h-4 flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <img src={cmsContent?.home?.hero_plate4_logo || '/image/LEVIS.png'} alt="Levi's" className="max-h-4 max-w-[28px] object-contain" />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[7px] font-mono uppercase text-white/50 group-hover:text-black/60 block tracking-wider leading-none mb-0.5 transition-colors">
                                      {cmsContent?.home?.hero_plate4_tag || 'Dispatch'}
                                    </span>
                                    <span className="font-bold uppercase text-[9px] md:text-[10px] text-white group-hover:text-black tracking-tight leading-none block transition-colors">
                                      {cmsContent?.home?.hero_plate4_title || 'Ship'}
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

                            {/* 3 Sample Product Cards */}
                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                              <div className="border border-neutral-200 rounded p-2 bg-neutral-50/50 space-y-1">
                                <div className="aspect-[3/4] bg-neutral-200/80 rounded flex items-center justify-center text-[9px] font-mono text-neutral-400">PLATE 01</div>
                                <div className="text-[10px] font-semibold text-neutral-900 truncate">Atelier Coat</div>
                                <div className="text-[9px] font-mono text-neutral-600">3,450,000₫</div>
                              </div>
                              <div className="border border-neutral-200 rounded p-2 bg-neutral-50/50 space-y-1">
                                <div className="aspect-[3/4] bg-neutral-200/80 rounded flex items-center justify-center text-[9px] font-mono text-neutral-400">PLATE 02</div>
                                <div className="text-[10px] font-semibold text-neutral-900 truncate">Pleated Pant</div>
                                <div className="text-[9px] font-mono text-neutral-600">1,850,000₫</div>
                              </div>
                              <div className="border border-neutral-200 rounded p-2 bg-neutral-50/50 space-y-1">
                                <div className="aspect-[3/4] bg-neutral-200/80 rounded flex items-center justify-center text-[9px] font-mono text-neutral-400">PLATE 03</div>
                                <div className="text-[10px] font-semibold text-neutral-900 truncate">Raw Shirt</div>
                                <div className="text-[9px] font-mono text-neutral-600">2,200,000₫</div>
                              </div>
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
                              {cmsContent?.home?.studio_narrative || cmsContent?.studio?.narrative || 'Every garment is linked to Cloudflare D1 distributed edge storage. Zero speculative inventory, instant double-entry accounting records, and automated dispatch upon bank confirmation.'}
                            </p>

                            {/* Specs Definition List */}
                            <div className="grid grid-cols-2 gap-2 font-mono text-[9px] pt-1">
                              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                                <div className="text-neutral-500 text-[8px] uppercase">WEB CANVAS</div>
                                <div className="text-neutral-200 font-semibold truncate mt-0.5">
                                  {cmsContent?.home?.studio_canvas || cmsContent?.studio?.spec_canvas || 'Full-bleed monochrome UI'}
                                </div>
                              </div>
                              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                                <div className="text-neutral-500 text-[8px] uppercase">DATABASE</div>
                                <div className="text-emerald-400 font-semibold truncate mt-0.5">
                                  {cmsContent?.home?.studio_ledger || cmsContent?.studio?.spec_ledger || 'Cloudflare D1 APAC (SIN)'}
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
                              {cmsContent?.home?.manifesto_signature || cmsContent?.about?.signature || 'Atelier / Caishop Architecture 2026'}
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
                            <div className="flex justify-center gap-3 pt-1">
                              <span className="px-4 py-1.5 bg-white text-[#0a0a0a] text-[10px] uppercase font-semibold rounded">
                                {cmsContent?.home?.cta_button_text || 'Start shopping'}
                              </span>
                              <span className="px-4 py-1.5 border border-white/30 text-white text-[10px] uppercase font-semibold rounded">
                                Executive Dashboard
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
                              <span className="font-bold text-white tracking-wider">ATELIER CAISHOP</span>
                              <span>{cmsContent?.home?.footer_address || 'Hanoi Flagship Studio • Edge Cloud Delivery'}</span>
                            </div>
                            <div className="text-[9px] font-mono text-neutral-500 pt-1 border-t border-neutral-800 flex justify-between">
                              <span>{cmsContent?.home?.footer_copyright || '© 2026 ATELIER CAISHOP. ALL RIGHTS RESERVED.'}</span>
                              <span>D1 PROTOCOL</span>
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
                              <span>caishop.vn/products</span>
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
                              {cmsContent?.products?.badge || 'COLLECTION 01 • EDITIONS CATALOGUE'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 uppercase">
                              {cmsContent?.products?.title || 'THE PRODUCT ARCHIVE'}
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
                              Chỉnh sửa phần studio nền đen đơn sắc và các thông số công nghệ D1
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
                              <span>caishop.vn/#studio</span>
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
                            {cmsContent?.studio?.narrative || 'Interactive 3D fitting canvas synchronizing geometric garment meshes with Cloudflare D1 inventory ledger.'}
                          </p>

                          {/* Tech Specs Badges */}
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px]">
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                              <div className="text-neutral-500 text-[8px] uppercase">RENDER ENGINE</div>
                              <div className="text-neutral-200 font-semibold truncate mt-0.5">
                                {cmsContent?.studio?.spec_canvas || '3D WEBGL ENGINE / 60 FPS'}
                              </div>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded">
                              <div className="text-neutral-500 text-[8px] uppercase">STATE DATABASE</div>
                              <div className="text-emerald-400 font-semibold truncate mt-0.5">
                                {cmsContent?.studio?.spec_ledger || 'CLOUDFLARE D1 / <10MS SLA'}
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
                              <span>caishop.vn/#about</span>
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
                            "{cmsContent?.about?.body_text || 'We reject ornamental excess in e-commerce interfaces. CAISHOP Atelier treats code, data integrity, and typography as singular architectural elements.'}"
                          </blockquote>
                          <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-stone-200 text-stone-600">
                            <div>SIGNATURE: <span className="font-semibold text-stone-900">{cmsContent?.about?.signature || 'CAISHOP ATELIER / STUDIO LABS'}</span></div>
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
                  <div className="p-4 sm:p-5 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Lợi nhuận ròng thực tế</span>
                      <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        Biên {cashflow.gross_margin_percentage}%
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-emerald-700">
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
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium ${tx.transaction_type === 'REVENUE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.transaction_type === 'COGS'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                              {tx.transaction_type}
                            </span>
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
          {activeTab === 'orders' && (
            <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Danh sách đơn hàng vận hành</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tiến trình thanh toán VietQR và xử lý đóng gói xuất kho</p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Tổng {orders.length} đơn hàng
                </div>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                    <tr>
                      <th className="py-2.5 px-4">Mã đơn</th>
                      <th className="py-2.5 px-4">Khách hàng</th>
                      <th className="py-2.5 px-4">Địa chỉ giao hàng</th>
                      <th className="py-2.5 px-4 text-center">Thanh toán</th>
                      <th className="py-2.5 px-4 text-center">Trạng thái</th>
                      <th className="py-2.5 px-4 text-right">Tổng thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Chưa có đơn hàng nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      orders.map(ord => (
                        <tr key={ord.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{ord.order_code}</td>
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-slate-900">{ord.customer_name}</div>
                            <div className="text-[11px] text-slate-500">{ord.customer_phone}</div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{ord.shipping_address}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-sm text-[11px] font-medium ${ord.payment_status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                              }`}>
                              {ord.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {(() => {
                              const isDelivered = ord.fulfillment_status === 'DELIVERED';
                              const isProcessing = ord.fulfillment_status === 'PACKING' || ord.fulfillment_status === 'DISPATCHED';
                              const currentVal = isDelivered ? 'DELIVERED' : isProcessing ? 'PACKING' : 'UNFULFILLED';

                              return (
                                <CustomSelect
                                  value={currentVal}
                                  onChange={val => handleUpdateOrderStatus(ord.id, val)}
                                  options={[
                                    { value: 'UNFULFILLED', label: 'Chưa xử lý', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
                                    { value: 'PACKING', label: 'Đang xử lý', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
                                    { value: 'DELIVERED', label: 'Hoàn thành', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' }
                                  ]}
                                  variant="status-badge"
                                  size="sm"
                                />
                              );
                            })()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                            {formatMoney(ord.total_amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      Hội Viên Đồng
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                      0 - 2 áo
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">0% <span className="text-xs font-normal text-slate-500">giảm giá</span></div>
                  <p className="text-[11px] text-slate-600">Khách hàng mới mua dưới 3 sản phẩm, áp dụng giá niêm yết chuẩn.</p>
                </div>

                <div className="rounded-lg border border-slate-300 bg-slate-50/80 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Hội Viên Bạc
                    </span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-semibold">
                      Từ 3 áo
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">5% <span className="text-xs font-normal text-emerald-600 font-medium">chiết khấu</span></div>
                  <p className="text-[11px] text-slate-600">Khách tích lũy từ 3 sản phẩm trở lên, giảm ngay 5% toàn bộ giỏ hàng.</p>
                </div>

                <div className="rounded-lg border border-yellow-300 bg-yellow-50/60 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-yellow-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Hội Viên Vàng
                    </span>
                    <span className="text-[10px] font-mono bg-yellow-200 text-yellow-900 px-1.5 py-0.5 rounded font-semibold">
                      Từ 5 áo
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">10% <span className="text-xs font-normal text-emerald-600 font-medium">chiết khấu</span></div>
                  <p className="text-[11px] text-slate-600">Khách VIP mua từ 5 sản phẩm, giảm 10% cho mọi đơn hàng tiếp theo.</p>
                </div>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      Kim Cương / CTV VIP
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                      Từ 10 áo
                    </span>
                  </div>
                  <div className="text-xl font-bold text-indigo-950">15% <span className="text-xs font-normal text-emerald-600 font-medium">giảm sâu</span></div>
                  <p className="text-[11px] text-slate-600">Dành riêng cho Cộng tác viên và khách sỉ mua từ 10 áo trở lên.</p>
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
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.badge_class}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${c.dot_color}`} />
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
                              <span className={`inline-flex px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium ${
                                u.role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
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
              <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 text-slate-700" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Trạng thái Cơ sở dữ liệu Cloudflare D1</h2>
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

        </main>
      </div>

      {/* Floating Toast Notification (Top-Right) */}
      {contentToast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs font-medium border border-slate-700/60 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-sans leading-relaxed">{contentToast}</span>
          <button
            onClick={() => setContentToast(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
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
                  placeholder="admin@caishop.vn"
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

    </div>
  );
}
