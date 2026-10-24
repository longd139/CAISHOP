import ExecutiveDashboard from '@/components/ExecutiveDashboard';

export const metadata = {
  title: "DE'GENT — Bảng điều hành quản trị",
  description: 'Quản lý dòng tiền, tồn kho và điều khiển giá bán tập trung'
};

export default function AdminPage() {
  return <ExecutiveDashboard />;
}
