# Spec Delta

## Purpose

Chạy lõi tính từ Google Sheet theo yêu cầu của chủ sở hữu và ghi kết quả, lỗi, cảnh báo ra tab riêng mà không đụng đến dữ liệu đầu vào, không gửi gì ra ngoài và không để lộ dữ liệu nhạy cảm.

## ADDED Requirements

### Requirement: Chỉ tính khi chủ sở hữu yêu cầu
Hệ thống SHALL chỉ chạy tính khi chủ sở hữu chọn lệnh trong menu của Sheet, và MUST NOT tự chạy khi mở Sheet, khi dữ liệu đổi hay theo lịch.

#### Scenario: Mở Sheet
- **WHEN** chủ sở hữu mở Sheet
- **THEN** chỉ có menu được thêm vào, không có phép tính nào chạy và không có tab nào bị ghi

### Requirement: Ghi kết quả chỉ vào tab kết quả
Hệ thống SHALL ghi kết quả vào tab "Kết quả" (tạo nếu chưa có) và làm mới toàn bộ nội dung tab đó mỗi lần tính. Hệ thống MUST NOT ghi, sửa hay xoá bất kỳ ô nào ở các tab cấu hình, tab báo cáo kiểm kê và các tab nhập tay.

#### Scenario: Tính lại
- **WHEN** chủ sở hữu chạy tính lần thứ hai
- **THEN** tab kết quả chỉ chứa kết quả của lần tính mới nhất và các tab đầu vào không đổi một ô nào

#### Scenario: Tên tab kết quả trùng tab đầu vào
- **WHEN** cấu hình đặt tên tab kết quả trùng với một tab đầu vào
- **THEN** hệ thống từ chối ghi và báo lỗi

### Requirement: Nội dung tab kết quả
Hệ thống SHALL ghi nhãn "Đề xuất – chờ duyệt", kỳ, trạng thái đủ dữ liệu, thời điểm tính, bảng thành viên chia theo nhóm với các khoản tiền, dòng tổng từng nhóm và tổng team kèm ghi chú "cộng của N/M người", danh sách lỗi, danh sách cảnh báo và bảng đối soát. Giá trị chưa tính MUST hiển thị là "—" hoặc ô trống, không bao giờ là 0.

#### Scenario: Người chưa đủ dữ liệu
- **WHEN** một thành viên thiếu key metrics
- **THEN** các ô thu nhập của người đó hiện "—" và cột trạng thái ghi lý do, không có số 0

#### Scenario: Chặn toàn bộ do lỗi cấu hình
- **WHEN** lõi báo lỗi cấu hình chặn toàn bộ
- **THEN** tab kết quả chỉ ghi danh sách lỗi và nhãn, không có bảng thành viên

#### Scenario: Đối soát
- **WHEN** một nguồn point lệch quỹ
- **THEN** bảng đối soát ghi nguồn, khu vực, quỹ, phần đã chia và độ lệch

### Requirement: Giải thích từng bước
Hệ thống SHALL ghi vào tab "Giải thích" từng bước tính của mỗi thành viên (point từng nguồn, Min–Max, point vượt, %HT từng chỉ số, điểm, thưởng, phụ cấp, thu nhập hoặc lý do chưa tính) để chủ sở hữu tự kiểm lại bằng tay.

#### Scenario: Xem giải thích
- **WHEN** chủ sở hữu mở tab giải thích
- **THEN** mỗi thành viên có các dòng bước tính theo đúng thứ tự tính

### Requirement: Văn bản từ dữ liệu không được hiểu thành công thức
Hệ thống SHALL ghi mọi chuỗi có nguồn từ dữ liệu người dùng hoặc báo cáo (mã hàng, tên, thông điệp lỗi) ở dạng văn bản. Chuỗi bắt đầu bằng "=", "+", "-" hoặc "@" MUST được vô hiệu hoá để Sheet không đánh giá nó như công thức.

#### Scenario: Mã hàng bắt đầu bằng dấu bằng
- **WHEN** một thông điệp lỗi chứa mã hàng "=HYPERLINK(...)" ở đầu chuỗi ghi ra
- **THEN** ô được ghi như văn bản thuần và không thành công thức

### Requirement: Kiểm tra chia sẻ Sheet
Hệ thống SHALL kiểm tra mức chia sẻ của Sheet trước khi ghi kết quả. Nếu Sheet chia sẻ cho bất kỳ ai có liên kết, hay cho cả tên miền, hệ thống MUST từ chối tính và báo cách khắc phục. Nếu Sheet được chia sẻ cho người cụ thể khác chủ sở hữu, hệ thống SHALL cảnh báo nhưng vẫn tính.

#### Scenario: Chia sẻ rộng
- **WHEN** Sheet được chia sẻ cho "bất kỳ ai có liên kết"
- **THEN** hệ thống từ chối tính, không ghi kết quả, và báo cần đổi về Riêng tư

#### Scenario: Chia sẻ cho người cụ thể
- **WHEN** Sheet được chia sẻ cho thêm một người cụ thể
- **THEN** hệ thống cảnh báo trong tab kết quả nhưng vẫn tính

#### Scenario: Không kiểm tra được
- **WHEN** hệ thống không đọc được mức chia sẻ (thiếu quyền)
- **THEN** hệ thống từ chối tính và báo cần cấp quyền, thay vì coi như an toàn

### Requirement: Không gửi dữ liệu ra ngoài
Hệ thống MUST NOT gửi thư, gọi địa chỉ bên ngoài, ghi sang Sheet hay tệp khác, hoặc thực hiện bất kỳ hành động nào dựa trên kết quả. Hệ thống MUST NOT thêm thư viện hay dịch vụ bên ngoài.

#### Scenario: Sau khi tính
- **WHEN** phép tính hoàn tất
- **THEN** kết quả chỉ nằm trong các tab của Sheet này và không có thông báo, thư hay yêu cầu mạng nào được gửi đi

### Requirement: Nhật ký không chứa dữ liệu nhạy cảm
Hệ thống SHALL thêm vào tab "Nhật ký" các dòng do lõi tạo (thời điểm, mức, loại lỗi, trường liên quan, phạm vi) mỗi lần tính và MUST NOT ghi tên, tài khoản, số lương, thu nhập, mã hàng, nội dung nhật ký công việc hay giá trị trong báo cáo kiểm kê.

#### Scenario: Lỗi mã hàng lạ
- **WHEN** lần tính gặp mã hàng chưa có trong bảng quy đổi
- **THEN** tab nhật ký ghi loại lỗi và phạm vi nhưng không ghi mã hàng đó

#### Scenario: Tính thành công
- **WHEN** lần tính không có lỗi
- **THEN** nhật ký không chứa số tiền nào của kết quả
