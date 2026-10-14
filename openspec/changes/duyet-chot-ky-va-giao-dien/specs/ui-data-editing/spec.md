# Spec Delta

## Purpose

Cho chủ sở hữu sửa cấu hình và dữ liệu nhập của kỳ ngay từ bảng điều khiển một cách an toàn: mọi việc ghi do máy chủ kiểm tra, chỉ vào các tab được phép, có xác nhận và có chỗ khôi phục, mà không phá vỡ nguyên tắc dữ liệu thật chỉ nằm trong Sheet riêng tư.

## ADDED Requirements

### Requirement: Danh sách tab sửa được
Hệ thống SHALL chỉ cho sửa từ bảng điều khiển các bảng sau: cấu hình (tham số, bậc, bậc thang, chỉ số, nhóm thiết bị, mã hàng, việc quản lý kho, hệ số chia, khu vực, thành viên, tỷ trọng) và nhập tay (số liệu bảo hành và hỗ trợ sale theo khu vực, xác nhận báo cáo, nhật ký công việc, key metrics). Hệ thống MUST từ chối ghi vào bất kỳ tab nào khác, kể cả tab báo cáo kiểm kê (chỉ ghi qua chức năng nhập báo cáo), tab kết quả, tab chỉ mục và tab bản sao kỳ.

#### Scenario: Ghi vào tab ngoài danh sách
- **WHEN** hàm lưu bảng nhận tên một tab không thuộc danh sách sửa được
- **THEN** hàm từ chối, không ghi gì và nêu lý do

#### Scenario: Tab bản sao kỳ
- **WHEN** hàm lưu bảng nhận tên `Chot_2026-09` hoặc `KyDaChot`
- **THEN** hàm từ chối và các tab đó không đổi

### Requirement: Đọc bảng để sửa
Hệ thống SHALL trả về cho bảng điều khiển nội dung một bảng sửa được gồm tiêu đề cột chuẩn, kiểu từng cột (số, chữ, TRUE hoặc FALSE, chọn từ danh sách) và các dòng hiện có, và MUST trả khung tiêu đề rỗng khi tab chưa tồn tại thay vì báo lỗi.

#### Scenario: Tab chưa tồn tại
- **WHEN** chủ sở hữu mở bộ soạn của một bảng mà tab chưa được tạo
- **THEN** bộ soạn hiện tiêu đề chuẩn và không có dòng nào, và việc lưu sẽ tạo tab

### Requirement: Kiểm tra trước khi ghi
Trước khi ghi, hệ thống SHALL dựng nội dung bảng mới, chạy bộ đọc và bộ kiểm tra cấu hình hiện có trên bản thử đó, và MUST từ chối ghi, không đổi gì, nếu bản thử có lỗi thuộc chính bảng đang lưu. Lỗi thuộc bảng khác SHALL được báo như cảnh báo sau khi ghi và MUST NOT chặn việc lưu.

#### Scenario: Tổng hệ số chia khác 1
- **WHEN** chủ sở hữu lưu bảng hệ số chia với tổng hệ số bảo hành của một khu vực là 0,9
- **THEN** hệ thống từ chối ghi, nêu khu vực và tổng hiện tại, và tab giữ nguyên

#### Scenario: Lỗi ở bảng khác
- **WHEN** chủ sở hữu lưu bảng thành viên thêm một người chưa có tỷ trọng ở bảng tỷ trọng
- **THEN** hệ thống ghi bảng thành viên và trả cảnh báo về phần còn thiếu ở bảng khác

#### Scenario: Ô số chứa chữ
- **WHEN** chủ sở hữu lưu một bảng có ô đơn giá point là "năm mươi nghìn"
- **THEN** hệ thống từ chối ghi và nêu tab, dòng và cột

### Requirement: Chuyển kiểu giá trị rõ ràng
Hệ thống SHALL chuyển giá trị gửi từ giao diện theo kiểu cột: ô số chỉ nhận chuỗi gồm chữ số có thể có một dấu chấm hoặc dấu phẩy thập phân, ô TRUE hoặc FALSE chỉ nhận hai giá trị đó, ô chọn chỉ nhận giá trị trong danh sách, ô chữ được cắt khoảng trắng đầu cuối. Giá trị không đúng kiểu MUST được giữ nguyên dạng thô để bộ kiểm tra báo lỗi, và hệ thống MUST NOT đoán định dạng hàng nghìn.

#### Scenario: Số có dấu phẩy
- **WHEN** giao diện gửi "0,17" cho một cột số
- **THEN** giá trị được ghi là số 0.17

#### Scenario: Chuỗi có dấu phân cách nghìn
- **WHEN** giao diện gửi "6.000.000" cho một cột số
- **THEN** giá trị không được đoán thành số và việc lưu bị từ chối với lỗi nêu ô đó

#### Scenario: Ô trống
- **WHEN** giao diện gửi ô trống cho cột số tuỳ chọn
- **THEN** ô được ghi trống (không phải 0)

### Requirement: Văn bản không thành công thức
Mọi ô chữ do giao diện ghi MUST được đặt định dạng văn bản trước khi ghi để chuỗi bắt đầu bằng "=", "+", "-" hoặc "@" được lưu như chữ và không bị Sheet đánh giá thành công thức.

#### Scenario: Tên bắt đầu bằng dấu bằng
- **WHEN** chủ sở hữu lưu một thành viên có tên `=1+1`
- **THEN** ô được lưu là chữ `=1+1` và không có ô nào trở thành công thức

