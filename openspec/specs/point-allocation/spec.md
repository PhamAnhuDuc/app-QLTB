# point-allocation Specification

## Purpose

Tính point hằng kỳ từ bốn nguồn công việc và chia quỹ point theo khu vực cho từng thành viên, kèm đối soát để phát hiện lệch giữa quỹ và phần đã chia.

## Requirements

### Requirement: Quỹ point xuất bán và chuyển kho theo khu vực
Hệ thống SHALL tính quỹ point xuất bán/chuyển kho của mỗi khu vực bằng tổng, qua mọi mã hàng có phát sinh, của (số lượng bán ra × point xuất bán của nhóm) cộng (số lượng chuyển kho × point chuyển kho của nhóm). Nhóm của mã hàng lấy từ bảng quy đổi.

#### Scenario: Tính quỹ khu vực
- **WHEN** khu vực Hà Nội có mã A (nhóm "Thiết bị BH", bán ra 10, chuyển kho 5) và point xuất bán 0,3 và point chuyển kho 0,33 cho nhóm đó
- **THEN** point của mã A là 10 × 0,3 + 5 × 0,33 = 4,65 và được cộng vào quỹ khu vực Hà Nội

#### Scenario: Xuất bán và chuyển kho có point khác nhau
- **WHEN** một nhóm có point xuất bán khác point chuyển kho
- **THEN** hệ thống dùng đúng point của từng loại, không dùng một point chung

### Requirement: Mã hàng chưa có trong bảng quy đổi
Hệ thống MUST NOT bỏ qua im lặng mã hàng có phát sinh nhưng không có trong bảng quy đổi, hoặc có nhóm chưa có point. Hệ thống SHALL báo lỗi nêu rõ mã hàng, khu vực và số lượng, và không tính quỹ của khu vực đó cho đến khi được xử lý.

#### Scenario: Mã hàng lạ
- **WHEN** dữ liệu xuất bán có mã "ABC-999" với số lượng 3 và mã này không có trong bảng quy đổi
- **THEN** hệ thống báo lỗi "mã ABC-999 chưa có trong bảng quy đổi" kèm khu vực và số lượng, và không đưa kết quả của khu vực đó ra như đã tính xong

#### Scenario: Mã hàng không phát sinh
- **WHEN** mã hàng có số lượng bán ra và chuyển kho đều bằng 0 và không có trong bảng quy đổi
- **THEN** hệ thống không báo lỗi cho mã đó

### Requirement: Dòng dữ liệu thiếu mã hàng
Hệ thống SHALL báo cảnh báo khi một dòng dữ liệu kiểm kê có số lượng phát sinh nhưng không có mã hàng, và MUST NOT tính point cho dòng đó.

#### Scenario: Dòng demo không có mã
- **WHEN** dòng "Máy bán hàng … - Demo" không có mã hàng và có số lượng bán ra lớn hơn 0
- **THEN** hệ thống cảnh báo dòng thiếu mã và không cộng point của dòng đó vào quỹ

### Requirement: Khoảng ngày báo cáo khớp kỳ
Hệ thống SHALL kiểm tra khoảng ngày ghi trong báo cáo kiểm kê khớp trọn kỳ đang tính (từ ngày đầu đến ngày cuối của tháng) và cảnh báo khi báo cáo chỉ phủ một phần kỳ.

#### Scenario: Báo cáo chỉ phủ một phần tháng
- **WHEN** kỳ là tháng 10 nhưng báo cáo ghi từ 01/10 đến 14/10
- **THEN** hệ thống cảnh báo báo cáo chưa phủ hết kỳ và yêu cầu chủ sở hữu xác nhận trước khi dùng

### Requirement: Point bảo hành và hỗ trợ sale
Hệ thống SHALL tính quỹ point bảo hành của mỗi khu vực bằng số ca bảo hành × point mỗi ca, và quỹ point hỗ trợ sale bằng số đơn × hệ số hỗ trợ sale, với cả hai tham số lấy từ cấu hình. Số ca và số đơn MUST là số không âm do chủ sở hữu nhập.

#### Scenario: Tính quỹ bảo hành và hỗ trợ sale
- **WHEN** khu vực TP.HCM có 20 ca bảo hành (1 point/ca) và 100 đơn hỗ trợ sale (0,17/đơn)
- **THEN** quỹ bảo hành là 20 và quỹ hỗ trợ sale là 17

