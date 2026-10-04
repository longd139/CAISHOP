# DESIGN.md — CAISHOP Executive Control

## Product
CAISHOP — Bảng điều hành quản trị tập trung (Executive Dashboard) cho chủ shop thời trang: theo dõi dòng tiền, kiểm soát tồn kho và điều chỉnh giá bán.

## Users & tasks
- Users: Chủ shop / Nhà sáng lập, sử dụng hàng ngày trên desktop/laptop để ra quyết định kinh doanh.
- Top tasks:
  1. Kiểm tra lợi nhuận ròng, doanh thu và dòng tiền thực tế theo thời gian thực.
  2. Rà soát tồn kho, phát hiện ngay các SKU sắp hết hàng (dưới ngưỡng an toàn).
  3. Cập nhật giá niêm yết bán theo biến thể (có chốt chặn an toàn chống bán phá giá/lỗ vốn).

## Domain preset
Admin dashboard / internal tool: Giao diện cô đọng (dense), điềm đạm (calm), quét thông tin nhanh (fast to scan). Không dùng hiệu ứng gradient, neon glow hay thẻ bo tròn lòe loẹt.

## Reference UIs
- Stripe Dashboard — Cấu trúc số liệu tài chính rõ ràng, bảng biểu phẳng và tương phản chuẩn mực.
- GitHub / Linear Settings & Lists — Bố cục danh mục, bảng dữ liệu phân cấp, thao tác hàng (row actions) tinh tế.

## Tokens
- Primary: `#0f172a` (Slate 900)   Hover: `#1e293b` (Slate 800)   Soft: `#f1f5f9` (Slate 100)
- Accent: `#2563eb` (Blue 600 - liên kết và trạng thái focus/active)
- Font: Inter / System UI sans-serif   Body size: 14px
- Radius: Controls 6px (`rounded-md`) / Panels 8px (`rounded-lg`) / Badges 4px (`rounded-sm`)
- Density: Compact (phù hợp quản lý nhiều SKU và giao dịch)

## Layout decisions
- Shell: Thanh điều hướng trên đỉnh (Top Header) tinh gọn + Thanh tab phẳng + Vùng nội dung tối đa 1280px (`max-w-7xl`).
- Visual anchor:
  - Tab Dòng Tiền: Dải số liệu tài chính (Metrics Row) phẳng + Bảng sổ cái Inflow/Outflow.
  - Tab Tồn Kho: Bảng dữ liệu tồn kho với chỉ báo cảnh báo an toàn rõ ràng bằng văn bản và màu nền nhạt.
  - Tab Giá Bán: Bảng ma trận giá vốn, giá sàn và giá bán kèm input điều chỉnh trực tiếp.

## Do / Don't
- Do: Dùng màu nền bề mặt trung tính (trắng `#ffffff`, xám nhạt `#f8fafc`, viền `#e2e8f0`).
- Do: Hiển thị trạng thái bằng nhãn chữ cụ thể ("Sắp hết hàng", "Đã thanh toán").
- Don't: Không dùng gradient nền hoặc viền neon.
- Don't: Không dùng thẻ bo góc lớn `rounded-2xl` hay đổ bóng lớn `shadow-xl`.
- Don't: Không dùng hiệu ứng chuyển động không cần thiết (bỏ `animate-pulse`, `animate-spin` trang trí).
