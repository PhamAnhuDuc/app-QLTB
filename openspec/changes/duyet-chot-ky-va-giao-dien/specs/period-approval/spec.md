# Spec Delta

## Purpose

Cho chủ sở hữu duyệt một kỳ để chuyển kết quả đề xuất thành bản chính thức đóng băng, giữ dấu vết mọi lần chốt và mở lại, để số của kỳ đã chốt không đổi dù cấu hình hay dữ liệu về sau bị sửa.

## ADDED Requirements

### Requirement: Duyệt và chốt kỳ trong một bước
Hệ thống SHALL coi "Xác nhận duyệt" là việc chốt kỳ: một thao tác duy nhất tính lại kỳ từ dữ liệu hiện tại, lưu bản sao kỳ và ghi vào chỉ mục. Hệ thống MUST NOT dùng nội dung đang hiển thị ở tab kết quả làm nguồn để chốt.

#### Scenario: Chốt dùng dữ liệu hiện tại
- **WHEN** chủ sở hữu sửa một ô nhập tay sau lần tính gần nhất rồi bấm duyệt
- **THEN** bản chốt phản ánh dữ liệu đã sửa chứ không phải kết quả cũ trong tab kết quả

### Requirement: Điều kiện chặn duyệt
Hệ thống SHALL từ chối duyệt và nêu rõ lý do khi xảy ra bất kỳ điều nào: cấu hình hay kỳ bị lỗi chặn toàn bộ, đối soát point lệch, không có thành viên nào tính được, Sheet đang chia sẻ rộng hoặc không đọc được mức chia sẻ, hoặc kỳ này đã được chốt và chưa mở lại.

#### Scenario: Đối soát lệch
- **WHEN** bảng đối soát có một nguồn lệch quỹ
- **THEN** hệ thống từ chối duyệt, nêu nguồn và khu vực lệch, và không tạo bản sao

#### Scenario: Không ai tính được
- **WHEN** mọi thành viên đều chưa tính được
- **THEN** hệ thống từ chối duyệt vì không có kết quả nào để chốt

#### Scenario: Chia sẻ rộng
- **WHEN** Sheet đang chia sẻ cho bất kỳ ai có liên kết
- **THEN** hệ thống từ chối duyệt và không ghi gì

#### Scenario: Kỳ đã chốt
- **WHEN** kỳ hiện tại đã có bản chốt đang hiệu lực
- **THEN** hệ thống từ chối duyệt lần nữa và chỉ dẫn dùng "Mở lại kỳ"

### Requirement: Xác nhận từng người chưa tính
Khi có thành viên chưa tính được, hệ thống SHALL yêu cầu chủ sở hữu xác nhận bỏ qua **từng người** trước khi chốt, và MUST từ chối nếu thiếu xác nhận của bất kỳ người nào, nêu tài khoản những người còn thiếu. Người chỉ theo dõi point không cần xác nhận. Người được xác nhận bỏ qua MUST được ghi trong bản chốt và không nằm trong tổng đã duyệt.

#### Scenario: Thiếu xác nhận
- **WHEN** hai thành viên chưa tính được và chủ sở hữu chỉ xác nhận một người
- **THEN** hệ thống từ chối chốt và nêu tài khoản người còn lại

#### Scenario: Xác nhận đủ
- **WHEN** chủ sở hữu xác nhận bỏ qua cả hai người
- **THEN** kỳ được chốt, tổng chỉ gồm những người đã tính, và bản chốt ghi tài khoản hai người bị bỏ qua

#### Scenario: Chỉ theo dõi point
- **WHEN** một thành viên chỉ theo dõi point và mọi người khác đã tính được
- **THEN** hệ thống chốt mà không đòi xác nhận nào

### Requirement: Bản sao đóng băng của kỳ
Hệ thống SHALL lưu bản sao kỳ vào một tab riêng tên `Chot_<kỳ>` gồm siêu dữ liệu (kỳ, thời điểm chốt, người bị bỏ qua), bảng kết quả đã duyệt, và toàn bộ cấu hình cùng dữ liệu kỳ đã dùng để tính, được chia thành các đoạn không quá 40.000 ký tự mỗi ô, kèm dấu vân tay của nội dung. Tab MUST được bảo vệ ở chế độ cảnh báo khi sửa.

#### Scenario: Cấu hình đổi sau khi chốt
- **WHEN** chủ sở hữu đổi đơn giá point sau khi chốt kỳ 2026-09
- **THEN** bản sao `Chot_2026-09` vẫn giữ nguyên đơn giá và các số đã duyệt

