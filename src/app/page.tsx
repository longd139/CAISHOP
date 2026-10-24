import CustomerStorefront from '@/components/CustomerStorefront';

export const metadata = {
  title: "DE'GENT — Thời trang tối giản & cao cấp",
  description: "Trang mua sắm thời trang trực tuyến DE'GENT. Đặt hàng và thanh toán VietQR tự động."
};

export default function HomePage() {
  return (
    <CustomerStorefront />
  );
}
