import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateTier, getNextTierInfo, MEMBERSHIP_TIERS } from '@/lib/membership';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim() || '';
    const email = searchParams.get('email')?.trim() || '';
    const cartCount = Math.max(0, parseInt(searchParams.get('cart_count') || '0', 10));

    // If no phone or email provided, calculate tier strictly based on order count (0)
    if (!phone && !email) {
      const tier = calculateTier(0);
      const nextInfo = getNextTierInfo(0);
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
        AND (o.payment_status = 'PAID' OR o.fulfillment_status = 'DELIVERED')
    `, [phone, email || phone]);

    const pastOrders = stats?.order_count || 0;
    const tier = calculateTier(pastOrders);
    const nextInfo = getNextTierInfo(pastOrders);

    // Lấy thông tin tài khoản ngân hàng nhận tiền hoàn từ đơn hàng gần nhất (nếu có)
    const latestBank = await db.queryFirst<{
      refund_bank_name: string | null;
      refund_bank_account: string | null;
      refund_account_holder: string | null;
    }>(`
      SELECT refund_bank_name, refund_bank_account, refund_account_holder
      FROM orders
      WHERE (customer_phone = ? OR (customer_email IS NOT NULL AND customer_email = ?))
        AND (refund_bank_account IS NOT NULL AND refund_bank_account != '')
      ORDER BY created_at DESC
      LIMIT 1
    `, [phone, email || phone]);

    return NextResponse.json({
      success: true,
      data: {
        phone,
        email,
        past_items: stats?.past_items || 0,
        cart_items: cartCount,
        total_items: stats?.past_items || 0,
        total_spent: stats?.total_spent || 0,
        order_count: pastOrders,
        tier,
        next_tier_info: nextInfo,
        all_tiers: MEMBERSHIP_TIERS,
        saved_refund_bank: latestBank ? {
          bankName: latestBank.refund_bank_name || '',
          accountNumber: latestBank.refund_bank_account || '',
          accountHolder: latestBank.refund_account_holder || ''
        } : null
      }
    });
  } catch (error: any) {
    console.error('Error in /api/membership:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
