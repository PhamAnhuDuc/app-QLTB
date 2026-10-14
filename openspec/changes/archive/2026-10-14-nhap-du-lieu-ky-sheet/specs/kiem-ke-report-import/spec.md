# Spec Delta

## Purpose

Đọc báo cáo kiểm kê nhập-xuất-tồn được dán vào Google Sheet thành dữ liệu xuất bán và chuyển kho theo khu vực cho lõi tính, chỉ lấy những trường cần cho point và báo lỗi rõ khi cấu trúc báo cáo không như mong đợi.

## ADDED Requirements

### Requirement: Mỗi khu vực có một tab báo cáo kiểm kê
Hệ thống SHALL đọc báo cáo kiểm kê của mỗi khu vực từ đúng một tab do cấu hình chỉ định cho khu vực đó, và MUST xác định khu vực theo tab, không suy ra từ nội dung báo cáo.

#### Scenario: Báo cáo theo khu vực
- **WHEN** cấu hình có hai khu vực, mỗi khu vực trỏ tới một tab báo cáo khác nhau
- **THEN** dữ liệu đọc từ tab thứ nhất thuộc khu vực thứ nhất và dữ liệu từ tab thứ hai thuộc khu vực thứ hai

#### Scenario: Thiếu tab của một khu vực
- **WHEN** cấu hình chỉ định một tab báo cáo nhưng Sheet không có tab đó
- **THEN** hệ thống coi báo cáo của khu vực đó là thiếu (không phải 0 dòng) và nêu tên tab cần có

### Requirement: Nhận diện cột theo tên
Hệ thống SHALL tìm các cột "Mã hàng", "SL bán ra trong kỳ" và "SL chuyển kho" theo nội dung tiêu đề (không phân biệt hoa/thường và khoảng trắng thừa) trong phần đầu của tab, kể cả khi tiêu đề trải trên hai dòng, và MUST NOT dựa vào vị trí cột hay số dòng cố định.

#### Scenario: Cột nằm ở vị trí khác
- **WHEN** báo cáo có thêm hoặc bớt một cột phía trước nên các cột cần dùng dịch chỗ
- **THEN** hệ thống vẫn đọc đúng cột nhờ tên tiêu đề

#### Scenario: Tiêu đề hai tầng
- **WHEN** "SL bán ra trong kỳ" nằm ở dòng tiêu đề thứ hai bên dưới một nhóm cột "Xuất trong kỳ"
- **THEN** hệ thống ghép đúng cột dữ liệu theo vị trí ngang của tiêu đề dòng thứ hai

#### Scenario: Thiếu cột bắt buộc
- **WHEN** không tìm thấy một trong ba cột bắt buộc
- **THEN** hệ thống báo lỗi nêu tên cột còn thiếu và tab, và không đoán cột nào khác thay thế

### Requirement: Chỉ lấy các trường cần cho point
Hệ thống SHALL chỉ giữ mã hàng, tên hàng (chỉ để hiển thị), số lượng bán ra và số lượng chuyển kho của mỗi dòng. Hệ thống MUST NOT đưa giá bán, giá vốn, giá trị tồn hay các cột còn lại của báo cáo vào dữ liệu kỳ, kết quả hay log.

#### Scenario: Cột giá bị bỏ
- **WHEN** báo cáo có cột giá bán và các cột giá trị tồn kho
- **THEN** dữ liệu kỳ sinh ra không chứa các cột đó

### Requirement: Khoảng ngày của báo cáo
Hệ thống SHALL đọc khoảng ngày từ dòng mô tả dạng "Từ ngày: dd/mm/yyyy đến ngày: dd/mm/yyyy" ở phần đầu tab và chuyển thành ngày dạng năm-tháng-ngày. Nếu không tìm thấy hoặc không hợp lệ, hệ thống MUST để trống khoảng ngày để lõi cảnh báo, thay vì đoán.

#### Scenario: Đọc khoảng ngày
- **WHEN** phần đầu báo cáo ghi "Từ ngày: 01/10/2026 đến ngày: 14/10/2026"
- **THEN** khoảng ngày đọc được là 2026-10-01 đến 2026-10-14

#### Scenario: Không có dòng ngày
- **WHEN** phần đầu báo cáo không có dòng khoảng ngày
- **THEN** khoảng ngày để trống và hệ thống cảnh báo báo cáo không ghi ngày

#### Scenario: Ngày không tồn tại
- **WHEN** dòng ngày ghi "31/02/2026"
- **THEN** hệ thống coi là không hợp lệ, để trống khoảng ngày và cảnh báo

### Requirement: Dòng dữ liệu và dòng không phải dữ liệu
Hệ thống SHALL đọc các dòng nằm sau phần tiêu đề làm dòng sản phẩm, bỏ qua dòng "Tổng" và dòng chân bảng dạng "Tổng số dòng : N", và MUST giữ dòng sản phẩm không có mã hàng để lõi quyết định cảnh báo.

#### Scenario: Bỏ dòng tổng
- **WHEN** báo cáo có một dòng "Tổng" phía trên dữ liệu và một dòng "Tổng số dòng : 3" phía dưới
- **THEN** hai dòng đó không được tính là sản phẩm

#### Scenario: Dòng thiếu mã
- **WHEN** một dòng sản phẩm có tên hàng nhưng ô mã hàng để trống
- **THEN** dòng vẫn được giữ với mã trống để lõi cảnh báo "dòng thiếu mã"

### Requirement: Kiểm tra số dòng với chân bảng
Hệ thống SHALL so số dòng sản phẩm đọc được với số N trong dòng chân bảng "Tổng số dòng : N" khi dòng đó có mặt, và cảnh báo khi hai số khác nhau để phát hiện dòng bị bỏ sót khi dán.

#### Scenario: Dán thiếu dòng
- **WHEN** chân bảng ghi "Tổng số dòng : 164" nhưng chỉ đọc được 150 dòng sản phẩm
- **THEN** hệ thống cảnh báo thiếu 14 dòng và vẫn trả dữ liệu đã đọc, đồng thời không coi báo cáo là đủ

### Requirement: Giá trị số của báo cáo
Hệ thống SHALL coi ô trống ở cột số lượng là 0, nhận số thật không âm, và MUST báo lỗi nêu tab và dòng khi ô số lượng chứa chữ hoặc số âm. Hệ thống MUST NOT tự suy luận định dạng chuỗi số (dấu phân cách nghìn hay thập phân).

#### Scenario: Ô số lượng chứa chữ
- **WHEN** ô "SL bán ra trong kỳ" của một dòng chứa "mười"
- **THEN** hệ thống báo lỗi nêu tab, dòng và tên cột, và không cộng dòng đó

#### Scenario: Ô số lượng trống
- **WHEN** ô "SL chuyển kho" của một dòng để trống
- **THEN** giá trị được đọc là 0

#### Scenario: Số âm
- **WHEN** ô "SL bán ra trong kỳ" chứa -5
- **THEN** hệ thống báo lỗi nêu tab và dòng

### Requirement: Báo cáo rỗng hoặc không nhận ra
Hệ thống SHALL báo lỗi khi tab báo cáo không có dòng sản phẩm nào hoặc không có dòng tiêu đề nhận ra được, và MUST NOT coi đó là một báo cáo hợp lệ với toàn số 0.

#### Scenario: Tab trống
- **WHEN** tab báo cáo của một khu vực không có dữ liệu
- **THEN** hệ thống báo lỗi "báo cáo trống" cho khu vực đó và quỹ xuất bán/chuyển kho khu vực đó là thiếu
