# Spec Delta

## MODIFIED Requirements

### Requirement: Ghi kết quả chỉ vào tab kết quả
Hệ thống SHALL ghi kết quả vào tab "Kết quả" (tạo nếu chưa có) và làm mới toàn bộ nội dung tab đó mỗi lần tính. Ngoài các tab đầu ra gồm kết quả, giải thích, nhật ký hệ thống, chỉ mục các kỳ đã chốt và các tab bản sao kỳ, hệ thống MUST NOT ghi, sửa hay xoá bất kỳ ô nào ở các tab cấu hình, tab báo cáo kiểm kê và các tab nhập tay. Việc ghi tab chỉ mục và bản sao kỳ chỉ xảy ra khi chủ sở hữu duyệt hoặc mở lại kỳ.

#### Scenario: Tính lại
- **WHEN** chủ sở hữu chạy tính lần thứ hai
- **THEN** tab kết quả chỉ chứa kết quả của lần tính mới nhất và các tab đầu vào không đổi một ô nào

#### Scenario: Tên tab kết quả trùng tab đầu vào
- **WHEN** cấu hình đặt tên tab kết quả trùng với một tab đầu vào, tab chỉ mục hoặc tab bản sao kỳ
- **THEN** hệ thống từ chối ghi và báo lỗi

#### Scenario: Tính kỳ không đụng tới bản chốt
- **WHEN** chủ sở hữu chạy tính trên một kỳ đã chốt
- **THEN** tab chỉ mục và các tab bản sao kỳ không đổi một ô nào

## ADDED Requirements

### Requirement: Định dạng bảng kết quả
Hệ thống SHALL định dạng tab kết quả để dễ đọc: các cột tiền hiển thị có dấu phân cách nghìn, điểm key metrics và % thưởng hiển thị dạng phần trăm, point hiển thị tối đa hai chữ số thập phân, dòng tiêu đề và dòng tổng in đậm, và độ rộng cột đủ để không cắt tên nhóm và tên thành viên. Định dạng MUST NOT làm đổi giá trị lưu trong ô.

#### Scenario: Cột tiền
- **WHEN** thu nhập một người là 9800000
- **THEN** ô lưu số 9800000 và có định dạng số với dấu phân cách nghìn

#### Scenario: Ô chưa tính
- **WHEN** một ô chưa tính hiện "—"
- **THEN** ô vẫn là chữ "—" và không được định dạng như số

#### Scenario: Định dạng không đụng đầu vào
- **WHEN** hệ thống áp định dạng cho tab kết quả
- **THEN** không tab đầu vào nào bị đổi định dạng hay giá trị
