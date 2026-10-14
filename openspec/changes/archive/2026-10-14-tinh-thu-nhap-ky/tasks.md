# Tasks

Quy ước chung: lõi tính nằm trong `src/core/` dưới dạng các hàm JavaScript thuần (không gọi API Apps Script), kiểm thử bằng Node có sẵn (`node --test` hoặc `assert`), dữ liệu mẫu trong `tests/fixtures/` **chỉ là dữ liệu giả**. Không thêm thư viện ngoài.

## 1. Khung dự án và dữ liệu mẫu giả

- [x] 1.1 Tạo cấu trúc `src/core/`, `tests/`, `tests/fixtures/`, `tests/evidence/` và `.gitignore` chặn `.env` và tệp cấu hình chứa secret; kiểm tra bằng `git status` các thư mục xuất hiện đúng và `.gitignore` có `.env`
- [x] 1.2 Tạo bộ tiện ích dùng chung (so khớp không phân biệt hoa/thường, đọc số, phân biệt trống với 0) và test đơn vị cho từng tiện ích; kiểm tra bằng chạy test xanh
- [x] 1.3 Tạo bộ dữ liệu giả bộ 1 (bình thường, 7 thành viên giả ở 2 khu vực, 2 nhóm, đủ cấu hình) theo đúng cấu trúc của workbook cũ nhưng không dùng tên, tài khoản hay số thật; kiểm tra bằng rà soát thủ công và lệnh `grep` các tên/tài khoản thật đã biết không xuất hiện trong `tests/fixtures/`
- [x] 1.4 Tạo bộ dữ liệu giả bộ 2 (kỳ khác, bậc khác, hệ số chia khác) và bộ 3 (dữ liệu xấu: mã hàng lạ, hệ số lệch, tỷ trọng lệch, thiếu trường, dòng thiếu mã); kiểm tra các tệp fixture đọc được và mô tả rõ ý đồ từng bộ trong `tests/fixtures/README.md`

## 2. Cấu hình và kiểm tra cấu hình (`income-config`)

- [x] 2.1 Cài đặt đọc và kiểm tra bảng bậc (Min < Max) và bậc thang thưởng (không chồng, không hở, phủ từ 0); kiểm tra bằng test các scenario "Min không nhỏ hơn Max" và "khoảng ngưỡng chồng lấn hoặc hở"
- [x] 2.2 Cài đặt bảng quy đổi công việc hai cột point, ánh xạ mã hàng → nhóm, phát hiện mã trùng, so khớp không phân biệt hoa/thường; kiểm tra bằng test "tên nhóm khác chữ hoa/thường" và "mã hàng trùng"
- [x] 2.3 Cài đặt hệ số chia theo nguồn × khu vực × người và kiểm tra tổng hệ số bằng 1; kiểm tra bằng test "tổng hệ số khác 1" và "thành viên không có hệ số"
- [x] 2.4 Cài đặt danh sách thành viên (tài khoản duy nhất, cờ máy tính cá nhân, ghi đè lương cố định, tập chỉ số, tỷ trọng tổng 100%); kiểm tra bằng test "tài khoản trùng", "ghi đè lương cố định" và "tổng tỷ trọng khác 100%"
- [x] 2.5 Cài đặt từ chối tính khi thiếu tham số bắt buộc, nêu rõ tên tham số; kiểm tra bằng test "thiếu tham số bắt buộc" và "đổi đơn giá point"

## 3. Tính và chia point (`point-allocation`)

- [x] 3.1 Cài đặt quỹ xuất bán/chuyển kho theo khu vực với hai cột point; kiểm tra bằng test ví dụ mã A (10 bán, 5 chuyển kho → 4,65 point)
- [x] 3.2 Cài đặt báo lỗi mã hàng lạ hoặc nhóm chưa có point (kèm mã, khu vực, số lượng) và cảnh báo dòng thiếu mã; kiểm tra bằng test "mã hàng lạ", "mã hàng không phát sinh" và "dòng demo không có mã"
- [x] 3.3 Cài đặt kiểm tra khoảng ngày báo cáo phủ trọn kỳ; kiểm tra bằng test báo cáo 01–14 của tháng 10 bị cảnh báo
- [x] 3.4 Cài đặt quỹ bảo hành và hỗ trợ sale, từ chối số âm; kiểm tra bằng test "tính quỹ bảo hành và hỗ trợ sale" (20 ca, 100 đơn → 20 và 17) và "số ca âm"
- [x] 3.5 Cài đặt point quản lý kho từ nhật ký công việc (hệ số theo loại việc, hệ số riêng đã cấu hình), báo lỗi loại việc không có hệ số và tài khoản không có trong danh sách; kiểm tra bằng các test cùng tên trong spec
- [x] 3.6 Cài đặt chia quỹ theo hệ số, cộng bốn nguồn thành point tổng, đối soát quỹ với phần đã chia (sai số 0,01); kiểm tra bằng test "chia theo hệ số 60/40", "cộng bốn nguồn → 91" và "lệch do giá trị nhập tay"
- [x] 3.7 Cài đặt trạng thái đủ/thiếu dữ liệu point, phân biệt trống với 0 và nguồn không áp dụng; kiểm tra bằng test "có nguồn áp dụng còn trống", "nguồn nhập 0", "nguồn không áp dụng"

## 4. Chấm key metrics (`key-metrics-scoring`)

