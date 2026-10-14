# Spec Delta

## Purpose

Lưu toàn bộ cấu hình của lõi tính trong các tab của Google Sheet và đọc ngược thành cấu hình lõi dùng được, kiểm tra ngay khi đọc để lỗi cấu hình được chỉ ra đúng tab và dòng.

## ADDED Requirements

### Requirement: Cấu hình nằm trong các tab Cấu hình
Hệ thống SHALL lưu mỗi nhóm cấu hình trong một tab riêng: tham số, bảng bậc, bậc thang thưởng, chỉ số key metrics, nhóm thiết bị và point, mã hàng, việc quản lý kho, hệ số chia, khu vực và tab báo cáo của khu vực, thành viên, tỷ trọng key metrics của thành viên. Tên các tab cấu hình MUST nằm ở một nơi duy nhất trong mã nguồn.

#### Scenario: Đủ các tab
- **WHEN** Sheet có đủ các tab cấu hình
- **THEN** hệ thống đọc được thành một đối tượng cấu hình đúng cấu trúc lõi chấp nhận

#### Scenario: Thiếu một tab cấu hình
- **WHEN** Sheet không có tab hệ số chia
- **THEN** hệ thống báo lỗi nêu tên tab còn thiếu và từ chối tính

### Requirement: Đọc cột theo tiêu đề
Hệ thống SHALL xác định cột của mỗi bảng cấu hình theo tiêu đề cột, không theo thứ tự cột, và MUST báo lỗi nêu tab và tên cột khi thiếu cột bắt buộc.

#### Scenario: Đổi thứ tự cột
- **WHEN** chủ sở hữu đổi thứ tự hai cột trong tab bảng bậc
- **THEN** cấu hình đọc được vẫn đúng giá trị

#### Scenario: Thiếu cột
- **WHEN** tab bảng bậc không có cột "Lương cố định"
- **THEN** hệ thống báo lỗi nêu tab và cột

### Requirement: Kiểu giá trị của ô cấu hình
Hệ thống SHALL nhận ô số là số thật, ô lô-gic là TRUE hoặc FALSE, phần trăm là số thập phân (ô định dạng phần trăm cho giá trị thập phân tương ứng), và MUST báo lỗi nêu tab và dòng khi ô số chứa chữ. Ô ghi đè lương cố định để trống nghĩa là không ghi đè.

#### Scenario: Ô số chứa chữ
- **WHEN** ô đơn giá point chứa "năm mươi nghìn"
- **THEN** hệ thống báo lỗi nêu tab tham số và dòng của tham số đó

#### Scenario: Ghi đè lương cố định trống
- **WHEN** ô ghi đè lương cố định của một thành viên để trống
- **THEN** thành viên đó không bị ghi đè và dùng lương cố định của bậc

#### Scenario: Cờ máy tính cá nhân
- **WHEN** ô "máy tính cá nhân" của một thành viên là TRUE
- **THEN** thành viên đó nhận phụ cấp theo cấu hình

### Requirement: Kiểm tra cấu hình khi đọc
Hệ thống SHALL chạy cùng bộ kiểm tra cấu hình của lõi ngay sau khi đọc và báo mọi lỗi kèm tab, dòng và tên trường khi xác định được, đồng thời giữ nguyên phạm vi chặn của lõi (lỗi cục bộ chỉ chặn phần phụ thuộc).

#### Scenario: Hệ số chia không bằng 1
- **WHEN** tổng hệ số chia bảo hành của một khu vực là 0,9
- **THEN** hệ thống báo lỗi nêu tab hệ số chia, khu vực và tổng hiện tại, và chỉ chặn nguồn bảo hành của khu vực đó

#### Scenario: Tài khoản trùng
- **WHEN** tab thành viên có hai dòng cùng tài khoản
- **THEN** hệ thống báo lỗi nêu hai dòng bị trùng và từ chối tính toàn bộ

### Requirement: Khởi tạo khung cấu hình mặc định
Hệ thống SHALL có một lệnh khởi tạo tạo các tab cấu hình còn thiếu cùng giá trị mặc định đã quy định (đơn giá point, phụ cấp, hệ số hỗ trợ sale, point mỗi ca bảo hành, hệ số Min, trần doanh thu, sai số đối soát, bảng bậc và bậc thang). Lệnh MUST NOT ghi đè hay xoá bất kỳ tab nào đã có.

#### Scenario: Sheet mới
- **WHEN** chạy lệnh khởi tạo trên Sheet chưa có tab cấu hình
- **THEN** các tab cấu hình được tạo với giá trị mặc định và chưa có thành viên nào

#### Scenario: Tab đã có dữ liệu
- **WHEN** chạy lệnh khởi tạo khi tab bảng bậc đã có dữ liệu do chủ sở hữu nhập
- **THEN** tab bảng bậc giữ nguyên, chỉ các tab còn thiếu được tạo

### Requirement: Dữ liệu cấu hình thật không đi vào mã nguồn
Mã nguồn, dữ liệu mẫu và bộ test MUST NOT chứa tên, tài khoản, lương hay số liệu thật. Khung mặc định chỉ chứa các giá trị chính sách đã quy định và không có thành viên.

#### Scenario: Khung mặc định
- **WHEN** lệnh khởi tạo tạo tab thành viên
- **THEN** tab chỉ có dòng tiêu đề, không có người nào
