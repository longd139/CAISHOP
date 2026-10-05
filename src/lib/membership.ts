/**
 * Hệ thống Cấp bậc Hội viên & Chính sách Chiết khấu theo số lượng đơn hàng (Membership Tiers)
 * - Hội viên Đồng: 0 - 2 đơn hàng (Giảm 0%)
 * - Hội viên Bạc: Từ 3 đơn hàng (Giảm 5%)
 * - Hội viên Vàng: Từ 5 đơn hàng (Giảm 10%)
 * - Kim Cương / CTV VIP: Từ 10 đơn hàng (Giảm sâu 15%)
 */

export interface TierPerk {
  id: string;
  title: string;
  desc: string;
  badge?: string;
  category: 'discount' | 'shipping' | 'support' | 'gift' | 'return';
}

export interface MembershipTier {
  id: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  name: string;
  min_orders: number;
  min_items?: number;
  discount_percent: number;
  badge_class: string;
  dot_color: string;
  tag_text: string;
  description: string;
  theme_color: string;
  gradient: string;
  perks: TierPerk[];
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'BRONZE',
    name: 'Hội viên Đồng',
    min_orders: 0,
    min_items: 0,
    discount_percent: 0,
    badge_class: 'bg-amber-50 text-amber-900 border-amber-200',
    dot_color: 'bg-amber-600',
    tag_text: 'ĐỒNG',
    description: 'Mua dưới 3 đơn hàng - Giá niêm yết',
    theme_color: '#d97706',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    perks: [
      {
        id: 'p-bronze-1',
        title: 'Tỷ lệ chiết khấu: 0%',
        desc: 'Áp dụng giá gốc niêm yết chuẩn trên toàn bộ sản phẩm.',
        badge: 'Giá niêm yết',
        category: 'discount'
      },
      {
        id: 'p-bronze-2',
        title: 'Điều kiện: 0 - 2 đơn hàng',
        desc: 'Mức giá áp dụng cho khách hàng hoàn thành dưới 3 đơn hàng.',
        badge: '0 - 2 đơn',
        category: 'discount'
      },
      {
        id: 'p-bronze-3',
        title: 'Cơ chế áp dụng',
        desc: 'Tính giá trực tiếp theo giá bán lẻ niêm yết của từng sản phẩm.',
        badge: 'Trực tiếp',
        category: 'discount'
      },
      {
        id: 'p-bronze-4',
        title: 'Mục tiêu thăng hạng',
        desc: 'Hoàn thành từ 3 đơn hàng để bắt đầu được giảm ngay 5%.',
        badge: 'Cần từ 3 đơn',
        category: 'discount'
      }
    ]
  },
  {
    id: 'SILVER',
    name: 'Hội viên Bạc',
    min_orders: 3,
    min_items: 3,
    discount_percent: 5,
    badge_class: 'bg-slate-100 text-slate-800 border-slate-300',
    dot_color: 'bg-slate-500',
    tag_text: 'BẠC',
    description: 'Tích lũy từ 3 đơn hàng - Giảm 5%',
    theme_color: '#64748b',
    gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    perks: [
      {
        id: 'p-silver-1',
        title: 'Tỷ lệ chiết khấu: Giảm 5%',
        desc: 'Tự động giảm 5% trên tổng hóa đơn thanh toán cho mọi đơn tiếp theo.',
        badge: 'Giảm 5%',
        category: 'discount'
      },
      {
        id: 'p-silver-2',
        title: 'Điều kiện: Từ 3 đơn hàng',
        desc: 'Kích hoạt ngay khi tài khoản hoàn thành từ 3 đơn hàng thành công.',
        badge: 'Từ 3 đơn',
        category: 'discount'
      },
      {
        id: 'p-silver-3',
        title: 'Tự động trừ vào giỏ hàng',
        desc: 'Chiết khấu 5% được tính tự động, không cần nhập mã giảm giá.',
        badge: 'Tự động',
        category: 'discount'
      },
      {
        id: 'p-silver-4',
        title: 'Mục tiêu tiếp theo: Giảm 10%',
        desc: 'Đạt từ 5 đơn hàng để nâng mức chiết khấu lên gấp đôi (10%).',
        badge: 'Cần từ 5 đơn',
        category: 'discount'
      }
    ]
  },
  {
    id: 'GOLD',
    name: 'Hội viên Vàng',
    min_orders: 5,
    min_items: 5,
    discount_percent: 10,
    badge_class: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    dot_color: 'bg-yellow-500',
    tag_text: 'VÀNG',
    description: 'Tích lũy từ 5 đơn hàng - Giảm 10%',
    theme_color: '#eab308',
    gradient: 'from-yellow-500/15 via-yellow-500/5 to-transparent',
    perks: [
      {
        id: 'p-gold-1',
        title: 'Tỷ lệ chiết khấu: Giảm 10%',
        desc: 'Tự động giảm 10% trên toàn bộ giỏ hàng không giới hạn giá trị.',
        badge: 'Giảm 10%',
        category: 'discount'
      },
      {
        id: 'p-gold-2',
        title: 'Điều kiện: Từ 5 đơn hàng',
        desc: 'Áp dụng khi bạn đã tích lũy hoàn thành từ 5 đơn hàng thành công.',
        badge: 'Từ 5 đơn',
        category: 'discount'
      },
      {
        id: 'p-gold-3',
        title: 'Trừ thẳng vào hóa đơn',
        desc: 'Hệ thống tự nhận diện hạng Vàng và trừ 10% tại bước thanh toán.',
        badge: 'Tự động',
        category: 'discount'
      },
      {
        id: 'p-gold-4',
        title: 'Mục tiêu cao nhất: Giảm 15%',
        desc: 'Đạt từ 10 đơn hàng để nhận mức chiết khấu tối đa 15% (giá CTV VIP).',
        badge: 'Cần từ 10 đơn',
        category: 'discount'
      }
    ]
  },
  {
    id: 'DIAMOND',
    name: 'Kim Cương (CTV VIP)',
    min_orders: 10,
    min_items: 10,
    discount_percent: 15,
    badge_class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot_color: 'bg-indigo-500',
    tag_text: 'KIM CƯƠNG',
    description: 'Tích lũy từ 10 đơn hàng - Giảm sâu 15%',
    theme_color: '#6366f1',
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    perks: [
      {
        id: 'p-diamond-1',
        title: 'Tỷ lệ chiết khấu: Giảm sâu 15%',
        desc: 'Mức chiết khấu cao nhất hệ thống, trừ 15% toàn bộ đơn hàng.',
        badge: 'Giảm sâu 15%',
        category: 'discount'
      },
      {
        id: 'p-diamond-2',
        title: 'Điều kiện: Từ 10 đơn hàng',
        desc: 'Dành riêng cho khách hàng đạt từ 10 đơn hàng và CTV thân thiết.',
        badge: 'Từ 10 đơn',
        category: 'discount'
      },
      {
        id: 'p-diamond-3',
        title: 'Chính sách giá CTV VIP',
        desc: 'Áp dụng mức giá sỉ CTV tốt nhất cho mọi đơn hàng tiếp theo.',
        badge: 'Giá sỉ CTV',
        category: 'discount'
      },
      {
        id: 'p-diamond-4',
        title: 'Mức chiết khấu cao nhất',
        desc: 'Bạn đã đạt mốc giảm giá tối đa trong hệ thống CAISHOP.',
        badge: 'Cấp tối đa',
        category: 'discount'
      }
    ]
  }
];

