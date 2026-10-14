# key-metrics-scoring Specification

## Purpose

Chấm điểm key metrics của từng thành viên từ kết quả và mục tiêu các chỉ số, rồi quy ra % thưởng theo bậc thang, theo đúng quy tắc đang dùng để tính lương.

## Requirements

### Requirement: Mức Min của chỉ số
Hệ thống SHALL xác định mức Min của một chỉ số từ mục tiêu và hệ số 70%: với chỉ số cao tốt Min bằng mục tiêu × 0,7; với chỉ số thấp tốt Min bằng mục tiêu / 0,7. Vòng quay HTK (thời gian) và tỷ lệ bảo hành là chỉ số thấp tốt; tỷ lệ hài lòng thiết bị là chỉ số cao tốt. Hệ số 70% MUST là tham số cấu hình.

#### Scenario: Min của chỉ số thấp tốt
- **WHEN** mục tiêu thời gian vòng quay HTK là 21
- **THEN** Min là 21 / 0,7 = 30

#### Scenario: Min của chỉ số cao tốt
- **WHEN** mục tiêu tỷ lệ hài lòng là 80%
- **THEN** Min là 80% × 0,7 = 56%

### Requirement: %HT của chỉ số thấp tốt và cao tốt
Hệ thống SHALL tính %HT bằng nội suy tuyến tính từ 0% tại Min đến 100% tại mục tiêu: %HT = (Min − KQ) / (Min − mục tiêu), bị chặn trong khoảng 0% đến 100%. Kết quả tệ hơn hoặc bằng Min cho 0%; tốt hơn hoặc bằng mục tiêu cho 100%. Hệ thống MUST NOT tính tiếp theo tỷ lệ khi kết quả tệ hơn Min.

#### Scenario: Chỉ số thấp tốt ở giữa Min và mục tiêu
- **WHEN** chỉ số thấp tốt có mục tiêu 21, Min 30 và kết quả 21,19
- **THEN** %HT là (30 − 21,19) / (30 − 21) ≈ 97,9%

#### Scenario: Chỉ số thấp tốt tốt hơn mục tiêu
- **WHEN** chỉ số thấp tốt có mục tiêu 21 và kết quả 18
- **THEN** %HT là 100%

#### Scenario: Chỉ số cao tốt ở giữa Min và mục tiêu
- **WHEN** chỉ số cao tốt có mục tiêu 0,8, Min 0,56 và kết quả 0,7
- **THEN** %HT là (0,7 − 0,56) / (0,8 − 0,56) ≈ 58,3%

#### Scenario: Kết quả bằng hoặc tệ hơn Min
- **WHEN** chỉ số cao tốt có Min 0,56 và kết quả 0,56 hoặc 0,4
- **THEN** %HT là 0% trong cả hai trường hợp

### Requirement: %HT của hoàn thành doanh thu
Hệ thống SHALL tính %HT của hoàn thành doanh thu bằng kết quả / mục tiêu, chặn trên ở 120% và không có Min.

#### Scenario: Doanh thu vượt mục tiêu
- **WHEN** doanh thu kết quả bằng 130% mục tiêu
- **THEN** %HT là 120%

#### Scenario: Doanh thu dưới mục tiêu
- **WHEN** doanh thu kết quả bằng 98% mục tiêu
- **THEN** %HT là 98%

### Requirement: Điểm key metrics theo tỷ trọng từng người
Hệ thống SHALL tính điểm key metrics của một thành viên bằng tổng, qua các chỉ số áp dụng cho người đó, của (tỷ trọng × %HT). Tập chỉ số và tỷ trọng lấy từ cấu hình của chính thành viên đó.

#### Scenario: Thành viên có hai chỉ số
- **WHEN** thành viên chỉ có vòng quay HTK (tỷ trọng 80%, %HT 97,9%) và doanh thu (tỷ trọng 20%, %HT 98%)
- **THEN** điểm key metrics là 0,8 × 97,9% + 0,2 × 98% ≈ 97,9%

#### Scenario: Điểm vượt 100% nhờ doanh thu
- **WHEN** thành viên có ba chỉ số đều 100% trừ doanh thu 120% với tỷ trọng 25%
- **THEN** điểm key metrics là 100% × 0,75 + 120% × 0,25 = 105%

### Requirement: % thưởng theo bậc thang
Hệ thống SHALL quy điểm key metrics sang % thưởng theo bậc thang đã cấu hình, với mỗi khoảng đóng ở cận trên và mở ở cận dưới. Với cấu hình mặc định: điểm không vượt 70% cho 0%, trên 70% đến 80% cho 15%, trên 80% đến 90% cho 20%, trên 90% đến 100% cho 25%, trên 100% cho 35%.

#### Scenario: Đúng cận trên
- **WHEN** điểm key metrics đúng 80%
- **THEN** % thưởng là 15%

#### Scenario: Vừa trên cận
- **WHEN** điểm key metrics là 100,01%
- **THEN** % thưởng là 35%

#### Scenario: Không vượt 70%
- **WHEN** điểm key metrics là 65%
- **THEN** % thưởng là 0%

### Requirement: Nhập kết quả chỉ số dùng chung theo nhóm hoặc khu vực
Hệ thống SHALL cho nhập mục tiêu và kết quả của một chỉ số một lần ở cấp nhóm hoặc khu vực và áp cho mọi thành viên thuộc cấp đó, trong khi tỷ trọng vẫn theo từng người. Nếu cấu hình riêng cho một người thì giá trị riêng được ưu tiên.

#### Scenario: Kết quả dùng chung theo khu vực
- **WHEN** hai thành viên cùng khu vực dùng chung kết quả tỷ lệ bảo hành của khu vực đó
- **THEN** cả hai cùng nhận %HT tính từ giá trị đó, mỗi người nhân với tỷ trọng riêng

### Requirement: Dữ liệu key metrics thiếu hoặc sai
Hệ thống MUST NOT tự điền 0 khi kết quả hoặc mục tiêu của một chỉ số áp dụng bị trống, và SHALL đánh dấu key metrics của thành viên là "thiếu". Mục tiêu nhỏ hơn hoặc bằng 0, hoặc kết quả không phải số không âm, MUST bị báo lỗi nêu rõ chỉ số và người liên quan.

#### Scenario: Thiếu kết quả
- **WHEN** thành viên có chỉ số tỷ lệ bảo hành áp dụng nhưng kết quả để trống
- **THEN** key metrics của thành viên là "thiếu" và không có điểm, không có % thưởng

#### Scenario: Mục tiêu bằng 0
- **WHEN** một chỉ số có mục tiêu 0
- **THEN** hệ thống báo lỗi chỉ số đó thay vì chia cho 0

### Requirement: Trạng thái đủ dữ liệu key metrics
Hệ thống SHALL coi key metrics của thành viên là đủ khi mọi chỉ số áp dụng cho người đó có cả mục tiêu và kết quả hợp lệ. Thành viên không có chỉ số nào áp dụng MUST được đánh dấu là "không áp dụng" thay vì "thiếu".

#### Scenario: Thành viên chỉ theo dõi point
- **WHEN** một thành viên không có cấu hình chỉ số key metrics nào
- **THEN** key metrics của người đó là "không áp dụng" và không chặn tính point