### Requirement: Chặn ghi khi kỳ đã chốt hoặc Sheet chia sẻ rộng
Hệ thống MUST từ chối mọi thao tác ghi từ giao diện (lưu bảng, đặt kỳ, nhập báo cáo, khôi phục mặc định) khi mức chia sẻ của Sheet là rộng hoặc không đọc được. Hệ thống MUST từ chối lưu các bảng nhập tay của kỳ và nhập báo cáo khi kỳ hiện tại đang ở trạng thái Đã chốt, và chỉ dẫn mở lại kỳ trước. Việc lưu các bảng cấu hình khi kỳ đang Đã chốt SHALL được phép nhưng kèm cảnh báo rằng bản chốt không đổi.

#### Scenario: Chia sẻ rộng
- **WHEN** Sheet đang chia sẻ cho bất kỳ ai có liên kết và chủ sở hữu bấm Lưu
- **THEN** hệ thống từ chối và không ghi gì

#### Scenario: Sửa bảng nhập khi kỳ đã chốt
- **WHEN** kỳ đang Đã chốt và chủ sở hữu lưu bảng nhật ký công việc
- **THEN** hệ thống từ chối và chỉ dẫn dùng "Mở lại kỳ"

#### Scenario: Sửa cấu hình khi kỳ đã chốt
- **WHEN** kỳ đang Đã chốt và chủ sở hữu lưu bảng tham số
- **THEN** hệ thống ghi và cảnh báo rằng bản chốt giữ nguyên số cũ

### Requirement: Ghi theo bảng và không mất dữ liệu ngoài bảng
Khi lưu một bảng, hệ thống SHALL thay thế các dòng dữ liệu của bảng đó theo đúng các cột chuẩn và MUST NOT đổi các tab khác. Hệ thống SHALL ghi một dòng vào nhật ký hệ thống chỉ gồm loại sự kiện và phạm vi, và MUST NOT ghi nội dung bảng, tên, tài khoản hay số tiền vào nhật ký.

#### Scenario: Lưu một bảng
- **WHEN** chủ sở hữu lưu bảng bậc
- **THEN** chỉ tab bảng bậc và nhật ký hệ thống thay đổi, mọi tab khác giữ nguyên

#### Scenario: Nhật ký sự kiện
- **WHEN** một bảng được lưu thành công
- **THEN** nhật ký hệ thống có một dòng loại sự kiện sửa bảng và không chứa nội dung bảng

### Requirement: Chọn kỳ
Hệ thống SHALL cho đặt kỳ bằng một tháng dạng năm-tháng và ghi vào ô tháng của tab `Ky` ở dạng văn bản, và MUST từ chối giá trị không đúng dạng hoặc tháng không tồn tại.

#### Scenario: Đặt kỳ hợp lệ
- **WHEN** giao diện gửi "2026-10"
- **THEN** ô tháng của tab Ky là chữ "2026-10" và mô hình tải lại theo kỳ mới

#### Scenario: Kỳ sai
- **WHEN** giao diện gửi "2026-13" hoặc "tháng chín"
- **THEN** hệ thống từ chối và tab Ky không đổi

### Requirement: Nhập báo cáo kiểm kê từ văn bản hoặc tệp
Hệ thống SHALL cho nhập báo cáo kiểm kê của một khu vực bằng cách dán văn bản hoặc chọn tệp CSV hay TSV, phân tích văn bản thành bảng (nhận dấu tab, dấu phẩy hoặc chấm phẩy, có dấu nháy kép), chuyển các ô chỉ gồm chữ số thành số, kiểm tra bằng bộ đọc báo cáo hiện có, và chỉ ghi vào tab báo cáo của khu vực khi không có lỗi. Hệ thống MUST đặt giới hạn kích thước và MUST từ chối tệp quá lớn.

#### Scenario: Dán báo cáo hợp lệ
- **WHEN** chủ sở hữu dán báo cáo đúng cấu trúc cho khu vực HN
- **THEN** tab báo cáo của HN được thay bằng nội dung đó và mô hình tải lại

#### Scenario: Báo cáo thiếu cột
- **WHEN** văn bản dán không có cột "SL chuyển kho"
- **THEN** hệ thống từ chối, nêu cột còn thiếu và tab báo cáo giữ nguyên

#### Scenario: Báo cáo quá lớn
- **WHEN** văn bản vượt giới hạn số dòng hoặc số ký tự
- **THEN** hệ thống từ chối và nêu giới hạn

#### Scenario: Khu vực không có trong cấu hình
- **WHEN** giao diện gửi một mã khu vực không có trong cấu hình
- **THEN** hệ thống từ chối và không ghi tab nào

### Requirement: Khôi phục mặc định
Hệ thống SHALL cho khôi phục giá trị mặc định chỉ với bốn bảng có mặc định đã quy định (tham số, bậc, bậc thang, chỉ số) và MUST NOT đổi các bảng còn lại.

#### Scenario: Khôi phục bảng bậc
- **WHEN** chủ sở hữu xác nhận khôi phục mặc định cho bảng bậc
- **THEN** tab bảng bậc chứa năm bậc mặc định và các tab khác không đổi

#### Scenario: Bảng không có mặc định
- **WHEN** giao diện yêu cầu khôi phục mặc định cho bảng thành viên
- **THEN** hệ thống từ chối vì bảng này không có giá trị mặc định
