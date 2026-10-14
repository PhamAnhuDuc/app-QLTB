# income-config Specification

## Purpose

Quản lý toàn bộ tham số tính point và thu nhập ở một nơi duy nhất, sửa được mà không đổi code, để mọi kết quả tính đều truy ngược được về cấu hình đang áp dụng.

## Requirements

### Requirement: Mọi tham số tính phải cấu hình được
Hệ thống SHALL lấy bảng bậc, bậc thang thưởng key metrics, đơn giá point, mức phụ cấp, hệ số hỗ trợ sale, point mỗi ca bảo hành, bảng quy đổi công việc, hệ số chia và danh sách thành viên từ cấu hình. Hệ thống MUST NOT hardcode các giá trị này trong công thức.

#### Scenario: Đổi đơn giá point
- **WHEN** chủ sở hữu đổi đơn giá point từ 50.000đ sang một giá trị khác và tính lại kỳ chưa duyệt
- **THEN** thưởng vượt point của mọi thành viên đổi theo đơn giá mới mà không cần sửa code

#### Scenario: Thiếu tham số bắt buộc
- **WHEN** cấu hình thiếu một tham số bắt buộc (ví dụ đơn giá point để trống)
- **THEN** hệ thống từ chối tính và nêu rõ tên tham số còn thiếu

### Requirement: Bảng bậc
Hệ thống SHALL lưu cho mỗi bậc một lương cố định, một point Min và một point Max, với Min nhỏ hơn Max. Giá trị mặc định ban đầu là lương cố định 6.000.000 / 7.500.000 / 8.500.000 / 10.000.000 / 12.000.000 đồng và Min–Max 120–150 / 150–200 / 200–250 / 250–300 / 300–350 cho bậc 1 đến 5.

#### Scenario: Min không nhỏ hơn Max
- **WHEN** chủ sở hữu lưu một bậc có Min lớn hơn hoặc bằng Max
- **THEN** hệ thống từ chối lưu và báo bậc bị lỗi

### Requirement: Bậc thang thưởng key metrics
Hệ thống SHALL lưu bậc thang gồm các ngưỡng theo điểm key metrics và % thưởng tương ứng, với các khoảng không chồng lấn và phủ kín từ 0. Giá trị mặc định: không vượt 70% là 0%, trên 70% đến 80% là 15%, trên 80% đến 90% là 20%, trên 90% đến 100% là 25%, trên 100% là 35%.

#### Scenario: Khoảng ngưỡng chồng lấn hoặc hở
- **WHEN** chủ sở hữu lưu bậc thang có hai khoảng chồng nhau hoặc có khoảng không thuộc bậc nào
- **THEN** hệ thống từ chối lưu và chỉ ra khoảng lỗi

### Requirement: Bảng quy đổi công việc có hai cột point
Hệ thống SHALL lưu bảng quy đổi cho mỗi nhóm thiết bị một point cho xuất bán và một point cho chuyển kho, mỗi mã hàng thuộc đúng một nhóm, và mỗi loại công việc của nhật ký quản lý kho một hệ số point. Hệ thống MUST so khớp tên nhóm và mã hàng không phân biệt chữ hoa/chữ thường.

#### Scenario: Tên nhóm khác chữ hoa/thường
- **WHEN** nhóm của một mã hàng ghi là "MBH cầm tay" trong danh mục và "MBH Cầm tay" trong bảng point
- **THEN** hệ thống coi là cùng một nhóm và dùng point của nhóm đó

#### Scenario: Mã hàng trùng
- **WHEN** bảng quy đổi có hai dòng cùng mã hàng (không phân biệt hoa/thường)
- **THEN** hệ thống báo mã trùng và yêu cầu sửa trước khi tính

### Requirement: Hệ số chia point theo nguồn, khu vực và người
Hệ thống SHALL lưu hệ số chia point theo ba chiều: nguồn point (xuất bán/chuyển kho, bảo hành, hỗ trợ sale), khu vực (Hà Nội, TP.HCM) và thành viên. Hệ số là cố định cho đến khi chủ sở hữu sửa, và tổng hệ số của mỗi nguồn trong mỗi khu vực MUST bằng 1.

#### Scenario: Tổng hệ số khác 1
- **WHEN** tổng hệ số chia của nguồn bảo hành ở một khu vực khác 1
- **THEN** hệ thống từ chối tính nguồn đó và báo khu vực, nguồn và tổng hiện tại

#### Scenario: Thành viên không có hệ số
- **WHEN** một thành viên không có hệ số ở một nguồn
- **THEN** thành viên đó không nhận point từ nguồn đó và không bị báo lỗi

### Requirement: Danh sách thành viên
Hệ thống SHALL lưu mỗi thành viên với tài khoản làm khoá định danh duy nhất, tên hiển thị, bậc, khu vực, nhóm, cờ dùng máy tính cá nhân, lương cố định ghi đè (tuỳ chọn), tập chỉ số key metrics áp dụng và tỷ trọng của từng chỉ số. Ghi đè lương cố định MUST chỉ thay lương cố định, không đổi Min và Max của bậc.

#### Scenario: Tài khoản trùng
- **WHEN** hai thành viên có cùng tài khoản (không phân biệt hoa/thường)
- **THEN** hệ thống từ chối lưu và báo tài khoản trùng

#### Scenario: Ghi đè lương cố định
- **WHEN** thành viên có lương cố định ghi đè khác giá trị chuẩn của bậc
- **THEN** hệ thống dùng giá trị ghi đè để tính và đánh dấu "lương cố định đã ghi đè" để cảnh báo, không chặn tính

### Requirement: Tỷ trọng key metrics theo từng người
Hệ thống SHALL cho phép mỗi thành viên có một tập chỉ số key metrics riêng (tập con của vòng quay HTK, tỷ lệ bảo hành, tỷ lệ hài lòng thiết bị, hoàn thành doanh thu) với tỷ trọng riêng, và tổng tỷ trọng của một thành viên MUST bằng 100%.

#### Scenario: Tổng tỷ trọng khác 100%
- **WHEN** tổng tỷ trọng của một thành viên khác 100%
- **THEN** hệ thống từ chối tính key metrics cho thành viên đó và báo tổng hiện tại

### Requirement: Dữ liệu cấu hình và ví dụ không chứa dữ liệu thật
Tài liệu spec, dữ liệu mẫu và bộ test MUST dùng dữ liệu giả. Hệ thống MUST NOT ghi lương, thu nhập hay thông tin nhân sự vào log.

#### Scenario: Ghi log lỗi
- **WHEN** hệ thống ghi một lỗi tính toán
- **THEN** log chỉ chứa loại lỗi, trường thiếu và thời điểm, không chứa số lương hoặc thu nhập