export function calculateTier(totalOrders: number): MembershipTier {
  if (totalOrders >= 10) return MEMBERSHIP_TIERS[3]; // DIAMOND
  if (totalOrders >= 5) return MEMBERSHIP_TIERS[2];  // GOLD
  if (totalOrders >= 3) return MEMBERSHIP_TIERS[1];  // SILVER
  return MEMBERSHIP_TIERS[0];                       // BRONZE
}

export function getNextTierInfo(totalOrders: number) {
  if (totalOrders < 3) {
    return {
      next_tier: MEMBERSHIP_TIERS[1],
      orders_needed: 3 - totalOrders,
      items_needed: 3 - totalOrders,
      benefit: 'Giảm 5% toàn bộ đơn hàng'
    };
  }
  if (totalOrders < 5) {
    return {
      next_tier: MEMBERSHIP_TIERS[2],
      orders_needed: 5 - totalOrders,
      items_needed: 5 - totalOrders,
      benefit: 'Giảm 10% toàn bộ đơn hàng'
    };
  }
  if (totalOrders < 10) {
    return {
      next_tier: MEMBERSHIP_TIERS[3],
      orders_needed: 10 - totalOrders,
      items_needed: 10 - totalOrders,
      benefit: 'Giảm sâu 15% (Chính sách CTV VIP)'
    };
  }
  return null; // Đã đạt Rank cao nhất
}
