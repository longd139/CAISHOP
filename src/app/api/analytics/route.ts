import { NextResponse } from 'next/server';
import { getDb, getAllProductsWithVariants, getOrders, getSiteContent, setSiteContent } from '@/lib/db';

export interface SizeReturnRecord {
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
}

export interface SearchLogRecord {
  id: string;
  query: string;
  duration_seconds: number;
  results_count: number;
  selected_product_id?: string | null;
  created_at: string;
}

// Dữ liệu mẫu chuẩn mực khởi tạo khi chưa có dữ liệu thực tế
const DEFAULT_SAMPLE_RETURNS: SizeReturnRecord[] = [
  { id: 'ret-01', order_id: 'ord-01', product_id: 'prod-01', product_name: 'Áo Thun Cổ Tròn Minimalist', variant_sku: 'AT-BLK-M', size: 'M', color: 'Đen', return_reason: 'TIGHT', notes: 'Khách phản hồi chật phần bắp tay và vai', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'ret-02', order_id: 'ord-02', product_id: 'prod-01', product_name: 'Áo Thun Cổ Tròn Minimalist', variant_sku: 'AT-WHT-L', size: 'L', color: 'Trắng', return_reason: 'TIGHT', notes: 'Khách mặc kích vòng ngực', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'ret-03', order_id: 'ord-03', product_id: 'prod-01', product_name: 'Áo Thun Cổ Tròn Minimalist', variant_sku: 'AT-GRY-XL', size: 'XL', color: 'Xám', return_reason: 'LOOSE', notes: 'Khách mặc bị dài và thụng phần thân', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'ret-04', order_id: 'ord-04', product_id: 'prod-02', product_name: 'Áo Polo Pique Cotton Cao Cấp', variant_sku: 'PL-NVY-S', size: 'S', color: 'Xanh Navy', return_reason: 'TIGHT', notes: 'Chật nách và cổ áo khi cài cúc', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'ret-05', order_id: 'ord-05', product_id: 'prod-02', product_name: 'Áo Polo Pique Cotton Cao Cấp', variant_sku: 'PL-BLK-M', size: 'M', color: 'Đen', return_reason: 'TIGHT', notes: 'Bó sát ngực, khách thích mặc thoải mái', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'ret-06', order_id: 'ord-06', product_id: 'prod-02', product_name: 'Áo Polo Pique Cotton Cao Cấp', variant_sku: 'PL-WHT-XL', size: 'XL', color: 'Trắng', return_reason: 'LOOSE', notes: 'Vai rủ quá nhiều, rộng vòng bụng', created_at: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 'ret-07', order_id: 'ord-07', product_id: 'prod-03', product_name: 'Quần Khaki Chino Slimfit Co Giãn', variant_sku: 'QK-KHA-30', size: '30', color: 'Khaki', return_reason: 'TIGHT', notes: 'Chật đùi và đáy quần khi ngồi', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'ret-08', order_id: 'ord-08', product_id: 'prod-03', product_name: 'Quần Khaki Chino Slimfit Co Giãn', variant_sku: 'QK-BLK-31', size: '31', color: 'Đen', return_reason: 'TIGHT', notes: 'Bó bắp chân và mông quá chặt', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'ret-09', order_id: 'ord-09', product_id: 'prod-03', product_name: 'Quần Khaki Chino Slimfit Co Giãn', variant_sku: 'QK-NVY-32', size: '32', color: 'Xanh Navy', return_reason: 'TIGHT', notes: 'Chật vòng bụng 2cm so với bảng size', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'ret-10', order_id: 'ord-10', product_id: 'prod-03', product_name: 'Quần Khaki Chino Slimfit Co Giãn', variant_sku: 'QK-KHA-34', size: '34', color: 'Khaki', return_reason: 'LOOSE', notes: 'Rộng lưng quần, phải dùng thắt lưng', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'ret-11', order_id: 'ord-11', product_id: 'prod-04', product_name: 'Quần Tây May Đo Xếp Ly Pleated', variant_sku: 'QT-CHA-30', size: '30', color: 'Xám Than', return_reason: 'TIGHT', notes: 'Chật cạp quần và hông', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'ret-12', order_id: 'ord-12', product_id: 'prod-04', product_name: 'Quần Tây May Đo Xếp Ly Pleated', variant_sku: 'QT-BLK-33', size: '33', color: 'Đen', return_reason: 'LOOSE', notes: 'Ống quần quá thụng và rộng', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'ret-13', order_id: 'ord-13', product_id: 'prod-05', product_name: 'Áo Khoác Blazer Classic Atelier', variant_sku: 'BZ-BLK-L', size: 'L', color: 'Đen', return_reason: 'LOOSE', notes: 'Vai áo to hơn khung người, tay dài quá ngón tay', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'ret-14', order_id: 'ord-14', product_id: 'prod-05', product_name: 'Áo Khoác Blazer Classic Atelier', variant_sku: 'BZ-NVY-XL', size: 'XL', color: 'Navy', return_reason: 'LOOSE', notes: 'Form quá rộng theo phong cách oversize', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'ret-15', order_id: 'ord-15', product_id: 'prod-05', product_name: 'Áo Khoác Blazer Classic Atelier', variant_sku: 'BZ-BLK-M', size: 'M', color: 'TIGHT', return_reason: 'TIGHT', notes: 'Cài cúc bị căng ngực', created_at: new Date(Date.now() - 86400000 * 6).toISOString() },
];

