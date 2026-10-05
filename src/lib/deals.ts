export interface CustomDeal {
  code: string;
  title: string;
  discount: string;
  discount_amount?: number;
  is_freeship?: boolean;
  min_order?: number;
  condition: string;
  expiry: string;
  is_active?: boolean;
}

export const AVAILABLE_DEALS: CustomDeal[] = [
  {
    code: 'FREESHIP',
    title: 'Ưu Đãi Miễn Phí Giao Hàng',
    discount: 'Freeship toàn quốc',
    is_freeship: true,
    min_order: 0,
    condition: 'Áp dụng cho mọi giá trị đơn hàng',
    expiry: '15/11/2026',
    is_active: true
  },
  {
    code: 'CAISHOP50K',
    title: 'Voucher Độc Quyền Tài Khoản',
    discount: 'Giảm 50.000đ',
    discount_amount: 50000,
    min_order: 350000,
    condition: 'Áp dụng cho đơn hàng từ 350.000đ trở lên',
    expiry: '31/10/2026',
    is_active: true
  },
  {
    code: 'CAISHOP100K',
    title: 'Ưu Đãi Đơn Hàng VIP',
    discount: 'Giảm 100.000đ',
    discount_amount: 100000,
    min_order: 800000,
    condition: 'Áp dụng cho đơn hàng từ 800.000đ trở lên',
    expiry: '31/12/2026',
    is_active: true
  },
];
