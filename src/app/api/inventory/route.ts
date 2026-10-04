import { NextResponse } from 'next/server';
import { getInventoryOverview, adjustInventory } from '@/lib/db';

export async function GET() {
  try {
    const items = getInventoryOverview();
    const lowStockCount = items.filter(i => i.is_low_stock).length;
    const criticalCount = items.filter(i => i.is_critical).length;
    
    return NextResponse.json({
      success: true,
      data: items,
      summary: {
        total_skus: items.length,
        low_stock_count: lowStockCount,
        critical_count: criticalCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { variant_id, physical_qty } = body;

    if (!variant_id || physical_qty === undefined) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin variant_id hoặc physical_qty' }, { status: 400 });
    }

    const result = adjustInventory(variant_id, Number(physical_qty));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
