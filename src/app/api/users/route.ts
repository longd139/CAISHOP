import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateTier } from '@/lib/membership';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Danh sách tài khoản đăng ký hệ thống
    const users = await db.queryAll(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    // 2. Danh sách khách hàng thực tế tổng hợp từ đơn hàng
    const customers = await db.queryAll(`
      SELECT 
        o.customer_phone as phone,
        MAX(o.customer_name) as name,
        MAX(o.customer_email) as email,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.quantity), 0) as total_items,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.fulfillment_status != 'CANCELLED'
      GROUP BY o.customer_phone
      ORDER BY total_items DESC, total_spent DESC
    `);

    const enrichedCustomers = customers.map(c => {
      const tier = calculateTier(c.total_items);
      return {
        ...c,
        tier: tier.name,
        tier_id: tier.id,
        tag_text: tier.tag_text,
        discount_percent: tier.discount_percent,
        badge_class: tier.badge_class,
        dot_color: tier.dot_color
      };
    });

    return NextResponse.json({
      success: true,
      data: users,
      customers: enrichedCustomers
    });
  } catch (error: any) {
    console.error('Failed to fetch users and customer membership ranks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
