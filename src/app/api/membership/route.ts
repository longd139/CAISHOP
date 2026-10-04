import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateTier, getNextTierInfo, MEMBERSHIP_TIERS } from '@/lib/membership';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim() || '';
    const email = searchParams.get('email')?.trim() || '';
    const cartCount = Math.max(0, parseInt(searchParams.get('cart_count') || '0', 10));

    // If no phone or email provided, calculate tier strictly based on current cart count
    if (!phone && !email) {
      const tier = calculateTier(cartCount);
      const nextInfo = getNextTierInfo(cartCount);
      return NextResponse.json({
        success: true,
        data: {
          phone: '',
          past_items: 0,
          cart_items: cartCount,
          total_items: cartCount,
          total_spent: 0,
          order_count: 0,
          tier,
          next_tier_info: nextInfo,
          all_tiers: MEMBERSHIP_TIERS
        }
      });
    }

    const db = await getDb();
    
    // Aggregating past purchases by phone (or email)
    const stats = await db.queryFirst<{ past_items: number; total_spent: number; order_count: number }>(`
      SELECT 
        COALESCE(SUM(oi.quantity), 0) as past_items,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COUNT(DISTINCT o.id) as order_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.customer_phone = ? OR (o.customer_email IS NOT NULL AND o.customer_email = ?))
        AND o.fulfillment_status != 'CANCELLED'
    `, [phone, email || phone]);

    const pastItems = stats?.past_items || 0;
    const totalItems = pastItems + cartCount;
    const tier = calculateTier(totalItems);
    const nextInfo = getNextTierInfo(totalItems);

    return NextResponse.json({
      success: true,
      data: {
        phone,
        email,
        past_items: pastItems,
        cart_items: cartCount,
        total_items: totalItems,
        total_spent: stats?.total_spent || 0,
        order_count: stats?.order_count || 0,
        tier,
        next_tier_info: nextInfo,
        all_tiers: MEMBERSHIP_TIERS
      }
    });
  } catch (error: any) {
    console.error('Error in /api/membership:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
