# Spec Delta

## Purpose

Tính thu nhập tạm tính hằng tháng của từng thành viên và tổng theo nhóm/team từ point, điểm key metrics và cấu hình, luôn như một đề xuất chờ chủ sở hữu duyệt và không bao giờ tự quyết.

## ADDED Requirements

### Requirement: Thu nhập tạm tính
Hệ thống SHALL tính thu nhập tạm tính của một thành viên bằng lương cố định + thưởng key metrics + thưởng vượt point + phụ cấp. Hệ thống MUST NOT có khoản phạt hay khoản trừ nào.

#### Scenario: Ví dụ mẫu bậc 1
- **WHEN** thành viên bậc 1 (lương cố định 6.000.000, Min 120, Max 150) có point tổng 324,1, điểm key metrics 99,6% (thưởng 25%), đơn giá point 50.000đ và dùng máy tính cá nhân (phụ cấp 200.000đ)
- **THEN** thưởng key metrics là 1.500.000, thưởng vượt point là 1.500.000 và thu nhập tạm tính là 9.200.000

#### Scenario: Thành viên có lương cố định ghi đè
- **WHEN** thành viên bậc 4 có lương cố định ghi đè 10.800.000, Min 250, Max 300, point 491,7, thưởng key metrics 25% và dùng máy tính cá nhân
- **THEN** thưởng key metrics là 2.700.000, thưởng vượt point là 2.500.000 và thu nhập là 16.200.000

### Requirement: Thưởng vượt point
Hệ thống SHALL tính point vượt bằng 0 khi point tổng không lớn hơn Min, bằng Max − Min khi point tổng lớn hơn Max, và bằng point tổng − Min trong các trường hợp còn lại. Thưởng vượt point bằng point vượt × đơn giá point. Point dưới Min MUST NOT làm giảm thu nhập.

#### Scenario: Point trong khoảng Min–Max
- **WHEN** Min 250, Max 300 và point tổng 298,67
- **THEN** point vượt là 48,67 và thưởng vượt point là 48,67 × 50.000 ≈ 2.433.333

#### Scenario: Point vượt Max bị cắt trần
- **WHEN** Min 250, Max 300 và point tổng 466,3
- **THEN** point vượt là 50 và thưởng vượt point là 2.500.000, đồng thời hệ thống cảnh báo point đã bị cắt trần

#### Scenario: Point dưới Min
- **WHEN** Min 30 và point tổng 22
- **THEN** point vượt là 0, thưởng vượt point là 0, thu nhập không bị trừ và hệ thống hiện thông tin "point thấp hơn Min"

### Requirement: Thưởng key metrics
Hệ thống SHALL tính thưởng key metrics bằng lương cố định áp dụng cho thành viên × % thưởng của điểm key metrics. Lương cố định áp dụng là giá trị ghi đè nếu có, nếu không là giá trị của bậc.

#### Scenario: Thưởng tính trên lương cố định ghi đè
- **WHEN** thành viên bậc 3 có lương cố định ghi đè 9.800.000 và % thưởng 20%
- **THEN** thưởng key metrics là 1.960.000

#### Scenario: % thưởng bằng 0
- **WHEN** điểm key metrics không vượt 70%
- **THEN** thưởng key metrics là 0 và các khoản còn lại vẫn được tính

### Requirement: Phụ cấp theo cờ máy tính cá nhân
Hệ thống SHALL cộng mức phụ cấp đã cấu hình cho thành viên có cờ dùng máy tính cá nhân và cộng 0 cho thành viên dùng máy công ty cấp. Phụ cấp MUST NOT là hằng số áp cho mọi người.

#### Scenario: Máy công ty
- **WHEN** thành viên có cờ dùng máy tính cá nhân tắt
- **THEN** phụ cấp là 0 và thu nhập không gồm 200.000đ

### Requirement: Thành viên thiếu dữ liệu không được tính
Hệ thống MUST NOT tính thu nhập tạm tính cho thành viên có point "thiếu" hoặc key metrics "thiếu", và MUST NOT tự điền 0 thay cho dữ liệu thiếu. Các thành phần đã tính được (ví dụ thưởng vượt point) vẫn được hiển thị, còn thu nhập hiển thị là "chưa tính".

