# Proposal

## Why

Lớp Google Sheet đã tính đúng và đã được thử trên Sheet thật (F1, F3, F10 đạt, tổng 75.838.000đ), nhưng kết quả vẫn chỉ là một tab có thể bị ghi đè bất cứ lúc nào: không có bước **duyệt** để biến đề xuất thành bản chính thức, không có bản sao đóng băng của kỳ (tháng sau sửa cấu hình là số tháng trước có thể đổi theo khi tính lại), và chủ sở hữu phải đi qua nhiều tab thay vì một chỗ xem trọn quy trình. Bảng `KetQua` còn khó đọc (tiền và phần trăm chưa định dạng, cột bị cắt chữ).

## What Changes

- **Duyệt và chốt kỳ trong một bước:** nút "Xác nhận duyệt" tính lại từ dữ liệu hiện tại, buộc chủ sở hữu xác nhận **từng người chưa đủ dữ liệu**, rồi lưu **bản sao đóng băng** của kỳ (kết quả đã duyệt cùng toàn bộ cấu hình và dữ liệu đã dùng, kèm dấu vân tay để phát hiện sửa tay) và thêm một dòng vào bảng chỉ mục các kỳ đã chốt. Kỳ đã chốt không chốt lại được.
- **Mở lại kỳ có dấu vết:** cần lý do, giữ nguyên bản chốt cũ (đổi tên, không xoá), ghi trạng thái "Đã mở lại", sau đó chốt lại được.
- **Tính kỳ trên kỳ đã chốt vẫn chạy** nhưng cảnh báo rõ và cho biết kết quả tính lại giống hay khác bản chốt; không bao giờ đổi bản chốt.
- **Giao diện HTML** (hộp thoại không chặn Sheet) theo **đầy đủ prototype**: Tổng quan, Nhập point (4 nguồn), Nhập key metrics, Kết quả, Duyệt và lưu, Lịch sử và Cấu hình, cùng ô chọn kỳ. Hiển thị chỉ qua `textContent`, không tải tài nguyên ngoài, không gọi mạng.
- **Màn xem chi tiết (chỉ đọc):** chip Point và Key metrics đủ/thiếu cho từng người, phân rã point theo nguồn (quỹ, hệ số, point nhận), thanh %HT của từng chỉ số, và panel "Cách tính" khi bấm một thành viên.
- **Sửa dữ liệu và cấu hình ngay trong giao diện:** một bộ soạn bảng dùng chung cho các bảng cấu hình (bậc, bậc thang, thông số, quy đổi công việc, hệ số chia, khu vực, thành viên, tỷ trọng) và các bảng nhập tay (bảo hành, hỗ trợ sale, xác nhận báo cáo, nhật ký công việc, key metrics), ô chọn kỳ, nhập báo cáo kiểm kê bằng dán văn bản hoặc chọn tệp CSV/TSV, và "Khôi phục mặc định" cho bốn bảng có giá trị mặc định. Mọi thao tác ghi do **máy chủ** kiểm tra và chỉ ghi vào danh sách tab cho phép; chặn khi kỳ đã chốt hoặc Sheet chia sẻ rộng; có hộp xác nhận.
- **Định dạng `KetQua`:** tiền có dấu phân cách nghìn, phần trăm hiển thị %, point hai chữ số thập phân, tiêu đề in đậm, độ rộng cột hợp lý.
- **Quyền:** giữ `drive` làm mặc định (đã kiểm chứng) và cung cấp thêm một manifest dùng `drive.readonly` để chủ sở hữu thử thu hẹp quyền.
- Không đọc tệp Excel `.xlsx` (chỉ dán văn bản hoặc chọn tệp CSV/TSV), không tự động tải báo cáo từ hệ thống, không tính theo ngày công, không chạy theo lịch. Sửa tay trực tiếp trên Sheet vẫn được và vẫn là đường dự phòng.

## Capabilities

### New Capabilities
- `period-approval`: Duyệt và chốt kỳ một bước, xác nhận từng người chưa đủ dữ liệu, bản sao đóng băng có dấu vân tay, chỉ mục các kỳ đã chốt, chặn chốt lại, mở lại kỳ có lý do và dấu vết, so sánh tính lại với bản chốt.
- `control-panel-ui`: Bảng điều khiển HTML trong Sheet theo prototype (bảy màn hình, ô chọn kỳ, chip, phân rã point, thanh %HT, panel cách tính), trạng thái rỗng/đang tải/lỗi/thành công, hiển thị an toàn, không gọi ra ngoài, và chỉ gọi các hàm máy chủ được liệt kê.
- `ui-data-editing`: Sửa cấu hình và dữ liệu nhập từ bảng điều khiển: bộ soạn bảng dùng chung, kiểm tra trước khi ghi, chuyển kiểu giá trị, danh sách tab được ghi, chặn khi kỳ đã chốt hoặc Sheet chia sẻ rộng, chọn kỳ, nhập báo cáo kiểm kê từ văn bản hoặc tệp, khôi phục mặc định.

### Modified Capabilities
- `sheet-result-output`: Mở rộng danh sách tab đầu ra được phép ghi (thêm chỉ mục kỳ đã chốt và bản sao kỳ) và thêm yêu cầu định dạng bảng kết quả.

## Impact

- **Mã nguồn mới:** `src/sheet/chot.js`, `src/sheet/giaodien.js`, `src/sheet/giaodienhtml.js`, `src/sheet/gas-chot.js`, `src/sheet/gas-giaodien.js`, `src/sheet/bang.js` (định nghĩa và kiểm tra bảng sửa được), `src/sheet/nhapbang.js` (phân tích văn bản CSV/TSV), `src/sheet/gas-sua.js` (ghi bảng); chỉnh `ketqua.js`, `gas.js`, `hang.js`, `tools/build-gs.js`. `src/core/` không đổi.
- **Quyền:** cần thêm `HtmlService` và `Sheet.protect()` (không cần quyền OAuth mới, đã nằm trong `script.container.ui` và `spreadsheets.currentonly`); cần cập nhật bài kiểm tra quét API cho phép. Vẫn không có quyền mạng, thư, lịch.
- **Dữ liệu:** bản sao kỳ chứa cấu hình và dữ liệu đã dùng của kỳ (lương, tên, tài khoản) **trong chính Sheet riêng tư**; chuẩn Sapo mục D5 vẫn áp dụng (Tier 3). Nhật ký hệ thống không ghi tên, tài khoản hay số tiền của sự kiện chốt, mở lại và sửa bảng. Màn phân rã point nay hiển thị **mã hàng, nhóm và số lượng bán, chuyển kho** của báo cáo (prototype yêu cầu), vẫn không hiển thị giá bán, giá trị tồn hay mô tả nhật ký công việc.
- **Đảo ngược một nguyên tắc cũ:** trước đây giao diện không sửa dữ liệu nhập. Nay giao diện được ghi vào các bảng cấu hình và nhập tay, nên toàn bộ việc ghi nằm ở máy chủ với danh sách tab cho phép, kiểm tra trước khi ghi, hộp xác nhận, chặn khi kỳ đã chốt và khi Sheet chia sẻ rộng. Lịch sử phiên bản của Google Sheets là chỗ khôi phục khi sửa nhầm.
- **Số tab tăng** mỗi kỳ chốt (một tab bản sao). Giới hạn ô 50.000 ký tự được xử lý bằng chia đoạn.
- **Không kiểm thử được bằng Node:** hành vi thật của hộp thoại HTML, `sheet.protect()` và giới hạn kích thước trên Sheet thật. Giao diện được kiểm thử bằng một DOM giả tối thiểu và danh sách kiểm tay.
