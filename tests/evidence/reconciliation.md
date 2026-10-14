# Đối chiếu lõi tính mới với công thức workbook cũ

> Toàn bộ số liệu dưới đây là **dữ liệu giả** (bộ `bo1`, `bo2` trong `tests/fixtures/`). Không có số thật.
> Đây là hồ sơ tự soát để mang đi review, không phải kết luận "đã đạt chuẩn".

## Cách làm

Công thức của workbook Excel cũ (các sheet Key Metrics, Point, Bảng quy đổi công việc) được cài đặt lại **độc lập** trong
`tests/doi-chieu-cu.js`, cố ý viết khác cấu trúc với `src/core/` và giữ nguyên các hành vi im lặng của workbook cũ.
Hai bên chạy trên cùng dữ liệu giả có cấu trúc giống workbook cũ; test `tests/doi-chieu-cu.test.js` so sánh point tổng và thu nhập từng người.

Chạy lại: `node --test tests/doi-chieu-cu.test.js`

## Kết quả khi dữ liệu hợp lệ: trùng khớp

**Bộ 1** (tháng 09/2026, đơn giá point 50.000đ)

| Tài khoản giả | Point cũ | Point mới | Thu nhập cũ | Thu nhập mới | Trạng thái |
|---|---|---|---|---|---|
| nva1 | 278,92 | 278,92 | 9.800.000 | 9.800.000 | đã tính |
| nvb2 | 326,38 | 326,38 | 16.200.000 | 16.200.000 | đã tính |
| nvc3 | 17 | 17 | 12.700.000 | 12.700.000 | đã tính |
| nvd4 | 5 | 5 | không có | không tính | chỉ theo dõi point |
| nve5 | 275,26 | 275,26 | 16.043.000 | 16.043.000 | đã tính |
| nvf6 | 281,54 | 281,54 | 9.620.000 | 9.620.000 | đã tính |
| nvg7 | 5 | 5 | 11.475.000 | 11.475.000 | đã tính |

**Bộ 2** (tháng 10/2026, đơn giá point 60.000đ, bậc và hệ số khác)

| Tài khoản giả | Point cũ | Point mới | Thu nhập cũ | Thu nhập mới | Trạng thái |
|---|---|---|---|---|---|
| nvh8 | 233,6 | 233,6 | 12.200.000 | 12.200.000 | đã tính |
| nvi9 | 49,6 | 49,6 | 13.800.000 | 13.800.000 | đã tính |
| nvk10 | 94,5 | 94,5 | 8.700.000 | 8.700.000 | đã tính |
| nvl11 | 50 | 50 | 12.000.000 | 12.000.000 | đã tính |

Chênh lệch giữa hai bên (trước khi làm tròn đến đồng) không quá 0,001 đồng; đây cũng là dung sai của test.
Điều này cho thấy lõi mới tính đúng cùng quy tắc với workbook cũ, kể cả: nội suy %HT từ 0% tại Min đến 100% tại mục tiêu,
điểm key metrics theo tỷ trọng từng người, hai cột point xuất bán và chuyển kho, hệ số chia theo nguồn × khu vực,
cắt trần Max, phụ cấp theo cờ máy tính cá nhân, ghi đè lương cố định.

Lưu ý giới hạn: hai cài đặt cùng do một người đọc từ cùng một workbook, nên việc trùng khớp chỉ chứng minh lõi mới
đúng với **cách tôi hiểu** workbook cũ. Trước khi dùng lương thật, chủ sở hữu nên chạy cả hai trên một kỳ có số thật
ngay trong môi trường riêng của mình và so từng dòng (xem mục "Việc còn lại" cuối tài liệu).

## Khác biệt có chủ đích (lõi mới cố ý khác workbook cũ)

| # | Tình huống | Workbook cũ | Lõi mới | Lý do |
|---|---|---|---|---|
| 1 | Mã hàng có phát sinh nhưng chưa có trong bảng quy đổi | Bỏ qua âm thầm (`IFNA(...,"")` rồi `SUM`), thu nhập ra số thấp hơn thật mà không báo | Báo lỗi nêu mã, khu vực, số lượng; nguồn xuất bán/chuyển kho của khu vực đó không có số; người phụ thuộc hiện "chưa tính"; khu vực khác vẫn tính | Spec point-allocation, chuẩn Sapo 2.8 (không bịa kết quả) |
| 2 | Chỉ số key metrics thiếu kết quả | Coi %HT = 0, vẫn ra số thu nhập | Key metrics "thiếu", thu nhập "chưa tính" | Spec key-metrics-scoring |
| 3 | Point quản lý kho nhập tay đè công thức | Dùng số nhập tay, không ai biết lệch nhật ký | Dùng tổng nhật ký, báo lệch kèm tài khoản; kỳ không được coi là đủ dữ liệu | Spec point-allocation (đối soát) |
| 4 | Dòng "Tổng" khi còn người thiếu dữ liệu | Không có khái niệm "thiếu"; bản prototype đầu cộng cột lương cố định cho 7 người nhưng thu nhập chỉ cho 5 người | Mọi cột tiền cùng tập người đã tính, ghi "cộng của N/M người"; không ai tính được thì để trống thay vì 0 | Spec income-calculation |
| 5 | Báo cáo kiểm kê chỉ phủ một phần kỳ | Không thấy kiểm tra nào trong các công thức đã đọc | Chặn quỹ khu vực đó cho đến khi chủ sở hữu xác nhận; sau xác nhận chỉ còn cảnh báo | Spec point-allocation |
| 6 | Người không có chỉ số key metrics (chỉ theo dõi point) | Nằm ngoài bảng thu nhập | Hiện point, không tính thu nhập, không nằm trong tổng và mẫu số | Spec income-calculation |

Các khác biệt #1 đến #4 đều có test tự động trong `tests/doi-chieu-cu.test.js`.

## Điều chưa đối chiếu được

- Chưa chạy trên số liệu thật (không được phép đưa dữ liệu thật vào AI; chuẩn Sapo 2.1).
- Workbook cũ có sheet ẩn mô tả bậc thang với nhãn khoảng "80% < X ≤ 100%" trong khi công thức thực tế dùng 80–90%. Lõi mới theo công thức thực tế (đã được chủ sở hữu xác nhận).
- Workbook cũ dùng số cố định 0,375 cho "Quản lý sale admin tỉnh" trong công thức; lõi mới đưa vào bảng việc quản lý kho dưới dạng cấu hình, nhưng chưa có dữ liệu thật để so.

## Việc còn lại cho chủ sở hữu

1. Tự chạy lõi mới và workbook cũ trên một kỳ thật trong môi trường riêng, so từng dòng; mọi chênh lệch phải thuộc 6 khác biệt có chủ đích ở trên.
2. Xác nhận các giả định trong `design.md` (làm tròn, ghi đè chỉ áp lương cố định, nguồn không có hệ số là không áp dụng).