- [x] 4.1 Cài đặt Min từ mục tiêu và hệ số 70% cho chỉ số thấp tốt và cao tốt; kiểm tra bằng test 21 → 30 và 80% → 56%
- [x] 4.2 Cài đặt %HT nội suy 0% tại Min – 100% tại mục tiêu, chặn 0–100%; kiểm tra bằng test 97,9%, 100%, 58,3% và "bằng hoặc tệ hơn Min → 0%"
- [x] 4.3 Cài đặt %HT doanh thu (KQ/Mục tiêu, trần 120%); kiểm tra bằng test 130% → 120% và 98% → 98%
- [x] 4.4 Cài đặt điểm key metrics theo tỷ trọng từng người và % thưởng theo bậc thang với biên đóng ở cận trên; kiểm tra bằng test điểm 97,9%, điểm 105% và các biên 80%, 100,01%, 65%
- [x] 4.5 Cài đặt nhập kết quả dùng chung theo nhóm hoặc khu vực có ưu tiên giá trị riêng; kiểm tra bằng test "kết quả dùng chung theo khu vực"
- [x] 4.6 Cài đặt xử lý thiếu hoặc sai dữ liệu (kết quả trống → thiếu; mục tiêu 0 → báo lỗi) và trạng thái "không áp dụng"; kiểm tra bằng test "thiếu kết quả", "mục tiêu bằng 0" và "thành viên chỉ theo dõi point"

## 5. Tính thu nhập tạm tính (`income-calculation`)

- [x] 5.1 Cài đặt point vượt (không âm, cắt trần Max) và thưởng vượt point; kiểm tra bằng test 298,67 → 48,67; 466,3 → 50; 22 dưới Min → 0 không bị trừ
- [x] 5.2 Cài đặt thưởng key metrics trên lương cố định áp dụng (ghi đè nếu có) và phụ cấp theo cờ; kiểm tra bằng test "thưởng tính trên lương ghi đè 1.960.000", "% thưởng bằng 0", "máy công ty"
- [x] 5.3 Cài đặt thu nhập tạm tính và hai ví dụ mẫu của spec; kiểm tra bằng test ví dụ bậc 1 → 9.200.000 và ví dụ ghi đè → 16.200.000
- [x] 5.4 Cài đặt trạng thái "chưa tính" khi thiếu point hoặc key metrics, "không tính" khi chỉ theo dõi point; kiểm tra bằng test "thiếu key metrics", "thiếu point" và "theo dõi point"
- [x] 5.5 Cài đặt tổng theo nhóm và team chỉ gồm người đã tính, kèm số người đã tính trên tổng, và làm tròn đến đồng; kiểm tra bằng test "tổng khi còn người thiếu dữ liệu 5/7" và "thưởng lẻ đồng"
- [x] 5.6 Cài đặt nhãn "Đề xuất – chờ duyệt", cảnh báo không chặn (cắt trần, dưới Min, ghi đè lương) và dữ liệu giải thích cách tính từng bước; kiểm tra bằng test các scenario cùng tên
- [x] 5.7 Kiểm tra tính ổn định: chạy hai lần cùng đầu vào cho cùng kết quả; kiểm tra bằng test "chạy hai lần" trên bộ 1

## 6. Gom lỗi, log và bằng chứng test

- [x] 6.1 Cài đặt tổng hợp lỗi chặn và cảnh báo từ mọi bước, một lỗi chỉ chặn phần phụ thuộc nó; kiểm tra bằng test bộ 3 cho thấy lỗi mã hàng lạ ở một khu vực không chặn khu vực kia
- [x] 6.2 Cài đặt ghi log lỗi chỉ gồm loại lỗi, trường thiếu và thời điểm, không có lương hay thu nhập; kiểm tra bằng test "ghi log lỗi" quét nội dung log không chứa số tiền hay tên
- [x] 6.3 Chạy ba bộ dữ liệu (bình thường, khác kỳ/bậc/khu vực, xấu/thiếu trường) và lưu cặp input/output vào `tests/evidence/`; kiểm tra bằng 3 cặp tệp có mặt, bộ 3 báo lỗi rõ và không bịa số

## 7. Tài liệu và kiểm tra tích hợp

- [x] 7.1 Viết README ngắn (lõi tính làm gì, cách chạy test, đầu vào/đầu ra mẫu giả, tham số cấu hình và mặc định, tier, owner và rủi ro không có backup, kênh báo lỗi) theo Phụ lục B của chuẩn Sapo; kiểm tra bằng làm theo README và chạy được test như mô tả
- [x] 7.2 Cập nhật `mini-prd-form-tinh-point.md` cho khớp spec (công thức %HT, tỷ trọng theo người, hai cột point, nhật ký quản lý kho) hoặc ghi rõ nó đã được thay thế; kiểm tra bằng đọc lại không còn công thức %HT cũ
- [x] 7.3 Soát nội bộ lõi theo checklist C1–C13 liên quan (C2, C3, C4, C5, C6, C7, C9, C11, C13) và ghi kết quả đạt/chưa đạt kèm lý do vào `tests/evidence/self-check.md`; kiểm tra bằng tệp có đủ các mục và không tuyên bố "đã đạt chuẩn"
- [x] 7.4 Đối chiếu một kỳ dữ liệu giả có cấu trúc giống workbook cũ giữa lõi mới và công thức cũ, liệt kê mọi chênh lệch có chủ đích (lỗi mã hàng lạ, giá trị nhập tay) trong `tests/evidence/reconciliation.md`; kiểm tra bằng mọi chênh lệch đều được giải thích

## Workflow follow-up

- Giao diện Apps Script, nhập/import báo cáo kiểm kê và nhật ký công việc, duyệt và chốt kỳ (bản sao kỳ, mở lại kỳ) là các change sau.
- Chủ sở hữu rà lại các giả định trong `design.md` (làm tròn, ghi đè Min/Max, nguồn không áp dụng) trước khi apply.
- Archive change sau khi hoàn tất và được chủ sở hữu xem lại.