#### Scenario: Dữ liệu lớn
- **WHEN** dữ liệu đã dùng có độ dài vượt 40.000 ký tự
- **THEN** hệ thống chia thành nhiều ô và đọc ghép lại được nguyên vẹn

### Requirement: Kiểm tra toàn vẹn bản chốt
Khi đọc bản chốt, hệ thống SHALL tính lại dấu vân tay và so với giá trị đã lưu, và MUST cảnh báo rõ khi hai giá trị khác nhau thay vì coi bản chốt là đáng tin.

#### Scenario: Bản chốt bị sửa tay
- **WHEN** một ô dữ liệu trong tab bản sao bị sửa
- **THEN** hệ thống cảnh báo "bản chốt đã bị sửa" khi đọc nó

### Requirement: Chỉ mục các kỳ đã chốt
Hệ thống SHALL ghi vào tab `KyDaChot` một dòng cho mỗi lần chốt hoặc mở lại gồm kỳ, trạng thái (Đã chốt hoặc Đã mở lại), thời điểm, tổng thu nhập đã duyệt, số người đã tính, số người bỏ qua, tên tab bản sao và lý do (khi mở lại). Trạng thái hiệu lực của một kỳ là trạng thái của dòng mới nhất của kỳ đó.

#### Scenario: Hai sự kiện của một kỳ
- **WHEN** kỳ 2026-09 được chốt rồi mở lại
- **THEN** chỉ mục có hai dòng của kỳ đó và trạng thái hiệu lực là Đã mở lại

### Requirement: Tính kỳ trên kỳ đã chốt
Hệ thống SHALL vẫn cho chạy "Tính kỳ" trên kỳ đã chốt nhưng MUST cảnh báo rằng kỳ đã chốt, so sánh thu nhập từng người với bản chốt và nêu số người khác nhau, và MUST NOT thay đổi bản chốt hay chỉ mục.

#### Scenario: Tính lại giống bản chốt
- **WHEN** dữ liệu không đổi kể từ lúc chốt
- **THEN** cảnh báo cho biết kết quả giống bản chốt

#### Scenario: Tính lại khác bản chốt
- **WHEN** một ô nhập tay đã đổi sau khi chốt làm thu nhập hai người khác bản chốt
- **THEN** cảnh báo nêu hai người khác nhau và bản chốt vẫn nguyên

### Requirement: Mở lại kỳ có lý do và dấu vết
Hệ thống SHALL chỉ cho mở lại một kỳ đang ở trạng thái Đã chốt và MUST yêu cầu lý do không rỗng. Khi mở lại, hệ thống SHALL giữ bản chốt cũ bằng cách đổi tên tab bản sao thành tên có hậu tố đánh số, ghi dòng "Đã mở lại" vào chỉ mục, và cho phép chốt lại kỳ. Hệ thống MUST NOT xoá bản chốt cũ.

#### Scenario: Mở lại không có lý do
- **WHEN** chủ sở hữu mở lại kỳ mà để trống lý do
- **THEN** hệ thống từ chối và không đổi gì

#### Scenario: Mở lại rồi chốt lại
- **WHEN** kỳ 2026-09 đã chốt được mở lại với lý do hợp lệ rồi chốt lần nữa
- **THEN** tab bản chốt cũ còn nguyên dưới tên có hậu tố, tab `Chot_2026-09` là bản mới, và chỉ mục có ba dòng của kỳ đó

#### Scenario: Mở lại kỳ chưa chốt
- **WHEN** chủ sở hữu mở lại kỳ chưa từng chốt
- **THEN** hệ thống từ chối và nêu kỳ chưa được chốt

### Requirement: Nhật ký sự kiện chốt không lộ dữ liệu
Hệ thống SHALL ghi vào nhật ký hệ thống mỗi sự kiện chốt và mở lại với loại sự kiện và phạm vi, và MUST NOT ghi tên, tài khoản, số tiền, lý do mở lại hay tên tab bản sao.

#### Scenario: Chốt thành công
- **WHEN** kỳ được chốt
- **THEN** nhật ký có một dòng loại sự kiện chốt và không chứa tổng thu nhập hay tài khoản bị bỏ qua

### Requirement: Duyệt không kích hoạt hành động nào khác
Hệ thống MUST NOT chi trả, gửi thư, ghi sang Sheet hay tệp khác, hoặc gọi địa chỉ bên ngoài khi duyệt hay mở lại; toàn bộ thay đổi chỉ nằm trong các tab của Sheet này.

#### Scenario: Sau khi chốt
- **WHEN** kỳ được chốt
- **THEN** các thay đổi chỉ gồm tab bản sao, chỉ mục, tab kết quả, giải thích và nhật ký hệ thống