#### Scenario: Số ca âm
- **WHEN** chủ sở hữu nhập số ca bảo hành là -3
- **THEN** hệ thống từ chối giá trị và báo lỗi

### Requirement: Quản lý kho là nhật ký công việc cá nhân
Hệ thống SHALL tính point quản lý kho của mỗi thành viên bằng tổng, qua các dòng nhật ký của người đó, của (số lượng × hệ số của loại công việc trong bảng quy đổi). Mỗi dòng nhật ký gồm tài khoản, loại công việc, mô tả và số lượng. Hệ số riêng đã cấu hình cho loại công việc (ví dụ quản lý sale admin tỉnh) MUST được dùng.

#### Scenario: Cộng nhật ký theo người
- **WHEN** tài khoản "user1" có hai dòng: loại "Kiểm kho" hệ số 0,5 số lượng 10, và loại "Đầu mối 360" hệ số 1 số lượng 4
- **THEN** point quản lý kho của user1 là 5 + 4 = 9

#### Scenario: Loại công việc không có hệ số
- **WHEN** một dòng nhật ký có loại công việc không có trong bảng quy đổi
- **THEN** hệ thống báo lỗi nêu rõ dòng và loại công việc, không coi hệ số là 0 một cách im lặng

#### Scenario: Tài khoản không có trong danh sách
- **WHEN** một dòng nhật ký có tài khoản không thuộc danh sách thành viên
- **THEN** hệ thống báo lỗi nêu tài khoản đó

### Requirement: Chia quỹ theo hệ số
Hệ thống SHALL chia quỹ point của mỗi nguồn trong mỗi khu vực cho từng thành viên bằng quỹ × hệ số của thành viên ở nguồn và khu vực đó. Tổng point thành viên có từ các nguồn cộng với point quản lý kho là point tổng của thành viên.

#### Scenario: Chia theo hệ số
- **WHEN** quỹ xuất bán/chuyển kho khu vực Hà Nội là 100 và hai thành viên có hệ số 0,6 và 0,4
- **THEN** họ nhận lần lượt 60 và 40 point từ nguồn này

#### Scenario: Cộng bốn nguồn
- **WHEN** một thành viên nhận 60 từ xuất bán/chuyển kho, 14 từ bảo hành, 8 từ hỗ trợ sale và có 9 từ nhật ký quản lý kho
- **THEN** point tổng của thành viên là 91

### Requirement: Đối soát quỹ và phần đã chia
Hệ thống SHALL kiểm tra, với mỗi nguồn và khu vực, tổng point đã chia cho thành viên bằng quỹ (sai số làm tròn không quá 0,01 point), và kiểm tra tổng point quản lý kho của các thành viên bằng tổng nhật ký. Khi lệch, hệ thống MUST báo rõ nguồn, khu vực và độ lệch, và không đánh dấu kỳ là đủ dữ liệu.

#### Scenario: Chia đủ
- **WHEN** hệ số của một nguồn trong một khu vực cộng lại bằng 1
- **THEN** đối soát đạt

#### Scenario: Lệch do giá trị nhập tay
- **WHEN** point quản lý kho của một thành viên bị nhập tay chênh lệch với tổng nhật ký của người đó
- **THEN** đối soát báo lệch kèm độ lệch và tài khoản liên quan

### Requirement: Trạng thái đủ dữ liệu point
Hệ thống SHALL coi point của một thành viên là đủ khi mọi nguồn áp dụng cho thành viên đó đều có số liệu trong kỳ. Ba nguồn có quỹ khu vực áp dụng cho thành viên khi người đó có hệ số ở nguồn đó; nguồn nhật ký quản lý kho áp dụng cho mọi thành viên. Giá trị 0 do người dùng nhập là có số liệu, ô trống là chưa có. Hệ thống MUST phân biệt 0 với trống.

#### Scenario: Có nguồn áp dụng còn trống
- **WHEN** một thành viên có hệ số ở nguồn hỗ trợ sale nhưng chưa có số liệu nguồn đó (ô trống)
- **THEN** point của thành viên là "thiếu" và không được tính như 0

#### Scenario: Nguồn nhập 0
- **WHEN** chủ sở hữu nhập 0 cho nguồn bảo hành của một thành viên có hệ số ở nguồn đó
- **THEN** nguồn đó được coi là có số liệu

#### Scenario: Nguồn không áp dụng
- **WHEN** một thành viên không có hệ số ở nguồn bảo hành
- **THEN** nguồn bảo hành không được tính vào điều kiện đủ dữ liệu của thành viên đó
