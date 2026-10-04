/**
 * Hệ thống Cấp bậc Hội viên & Chính sách Chiết khấu theo số lượng (Membership Tiers)
 * - Hội viên Đồng: 0 - 2 sản phẩm (Giảm 0%)
 * - Hội viên Bạc: Từ 3 sản phẩm (Giảm 5%)
 * - Hội viên Vàng: Từ 5 sản phẩm (Giảm 10%)
 * - Kim Cương / CTV VIP: Từ 10 sản phẩm (Giảm sâu 15%)
 */

export interface MembershipTier {
  id: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  name: string;
  min_items: number;
  discount_percent: number;
  badge_class: string;
  dot_color: string;
  tag_text: string;
  description: string;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'BRONZE',
    name: 'Hội viên Đồng',
    min_items: 0,
    discount_percent: 0,
    badge_class: 'bg-amber-50 text-amber-900 border-amber-200',
    dot_color: 'bg-amber-600',
    tag_text: 'ĐỒNG',
    description: 'Mua dưới 3 sản phẩm • Giá niêm yết'
  },
  {
    id: 'SILVER',
    name: 'Hội viên Bạc',
    min_items: 3,
    discount_percent: 5,
    badge_class: 'bg-slate-100 text-slate-800 border-slate-300',
    dot_color: 'bg-slate-500',
    tag_text: 'BẠC',
    description: 'Mua từ 3 sản phẩm • Giảm 5%'
  },
  {
    id: 'GOLD',
    name: 'Hội viên Vàng',
    min_items: 5,
    discount_percent: 10,
    badge_class: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    dot_color: 'bg-yellow-500',
    tag_text: 'VÀNG',
    description: 'Mua từ 5 sản phẩm • Giảm 10%'
  },
  {
    id: 'DIAMOND',
    name: 'Kim Cương (CTV VIP)',
    min_items: 10,
    discount_percent: 15,
    badge_class: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot_color: 'bg-indigo-500',
    tag_text: 'KIM CƯƠNG',
    description: 'Mua từ 10 sản phẩm • Giảm sâu 15%'
  }
];

export function calculateTier(totalItems: number): MembershipTier {
  if (totalItems >= 10) return MEMBERSHIP_TIERS[3]; // DIAMOND
  if (totalItems >= 5) return MEMBERSHIP_TIERS[2];  // GOLD
  if (totalItems >= 3) return MEMBERSHIP_TIERS[1];  // SILVER
  return MEMBERSHIP_TIERS[0];                       // BRONZE
}

export function getNextTierInfo(totalItems: number) {
  if (totalItems < 3) {
    return {
      next_tier: MEMBERSHIP_TIERS[1],
      items_needed: 3 - totalItems,
      benefit: 'Giảm 5% toàn bộ đơn hàng'
    };
  }
  if (totalItems < 5) {
    return {
      next_tier: MEMBERSHIP_TIERS[2],
      items_needed: 5 - totalItems,
      benefit: 'Giảm 10% toàn bộ đơn hàng'
    };
  }
  if (totalItems < 10) {
    return {
      next_tier: MEMBERSHIP_TIERS[3],
      items_needed: 10 - totalItems,
      benefit: 'Giảm sâu 15% (Chính sách CTV VIP)'
    };
  }
  return null; // Đã đạt Rank cao nhất
}
