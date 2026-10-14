# Dữ liệu mẫu (toàn bộ là dữ liệu GIẢ)

Mọi tệp trong thư mục này là dữ liệu giả. Không có tên, tài khoản, số lương, số doanh thu hay số liệu kiểm kê thật.
Tên "Nhân viên A, B, C…" và tài khoản dạng `nva1` chỉ là nhãn mẫu. Nếu cần thêm ca kiểm thử, hãy tự bịa số mới, đừng chép từ file thật.

Mỗi bộ gồm hai tệp: `config.json` (cấu hình) và `ky.json` (dữ liệu một kỳ).

| Bộ | Ý đồ |
|---|---|
| `bo1` | **Bình thường.** Tháng 09/2026, 7 thành viên, 2 khu vực, 2 nhóm, đủ dữ liệu. Có người ở mọi trạng thái: point cắt trần Max, point trong khoảng Min–Max, point dưới Min, ghi đè lương cố định, không dùng máy cá nhân, chỉ theo dõi point. Tên nhóm lệch hoa/thường ("MBH cầm tay" so với "MBH Cầm tay"). Dòng kiểm kê thiếu mã nhưng không phát sinh, mã không phát sinh không có trong bảng quy đổi. |
| `bo2` | **Khác kỳ / bậc / hệ số.** Tháng 10/2026, đơn giá point khác (60.000đ), bậc 2/3/5, hệ số chia khác (một người nhận 100%), mã hàng viết thường, chỉ số cao tốt dưới Min. |
| `bo3` | **Dữ liệu xấu hoặc thiếu trường.** Mã hàng lạ, dòng thiếu mã có phát sinh, số ca âm, ô trống, tài khoản và loại việc không có trong cấu hình, mục tiêu bằng 0, kết quả trống, hệ số chia cộng không bằng 1, tỷ trọng không bằng 100%, báo cáo kiểm kê chỉ phủ một phần kỳ. Mỗi lỗi chỉ được chặn phần phụ thuộc nó. |

## Quy ước dữ liệu

- Ô **trống** (`null`) khác số **0**: trống là chưa có số liệu, 0 là đã nhập 0.
- Người không có dòng nhật ký công việc nào thì nguồn "quản lý kho" là **thiếu**. Muốn nói "không có việc" thì nhập một dòng có `soLuong` bằng 0.
- Kết quả key metrics nhập một lần theo `capDo`: `taiKhoan` (ưu tiên cao nhất), `khuVuc`, hoặc `nhom`.
- Tỷ lệ ghi dạng thập phân (0,033 là 3,3%).

## Fixture Sheet giả (`tests/fixtures/sheet/`)

Mỗi tệp `boN.tabs.json` là một đối tượng `{tên tab: mảng hai chiều}` giả lập một Google Sheet đúng kiểu `getValues()` trả về.
Chúng được dựng từ `boN/config.json` và `boN/ky.json` bằng `tests/sheet-fixture.js` (chạy `node tests/sheet-fixture.js` để ghi lại; test sẽ báo nếu tệp đã lưu lệch với nguồn).

- Các tab `CH_*` là cấu hình; `Ky`, `BaoHanh_HoTroSale`, `XacNhanBaoCao`, `NhatKyCongViec`, `KeyMetrics` là nhập tay của kỳ.
- `KiemKe_HN`, `KiemKe_HCM` là báo cáo kiểm kê giả có **đúng cấu trúc báo cáo thật** (nhiều dòng đầu, dòng "Từ ngày … đến ngày …", tiêu đề hai tầng, dòng "Tổng" mang giá trị cũ bằng 0, dòng sản phẩm, một dòng thiếu mã ở bo1, chân bảng "Tổng số dòng : N") nhưng toàn bộ số liệu là giả, kể cả các cột giá bán và giá trị tồn để kiểm tra việc không mang theo.
- Ô trống trong Sheet được biểu diễn bằng chuỗi rỗng `""`, ô trống trong dữ liệu kỳ JSON là `null`.
- `bo3` giữ nguyên các giá trị xấu ở dạng thô (số ca âm, ô trống, mã lạ, tài khoản lạ, báo cáo HCM chỉ phủ đến 14/09).
- Các biến thể xấu cho từng bảng riêng lẻ do từng test tự tạo bằng cách sửa một bản sao của fixture `bo1`.