const DEFAULT_SAMPLE_SEARCH_LOGS: SearchLogRecord[] = [
  { id: 's-01', query: 'áo thun cotton', duration_seconds: 24.8, results_count: 5, selected_product_id: 'prod-01', created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: 's-02', query: 'polo trắng', duration_seconds: 16.4, results_count: 3, selected_product_id: 'prod-02', created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
  { id: 's-03', query: 'quần khaki slimfit', duration_seconds: 52.3, results_count: 4, selected_product_id: 'prod-03', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 's-04', query: 'áo blazer đen', duration_seconds: 68.7, results_count: 2, selected_product_id: 'prod-05', created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: 's-05', query: 'size l oversize', duration_seconds: 34.2, results_count: 6, selected_product_id: 'prod-01', created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
  { id: 's-06', query: 'quần tây xếp ly', duration_seconds: 43.1, results_count: 3, selected_product_id: 'prod-04', created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString() },
  { id: 's-07', query: 'sơ mi oxford', duration_seconds: 29.5, results_count: 4, selected_product_id: 'prod-06', created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  { id: 's-08', query: 'áo khoác mùa đông', duration_seconds: 78.4, results_count: 2, selected_product_id: 'prod-05', created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString() },
  { id: 's-09', query: 'đen matt', duration_seconds: 19.8, results_count: 7, selected_product_id: 'prod-01', created_at: new Date(Date.now() - 1000 * 60 * 550).toISOString() },
  { id: 's-10', query: 'áo phông trơn', duration_seconds: 21.0, results_count: 4, selected_product_id: 'prod-01', created_at: new Date(Date.now() - 1000 * 60 * 700).toISOString() },
  { id: 's-11', query: 'quần short', duration_seconds: 14.5, results_count: 0, selected_product_id: null, created_at: new Date(Date.now() - 1000 * 60 * 850).toISOString() },
  { id: 's-12', query: 'áo len cổ lọ', duration_seconds: 25.0, results_count: 0, selected_product_id: null, created_at: new Date(Date.now() - 1000 * 60 * 990).toISOString() },
];

export async function GET() {
  try {
    const db = await getDb();

    // 1. Lấy danh sách sản phẩm và đơn hàng
    const [allProducts, allOrders] = await Promise.all([
      getAllProductsWithVariants(true),
      getOrders(100)
    ]);

    // 2. Lấy dữ liệu Hoàn hàng theo Size (size_returns)
    let sizeReturns: SizeReturnRecord[] = [];
    try {
      sizeReturns = await db.queryAll<SizeReturnRecord>(`
        SELECT * FROM size_returns ORDER BY created_at DESC LIMIT 200
      `);
    } catch {}

    if (!sizeReturns || sizeReturns.length === 0) {
      const stored = await getSiteContent<SizeReturnRecord[]>('analytics_size_returns', []);
      if (stored && stored.length > 0) {
        sizeReturns = stored;
      } else {
        sizeReturns = DEFAULT_SAMPLE_RETURNS;
        await setSiteContent('analytics_size_returns', DEFAULT_SAMPLE_RETURNS);
      }
    }

    // 3. Lấy dữ liệu Tìm kiếm & Thời gian tìm kiếm (search_logs)
    let searchLogs: SearchLogRecord[] = [];
    try {
      searchLogs = await db.queryAll<SearchLogRecord>(`
        SELECT * FROM search_logs ORDER BY created_at DESC LIMIT 200
      `);
    } catch {}

    if (!searchLogs || searchLogs.length === 0) {
      const stored = await getSiteContent<SearchLogRecord[]>('analytics_search_logs', []);
      if (stored && stored.length > 0) {
        searchLogs = stored;
      } else {
        searchLogs = DEFAULT_SAMPLE_SEARCH_LOGS;
        await setSiteContent('analytics_search_logs', DEFAULT_SAMPLE_SEARCH_LOGS);
      }
    }

    // 4. Lấy dữ liệu Lượt xem sản phẩm (product_views)
    let viewCountsMap: Record<string, number> = {};
    try {
      const rows = await db.queryAll<{ product_id: string; total: number }>(`
        SELECT product_id, COUNT(id) as total FROM product_views GROUP BY product_id
      `);
      for (const r of rows) {
        viewCountsMap[r.product_id] = r.total;
      }
    } catch {}

    const storedViews = await getSiteContent<Record<string, number>>('analytics_view_counts', {});
    for (const [pid, count] of Object.entries(storedViews || {})) {
      viewCountsMap[pid] = (viewCountsMap[pid] || 0) + Number(count);
    }

    // Gán lượt xem mặc định cơ bản nếu sản phẩm chưa có
    const defaultBaseViews: Record<string, number> = {
      'prod-01': 1420,
      'prod-02': 1180,
      'prod-03': 950,
      'prod-04': 780,
      'prod-05': 640,
      'prod-06': 510,
    };
    for (const p of allProducts) {
      if (!viewCountsMap[p.id]) {
        viewCountsMap[p.id] = defaultBaseViews[p.id] || Math.floor(250 + (p.id.charCodeAt(p.id.length - 1) * 7) % 450);
      }
    }

    // ================= XỬ LÝ DỮ LIỆU THỐNG KÊ SIZE BỊ HOÀN VỀ =================
    // Phân tích theo từng size: S, M, L, XL, XXL, 29, 30, 31, 32, 33, 34...
    const sizeStatsMap: Record<string, { size: string; total: number; tight: number; loose: number; other: number }> = {};

    for (const ret of sizeReturns) {
      const s = (ret.size || 'UNKNOWN').trim().toUpperCase();
      if (!sizeStatsMap[s]) {
        sizeStatsMap[s] = { size: s, total: 0, tight: 0, loose: 0, other: 0 };
      }
      sizeStatsMap[s].total += 1;
      if (ret.return_reason === 'TIGHT') sizeStatsMap[s].tight += 1;
      else if (ret.return_reason === 'LOOSE') sizeStatsMap[s].loose += 1;
      else sizeStatsMap[s].other += 1;
    }

    // Sắp xếp thứ tự size trực quan: S -> M -> L -> XL -> XXL -> số
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '28', '29', '30', '31', '32', '33', '34', '35', '36'];
    const sizeAnalytics = Object.values(sizeStatsMap).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a.size);
      const idxB = sizeOrder.indexOf(b.size);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.size.localeCompare(b.size);
    }).map(s => {
      const tightRatio = s.total > 0 ? Math.round((s.tight / s.total) * 100) : 0;
      const looseRatio = s.total > 0 ? Math.round((s.loose / s.total) * 100) : 0;
      let primaryIssue: 'CHẬT' | 'RỘNG' | 'CÂN BẰNG' = 'CÂN BẰNG';
      if (tightRatio >= 60) primaryIssue = 'CHẬT';
      else if (looseRatio >= 60) primaryIssue = 'RỘNG';

      return {
        size: s.size,
        total_returned: s.total,
        tight_count: s.tight,
        loose_count: s.loose,
        other_count: s.other,
        tight_ratio: tightRatio,
        loose_ratio: looseRatio,
        primary_issue: primaryIssue,
        severity: (s.total >= 4 && (tightRatio >= 65 || looseRatio >= 65)) ? 'HIGH' : s.total >= 2 ? 'MEDIUM' : 'LOW'
      };
    });

    // Bản đồ thông tin sản phẩm và lượt bán để tính tỷ lệ hoàn chính xác
    const productInfoMap: Record<string, any> = {};
    for (const p of (allProducts as any[])) {
      productInfoMap[p.id] = p;
    }

    const productUnitsSoldMap: Record<string, number> = {};
    for (const ord of (allOrders as any[])) {
      if (ord.items && Array.isArray(ord.items)) {
        for (const item of ord.items) {
          for (const p of (allProducts as any[])) {
            if (p.variants && p.variants.some((v: any) => v.id === item.variant_id)) {
              productUnitsSoldMap[p.id] = (productUnitsSoldMap[p.id] || 0) + (item.quantity || 1);
            }
          }
        }
      }
    }

    // Thống kê hoàn hàng theo Sản phẩm chi tiết
    const productReturnMap: Record<string, {
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
      logs: SizeReturnRecord[];
      recommendation: string;
    }> = {};

    for (const ret of sizeReturns) {
      const pid = ret.product_id;
      if (!productReturnMap[pid]) {
        const prod = productInfoMap[pid];
        productReturnMap[pid] = {
          product_id: pid,
          product_name: prod?.name || ret.product_name,
          image_url: prod?.image_url || 'https://res.cloudinary.com/tkfku9hx/image/upload/v1792863862/degent/hero-atelier.jpg',
          category: prod?.category || 'Thời trang',
          units_sold: productUnitsSoldMap[pid] || 0,
          total: 0,
          tight: 0,
          loose: 0,
          other: 0,
          tight_percentage: 0,
          loose_percentage: 0,
          other_percentage: 0,
          return_rate: 0,
          is_high_return_rate: false,
          primary_issue: 'CÂN BẰNG',
          sizes: [],
          size_breakdown: [],
          logs: [],
          recommendation: ''
        };
      }

      productReturnMap[pid].total += 1;
      if (ret.return_reason === 'TIGHT') productReturnMap[pid].tight += 1;
      else if (ret.return_reason === 'LOOSE') productReturnMap[pid].loose += 1;
      else productReturnMap[pid].other += 1;

      if (!productReturnMap[pid].sizes.includes(ret.size)) {
        productReturnMap[pid].sizes.push(ret.size);
      }
      productReturnMap[pid].logs.push(ret);
    }

    // Hoàn thiện các chỉ số %, tỷ lệ hoàn và khuyến nghị cho từng sản phẩm
    for (const pid of Object.keys(productReturnMap)) {
      const item = productReturnMap[pid];
      const prod = productInfoMap[pid];
      if (prod && !item.units_sold && productUnitsSoldMap[pid]) {
        item.units_sold = productUnitsSoldMap[pid];
      }
      // Ước tính số lượng đã bán nếu đơn hàng chưa có trong DB (seed fallback)
      const effectiveUnitsSold = item.units_sold > 0 ? item.units_sold : Math.max(16, item.total * 4 + 8);
      item.units_sold = effectiveUnitsSold;
      item.return_rate = Number(((item.total / effectiveUnitsSold) * 100).toFixed(1));

      item.tight_percentage = item.total > 0 ? Math.round((item.tight / item.total) * 100) : 0;
      item.loose_percentage = item.total > 0 ? Math.round((item.loose / item.total) * 100) : 0;
      item.other_percentage = Math.max(0, 100 - item.tight_percentage - item.loose_percentage);

      // Cảnh báo tỷ lệ hoàn cao: nếu return_rate >= 12% hoặc tổng lượt hoàn >= 3
      item.is_high_return_rate = item.return_rate >= 12 || item.total >= 3;

      if (item.tight_percentage >= 60) {
        item.primary_issue = 'CHẬT';
        item.recommendation = `${item.tight_percentage}% đơn hoàn là do CHẬT (đùi, đáy hoặc ngực). Vì là hàng nhập khẩu, khuyến nghị CTV & CSKH chủ động tư vấn khách TĂNG 1 SIZE khi chốt đơn.`;
      } else if (item.loose_percentage >= 60) {
        item.primary_issue = 'RỘNG';
        item.recommendation = `Đa số khách hoàn do RỘNG (${item.loose_percentage}% form âu/suông dài). Khuyến nghị CTV & CSKH chủ động tư vấn khách GIẢM 1 SIZE hoặc chọn mẫu form ôm vừa vặn.`;
      } else {
        item.primary_issue = 'CÂN BẰNG';
        item.recommendation = `Tỷ lệ chật (${item.tight_percentage}%) và rộng (${item.loose_percentage}%) phân bố cân bằng. Form chuẩn theo bảng thông số, CTV tư vấn khách CHỌN ĐÚNG SIZE theo chiều cao & cân nặng.`;
      }

      // Nhóm breakdown theo từng size cho riêng sản phẩm này
      const sizeGroupMap: Record<string, { total: number; tight: number; loose: number }> = {};
      for (const log of item.logs) {
        const s = (log.size || 'M').trim().toUpperCase();
        if (!sizeGroupMap[s]) sizeGroupMap[s] = { total: 0, tight: 0, loose: 0 };
        sizeGroupMap[s].total += 1;
        if (log.return_reason === 'TIGHT') sizeGroupMap[s].tight += 1;
        else if (log.return_reason === 'LOOSE') sizeGroupMap[s].loose += 1;
      }

      item.size_breakdown = Object.entries(sizeGroupMap)
        .map(([size, stat]) => ({
          size,
          total: stat.total,
          tight: stat.tight,
          loose: stat.loose,
          tight_percentage: stat.total > 0 ? Math.round((stat.tight / stat.total) * 100) : 0,
          loose_percentage: stat.total > 0 ? Math.round((stat.loose / stat.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);
    }

    const productReturnAnalytics = Object.values(productReturnMap).sort((a, b) => {
      // Ưu tiên sản phẩm có tỷ lệ hoàn cao hoặc số lượt hoàn lớn lên đầu
      if (a.is_high_return_rate !== b.is_high_return_rate) {
        return a.is_high_return_rate ? -1 : 1;
      }
      return b.return_rate - a.return_rate || b.total - a.total;
    });

    // ================= XỬ LÝ DỮ LIỆU THỜI GIAN TÌM KIẾM =================
    const totalSearches = searchLogs.length;
    const totalDuration = searchLogs.reduce((acc, cur) => acc + (cur.duration_seconds || 0), 0);
    const avgSearchDuration = totalSearches > 0 ? Number((totalDuration / totalSearches).toFixed(1)) : 0;

    const fastSearches = searchLogs.filter(s => s.duration_seconds < 20).length;
    const mediumSearches = searchLogs.filter(s => s.duration_seconds >= 20 && s.duration_seconds <= 60).length;
    const deepSearches = searchLogs.filter(s => s.duration_seconds > 60).length;

    // Nhóm theo từ khóa tìm kiếm (Top Queries)
    const queryMap: Record<string, { query: string; count: number; total_duration: number; clicked_product_id: string | null; results_count: number }> = {};
    for (const log of searchLogs) {
      const q = log.query.trim().toLowerCase();
      if (!q) continue;
      if (!queryMap[q]) {
        queryMap[q] = { query: q, count: 0, total_duration: 0, clicked_product_id: null, results_count: log.results_count };
      }
      queryMap[q].count += 1;
      queryMap[q].total_duration += (log.duration_seconds || 0);
      if (log.selected_product_id) {
        queryMap[q].clicked_product_id = log.selected_product_id;
      }
    }

    const productNameMap: Record<string, string> = {};
    for (const p of allProducts) {
      productNameMap[p.id] = p.name;
    }

    const topQueries = Object.values(queryMap)
      .map(q => ({
        query: q.query,
        count: q.count,
        avg_duration: Number((q.total_duration / q.count).toFixed(1)),
        results_count: q.results_count,
        top_clicked_name: q.clicked_product_id ? (productNameMap[q.clicked_product_id] || q.clicked_product_id) : 'Chưa chọn'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ================= XỬ LÝ MA TRẬN GIÁM SÁT SẢN PHẨM ĐANG BÁN =================
    // Tính tổng lượt xem toàn sàn
    const totalViews = Object.values(viewCountsMap).reduce((acc, cur) => acc + cur, 0);

    const productMonitoring = (allProducts as any[]).map((p: any) => {
      const views = viewCountsMap[p.id] || 0;
      const viewShare = totalViews > 0 ? Number(((views / totalViews) * 100).toFixed(1)) : 0;

      // Tính tổng tồn kho khả dụng & giá bán
      const totalPhysicalQty = p.variants.reduce((sum: number, v: any) => sum + (v.physical_qty || 0), 0);
      const totalAvailableQty = p.variants.reduce((sum: number, v: any) => sum + (v.available_qty !== undefined ? v.available_qty : (v.physical_qty || 0)), 0);
      const minPrice = p.variants.length > 0 ? Math.min(...p.variants.map((v: any) => v.selling_price || 0)) : 0;
      const maxPrice = p.variants.length > 0 ? Math.max(...p.variants.map((v: any) => v.selling_price || 0)) : 0;
      const minCost = p.variants.length > 0 ? Math.min(...p.variants.map((v: any) => v.cost_price || 0)) : 0;
      const marginPercent = minPrice > 0 ? Math.round(((minPrice - minCost) / minPrice) * 100) : 0;

      // Doanh số & Số lượng bán dựa trên đơn hàng thực tế
      let unitsSold = 0;
      let revenue = 0;
      for (const ord of (allOrders as any[])) {
        if (ord.items && Array.isArray(ord.items)) {
          for (const item of ord.items) {
            const isMatch = p.variants.some((v: any) => v.id === item.variant_id);
            if (isMatch) {
              unitsSold += item.quantity || 1;
              revenue += item.total_price || (item.unit_price * (item.quantity || 1));
            }
          }
        }
      }

      // Thống kê hoàn theo sản phẩm này
      const prodReturns = productReturnMap[p.id];
      const returnCount = prodReturns ? prodReturns.total : 0;
      const tightCount = prodReturns ? prodReturns.tight : 0;
      const looseCount = prodReturns ? prodReturns.loose : 0;
      const returnRate = unitsSold > 0 ? Number(((returnCount / unitsSold) * 100).toFixed(1)) : 0;

      // Khuyến nghị kích cỡ tự động
      let sizeRecommendation = 'Kích cỡ chuẩn form mẫu';
      if (tightCount >= 2 && tightCount > looseCount) {
        sizeRecommendation = `⚠️ Form ôm sát: Khuyên khách tăng 1 size (${prodReturns?.sizes.join(', ')})`;
      } else if (looseCount >= 2 && looseCount > tightCount) {
        sizeRecommendation = `ℹ️ Form rộng/oversize: Khuyên khách giảm 1 size (${prodReturns?.sizes.join(', ')})`;
      } else if (returnCount > 0) {
        sizeRecommendation = `Đã có ${returnCount} lượt đổi/hoàn size`;
      }

      const conversionRate = views > 0 ? Number(((unitsSold / views) * 100).toFixed(1)) : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        image_url: p.image_url,
        is_active: p.is_active === 1,
        total_physical_qty: 999999,
        total_available_qty: 999999,
        is_low_stock: false,
        is_out_of_stock: false,
        min_price: minPrice,
        max_price: maxPrice,
        margin_percent: marginPercent,
        views,
        view_share: viewShare,
        units_sold: unitsSold,
        revenue,
        conversion_rate: conversionRate,
        returns: {
          total: returnCount,
          tight: tightCount,
          loose: looseCount,
          return_rate: returnRate,
          problem_sizes: prodReturns?.sizes || []
        },
        size_recommendation: sizeRecommendation,
        variants_count: p.variants.length,
        created_at: p.created_at
      };
    });

    // Sắp xếp theo lượt xem giảm dần
    const topViewedProducts = [...productMonitoring].sort((a, b) => b.views - a.views);

    // ================= TỔNG KẾT METRICS =================
    const totalTightReturns = sizeReturns.filter(r => r.return_reason === 'TIGHT').length;
    const totalLooseReturns = sizeReturns.filter(r => r.return_reason === 'LOOSE').length;
    const totalReturnsCount = sizeReturns.length;

    return NextResponse.json({
      success: true,
      summary: {
        total_active_products: (allProducts as any[]).filter((p: any) => p.is_active === 1).length,
        total_views: totalViews,
        avg_search_duration_seconds: avgSearchDuration,
        total_returns: totalReturnsCount,
        tight_returns_count: totalTightReturns,
        loose_returns_count: totalLooseReturns,
        tight_percentage: totalReturnsCount > 0 ? Math.round((totalTightReturns / totalReturnsCount) * 100) : 0,
        loose_percentage: totalReturnsCount > 0 ? Math.round((totalLooseReturns / totalReturnsCount) * 100) : 0,
      },
      size_analytics: sizeAnalytics,
      product_return_analytics: productReturnAnalytics,
      search_analytics: {
        avg_duration_seconds: avgSearchDuration,
        total_searches: totalSearches,
        fast_searches: fastSearches,
        medium_searches: mediumSearches,
        deep_searches: deepSearches,
        top_queries: topQueries,
        recent_searches: searchLogs.slice(0, 20)
      },
      product_monitoring: productMonitoring,
      top_viewed_products: topViewedProducts,
      return_logs: sizeReturns.slice(0, 50)
    });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;
    const db = await getDb();

    // 1. Ghi nhận lượt xem sản phẩm
    if (type === 'view') {
      const { product_id, session_id } = body;
      if (!product_id) {
        return NextResponse.json({ success: false, message: 'Thiếu product_id' }, { status: 400 });
      }

      // Lưu vào bảng product_views
      try {
        await db.execute(`
          INSERT INTO product_views (id, product_id, session_id, viewed_at)
          VALUES (?, ?, ?, datetime('now'))
        `, [`view-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, product_id, session_id || 'guest']);
      } catch {}

      // Đồng bộ vào site_content view counts
      const counts = await getSiteContent<Record<string, number>>('analytics_view_counts', {});
      counts[product_id] = (counts[product_id] || 0) + 1;
      await setSiteContent('analytics_view_counts', counts);

      return NextResponse.json({ success: true, product_id, views: counts[product_id] });
    }

    // 2. Ghi nhận phiên tìm kiếm và thời gian tìm kiếm
    if (type === 'search') {
      const { query, duration_seconds, results_count, selected_product_id } = body;
      if (!query || duration_seconds === undefined) {
        return NextResponse.json({ success: false, message: 'Thiếu query hoặc duration_seconds' }, { status: 400 });
      }

      const logId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newLog: SearchLogRecord = {
        id: logId,
        query: String(query).trim(),
        duration_seconds: Math.max(0.5, Number(duration_seconds)),
        results_count: Number(results_count || 0),
        selected_product_id: selected_product_id || null,
        created_at: new Date().toISOString()
      };

      try {
        await db.execute(`
          INSERT INTO search_logs (id, query, duration_seconds, results_count, selected_product_id, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [newLog.id, newLog.query, newLog.duration_seconds, newLog.results_count, newLog.selected_product_id]);
      } catch {}

      const logs = await getSiteContent<SearchLogRecord[]>('analytics_search_logs', DEFAULT_SAMPLE_SEARCH_LOGS);
      logs.unshift(newLog);
      if (logs.length > 300) logs.length = 300;
      await setSiteContent('analytics_search_logs', logs);

      return NextResponse.json({ success: true, log: newLog });
    }

    // 3. Thêm bản ghi hoàn hàng theo Size & Lý do (Chật / Rộng / Khác)
    if (type === 'return') {
      const { order_id, product_id, product_name, variant_sku, size, color, return_reason, notes } = body;
      if (!product_id || !size || !return_reason) {
        return NextResponse.json({ success: false, message: 'Thiếu product_id, size hoặc return_reason' }, { status: 400 });
      }

      const returnId = `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newReturn: SizeReturnRecord = {
        id: returnId,
        order_id: order_id || 'HD-TRỰC-TIẾP',
        product_id,
        product_name: product_name || 'Sản phẩm',
        variant_sku: variant_sku || '',
        size: String(size).toUpperCase(),
        color: color || '',
        return_reason: return_reason === 'LOOSE' ? 'LOOSE' : return_reason === 'OTHER' ? 'OTHER' : 'TIGHT',
        notes: notes || '',
        created_at: new Date().toISOString()
      };

      try {
        await db.execute(`
          INSERT INTO size_returns (id, order_id, product_id, product_name, variant_sku, size, color, return_reason, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [newReturn.id, newReturn.order_id, newReturn.product_id, newReturn.product_name, newReturn.variant_sku, newReturn.size, newReturn.color, newReturn.return_reason, newReturn.notes]);
      } catch {}

      const returns = await getSiteContent<SizeReturnRecord[]>('analytics_size_returns', DEFAULT_SAMPLE_RETURNS);
      returns.unshift(newReturn);
      if (returns.length > 300) returns.length = 300;
      await setSiteContent('analytics_size_returns', returns);

      return NextResponse.json({ success: true, return: newReturn });
    }

    // 4. Xóa bản ghi hoàn hàng
    if (type === 'delete_return') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: 'Thiếu id' }, { status: 400 });
      }
      try {
        await db.execute(`DELETE FROM size_returns WHERE id = ?`, [id]);
      } catch {}

      const returns = await getSiteContent<SizeReturnRecord[]>('analytics_size_returns', DEFAULT_SAMPLE_RETURNS);
      const filtered = returns.filter(r => r.id !== id);
      await setSiteContent('analytics_size_returns', filtered);

      return NextResponse.json({ success: true, message: 'Đã xóa bản ghi hoàn hàng' });
    }

    return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
