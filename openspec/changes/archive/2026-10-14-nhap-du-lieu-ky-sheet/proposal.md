# Proposal

## Why

Lõi tính point và thu nhập (`src/core/`, đã có 4 main spec) mới chỉ chạy được trên tệp JSON giả. Chủ sở hữu làm việc trong Google Sheet nên chưa dùng được: báo cáo kiểm kê xuất từ hệ thống là bảng nhiều dòng tiêu đề, số ca bảo hành, số đơn hỗ trợ sale, nhật ký công việc và key metrics chưa có chỗ nhập, và kết quả chưa có chỗ xem. Nếu không làm cầu nối này, lõi vẫn nằm ngoài quy trình thật và workbook Excel cũ (có các lỗi im lặng đã biết) tiếp tục là cách duy nhất để tính lương.

## What Changes

- Đọc **báo cáo kiểm kê nhập-xuất-tồn** do chủ sở hữu **dán** vào một tab riêng cho mỗi khu vực: nhận diện bảng theo tên cột (không theo vị trí ô cố định), lấy mã hàng, "SL bán ra trong kỳ", "SL chuyển kho" và khoảng ngày của báo cáo, bỏ dòng tổng và dòng chân bảng. Khu vực lấy từ tên tab, không đoán từ nội dung.
- Các tab **nhập tay** có cấu trúc cố định: số ca bảo hành và số đơn hỗ trợ sale theo khu vực, nhật ký công việc, mục tiêu và kết quả key metrics (theo nhóm, khu vực hoặc tài khoản), xác nhận báo cáo chỉ phủ một phần kỳ. Ô trống khác số 0.
- Các tab **Cấu hình** lưu toàn bộ cấu hình lõi (tham số, bậc, bậc thang, quy đổi công việc, hệ số chia, thành viên) và kiểm tra bằng đúng bộ kiểm tra của lõi ngay khi đọc.
- Menu trong Sheet để chạy tính kỳ. Kết quả ghi ra tab **Kết quả** gồm bảng theo nhóm, dòng tổng "cộng của N/M người", lỗi, cảnh báo, giải thích từng bước, nhãn "Đề xuất – chờ duyệt". Chỉ ghi vào tab kết quả, không bao giờ ghi đè dữ liệu đầu vào.
- Cảnh báo khi Sheet đang chia sẻ rộng (bất kỳ ai có link) và không ghi lương hay tên vào log.
- Phần chuyển đổi giữa bảng tính hai chiều và đối tượng của lõi là hàm thuần có test bằng Node; phần gọi API của Apps Script mỏng, và một lệnh gộp mã nguồn thành một tệp để dán vào Apps Script (không thêm công cụ ngoài).

Không thuộc change này (để change sau): duyệt và chốt kỳ, bản sao kỳ, mở lại kỳ, giao diện HTML (thanh bên hoặc hộp thoại), tính theo ngày công, tự động tải tệp, chạy theo lịch.

## Capabilities

### New Capabilities
- `kiem-ke-report-import`: Đọc báo cáo kiểm kê nhập-xuất-tồn được dán vào Sheet thành dữ liệu xuất bán và chuyển kho theo khu vực, kèm khoảng ngày, và báo lỗi rõ khi cấu trúc báo cáo không như mong đợi.
- `period-data-entry`: Các bảng nhập tay của một kỳ (bảo hành, hỗ trợ sale, nhật ký công việc, key metrics, xác nhận báo cáo một phần) và cách chuyển chúng thành dữ liệu kỳ cho lõi, phân biệt ô trống với 0.
- `sheet-config-storage`: Lưu cấu hình trong các tab Cấu hình và đọc ngược thành cấu hình của lõi, với kiểm tra khi đọc và báo lỗi theo ô hoặc dòng.
- `sheet-result-output`: Chạy tính từ menu, ghi kết quả và lỗi ra tab Kết quả, bảo vệ dữ liệu đầu vào, kiểm tra chia sẻ Sheet và giữ log không chứa dữ liệu nhạy cảm.

### Modified Capabilities
<!-- Không có. Các quy tắc tính trong 4 main spec hiện có không đổi; change này chỉ thêm lớp nhập/xuất. -->

## Impact

- **Mã nguồn mới:** `src/sheet/` (hàm thuần chuyển đổi bảng ↔ đối tượng, và lớp Apps Script mỏng), `tests/` cho phần chuyển đổi, lệnh gộp mã nguồn. `src/core/` giữ nguyên hành vi; nếu cần chỉnh nhỏ (ví dụ nhận ngày dạng chuỗi), phải kèm test và ghi rõ.
- **Dữ liệu:** dữ liệu thật chỉ nằm trong Google Sheet riêng của chủ sở hữu. Test và ví dụ dùng dữ liệu giả có đúng cấu trúc báo cáo thật; không chép số hay tên từ file thật. Báo cáo kiểm kê (số lượng bán, chuyển kho theo mã hàng) là dữ liệu nội bộ Bảo mật.
- **Môi trường:** Google Sheet riêng tư + Apps Script, một người dùng. Tier 3 (xem change trước). Cần chủ sở hữu tự dán mã và cấp quyền Apps Script trong tài khoản của mình.
- **Phụ thuộc:** không thêm thư viện hay dịch vụ ngoài; không dùng `clasp`.
- **Rủi ro cần soát:** quyền chia sẻ Sheet, Apps Script chạy với quyền của chủ sở hữu, định dạng ngày và số theo vùng của Sheet.
