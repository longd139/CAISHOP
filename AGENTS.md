# Agent Rules cho Antigravity

> Áp dụng cho mọi task code. Người dùng KHÔNG đọc code và không review diff — các rule dưới đây là lưới an toàn thay thế cho việc review thủ công. Agent phải tuân thủ nghiêm ngặt, không được tự diễn giải lại để "linh hoạt hơn".

---

## 1. Xác minh bắt buộc (Verification Flow)

- **Không được báo "done"/"fixed" nếu chưa thực sự chạy lệnh kiểm tra.**
- Lệnh kiểm tra theo tech stack:
  - Node/JS: `npm test` hoặc `pnpm test`
  - Python: `pytest`
  - Generic: `make test`
- Sau khi chạy:
  1. Dán toàn bộ output terminal vào chat.
  2. Nêu rõ số test pass/fail (ví dụ: "34/34 tests passed").
  3. Chỉ được đánh dấu hoàn thành SAU khi test thực sự pass.

## 2. Chống test giả / test vô nghĩa

- Cấm sửa hoặc xóa test hiện có để làm nó pass, trừ khi được yêu cầu rõ ràng — và phải giải thích lý do bằng tiếng Việt TRƯỚC khi sửa.
- Nếu tạo test mới, phải hiển thị nội dung test đó trong chat (không chỉ số lượng pass).
- Test phải kiểm tra hành vi thực tế (input cụ thể → output cụ thể mong đợi), không chỉ kiểm tra "không throw lỗi" hoặc mock toàn bộ logic cần test.

## 3. Kiểm soát phạm vi (Scope Control)

- Chỉ được sửa file/chức năng liên quan trực tiếp đến task đang làm.
- Nếu phát hiện vấn đề khác ngoài phạm vi task, phải báo cáo riêng — không tự ý sửa luôn.
- Trước khi sửa, liệt kê danh sách file sẽ bị ảnh hưởng. Nếu vượt quá 3 file cho một task nhỏ, phải xin xác nhận trước khi tiến hành.

## 4. An toàn qua Git

- Bắt buộc commit sau mỗi task hoàn thành, message mô tả rõ ràng bằng tiếng Việt (không dùng message chung chung như "update").
- Không bao giờ force-push.
- Không sửa trực tiếp trên branch chính (main/master) — luôn làm việc trên branch riêng.
- Trước khi bắt đầu một task lớn/rủi ro, tạo checkpoint hoặc tag để có thể rollback nhanh.

## 5. Giải thích bằng ngôn ngữ tự nhiên

- Sau mỗi task, tóm tắt bằng tiếng Việt, không dùng thuật ngữ kỹ thuật sâu:
  - Đã thay đổi gì
  - Tại sao thay đổi
  - Ảnh hưởng gì đến hành vi của ứng dụng
- Nếu thay đổi có rủi ro (đổi logic tính toán, đổi schema DB, đổi luồng dữ liệu quan trọng...), PHẢI cảnh báo trước khi làm — không được làm xong rồi mới báo.

## 6. Không tự ý thay đổi kiến trúc

- Cấm tự ý cài thêm thư viện/dependency mới.
- Cấm tự ý đổi framework, đổi cấu trúc thư mục, đổi convention đặt tên.
- Nếu thấy cần thiết, phải đề xuất trước, giải thích lý do, và chờ người dùng đồng ý.

## 7. Bảo mật thông tin nhạy cảm

- Cấm hardcode API key, mật khẩu, connection string trực tiếp vào code.
- Bắt buộc dùng biến môi trường (`.env`), và đảm bảo `.env` nằm trong `.gitignore`.
- Nếu cần thông tin nhạy cảm để hoàn thành task, phải hỏi người dùng cách cung cấp an toàn — không tự bịa giá trị hoặc để lộ trong log/commit.

## 8. Làm từng bước nhỏ

- Chia nhỏ task lớn thành các bước, mỗi bước verify riêng (test + báo cáo) trước khi sang bước tiếp theo.
- Tránh sửa hàng trăm dòng rồi mới chạy test một lần — nếu fail sẽ không xác định được lỗi nằm ở đâu.

## 9. Không tự quyết định thay người dùng

- Với các quyết định có đánh đổi (performance vs. đơn giản, bảo mật vs. tiện lợi, chi phí vs. tốc độ...), agent phải trình bày các lựa chọn và lý do, để người dùng tự quyết định — không tự chọn rồi im lặng thực hiện.

---

### Checklist nhanh trước khi báo "Hoàn thành"
- [ ] Đã chạy lệnh test và dán output đầy đủ
- [ ] Đã nêu số lượng test pass/fail
- [ ] Không sửa/xóa test cũ mà không giải thích
- [ ] Chỉ sửa file trong phạm vi task
- [ ] Đã commit với message rõ ràng, đúng branch
- [ ] Đã tóm tắt thay đổi bằng tiếng Việt dễ hiểu
- [ ] Không thêm dependency/đổi kiến trúc ngoài yêu cầu
- [ ] Không có secret nào bị hardcode