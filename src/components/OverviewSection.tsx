'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Users,
  CreditCard,
  Ticket,
  FolderTree,
  Sliders,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';

export interface InventoryItem {
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

export interface CashFlowSummary {
  total_revenue: number;
  total_cogs: number;
  total_shipping_fee: number;
  total_gateway_fee: number;
  net_profit: number;
  gross_margin_percentage: number;
  paid_orders_count: number;
  pending_orders_count: number;
}

export interface FinancialTransaction {
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

export interface Order {
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

export interface CustomerRankItem {
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

interface OverviewSectionProps {
  cashflow: CashFlowSummary | null;
  transactions: FinancialTransaction[];
  inventory: InventoryItem[];
  orders: Order[];
  customers: CustomerRankItem[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: any) => void;
  themeColor?: string;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
};

export default function OverviewSection({
  cashflow,
  transactions,
  inventory,
  orders,
  customers,
  loading,
  onRefresh,
  onNavigateTab,
  themeColor = '#0f172a'
}: OverviewSectionProps) {
  // Calculations
  const criticalItems = inventory.filter(item => item.is_critical);
  const lowStockItems = inventory.filter(item => item.is_low_stock && !item.is_critical);
  const totalStockAttention = criticalItems.length + lowStockItems.length;

  const pendingOrders = orders.filter(o => o.fulfillment_status === 'UNFULFILLED' || o.payment_status === 'PENDING');
  const shippingOrders = orders.filter(o => o.fulfillment_status === 'SHIPPING');
  const paidOrders = orders.filter(o => o.payment_status === 'PAID');

  const totalRev = cashflow?.total_revenue || 0;
  const cogsPercent = totalRev > 0 ? Math.round(((cashflow?.total_cogs || 0) / totalRev) * 100) : 0;
  const feePercent = totalRev > 0 ? Math.round((((cashflow?.total_shipping_fee || 0) + (cashflow?.total_gateway_fee || 0)) / totalRev) * 100) : 0;
  const netMarginPercent = cashflow?.gross_margin_percentage || (totalRev > 0 ? Math.round(((cashflow?.net_profit || 0) / totalRev) * 100) : 0);

  // Line & Area Chart States & Computation
  const [chartRange, setChartRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [chartType, setChartType] = useState<'spline' | 'bar' | 'linear'>('spline');
  const [metricFocus, setMetricFocus] = useState<'ALL' | 'REVENUE' | 'PROFIT'>('ALL');
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

  const daysCount = chartRange === '7d' ? 7 : chartRange === '14d' ? 14 : 30;

  const chartSeries = useMemo(() => {
    const now = new Date();
    const ordersByDay: Record<string, { revenue: number; count: number }> = {};

    for (const ord of orders) {
      if (!ord.created_at) continue;
      const dayKey = ord.created_at.slice(0, 10);
      if (!ordersByDay[dayKey]) ordersByDay[dayKey] = { revenue: 0, count: 0 };
      ordersByDay[dayKey].revenue += (ord.total_amount || 0);
      ordersByDay[dayKey].count += 1;
    }

    for (const tx of transactions) {
      if (!tx.recorded_at || tx.direction !== 'INFLOW') continue;
      const dayKey = tx.recorded_at.slice(0, 10);
      if (!ordersByDay[dayKey]) {
        ordersByDay[dayKey] = { revenue: 0, count: 0 };
      }
      if (ordersByDay[dayKey].revenue === 0) {
        ordersByDay[dayKey].revenue += (tx.amount || 0);
        ordersByDay[dayKey].count += 1;
      }
    }

    const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const points = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${dayStr}/${monthStr}`;
      const fullDate = `${weekdays[d.getDay()]}, ${dayStr}/${monthStr}/${d.getFullYear()}`;

      const dayData = ordersByDay[dayKey] || { revenue: 0, count: 0 };
      const profit = Math.round(dayData.revenue * (netMarginPercent / 100));

      points.push({
        dayKey,
        label,
        fullDate,
        revenue: dayData.revenue,
        profit,
        ordersCount: dayData.count
      });
    }

    return points;
  }, [daysCount, orders, transactions, netMarginPercent]);

  // Aggregate stats for the period
  const periodTotalRevenue = chartSeries.reduce((s, p) => s + p.revenue, 0);
  const periodTotalProfit = chartSeries.reduce((s, p) => s + p.profit, 0);
  const periodOrdersCount = chartSeries.reduce((s, p) => s + p.ordersCount, 0);
  const peakPoint = chartSeries.reduce((max, p) => (p.revenue > max.revenue ? p : max), chartSeries[0]);

  // SVG Coordinates Geometry
  const svgWidth = 860;
  const svgHeight = 250;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const rawMax = Math.max(...chartSeries.map(d => Math.max(d.revenue, d.profit)), 500000);
  const calcMaxVal = (val: number) => {
    if (val <= 1000000) return Math.ceil(val / 200000) * 200000;
    if (val <= 10000000) return Math.ceil(val / 1000000) * 1000000;
    return Math.ceil(val / 5000000) * 5000000;
  };
  const maxVal = calcMaxVal(rawMax);

  const formatShortMoney = (val: number) => {
    if (val === 0) return '0 ₫';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')} Tr ₫`;
    if (val >= 1000) return `${Math.round(val / 1000)}k ₫`;
    return `${val} ₫`;
  };

  const getPt = (index: number, val: number) => {
    const x = padLeft + (index / (chartSeries.length - 1)) * plotW;
    const y = padTop + plotH - (Math.max(0, val) / maxVal) * plotH;
    return { x, y };
  };

  const revenuePoints = chartSeries.map((d, i) => getPt(i, d.revenue));
  const profitPoints = chartSeries.map((d, i) => getPt(i, d.profit));

  // Monotone Cubic Spline Generator (Stripe-like smooth curve)
  const getSmoothCurvePath = (pts: { x: number; y: number }[], baselineY?: number): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      let cp1x = p1.x + (p2.x - p0.x) / 6;
      let cp1y = p1.y + (p2.y - p0.y) / 6;
      let cp2x = p2.x - (p3.x - p1.x) / 6;
      let cp2y = p2.y - (p3.y - p1.y) / 6;

      if (baselineY !== undefined) {
        cp1y = Math.min(baselineY, Math.max(0, cp1y));
        cp2y = Math.min(baselineY, Math.max(0, cp2y));
      }

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const revenueLinearD = revenuePoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const profitLinearD = profitPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');

  const revenueSplineD = getSmoothCurvePath(revenuePoints, padTop + plotH);
  const profitSplineD = getSmoothCurvePath(profitPoints, padTop + plotH);

  const baselineBottom = padTop + plotH;
  const activeRevPath = chartType === 'spline' ? revenueSplineD : revenueLinearD;
  const activeProfPath = chartType === 'spline' ? profitSplineD : profitLinearD;

  const revenueAreaD = `${activeRevPath} L ${revenuePoints[revenuePoints.length - 1].x.toFixed(1)} ${baselineBottom.toFixed(1)} L ${revenuePoints[0].x.toFixed(1)} ${baselineBottom.toFixed(1)} Z`;
  const profitAreaD = `${activeProfPath} L ${profitPoints[profitPoints.length - 1].x.toFixed(1)} ${baselineBottom.toFixed(1)} L ${profitPoints[0].x.toFixed(1)} ${baselineBottom.toFixed(1)} Z`;

  if (loading && !cashflow) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="h-10 bg-slate-100 rounded-md animate-pulse" />
        {/* Skeleton Metrics */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-20 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-slate-100 rounded-lg animate-pulse" />
          <div className="lg:col-span-4 h-80 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= 1. PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Tổng quan điều hành
            </h1>
            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Trực tuyến
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo tài chính, hiệu suất xử lý đơn hàng và giám sát an toàn tồn kho theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới số liệu</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 cursor-pointer"
          >
            <span>Cửa hàng</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ================= 2. CORE METRICS ROW (ADMIN DOMAIN PRESET) ================= */}
      {/* Design rules: Plain numbers, small labels, no giant cards, no gradients */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          
          {/* Metric 1: Doanh thu thuần */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng doanh thu thực tế</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              {formatMoney(cashflow?.total_revenue || 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-medium text-emerald-700">{cashflow?.paid_orders_count || 0} đơn</span>
              <span>đã thanh toán thành công</span>
            </div>
          </div>

          {/* Metric 2: Lợi nhuận ròng (P&L) */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Lợi nhuận ròng thực tế</span>
              <span className="rounded-sm bg-emerald-50 px-1.5 py-0.2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Biên {netMarginPercent}%
              </span>
            </div>
            <div className="mt-1.5 text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              {formatMoney(cashflow?.net_profit || 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Đã khấu trừ COGS ({formatMoney(cashflow?.total_cogs || 0)}) & cước phí
            </div>
          </div>

          {/* Metric 3: Đơn hàng cần xử lý */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đơn hàng vận hành</span>
              <ShoppingCart className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tracking-tight">
              {orders.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span className={pendingOrders.length > 0 ? 'text-amber-700 font-medium' : 'text-slate-600'}>
                {pendingOrders.length} chờ xử lý
              </span>
              <span>•</span>
              <span className="text-slate-600">{shippingOrders.length} đang giao</span>
            </div>
          </div>

          {/* Metric 4: Tồn kho & Cảnh báo an toàn */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tồn kho cần bổ sung</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tracking-tight flex items-baseline gap-2">
              <span className={criticalItems.length > 0 ? 'text-rose-700' : 'text-slate-900'}>
                {totalStockAttention}
              </span>
              <span className="text-xs font-normal text-slate-400 font-sans">SKU</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              {criticalItems.length > 0 ? (
                <span className="text-rose-700 font-medium">{criticalItems.length} SKU cạn hàng</span>
              ) : (
                <span className="text-emerald-700 font-medium">Kho ổn định</span>
              )}
              <span>•</span>
              <span>{inventory.length} tổng biến thể</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 3. OPERATIONAL ACTION NOTICE ================= */}
      {(pendingOrders.length > 0 || criticalItems.length > 0) ? (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Các mục cần quản trị viên xử lý ngay
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                {pendingOrders.length > 0 && `${pendingOrders.length} đơn hàng đang chờ xác nhận hoặc thanh toán. `}
                {criticalItems.length > 0 && `${criticalItems.length} mã sản phẩm đã chạm mức báo động hết tồn kho khả dụng.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pendingOrders.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="inline-flex h-8 items-center justify-center rounded-md bg-amber-700 hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400 px-3 text-xs font-medium text-white dark:text-slate-950 transition-colors cursor-pointer font-sans"
              >
                Xử lý đơn hàng
              </button>
            )}
            {criticalItems.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="inline-flex h-8 items-center justify-center rounded-md border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-amber-900/40 px-3 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/60 transition-colors cursor-pointer font-sans shadow-2xs"
              >
                Nhập kho SKU
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tất cả quy trình kinh doanh đang ở trạng thái an toàn. Không có đơn tồn đọng và kho đủ cung ứng.</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">Sẵn sàng tiếp nhận đơn</span>
        </div>
      )}

      {/* ================= 4. REVENUE & PROFIT LINE CHART (DOMAIN PRESET: ADMIN) ================= */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {/* Chart Header with Big Stripe-like KPI */}
        <header className="border-b border-slate-200 px-4 sm:px-5 py-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Xu hướng Doanh thu & Lợi nhuận (Revenue Analytics)
              </h2>
            </div>
            
            {/* Big Headline Stat */}
            <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {formatMoney(periodTotalRevenue)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Lợi nhuận ròng: {formatMoney(periodTotalProfit)} (Biên {netMarginPercent}%)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                • {periodOrdersCount} đơn trong kỳ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {/* Chart Type Selector: Spline / Bar / Linear */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setChartType('spline')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartType === 'spline' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Đường cong mượt (Smooth Spline)"
              >
                Đường cong
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartType === 'bar' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Biểu đồ cột (Daily Bars)"
              >
                Cột
              </button>
              <button
                type="button"
                onClick={() => setChartType('linear')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  chartType === 'linear' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Đường thẳng (Linear Polyline)"
              >
                Đường thẳng
              </button>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
              {(['7d', '14d', '30d'] as const).map((rng) => (
                <button
                  key={rng}
                  type="button"
                  onClick={() => {
                    setChartRange(rng);
                    setActiveHoverIdx(null);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    chartRange === rng
                      ? 'text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={chartRange === rng ? { backgroundColor: themeColor } : undefined}
                >
                  {rng === '7d' ? '7 ngày' : rng === '14d' ? '14 ngày' : '30 ngày'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Metric Focus & Filter Bar */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 text-[11px] font-mono">Hiển thị:</span>
            <button
              type="button"
              onClick={() => setMetricFocus(metricFocus === 'REVENUE' ? 'ALL' : 'REVENUE')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                metricFocus === 'REVENUE' ? 'text-white font-medium shadow-2xs' : 'hover:bg-slate-100 text-slate-700'
              }`}
              style={metricFocus === 'REVENUE' ? { backgroundColor: themeColor } : undefined}
            >
              <span
                className="w-2.5 h-1 rounded-xs"
                style={{ backgroundColor: metricFocus === 'REVENUE' ? '#ffffff' : themeColor }}
              />
              <span>Doanh thu</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricFocus(metricFocus === 'PROFIT' ? 'ALL' : 'PROFIT')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                metricFocus === 'PROFIT' ? 'bg-emerald-700 text-white font-medium' : 'hover:bg-emerald-50 text-emerald-700'
              }`}
            >
              <span className={`w-2.5 h-1 rounded-xs ${metricFocus === 'PROFIT' ? 'bg-white' : 'bg-emerald-600'}`} />
              <span>Lợi nhuận ròng</span>
            </button>
            {metricFocus !== 'ALL' && (
              <button
                type="button"
                onClick={() => setMetricFocus('ALL')}
                className="text-[11px] text-slate-400 hover:text-slate-700 underline cursor-pointer ml-1"
              >
                (Xem cả hai)
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Rê chuột vào điểm để xem chi tiết
          </span>
        </div>

        {/* Chart Canvas Area */}
        <div className="p-4 sm:p-5 relative select-none bg-white">
          {/* Floating Hover Tooltip (Never wraps text) */}
          {activeHoverIdx !== null && chartSeries[activeHoverIdx] && (() => {
            const xPercent = (revenuePoints[activeHoverIdx].x / svgWidth) * 100;
            let leftStyle = `${xPercent}%`;
            let transformStyle = 'translateX(-50%)';

            if (xPercent > 70) {
              transformStyle = 'translateX(calc(-100% - 12px))';
            } else if (xPercent < 30) {
              transformStyle = 'translateX(12px)';
            }

            return (
              <div
                className="pointer-events-none absolute z-20 top-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-xl transition-all text-xs whitespace-nowrap min-w-max select-none"
                style={{
                  left: leftStyle,
                  transform: transformStyle
                }}
              >
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-5 whitespace-nowrap">
                  <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{chartSeries[activeHoverIdx].fullDate}</span>
                  <span className="rounded-full bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 font-medium text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 font-sans whitespace-nowrap text-[11px]">
                    {chartSeries[activeHoverIdx].ordersCount} đơn hàng
                  </span>
                </div>
                <div className="space-y-1.5 font-sans">
                  {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                    <div className="flex items-center justify-between gap-6 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
                        <span className="whitespace-nowrap">Doanh thu:</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatMoney(chartSeries[activeHoverIdx].revenue)}
                      </span>
                    </div>
                  )}
                  {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                    <div className="flex items-center justify-between gap-6 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="whitespace-nowrap">Lợi nhuận ròng:</span>
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatMoney(chartSeries[activeHoverIdx].profit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* SVG Line / Spline / Bar Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                const ratio = Math.max(0, Math.min(1, (relX - padLeft) / plotW));
                const index = Math.round(ratio * (chartSeries.length - 1));
                setActiveHoverIdx(index);
              }}
              onMouseLeave={() => setActiveHoverIdx(null)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                if (!touch) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((touch.clientX - rect.left) / rect.width) * svgWidth;
                const ratio = Math.max(0, Math.min(1, (relX - padLeft) / plotW));
                const index = Math.round(ratio * (chartSeries.length - 1));
                setActiveHoverIdx(index);
              }}
              onTouchEnd={() => setActiveHoverIdx(null)}
            >
              <defs>
                {/* Smooth Area Gradients */}
                <linearGradient id="revenueSplineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={themeColor} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="profitSplineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803d" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                </linearGradient>

                {/* Drop shadow filter for lines */}
                <filter id="lineShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={themeColor} floodOpacity="0.16" />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                const y = padTop + plotH - ratio * plotH;
                const val = ratio * maxVal;
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400 font-medium"
                    >
                      {formatShortMoney(val)}
                    </text>
                  </g>
                );
              })}

              {/* ===== MODE 1 & 3: SPLINE OR LINEAR ===== */}
              {(chartType === 'spline' || chartType === 'linear') && (
                <g>
                  {/* Revenue Area Wash */}
                  {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                    <path d={revenueAreaD} fill="url(#revenueSplineGradient)" />
                  )}

                  {/* Profit Area Wash */}
                  {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                    <path d={profitAreaD} fill="url(#profitSplineGradient)" />
                  )}

                  {/* Profit Curve */}
                  {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                    <path
                      d={activeProfPath}
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Revenue Curve with Subtle Depth */}
                  {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                    <path
                      d={activeRevPath}
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Static Point Anchor Nodes */}
                  {daysCount <= 14 && chartSeries.map((d, i) => {
                    const ptRev = revenuePoints[i];
                    const ptProf = profitPoints[i];
                    return (
                      <g key={`nodes-${d.dayKey}`}>
                        {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                          <circle
                            cx={ptProf.x}
                            cy={ptProf.y}
                            r="3"
                            fill="#ffffff"
                            stroke="#15803d"
                            strokeWidth="2"
                          />
                        )}
                        {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                          <circle
                            cx={ptRev.x}
                            cy={ptRev.y}
                            r="3.5"
                            fill="#ffffff"
                            stroke={themeColor}
                            strokeWidth="2.5"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ===== MODE 2: BAR CHART ===== */}
              {chartType === 'bar' && (
                <g>
                  {chartSeries.map((d, i) => {
                    const pt = revenuePoints[i];
                    const isHovered = activeHoverIdx === i;
                    const barW = Math.max(6, Math.min(22, (plotW / chartSeries.length) * 0.4));

                    const revH = Math.max(2, (d.revenue / maxVal) * plotH);
                    const revY = padTop + plotH - revH;

                    const profH = Math.max(2, (d.profit / maxVal) * plotH);
                    const profY = padTop + plotH - profH;

                    return (
                      <g key={`bar-${d.dayKey}`}>
                        {/* Hover Column Wash */}
                        {isHovered && (
                          <rect
                            x={pt.x - barW - 6}
                            y={padTop}
                            width={(barW + 2) * 2 + 12}
                            height={plotH}
                            fill="#f8fafc"
                            rx="6"
                          />
                        )}

                        {/* Revenue Bar */}
                        {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                          <rect
                            x={metricFocus === 'ALL' ? pt.x - barW - 1 : pt.x - barW / 2}
                            y={revY}
                            width={barW}
                            height={revH}
                            fill={themeColor}
                            opacity={isHovered ? 1 : 0.88}
                            rx="3"
                          />
                        )}

                        {/* Profit Bar */}
                        {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                          <rect
                            x={metricFocus === 'ALL' ? pt.x + 1 : pt.x - barW / 2}
                            y={profY}
                            width={barW}
                            height={profH}
                            fill={isHovered ? '#15803d' : '#16a34a'}
                            rx="3"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Active Hover Guideline & Glowing Highlights */}
              {activeHoverIdx !== null && revenuePoints[activeHoverIdx] && (
                <g>
                  {/* Vertical Hairline */}
                  <line
                    x1={revenuePoints[activeHoverIdx].x}
                    y1={padTop}
                    x2={revenuePoints[activeHoverIdx].x}
                    y2={padTop + plotH}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Glowing Highlight Rings */}
                  {(metricFocus === 'ALL' || metricFocus === 'PROFIT') && (
                    <g>
                      <circle
                        cx={profitPoints[activeHoverIdx].x}
                        cy={profitPoints[activeHoverIdx].y}
                        r="8"
                        fill="#15803d"
                        fillOpacity="0.2"
                      />
                      <circle
                        cx={profitPoints[activeHoverIdx].x}
                        cy={profitPoints[activeHoverIdx].y}
                        r="4.5"
                        fill="#15803d"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                  {(metricFocus === 'ALL' || metricFocus === 'REVENUE') && (
                    <g>
                      <circle
                        cx={revenuePoints[activeHoverIdx].x}
                        cy={revenuePoints[activeHoverIdx].y}
                        r="9"
                        fill={themeColor}
                        fillOpacity="0.2"
                      />
                      <circle
                        cx={revenuePoints[activeHoverIdx].x}
                        cy={revenuePoints[activeHoverIdx].y}
                        r="5.5"
                        fill={themeColor}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* X-Axis Date Ticks & Labels */}
              {chartSeries.map((d, i) => {
                const pt = revenuePoints[i];
                const showTick = daysCount <= 14 ? true : (i % 3 === 0 || i === chartSeries.length - 1);
                if (!showTick) return null;

                const isHovered = activeHoverIdx === i;

                return (
                  <g key={`x-${d.dayKey}`}>
                    <line
                      x1={pt.x}
                      y1={padTop + plotH}
                      x2={pt.x}
                      y2={padTop + plotH + 4}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={padTop + plotH + 18}
                      textAnchor="middle"
                      className={`text-[10px] font-mono transition-colors ${
                        isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                      }`}
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Period Summary Footer */}
        <footer className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
          <div className="py-1.5 sm:py-0 sm:pr-4">
            <span className="text-slate-500 block">Doanh thu kỳ ({daysCount} ngày):</span>
            <span className="font-mono font-semibold text-slate-900 mt-0.5 block text-sm">
              {formatMoney(periodTotalRevenue)}
            </span>
          </div>
          <div className="py-1.5 sm:py-0 sm:px-4">
            <span className="text-slate-500 block">Lợi nhuận ròng ước tính:</span>
            <span className="font-mono font-semibold text-emerald-700 mt-0.5 block text-sm">
              {formatMoney(periodTotalProfit)} <span className="text-xs font-normal text-emerald-600">(Biên {netMarginPercent}%)</span>
            </span>
          </div>
          <div className="py-1.5 sm:py-0 sm:pl-4">
            <span className="text-slate-500 block">Ngày cao điểm nhất:</span>
            <span className="font-mono font-semibold text-slate-900 mt-0.5 block text-sm">
              {peakPoint && peakPoint.revenue > 0
                ? `${peakPoint.label} (${formatMoney(peakPoint.revenue)})`
                : 'Chưa có đơn phát sinh'}
            </span>
          </div>
        </footer>
      </section>

      {/* ================= 5. MAIN CONTENT GRID (7 COLS / 5 COLS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ===== LEFT COLUMN: OPERATIONAL FOCUS (8 / 12) ===== */}
        <div className="lg:col-span-8 space-y-6">

          {/* SECTION A: ĐƠN HÀNG GẦN ĐÂY CẦN THEO DÕI */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Đơn hàng vận hành gần đây
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi tiến độ thanh toán và giao vận của các đơn hàng mới nhất
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span>Xem tất cả ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">Mã đơn</th>
                    <th className="py-2.5 px-4">Khách hàng</th>
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4">Thanh toán</th>
                    <th className="py-2.5 px-4">Vận chuyển</th>
                    <th className="py-2.5 px-4 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có đơn hàng nào phát sinh trên hệ thống.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 6).map((order) => {
                      const isPaid = order.payment_status === 'PAID';
                      const isDelivered = order.fulfillment_status === 'DELIVERED';
                      const isShipping = order.fulfillment_status === 'SHIPPING';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            #{order.order_code}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{order.customer_name}</div>
                            <div className="font-mono text-slate-400 text-[11px]">{order.customer_phone}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${
                                isDelivered
                                  ? 'bg-slate-100 text-slate-700'
                                  : isShipping
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isDelivered ? 'Đã giao' : isShipping ? 'Đang giao' : 'Chưa giao'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {formatMoney(order.total_amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {orders.length > 6 && (
              <footer className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/30 text-right">
                <button
                  type="button"
                  onClick={() => onNavigateTab('orders')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Xem thêm {orders.length - 6} đơn hàng khác trong kho lưu trữ →
                </button>
              </footer>
            )}
          </section>

          {/* SECTION B: CẢNH BÁO TỒN KHO & MỨC AN TOÀN */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Giám sát điểm đặt hàng lại (Safety Stock Threshold)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các mặt hàng có lượng tồn thực tế hoặc khả dụng dưới ngưỡng kiểm soát an toàn
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span>Quản lý kho biến thể</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">SKU</th>
                    <th className="py-2.5 px-4">Sản phẩm & Biến thể</th>
                    <th className="py-2.5 px-4 text-center">Tồn khả dụng</th>
                    <th className="py-2.5 px-4 text-center">Ngưỡng an toàn</th>
                    <th className="py-2.5 px-4">Vị trí kho</th>
                    <th className="py-2.5 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {totalStockAttention === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium text-slate-700">Tồn kho đạt mức an toàn</span>
                          <span className="text-xs text-slate-400">Không có biến thể nào vi phạm ngưỡng cảnh báo đặt lại hàng.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...criticalItems, ...lowStockItems].slice(0, 5).map((item) => (
                      <tr key={item.variant_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{item.product_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Màu: {item.color} • Size: {item.size}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          <span className={item.available_qty <= 0 ? 'text-rose-700 font-bold' : 'text-slate-900'}>
                            {item.available_qty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {item.safety_threshold}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {item.location_code || 'KHO-CHINH'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {item.is_critical ? (
                            <span className="inline-flex items-center rounded-sm bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                              Nguy cấp (Cạn kho)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                              Dưới ngưỡng
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalStockAttention > 5 && (
              <footer className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/30 text-right">
                <button
                  type="button"
                  onClick={() => onNavigateTab('products')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Xem thêm {totalStockAttention - 5} mặt hàng khác cần bổ sung tồn kho →
                </button>
              </footer>
            )}
          </section>

        </div>

        {/* ===== RIGHT COLUMN: FINANCIAL HEALTH & QUICK JUMP (4 / 12) ===== */}
        <div className="lg:col-span-4 space-y-6">

          {/* PANEL 1: CƠ CẤU TÀI CHÍNH & DÒNG TIỀN */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Cơ cấu dòng tiền & Chi phí
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('cashflow')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Sổ cái P&L →
              </button>
            </header>

            <div className="p-4 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span>Giá vốn hàng bán (COGS)</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatMoney(cashflow?.total_cogs || 0)} ({cogsPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${Math.min(100, cogsPercent)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span>Cước vận chuyển & Phí sàn</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatMoney((cashflow?.total_shipping_fee || 0) + (cashflow?.total_gateway_fee || 0))} ({feePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(100, feePercent)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-600 mb-1">
                  <span className="font-medium text-emerald-800">Lợi nhuận ròng giữ lại</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatMoney(cashflow?.net_profit || 0)} ({netMarginPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${Math.min(100, Math.max(0, netMarginPercent))}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 font-mono text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Tài khoản đối soát:</span>
                  <span className="font-semibold text-slate-700">VIETINBANK CAISHOP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Khóa giá sàn an toàn:</span>
                  <span className="text-emerald-700 font-semibold">Đang kích hoạt</span>
                </div>
              </div>
            </div>
          </section>

          {/* PANEL 2: KHÁCH HÀNG & HỘI VIÊN TIÊU BIỂU */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Hội viên & Khách hàng tích cực
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Hội viên ({customers.length}) →
              </button>
            </header>

            <div className="divide-y divide-slate-100 text-xs">
              {customers.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  Chưa có dữ liệu xếp hạng khách hàng.
                </div>
              ) : (
                customers.slice(0, 4).map((c, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{c.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-slate-900">
                        {formatMoney(c.total_spent)}
                      </div>
                      <span className="inline-block mt-0.5 rounded-sm bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600">
                        {c.tier || 'STANDARD'} • {c.order_count} đơn
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* PANEL 3: PHÍM TẮT ĐIỀU HÀNH NHANH (QUICK ACTIONS) */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Phím tắt điều hành nhanh
              </h2>
            </header>

            <div className="p-3 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left flex flex-col justify-between cursor-pointer"
              >
                <Tag className="w-4 h-4 text-slate-600 mb-2" />
                <span className="font-semibold text-slate-900">Thêm sản phẩm</span>
                <span className="text-[11px] text-slate-500">Mới & Biến thể</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('payment')}
                className="p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left flex flex-col justify-between cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-600 mb-2" />
                <span className="font-semibold text-slate-900">VietQR & Pay</span>
                <span className="text-[11px] text-slate-500">Đối soát tự động</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('deals')}
                className="p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left flex flex-col justify-between cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-slate-600 mb-2" />
                <span className="font-semibold text-slate-900">Tạo Voucher</span>
                <span className="text-[11px] text-slate-500">Ưu đãi giỏ hàng</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('content')}
                className="p-3 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left flex flex-col justify-between cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-600 mb-2" />
                <span className="font-semibold text-slate-900">Biên tập CMS</span>
                <span className="text-[11px] text-slate-500">Giao diện storefront</span>
              </button>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
