'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Eye,
  Clock,
  RotateCcw,
  Search,
  Filter,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  Plus,
  RefreshCw,
  X,
  ExternalLink,
  SlidersHorizontal,
  Info,
  Check,
  Percent,
  Trash2,
  BarChart3,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getPrimaryImageUrl } from '@/lib/productImages';

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

interface ProductMonitoringItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  is_active: boolean;
  total_physical_qty: number;
  total_available_qty: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  min_price: number;
  max_price: number;
  margin_percent: number;
  views: number;
  view_share: number;
  units_sold: number;
  revenue: number;
  conversion_rate: number;
  returns: {
    total: number;
    tight: number;
    loose: number;
    return_rate: number;
    problem_sizes: string[];
  };
  size_recommendation: string;
  variants_count: number;
  created_at: string;
}

interface SizeAnalyticsItem {
  size: string;
  total_returned: number;
  tight_count: number;
  loose_count: number;
  other_count: number;
  tight_ratio: number;
  loose_ratio: number;
  primary_issue: 'CHẬT' | 'RỘNG' | 'CÂN BẰNG';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ProductReturnDetailItem {
  product_id: string;
  product_name: string;
  image_url: string;
  category: string;
  units_sold: number;
  total: number;
  tight: number;
  loose: number;
  other: number;
  tight_percentage: number;
  loose_percentage: number;
  other_percentage: number;
  return_rate: number;
  is_high_return_rate: boolean;
  primary_issue: 'CHẬT' | 'RỘNG' | 'CÂN BẰNG';
  sizes: string[];
  size_breakdown: {
    size: string;
    total: number;
    tight: number;
    loose: number;
    tight_percentage: number;
    loose_percentage: number;
  }[];
  logs: {
    id: string;
    order_id?: string;
    product_id: string;
    product_name: string;
    variant_sku?: string;
    size: string;
    color?: string;
    return_reason: 'TIGHT' | 'LOOSE' | 'OTHER';
    notes?: string;
    created_at: string;
  }[];
  recommendation: string;
}

interface SearchQueryAnalytics {
  query: string;
  count: number;
  avg_duration: number;
  results_count: number;
  top_clicked_name: string;
}

interface AnalyticsData {
  summary: {
    total_active_products: number;
    total_views: number;
    avg_search_duration_seconds: number;
    total_returns: number;
    tight_returns_count: number;
    loose_returns_count: number;
    tight_percentage: number;
    loose_percentage: number;
  };
  size_analytics: SizeAnalyticsItem[];
  product_return_analytics: ProductReturnDetailItem[];
  search_analytics: {
    avg_duration_seconds: number;
    total_searches: number;
    fast_searches: number;
    medium_searches: number;
    deep_searches: number;
    top_queries: SearchQueryAnalytics[];
    recent_searches: any[];
  };
  product_monitoring: ProductMonitoringItem[];
  top_viewed_products: ProductMonitoringItem[];
  return_logs: any[];
}

export interface ProductMonitoringSectionProps {
  activeSectionTab?: 'returns' | 'behavior';
  onSectionTabChange?: (tab: 'returns' | 'behavior') => void;
}

export default function ProductMonitoringSection({
  activeSectionTab = 'returns',
  onSectionTabChange,
}: ProductMonitoringSectionProps = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'returns' | 'views' | 'logs'>(
    activeSectionTab === 'behavior' ? 'views' : 'returns'
  );

  useEffect(() => {
    if (activeSectionTab === 'returns') {
      setActiveSubTab(prev => (prev === 'logs' ? 'logs' : 'returns'));
    } else if (activeSectionTab === 'behavior') {
      setActiveSubTab(prev => (prev === 'matrix' ? 'matrix' : 'views'));
    }
  }, [activeSectionTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MOST_VIEWED' | 'HIGH_RETURNS'>('ALL');
  const [isAddReturnOpen, setIsAddReturnOpen] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // New return form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnSize, setReturnSize] = useState('M');
  const [returnReason, setReturnReason] = useState<'TIGHT' | 'LOOSE' | 'OTHER'>('TIGHT');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnOrderCode, setReturnOrderCode] = useState('');

  // Return analysis subtab state
  const [selectedReturnProduct, setSelectedReturnProduct] = useState<ProductReturnDetailItem | null>(null);
  const [returnProductFilter, setReturnProductFilter] = useState<'ALL' | 'HIGH_RETURN' | 'TIGHT' | 'LOOSE'>('ALL');
  const [returnProductSearch, setReturnProductSearch] = useState('');
  const [showUniversalSizes, setShowUniversalSizes] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.product_monitoring.length > 0 && !selectedProductId) {
          setSelectedProductId(json.product_monitoring[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !returnSize) return;

    setSubmittingReturn(true);
    try {
      const chosenProd = data?.product_monitoring.find(p => p.id === selectedProductId);
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'return',
          product_id: selectedProductId,
          product_name: chosenProd?.name || 'Sản phẩm',
          order_id: returnOrderCode.trim() || 'HD-TRỰC-TIẾP',
          size: returnSize.trim().toUpperCase(),
          return_reason: returnReason,
          notes: returnNotes.trim()
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        setIsAddReturnOpen(false);
        setReturnNotes('');
        setReturnOrderCode('');
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error adding return:', err);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleDeleteReturn = async (returnId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi hoàn hàng này?')) return;
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete_return', id: returnId })
      });
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting return:', err);
    }
  };

  // Filtered monitoring products
  const filteredProducts = useMemo(() => {
    if (!data?.product_monitoring) return [];
    let list = [...data.product_monitoring];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    if (statusFilter === 'ACTIVE') {
      list = list.filter(p => p.is_active);
    } else if (statusFilter === 'MOST_VIEWED') {
      list.sort((a, b) => b.views - a.views);
    } else if (statusFilter === 'HIGH_RETURNS') {
      list = list.filter(p => p.returns.total > 0).sort((a, b) => b.returns.total - a.returns.total);
    }

    return list;
  }, [data?.product_monitoring, searchQuery, statusFilter]);

  // Filtered return products for returns tab
  const filteredReturnProducts = useMemo(() => {
    if (!data?.product_return_analytics) return [];
    let list = [...data.product_return_analytics];

    if (returnProductSearch.trim()) {
      const q = returnProductSearch.toLowerCase();
      list = list.filter(p =>
        p.product_name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.sizes.some(s => s.toLowerCase().includes(q))
      );
    }

    if (returnProductFilter === 'HIGH_RETURN') {
      list = list.filter(p => p.is_high_return_rate);
    } else if (returnProductFilter === 'TIGHT') {
      list = list.filter(p => p.tight_percentage >= 50);
    } else if (returnProductFilter === 'LOOSE') {
      list = list.filter(p => p.loose_percentage >= 50);
    }

    return list;
  }, [data?.product_return_analytics, returnProductSearch, returnProductFilter]);

  const returnStats = useMemo(() => {
    const list = data?.product_return_analytics || [];
    const highReturnCount = list.filter(p => p.is_high_return_rate).length;
    const tightFocusedCount = list.filter(p => p.tight_percentage >= 50).length;
    const looseFocusedCount = list.filter(p => p.loose_percentage >= 50).length;
    return {
      total: list.length,
      highReturnCount,
      tightFocusedCount,
      looseFocusedCount
    };
  }, [data?.product_return_analytics]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500 font-mono">Đang đồng bộ dữ liệu giám sát & phân tích sản phẩm...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    total_active_products: 0,
    total_views: 0,
    avg_search_duration_seconds: 0,
    total_returns: 0,
    tight_returns_count: 0,
    loose_returns_count: 0,
    tight_percentage: 0,
    loose_percentage: 0
  };

  return (
    <div className="space-y-6">

      {/* ================= 1. HEADER CONTROL BAR ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {activeSectionTab === 'returns'
                ? 'Giám sát Tỉ lệ Hoàn hàng & Kích cỡ'
                : 'Giám sát Hành vi Khách hàng & Sản phẩm Đang bán'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeSectionTab === 'returns'
                ? 'Theo dõi danh sách sản phẩm bị hoàn, phân tích nguyên nhân do chật/rộng và quản lý nhật ký phản hồi khách hàng'
                : 'Đo lường độ quan tâm theo lượt xem trang chi tiết, khoảng thời gian tìm kiếm, từ khóa xu hướng và ma trận sản phẩm đang bán'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            {activeSectionTab === 'returns' && (
              <button
                onClick={() => setIsAddReturnOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghi nhận Hoàn Size</span>
              </button>
            )}

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-all shadow-2xs cursor-pointer"
              title="Cập nhật số liệu tức thì"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs phân theo đúng 2 nhánh subsidebar */}
        <div className="flex items-center gap-1 mt-5 border-t border-slate-100 pt-3 overflow-x-auto">
          {activeSectionTab === 'returns' ? (
            <>
              <button
                onClick={() => setActiveSubTab('returns')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'returns'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>Tỉ lệ hoàn hàng</span>
              </button>

              <button
                onClick={() => setActiveSubTab('logs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'logs'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>Nhật ký Hoàn hàng</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveSubTab('views')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'views'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>Hành vi khách hàng</span>
              </button>

              <button
                onClick={() => setActiveSubTab('matrix')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'matrix'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>Ma trận Giám sát Đang bán</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= 2. FOUR KPI CARDS (DÀNH CHO HÀNH VI KHÁCH HÀNG & MA TRẬN) ================= */}
      {activeSectionTab === 'behavior' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Products */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Sản phẩm Đang bán</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{summary.total_active_products}</span>
            <span className="text-xs text-slate-500">mẫu item</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động cập nhật tồn kho thời gian thực</span>
          </div>
        </div>

        {/* Card 2: Total Views */}
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Lượt xem Sản phẩm</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {summary.total_views.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-500">lượt xem</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            Top xem: <strong className="text-slate-800">{data?.top_viewed_products[0]?.name || 'Áo Thun Minimalist'}</strong>
          </div>
        </div>

        {/* Card 3: Search Duration */}
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Thời gian tìm kiếm TB</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {summary.avg_search_duration_seconds}s
            </span>
            <span className="text-xs text-slate-500">giây / phiên</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-semibold">
              {summary.avg_search_duration_seconds < 25 ? '⚡ Tìm nhanh trúng đích' : summary.avg_search_duration_seconds <= 50 ? '🔍 Cân nhắc lựa chọn' : '🧐 So sánh nhiều mẫu'}
            </span>
          </div>
        </div>

        {/* Card 4: Size Return Ratio (Chật vs Rộng) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Tỷ lệ Hoàn do Size</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{summary.total_returns}</span>
            <span className="text-xs text-slate-500">lượt đổi/hoàn</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: `${summary.tight_percentage}%` }}
                className="bg-rose-500 h-full"
                title={`Chật: ${summary.tight_percentage}%`}
              />
              <div
                style={{ width: `${summary.loose_percentage}%` }}
                className="bg-sky-500 h-full"
                title={`Rộng: ${summary.loose_percentage}%`}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-700 shrink-0">
              {summary.tight_percentage}% chật / {summary.loose_percentage}% rộng
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ================= 3. TAB CONTENT ================= */}

      {/* SUBTAB 1: MA TRẬN GIÁM SÁT SẢN PHẨM ĐANG BÁN */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, mã hoặc danh mục..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Bộ lọc:
              </span>
              {(['ALL', 'ACTIVE', 'MOST_VIEWED', 'HIGH_RETURNS'] as const).map(f => {
                const labels = {
                  ALL: 'Tất cả',
                  ACTIVE: 'Đang bán',
                  MOST_VIEWED: 'Xem nhiều nhất',
                  HIGH_RETURNS: 'Bị hoàn size cao'
                };
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                      statusFilter === f
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Monitoring Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-3">Trạng thái bán</th>
                    <th className="py-3 px-3">Giá bán & Lãi</th>
                    <th className="py-3 px-3 text-center">Lượt xem (Views)</th>
                    <th className="py-3 px-3 text-center">Đã bán & Doanh thu</th>
                    <th className="py-3 px-3">Tỷ lệ Hoàn do Size</th>
                    <th className="py-3 px-4">Khuyến nghị Form & Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const primaryImg = getPrimaryImageUrl(prod.image_url);
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Product Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                                {primaryImg ? (
                                  <img
                                    src={primaryImg}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/product/${prod.slug || prod.id}`}
                                  target="_blank"
                                  className="font-semibold text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-1 group"
                                >
                                  <span className="truncate">{prod.name}</span>
                                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 text-sky-500" />
                                </Link>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>{prod.category}</span>
                                  <span>•</span>
                                  <span>{prod.variants_count} biến thể</span>
                                  {prod.is_active ? (
                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-sans font-semibold">
                                      Đang bán
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-sans">
                                      Tạm ẩn
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Luôn sẵn hàng
                            </span>
                          </td>

                          {/* Price & Margin */}
                          <td className="py-3 px-3">
                            <div className="font-mono font-semibold text-slate-900">
                              {formatMoney(prod.min_price)}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-600 font-semibold mt-0.5">
                              Lãi gộp: {prod.margin_percent}%
                            </div>
                          </td>

                          {/* Views */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-900">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>{prod.views.toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {prod.view_share}% toàn sàn
                            </div>
                          </td>

                          {/* Units Sold & Revenue */}
                          <td className="py-3 px-3 text-center">
                            <div className="font-mono font-semibold text-slate-900">
                              {prod.units_sold} đã bán
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {formatMoney(prod.revenue)}
                            </div>
                          </td>

                          {/* Size Returns */}
                          <td className="py-3 px-3">
                            {prod.returns.total > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-rose-600">
                                    {prod.returns.total} lượt hoàn
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({prod.returns.return_rate}%)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono">
                                  {prod.returns.tight > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                                      Chật: {prod.returns.tight}
                                    </span>
                                  )}
                                  {prod.returns.loose > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                                      Rộng: {prod.returns.loose}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> 0 hoàn size
                              </span>
                            )}
                          </td>

                          {/* Smart Size Advice */}
                          <td className="py-3 px-4">
                            <div className={`p-2 rounded text-[11px] leading-tight ${
                              prod.returns.tight >= 2
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : prod.returns.loose >= 2
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              {prod.size_recommendation}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PHÂN TÍCH SIZE HOÀN VỀ (CHẬT / RỘNG) */}
      {activeSubTab === 'returns' && (
        <div className="space-y-6">

          {/* 1. Header & Summary Metrics */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Phân tích Sản phẩm Hoàn Size &amp; Tỷ lệ Chật / Rộng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi danh sách sản phẩm bị hoàn size, nhận diện sản phẩm có tỷ lệ hoàn cao và phân tích chi tiết % do chật vs rộng
                </p>
              </div>
            </div>

            {/* 4 Mini KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 block font-medium">Sản phẩm bị hoàn size</span>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {returnStats.total} <span className="text-xs font-normal text-slate-500">sản phẩm</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Có phát sinh hoàn trả kích cỡ</span>
              </div>

              <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Cảnh báo tỷ lệ cao
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <div className="text-lg font-bold text-rose-700 font-mono">
                  {returnStats.highReturnCount} <span className="text-xs font-normal text-rose-600">sản phẩm</span>
                </div>
                <span className="text-[10px] text-rose-600 block">Tỷ lệ hoàn &gt; 10% hoặc ≥ 3 ca</span>
              </div>

              <div className="p-3.5 rounded-lg bg-rose-50/30 border border-rose-100 space-y-1">
                <span className="text-[11px] text-slate-600 block font-medium">Toàn sàn: Tỷ lệ Chật</span>
                <div className="text-lg font-bold text-rose-600 font-mono">
                  {data?.summary.tight_percentage || 0}%
                </div>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {data?.summary.tight_returns_count || 0} ca phản hồi chật
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-sky-50/30 border border-sky-100 space-y-1">
                <span className="text-[11px] text-slate-600 block font-medium">Toàn sàn: Tỷ lệ Rộng</span>
                <div className="text-lg font-bold text-sky-600 font-mono">
                  {data?.summary.loose_percentage || 0}%
                </div>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {data?.summary.loose_returns_count || 0} ca phản hồi rộng
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReturnProductFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    returnProductFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setReturnProductFilter('HIGH_RETURN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    returnProductFilter === 'HIGH_RETURN'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${returnProductFilter === 'HIGH_RETURN' ? 'text-amber-400' : 'text-rose-600'}`} />
                  <span>Tỷ lệ hoàn cao</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReturnProductFilter('TIGHT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    returnProductFilter === 'TIGHT'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Thiên hướng Chật
                </button>
                <button
                  type="button"
                  onClick={() => setReturnProductFilter('LOOSE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    returnProductFilter === 'LOOSE'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Thiên hướng Rộng
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, danh mục, size..."
                  value={returnProductSearch}
                  onChange={e => setReturnProductSearch(e.target.value)}
                  className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                />
                {returnProductSearch && (
                  <button
                    type="button"
                    onClick={() => setReturnProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. MAIN: DANH SÁCH SẢN PHẨM HOÀN SIZE (HIỆN SẢN PHẨM TRƯỚC) */}
          <div className="space-y-3.5">
            {filteredReturnProducts.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-white space-y-2">
                <RotateCcw className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Không tìm thấy sản phẩm hoàn size phù hợp bộ lọc</p>
                <p className="text-[11px] text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc bấm &quot;Tất cả&quot;</p>
              </div>
            ) : (
              filteredReturnProducts.map(prod => (
                <div
                  key={prod.product_id}
                  className={`rounded-xl border bg-white p-5 shadow-2xs transition-all space-y-4 ${
                    prod.is_high_return_rate ? 'border-rose-300 hover:border-rose-400' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Row 1: Header sản phẩm + Badge Tỷ lệ hoàn */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getPrimaryImageUrl(prod.image_url)}
                          alt={prod.product_name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.target.src = '/images/hero-atelier.jpg'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {prod.product_name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {prod.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>Mã: #{prod.product_id}</span>
                          <span>•</span>
                          <span>Đã bán: <strong>{prod.units_sold}</strong> chiếc</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges: Tỷ lệ hoàn & Thiên hướng */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {prod.is_high_return_rate ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Hoàn: {prod.return_rate}%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 font-mono">
                          Hoàn: {prod.return_rate}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Thống kê chi tiết & Thanh tỷ lệ % chật vs rộng */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1 border-t border-slate-100 items-center">
                    {/* Left 4 cols: Số lượt hoàn & Size bị hoàn */}
                    <div className="md:col-span-4 space-y-1.5">
                      <div className="text-xs text-slate-700 flex items-center justify-between">
                        <span className="text-slate-500">Tổng số ca hoàn size:</span>
                        <span className="font-bold font-mono text-slate-900">{prod.total} lượt</span>
                      </div>
                      <div className="text-xs flex items-center justify-between gap-2">
                        <span className="text-slate-500 shrink-0">Các size bị hoàn:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {prod.sizes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] dark:bg-slate-800 dark:border dark:border-slate-700 dark:text-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Middle 5 cols: Thanh % do chật vs do rộng */}
                    <div className="md:col-span-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                          {prod.tight_percentage}% do Chật
                        </span>
                        <span className="text-sky-600 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                          {prod.loose_percentage}% do Rộng
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${prod.tight_percentage}%` }}
                          className="bg-rose-500 h-full transition-all duration-300"
                          title={`Chật: ${prod.tight} đơn (${prod.tight_percentage}%)`}
                        />
                        <div
                          style={{ width: `${prod.loose_percentage}%` }}
                          className="bg-sky-500 h-full transition-all duration-300"
                          title={`Rộng: ${prod.loose} đơn (${prod.loose_percentage}%)`}
                        />
                      </div>
                    </div>

                    {/* Right 3 cols: Button Xem chi tiết % */}
                    <div className="md:col-span-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedReturnProduct(prod)}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center justify-center transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-[0.98]"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>


        </div>
      )}

      {/* SUBTAB 3: LƯỢT XEM & THỜI GIAN TÌM KIẾM */}
      {activeSubTab === 'views' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left Column: Top Viewed Products Ranking */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-sky-500" />
                    <span>Xếp hạng Sản phẩm Được Xem Nhiều Nhất</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đo lường độ quan tâm của khách hàng theo tổng lượt xem trang chi tiết
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  Tổng: {summary.total_views.toLocaleString('vi-VN')} views
                </span>
              </div>

              <div className="space-y-2.5">
                {data?.top_viewed_products.slice(0, 8).map((prod, idx) => {
                  const primaryImg = getPrimaryImageUrl(prod.image_url);
                  const isTop3 = idx < 3;
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                          idx === 1 ? 'bg-slate-300 text-slate-900' :
                          idx === 2 ? 'bg-amber-700/80 text-white' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div className="w-9 h-9 rounded-md border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                          {primaryImg ? (
                            <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatMoney(prod.min_price)} • {prod.units_sold} đơn chốt
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono pl-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {prod.views.toLocaleString('vi-VN')} views
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Tỷ lệ mua: {prod.conversion_rate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Search Duration & Query Analytics */}
            <div className="space-y-4">
              {/* Search Duration Distribution */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>Khoảng Thời Gian Tìm Kiếm Sản Phẩm</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tính toán thời lượng từ khi khách bắt đầu gõ tìm kiếm đến khi click xem sản phẩm
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-400">Trung bình:</span>
                    <strong className="text-sm font-bold text-purple-600 block">{summary.avg_search_duration_seconds}s</strong>
                  </div>
                </div>

                {/* Duration Bars */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                    <div className="text-[11px] font-semibold text-emerald-800">Dưới 20 giây</div>
                    <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
                      {data?.search_analytics.fast_searches || 0}
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Tìm nhanh chính xác</div>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200/80">
                    <div className="text-[11px] font-semibold text-sky-800">20s - 60s</div>
                    <div className="text-lg font-bold font-mono text-sky-900 mt-1">
                      {data?.search_analytics.medium_searches || 0}
                    </div>
                    <div className="text-[10px] text-sky-600 mt-0.5">Cân nhắc lựa chọn</div>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200/80">
                    <div className="text-[11px] font-semibold text-purple-800">Trên 60 giây</div>
                    <div className="text-lg font-bold font-mono text-purple-900 mt-1">
                      {data?.search_analytics.deep_searches || 0}
                    </div>
                    <div className="text-[10px] text-purple-600 mt-0.5">So sánh nhiều mẫu</div>
                  </div>
                </div>

                {/* Top Search Keywords */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-2.5">
                    Từ khóa Tìm kiếm Phổ biến & Thời gian thực
                  </h4>
                  <div className="space-y-1.5">
                    {data?.search_analytics.top_queries.slice(0, 6).map(q => (
                      <div
                        key={q.query}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">"{q.query}"</span>
                          <span className="text-[10px] font-mono text-slate-400">({q.count} lượt)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold text-[10px]">
                            {q.avg_duration}s tìm
                          </span>
                          <span className="text-slate-400 text-[10px] truncate max-w-[120px]" title={q.top_clicked_name}>
                            → {q.top_clicked_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 4: NHẬT KÝ HOÀN HÀNG */}
      {activeSubTab === 'logs' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Lịch sử Ghi nhận Đơn Đổi / Hoàn Size
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Tổng số: {data?.return_logs.length || 0} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-4">Sản phẩm</th>
                  <th className="py-2.5 px-3 text-center">Kích cỡ</th>
                  <th className="py-2.5 px-3">Lý do hoàn</th>
                  <th className="py-2.5 px-4">Ghi chú từ khách hàng</th>
                  <th className="py-2.5 px-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {data?.return_logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                      Chưa có bản ghi hoàn hàng nào.
                    </td>
                  </tr>
                ) : (
                  data?.return_logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        #{log.order_id || 'HD-TRỰC-TIẾP'}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                        {log.product_name}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-xs">
                          {log.size}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {log.return_reason === 'TIGHT' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-sans">
                            Bị Chật (Form ôm)
                          </span>
                        ) : log.return_reason === 'LOOSE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-sans">
                            Bị Rộng (Thụng)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                            Lý do khác
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px]">
                        {log.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteReturn(log.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 4. MODAL: GHI NHẬN HOÀN HÀNG MỚI ================= */}
      {isAddReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Ghi nhận Hoàn / Đổi Size</h3>
              </div>
              <button
                onClick={() => setIsAddReturnOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-5 space-y-4 text-xs">
              {/* Product selector */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Sản phẩm bị hoàn:</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 text-xs bg-white"
                  required
                >
                  {data?.product_monitoring.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order code & Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Mã đơn hàng (nếu có):</label>
                  <input
                    type="text"
                    placeholder="VD: ORD-9281"
                    value={returnOrderCode}
                    onChange={e => setReturnOrderCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800">Kích cỡ (Size):</label>
                  <input
                    type="text"
                    placeholder="VD: S, M, L, XL, 30, 32..."
                    value={returnSize}
                    onChange={e => setReturnSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 text-xs font-mono uppercase"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Lý do hoàn kích cỡ:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnReason('TIGHT')}
                    className={`py-2 px-2.5 rounded-md border text-center font-medium cursor-pointer transition-all ${
                      returnReason === 'TIGHT'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold ring-1 ring-rose-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bị Chật
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnReason('LOOSE')}
                    className={`py-2 px-2.5 rounded-md border text-center font-medium cursor-pointer transition-all ${
                      returnReason === 'LOOSE'
                        ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold ring-1 ring-sky-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bị Rộng
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnReason('OTHER')}
                    className={`py-2 px-2.5 rounded-md border text-center font-medium cursor-pointer transition-all ${
                      returnReason === 'OTHER'
                        ? 'bg-slate-100 border-slate-400 text-slate-800 font-bold ring-1 ring-slate-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Khác
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">Ghi chú cụ thể của khách:</label>
                <textarea
                  rows={2}
                  placeholder="VD: Kích phần bắp tay, cài cúc bị căng hoặc ống quần quá thụng..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddReturnOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-4 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingReturn ? 'Đang lưu...' : 'Lưu bản ghi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. MODAL: XEM CHI TIẾT % CHẬT / RỘNG CỦA SẢN PHẨM ================= */}
      {selectedReturnProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPrimaryImageUrl(selectedReturnProduct.image_url)}
                    alt={selectedReturnProduct.product_name}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = '/images/hero-atelier.jpg'; }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {selectedReturnProduct.product_name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                      {selectedReturnProduct.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Phân tích chi tiết tỷ lệ hoàn theo kích cỡ (Chật vs Rộng)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReturnProduct(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Đóng popup chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">

              {/* 1. Tỷ lệ hoàn chung & Alert badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-500 font-mono">Tỷ lệ hoàn hàng trên tổng đơn bán:</span>
                  <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                    <span>{selectedReturnProduct.return_rate}%</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedReturnProduct.total} lượt hoàn / {selectedReturnProduct.units_sold} sản phẩm đã bán)
                    </span>
                  </div>
                </div>

                {selectedReturnProduct.is_high_return_rate ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    CẢNH BÁO TỶ LỆ HOÀN CAO
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tỷ lệ hoàn trong ngưỡng an toàn
                  </span>
                )}
              </div>

              {/* 2. Hero: 2 Big Cards for % Chật vs % Rộng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Card Chật */}
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Minimize2 className="w-3.5 h-3.5 text-rose-600" />
                      Tỷ lệ hoàn do BỊ CHẬT
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono font-bold text-[10px]">
                      {selectedReturnProduct.tight} ca
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-600 font-mono">
                      {selectedReturnProduct.tight_percentage}%
                    </span>
                    <span className="text-xs text-rose-700 font-medium">
                      trên tổng số ca hoàn
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-rose-200/60 overflow-hidden">
                    <div
                      style={{ width: `${selectedReturnProduct.tight_percentage}%` }}
                      className="bg-rose-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <p className="text-[11px] text-rose-700 leading-relaxed pt-0.5">
                    Khách phản hồi form ôm, bị kích ở bắp tay, vai, ngực, mông hoặc đáy đùi khi vận động.
                  </p>
                </div>

                {/* Card Rộng */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                      Tỷ lệ hoàn do BỊ RỘNG
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-mono font-bold text-[10px]">
                      {selectedReturnProduct.loose} ca
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-sky-600 font-mono">
                      {selectedReturnProduct.loose_percentage}%
                    </span>
                    <span className="text-xs text-sky-700 font-medium">
                      trên tổng số ca hoàn
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-sky-200/60 overflow-hidden">
                    <div
                      style={{ width: `${selectedReturnProduct.loose_percentage}%` }}
                      className="bg-sky-600 h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <p className="text-[11px] text-sky-700 leading-relaxed pt-0.5">
                    Khách phản hồi form rộng, vai rủ, thụng thân áo hoặc chiều dài ống/tay dài hơn mong đợi.
                  </p>
                </div>
              </div>

              {/* 3. Phân bổ theo từng size của sản phẩm này */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                    Phân bố Chi tiết theo Từng Size của sản phẩm
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {selectedReturnProduct.size_breakdown?.length || 0} kích cỡ có ca hoàn
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 font-mono">
                        <th className="py-2.5 px-3.5">Kích cỡ</th>
                        <th className="py-2.5 px-3">Tổng hoàn</th>
                        <th className="py-2.5 px-3 text-rose-600">% Do Chật</th>
                        <th className="py-2.5 px-3 text-sky-600">% Do Rộng</th>
                        <th className="py-2.5 px-3.5">Tỷ lệ trực quan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedReturnProduct.size_breakdown?.map(sb => (
                        <tr key={sb.size} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px]">
                              {sb.size}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {sb.total} ca
                          </td>
                          <td className="py-2.5 px-3 text-rose-600 font-semibold">
                            {sb.tight_percentage}%
                          </td>
                          <td className="py-2.5 px-3 text-sky-600 font-semibold">
                            {sb.loose_percentage}%
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="h-2 w-32 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                              <div
                                style={{ width: `${sb.tight_percentage}%` }}
                                className="bg-rose-500 h-full"
                              />
                              <div
                                style={{ width: `${sb.loose_percentage}%` }}
                                className="bg-sky-500 h-full"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Khuyến nghị Tư vấn Size cho sản phẩm này */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Khuyến nghị Tư vấn Size cho Khách &amp; CTV (Tăng / Giảm size):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
                  {selectedReturnProduct.recommendation || 'Kích thước form dáng mẫu tương đối chuẩn xác, CTV tư vấn khách chọn đúng bảng size chuẩn.'}
                </p>
              </div>

              {/* 5. Nhật ký phản hồi thực tế từ khách hàng */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                  Phản hồi Thực tế từ Khách hàng ({selectedReturnProduct.logs?.length || 0} đơn)
                </h4>

                <div className="rounded-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase font-mono">
                        <th className="py-2 px-3">Mã đơn</th>
                        <th className="py-2 px-2 text-center">Size</th>
                        <th className="py-2 px-3">Lý do</th>
                        <th className="py-2 px-3">Ghi chú phản hồi</th>
                        <th className="py-2 px-3 text-right">Ngày gửi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {selectedReturnProduct.logs?.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                            #{log.order_id || 'HD-TRỰC-TIẾP'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold">
                            {log.size}
                          </td>
                          <td className="py-2 px-3">
                            {log.return_reason === 'TIGHT' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Bị Chật
                              </span>
                            ) : log.return_reason === 'LOOSE' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                Bị Rộng
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                Khác
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {log.notes || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400 text-[10px]">
                            {new Date(log.created_at).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
              <span className="text-[11px] text-slate-400 font-mono">
                DE&apos;GENT Atelier Size Monitor v2
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturnProduct(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(selectedReturnProduct.product_id);
                    setSelectedReturnProduct(null);
                    setIsAddReturnOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ghi nhận ca hoàn mới</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
