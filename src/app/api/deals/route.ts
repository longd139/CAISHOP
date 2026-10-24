import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';
import { AVAILABLE_DEALS, CustomDeal } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = await getSiteContent<CustomDeal[] | null>('available_deals', null);
    let deals: CustomDeal[] = [];

    if (raw && Array.isArray(raw) && (raw as CustomDeal[]).length > 0) {
      deals = raw as CustomDeal[];
    } else {
      deals = AVAILABLE_DEALS;
    }

    return NextResponse.json({
      success: true,
      data: deals,
      count: deals.length
    });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tải danh sách deal' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ. Yêu cầu danh sách các deal.' },
        { status: 400 }
      );
    }

    // Sanitize and validate deals
    const sanitizedDeals: CustomDeal[] = body.map((item: any) => {
      const code = String(item.code || '').trim().toUpperCase().replace(/\s+/g, '');
      const title = String(item.title || 'Ưu đãi đặc biệt').trim();
      const is_freeship = Boolean(item.is_freeship);
      const discount_amount = item.discount_amount !== undefined ? Number(item.discount_amount) || 0 : undefined;
      const min_order = Number(item.min_order) || 0;
      
      let discount = String(item.discount || '').trim();
      if (!discount) {
        if (is_freeship) {
          discount = 'Freeship toàn quốc';
        } else if (discount_amount) {
          discount = `Giảm ${new Intl.NumberFormat('vi-VN').format(discount_amount)}đ`;
        } else {
          discount = 'Ưu đãi đặc biệt';
        }
      }

      let condition = String(item.condition || '').trim();
      if (!condition) {
        if (min_order > 0) {
          condition = `Áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN').format(min_order)}đ trở lên`;
        } else {
          condition = 'Áp dụng cho mọi giá trị đơn hàng';
        }
      }

      const expiry = String(item.expiry || '31/12/2026').trim();

      return {
        code,
        title,
        discount,
        discount_amount,
        is_freeship,
        min_order,
        condition,
        expiry,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
      };
    }).filter(d => Boolean(d.code));

    await setSiteContent('available_deals', sanitizedDeals);

    return NextResponse.json({
      success: true,
      data: sanitizedDeals,
      message: 'Cập nhật danh sách ưu đãi thành công'
    });
  } catch (error: any) {
    console.error('Error saving deals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lưu cấu hình deal' },
      { status: 500 }
    );
  }
}