#### Scenario: Thiếu key metrics
- **WHEN** thành viên có point đủ nhưng key metrics thiếu
- **THEN** thưởng vượt point được hiển thị, thưởng key metrics và thu nhập hiển thị "chưa tính", và thành viên mang nhãn "Key metrics: thiếu"

#### Scenario: Thiếu point
- **WHEN** thành viên có key metrics đủ nhưng point thiếu
- **THEN** thu nhập hiển thị "chưa tính" và các thành phần phụ thuộc point để trống

### Requirement: Thành viên chỉ theo dõi point
Hệ thống SHALL hiển thị point của thành viên không có chỉ số key metrics áp dụng (nhãn "Theo dõi point") và MUST NOT tính thu nhập cho họ.

#### Scenario: Theo dõi point
- **WHEN** thành viên có point tổng 35 và không có chỉ số key metrics nào
- **THEN** hệ thống hiển thị point 35, thu nhập là "không tính" và thành viên không có mặt trong tổng thu nhập

### Requirement: Tổng theo nhóm và team
Hệ thống SHALL cộng thu nhập theo nhóm công việc và toàn team, chỉ gồm thành viên đã tính được, và hiển thị rõ số người đã tính trên tổng số người (ví dụ "cộng của 5/7 người"). Mọi cột tiền của dòng tổng MUST dùng cùng tập thành viên.

#### Scenario: Tổng khi còn người thiếu dữ liệu
- **WHEN** 7 thành viên, trong đó 5 đã tính và 2 chưa tính
- **THEN** tổng team là tổng thu nhập của 5 người, ghi "cộng của 5/7 người", và các cột lương cố định, thưởng, phụ cấp của dòng tổng cũng chỉ gồm 5 người đó

### Requirement: Làm tròn tiền
Hệ thống SHALL giữ nguyên độ chính xác khi tính từng khoản và làm tròn thu nhập của từng thành viên đến đồng khi hiển thị và khi tổng hợp; tổng nhóm và tổng team là tổng của các thu nhập đã làm tròn.

#### Scenario: Thưởng lẻ đồng
- **WHEN** thưởng vượt point là 2.433.333,33
- **THEN** thu nhập của thành viên được làm tròn đến đồng và tổng team bằng tổng các thu nhập đã làm tròn

### Requirement: Kết quả là đề xuất chờ duyệt
Hệ thống SHALL gắn nhãn "Đề xuất – chờ duyệt" cho mọi kết quả và MUST NOT thực hiện hành động nào dựa trên kết quả (chi trả, ghi sang hệ thống khác, gửi cho người khác). Người duyệt cuối là chủ sở hữu.

#### Scenario: Chưa duyệt
- **WHEN** kỳ chưa được chủ sở hữu duyệt
- **THEN** mọi kết quả mang nhãn "Đề xuất – chờ duyệt" và không có hành động tự động nào được kích hoạt

### Requirement: Giải thích cách tính
Hệ thống SHALL cho xem, với mỗi thành viên, từng bước tính: point từng nguồn, point tổng, Min và Max, point vượt, từng %HT, điểm key metrics, % thưởng, lương cố định áp dụng và phụ cấp, để chủ sở hữu tự kiểm lại bằng tay.

#### Scenario: Xem cách tính
- **WHEN** chủ sở hữu mở chi tiết của một thành viên đã tính
- **THEN** hệ thống liệt kê các bước trên với giá trị cụ thể và cấu hình đã dùng

### Requirement: Cảnh báo không chặn
Hệ thống SHALL cảnh báo, nhưng không chặn tính, các trường hợp: point bị cắt trần Max, point thấp hơn Min, lương cố định đã ghi đè khác bậc.

#### Scenario: Cảnh báo ghi đè lương
- **WHEN** thành viên có lương cố định ghi đè khác giá trị của bậc
- **THEN** hệ thống hiện cảnh báo nêu tài khoản, giá trị ghi đè và giá trị chuẩn, và vẫn dùng giá trị ghi đè để tính

### Requirement: Tính ổn định
Với cùng cấu hình và cùng dữ liệu đầu vào, hệ thống MUST cho cùng kết quả ở mọi lần tính.

#### Scenario: Chạy hai lần
- **WHEN** hệ thống tính hai lần với cùng cấu hình và dữ liệu
- **THEN** point, điểm key metrics, % thưởng và thu nhập của mọi thành viên giống nhau
