# period-data-entry Specification

## Purpose

Định nghĩa các bảng nhập tay của một kỳ trong Google Sheet và cách chuyển chúng thành dữ liệu kỳ cho lõi tính, giữ nguyên sự khác nhau giữa ô trống (chưa có số liệu) và số 0 (đã nhập 0).

## Requirements

### Requirement: Kỳ tính được chọn bằng tháng
Hệ thống SHALL xác định kỳ từ một ô tháng dạng năm-tháng và tự suy ra ngày đầu và ngày cuối của tháng, kể cả tháng 2 năm nhuận. Hệ thống MUST NOT cho nhập tay ngày bắt đầu hay ngày kết thúc của kỳ.

#### Scenario: Tháng 2 năm nhuận
- **WHEN** kỳ là 2028-02
- **THEN** ngày đầu là 2028-02-01 và ngày cuối là 2028-02-29

#### Scenario: Chưa chọn tháng
- **WHEN** ô tháng để trống hoặc không đúng dạng năm-tháng
- **THEN** hệ thống từ chối tính và nêu rõ ô cần sửa

### Requirement: Bảng bảo hành và hỗ trợ sale theo khu vực
Hệ thống SHALL đọc số ca bảo hành và số đơn hỗ trợ sale theo từng khu vực có trong cấu hình, trong đó ô trống là chưa có số liệu và số 0 là đã nhập 0.

#### Scenario: Ô trống khác 0
- **WHEN** số đơn hỗ trợ sale của một khu vực để trống và số ca bảo hành của khu vực đó là 0
- **THEN** dữ liệu kỳ coi hỗ trợ sale của khu vực là chưa có và bảo hành là đã nhập 0

#### Scenario: Khu vực không có trong cấu hình
- **WHEN** bảng có một dòng cho khu vực mà cấu hình không khai báo
- **THEN** hệ thống báo lỗi nêu khu vực đó và dòng

#### Scenario: Số không hợp lệ
- **WHEN** ô số ca bảo hành chứa chữ hoặc số âm
- **THEN** hệ thống báo lỗi nêu tab, dòng và cột, và không đổi giá trị đó thành 0

### Requirement: Nhật ký công việc
Hệ thống SHALL đọc nhật ký công việc gồm tài khoản, loại việc, mô tả và số lượng, bỏ qua dòng trống hoàn toàn, và cho chọn loại việc từ danh sách của cấu hình. Mô tả chỉ để người đọc và MUST NOT ảnh hưởng đến tính toán, kết quả hay log.

#### Scenario: Dòng thiếu một phần
- **WHEN** một dòng có tài khoản và số lượng nhưng thiếu loại việc
- **THEN** hệ thống báo lỗi nêu tab và dòng, và không bỏ qua dòng đó âm thầm

#### Scenario: Dòng trống hoàn toàn
- **WHEN** một dòng không có ô nào chứa giá trị
- **THEN** dòng đó được bỏ qua mà không báo lỗi

#### Scenario: Số lượng 0 là có số liệu
- **WHEN** một dòng nhật ký có tài khoản, loại việc và số lượng 0
- **THEN** dòng được giữ với số lượng 0 để thể hiện người đó đã được xác nhận không phát sinh

### Requirement: Mục tiêu và kết quả key metrics
Hệ thống SHALL đọc bảng key metrics gồm chỉ số, cấp độ áp dụng (nhóm, khu vực hoặc tài khoản), khoá của cấp độ đó, mục tiêu và kết quả. Mục tiêu và kết quả trống được giữ là trống. Hệ thống MUST báo lỗi khi cấp độ không thuộc ba giá trị trên hoặc khi cùng một chỉ số, cấp độ và khoá xuất hiện hai lần.

#### Scenario: Cấp độ không hợp lệ
- **WHEN** một dòng ghi cấp độ "phòng ban"
- **THEN** hệ thống báo lỗi nêu dòng và liệt kê ba cấp độ hợp lệ

#### Scenario: Khai báo trùng
- **WHEN** hai dòng cùng chỉ số, cùng cấp độ và cùng khoá
- **THEN** hệ thống báo lỗi nêu cả hai dòng và không chọn bừa một giá trị

#### Scenario: Kết quả để trống
- **WHEN** một dòng có mục tiêu nhưng kết quả để trống
- **THEN** dữ liệu kỳ giữ kết quả là trống để lõi đánh dấu key metrics là thiếu

### Requirement: Xác nhận báo cáo chỉ phủ một phần kỳ
Hệ thống SHALL cho chủ sở hữu xác nhận theo từng khu vực rằng vẫn dùng báo cáo kiểm kê chỉ phủ một phần kỳ, mặc định là chưa xác nhận, và chuyển xác nhận đó cho lõi.

#### Scenario: Mặc định chưa xác nhận
- **WHEN** bảng xác nhận không có dòng nào cho một khu vực
- **THEN** khu vực đó được coi là chưa xác nhận

#### Scenario: Đã xác nhận một khu vực
- **WHEN** chủ sở hữu đánh dấu xác nhận cho khu vực A
- **THEN** chỉ khu vực A được lõi coi là đã xác nhận, khu vực khác thì không

### Requirement: Lắp thành dữ liệu kỳ cho lõi
Hệ thống SHALL lắp các bảng trên cùng báo cáo kiểm kê thành đối tượng dữ liệu kỳ đúng cấu trúc lõi chấp nhận, và MUST gom mọi lỗi đọc dữ liệu thành một danh sách chỉ ra tab và dòng, thay vì dừng ở lỗi đầu tiên.

#### Scenario: Nhiều lỗi cùng lúc
- **WHEN** bảng bảo hành có một ô chữ và nhật ký có một dòng thiếu loại việc
- **THEN** hệ thống trả về cả hai lỗi trong một lần đọc

#### Scenario: Dữ liệu hợp lệ
- **WHEN** mọi bảng hợp lệ
- **THEN** đối tượng dữ liệu kỳ chạy được trực tiếp qua lõi mà không cần chỉnh sửa
