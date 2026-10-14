# Spec Delta

## Purpose

Gom toàn bộ quy trình tính, nhập, xem, duyệt và tra cứu lịch sử vào một bảng điều khiển trong Google Sheet theo prototype, hiển thị an toàn và rõ ràng, mà không làm thay đổi các quy tắc tính hay mở thêm đường dữ liệu ra ngoài.

## ADDED Requirements

### Requirement: Mở bảng điều khiển từ menu
Hệ thống SHALL thêm mục "Bảng điều khiển" vào menu và mở một hộp thoại không chặn Sheet khi được chọn. Hệ thống MUST NOT tự mở bảng điều khiển hay tính gì khi mở Sheet.

#### Scenario: Mở Sheet
- **WHEN** chủ sở hữu mở Sheet
- **THEN** menu có mục Bảng điều khiển nhưng không có hộp thoại nào hiện và không có tab nào bị ghi

### Requirement: Bảy màn hình theo prototype
Bảng điều khiển SHALL có thanh điều hướng theo thứ tự Tổng quan, Nhập point, Nhập key metrics, Kết quả, Duyệt và lưu, Lịch sử, Cấu hình, và mỗi mục mở đúng một màn hình.

#### Scenario: Chuyển màn hình
- **WHEN** chủ sở hữu bấm một mục điều hướng
- **THEN** màn hình tương ứng hiện ra và các màn khác ẩn đi

#### Scenario: Thứ tự điều hướng
- **WHEN** bảng điều khiển mở
- **THEN** các mục điều hướng xuất hiện đúng thứ tự Tổng quan, Nhập point, Nhập key metrics, Kết quả, Duyệt và lưu, Lịch sử, Cấu hình

### Requirement: Nội dung màn Tổng quan
Màn Tổng quan SHALL hiển thị kỳ đang làm, tổng thu nhập tạm tính, số người đã tính trên tổng, bảng thành viên, và tình trạng từng tab đầu vào (có dữ liệu, trống, thiếu) kèm nút mở đúng tab đó.

#### Scenario: Tình trạng tab
- **WHEN** một tab cấu hình bị thiếu
- **THEN** màn Tổng quan hiện tab đó là "Thiếu tab" và nút mở tab của nó bị vô hiệu

#### Scenario: Mở tab
- **WHEN** chủ sở hữu bấm "Mở tab" ở một tab có mặt
- **THEN** Sheet chuyển tới đúng tab đó và không dữ liệu nào đổi

### Requirement: Ô chọn kỳ
Phần đầu bảng điều khiển SHALL hiển thị kỳ đang làm và cho chọn kỳ khác từ một danh sách tháng quanh kỳ hiện tại. Việc chọn kỳ ghi vào tab `Ky` theo yêu cầu của `ui-data-editing` và MUST làm mô hình được tải lại.

#### Scenario: Chọn kỳ khác
- **WHEN** chủ sở hữu chọn tháng 2026-10 trong danh sách
- **THEN** trang gọi hàm máy chủ đặt kỳ và hiển thị kỳ mới cùng mô hình đã tải lại

### Requirement: Chip tình trạng dữ liệu của từng người
Bảng thành viên ở Tổng quan SHALL hiển thị cho mỗi người hai chip riêng: tình trạng point (đủ, thiếu, bị chặn) và tình trạng key metrics (đủ, thiếu, bị chặn, không áp dụng), cùng cột thu nhập.

#### Scenario: Người thiếu key metrics
- **WHEN** một thành viên đủ point nhưng thiếu key metrics
- **THEN** chip point là "Point: đủ", chip key metrics là "Key metrics: thiếu" và thu nhập hiện "—"

#### Scenario: Người chỉ theo dõi point
- **WHEN** một thành viên không có chỉ số key metrics nào
- **THEN** chip key metrics là "Key metrics: không áp dụng"

### Requirement: Phân rã point theo nguồn
Màn Nhập point SHALL hiển thị cho nguồn xuất bán và chuyển kho, theo từng khu vực: mã hàng, nhóm thiết bị, point quy đổi, số lượng bán ra, số lượng chuyển kho, point, quỹ point của khu vực, rồi bảng chia cho nhân viên gồm hệ số chia, tổng hệ số và point nhận. Với bảo hành và hỗ trợ sale SHALL hiển thị số liệu theo khu vực, quỹ và phần chia. Với quản lý kho SHALL hiển thị từng dòng việc kèm hệ số, số lượng, point và tổng theo người.

#### Scenario: Quỹ và phần chia
- **WHEN** quỹ xuất bán và chuyển kho của một khu vực là 100 và hai người có hệ số 0,6 và 0,4
- **THEN** màn hiển thị quỹ 100, tổng hệ số 1 và point nhận 60 và 40

#### Scenario: Chưa có báo cáo của một khu vực
- **WHEN** một khu vực chưa có báo cáo kiểm kê đọc được
- **THEN** khối của khu vực đó hiện trạng thái rỗng kèm nút nhập báo cáo, không hiện bảng toàn số 0

### Requirement: Key metrics từng người với thanh tiến độ
Màn Nhập key metrics SHALL hiển thị với mỗi thành viên có chỉ số: từng chỉ số kèm tỷ trọng, mục tiêu, kết quả, %HT bằng thanh tiến độ và con số, rồi Σ điểm key metrics và % thưởng. Chỉ số càng thấp càng tốt (vòng quay HTK, tỷ lệ bảo hành) MUST được ghi chú để người dùng không nhầm chiều. Thành viên thiếu dữ liệu SHALL hiện thông báo thiếu thay vì thanh trống.

#### Scenario: Có đủ chỉ số
- **WHEN** một thành viên có đủ mục tiêu và kết quả cho mọi chỉ số
- **THEN** mỗi chỉ số có thanh tiến độ khớp %HT và có dòng Σ điểm cùng % thưởng

#### Scenario: Thiếu kết quả
- **WHEN** một chỉ số của thành viên chưa có kết quả
- **THEN** thành viên hiện "Key metrics: thiếu" thay vì thanh tiến độ và Σ điểm

### Requirement: Panel cách tính
Màn Kết quả SHALL cho bấm vào một thành viên để mở panel liệt kê từng bước tính theo đúng thứ tự (point từng nguồn, Min–Max, point vượt, từng %HT, điểm, thưởng, phụ cấp, thu nhập hoặc lý do chưa tính).

#### Scenario: Xem cách tính
- **WHEN** chủ sở hữu bấm vào một thành viên đã tính
- **THEN** panel liệt kê các bước tính với giá trị cụ thể, và bấm lại hoặc bấm đóng thì panel ẩn đi

### Requirement: Kết quả tính chưa ghi ra Sheet
Màn Kết quả SHALL phân biệt kết quả đã ghi ra tab kết quả (sau "Tính kỳ") với kết quả chỉ tính để xem sau khi sửa dữ liệu, và MUST nêu rõ khi kết quả đang hiển thị chưa được ghi ra tab kết quả.

#### Scenario: Sau khi sửa bảng
- **WHEN** chủ sở hữu lưu một bảng nhập và mô hình được tải lại
- **THEN** màn Kết quả hiện số mới kèm ghi chú "chưa ghi ra tab kết quả, bấm Tính kỳ để ghi"

### Requirement: Hiển thị an toàn dữ liệu từ Sheet
Mọi chuỗi có nguồn từ Sheet hoặc báo cáo (tên, tài khoản, mã hàng, thông điệp lỗi, lý do) MUST được đưa vào trang bằng thuộc tính văn bản của phần tử, không bằng mã HTML, để nội dung chứa thẻ hay mã không bao giờ được thực thi.

#### Scenario: Tên chứa thẻ HTML
- **WHEN** tên một thành viên là `<img src=x onerror=alert(1)>`
- **THEN** bảng điều khiển hiển thị đúng chuỗi đó như chữ và không có phần tử ảnh hay mã nào được tạo

#### Scenario: Ô nhập chứa thẻ HTML
- **WHEN** chủ sở hữu gõ `<b>x</b>` vào một ô của bộ soạn bảng
- **THEN** chuỗi đó được giữ như chữ trong ô và gửi lên máy chủ như chữ

### Requirement: Không tải tài nguyên hay gọi ra ngoài
Bảng điều khiển MUST NOT tải phông, kiểu, mã, ảnh hay dữ liệu từ địa chỉ bên ngoài và MUST NOT gọi mạng. Mọi kiểu và mã SHALL nằm trong chính trang. Phông chữ SHALL dùng họ phông có sẵn của hệ thống. Việc chọn tệp báo cáo MUST đọc tệp ngay trong trình duyệt, không tải lên đâu khác.

#### Scenario: Quét tài nguyên ngoài
- **WHEN** quét nội dung trang
- **THEN** không có địa chỉ `http://` hay `https://` nào, không có thẻ nhúng tài nguyên ngoài

### Requirement: Chỉ gọi các hàm máy chủ được liệt kê
Bảng điều khiển SHALL chỉ gọi một danh sách cố định các hàm máy chủ: lấy mô hình, tính, duyệt, mở lại, lấy lịch sử, mở tab, đọc bảng, lưu bảng, khôi phục mặc định, đặt kỳ và nhập báo cáo. Hàm mở tab MUST chỉ chấp nhận tên tab thuộc danh sách tab của ứng dụng và từ chối tên khác.

#### Scenario: Mở tab ngoài danh sách
- **WHEN** hàm mở tab nhận một tên không thuộc danh sách
- **THEN** hàm từ chối và không đổi tab nào

#### Scenario: Gọi hàm ngoài danh sách
- **WHEN** mã trang được yêu cầu gọi một hàm máy chủ không có trong danh sách
- **THEN** trang từ chối ngay và không gửi yêu cầu nào

### Requirement: Mô hình hiển thị tối thiểu
Hàm máy chủ SHALL trả về cho bảng điều khiển một mô hình chỉ gồm những gì cần hiển thị. Mô hình MAY gồm mã hàng, nhóm thiết bị và số lượng bán ra, chuyển kho của báo cáo (cho màn phân rã point) và MUST NOT gồm giá bán, giá trị tồn, mô tả của nhật ký công việc hay bảng thô của các tab.

#### Scenario: Không lộ dữ liệu không cần
- **WHEN** hàm máy chủ trả về mô hình cho bộ dữ liệu mẫu
- **THEN** mô hình không chứa giá bán, giá trị tồn hay mô tả nhật ký công việc

#### Scenario: Có dữ liệu cho phân rã point
- **WHEN** mô hình được dựng sau khi tính
- **THEN** mô hình có mã hàng, nhóm, số lượng bán ra và chuyển kho từng dòng để màn Nhập point hiển thị

### Requirement: Trạng thái giao diện
Mỗi màn hình có dữ liệu SHALL thể hiện bốn trạng thái: rỗng (chưa có kết quả, kèm nút hành động), đang tải (nút bị vô hiệu), lỗi (nêu nguyên nhân bằng tiếng Việt) và thành công. Hành động duyệt, mở lại kỳ, lưu bảng, nhập báo cáo và khôi phục mặc định MUST có hộp xác nhận trước khi gọi máy chủ.

#### Scenario: Chưa tính
- **WHEN** chưa có kết quả
- **THEN** màn Kết quả hiện trạng thái rỗng với nút "Tính kỳ"

#### Scenario: Đang chạy
- **WHEN** một yêu cầu đang chạy
- **THEN** các nút hành động bị vô hiệu cho đến khi yêu cầu xong

#### Scenario: Duyệt cần xác nhận
- **WHEN** chủ sở hữu bấm "Xác nhận duyệt"
- **THEN** hiện hộp xác nhận, và chỉ khi đồng ý mới gọi máy chủ

### Requirement: Màn Duyệt và lưu
Màn Duyệt và lưu SHALL hiển thị tóm tắt kỳ (tổng đã tính, số người đã tính trên tổng, số cảnh báo), danh sách thành viên chưa tính kèm hộp đánh dấu xác nhận bỏ qua cho từng người, và nút duyệt chỉ bật khi mọi người chưa tính đều được đánh dấu và không có điều kiện chặn.

#### Scenario: Còn người chưa xác nhận
- **WHEN** còn một người chưa tính chưa được đánh dấu
- **THEN** nút duyệt bị vô hiệu và nêu lý do

#### Scenario: Có điều kiện chặn
- **WHEN** mô hình báo kỳ đã chốt hoặc đối soát lệch
- **THEN** nút duyệt bị vô hiệu và nêu điều kiện chặn

### Requirement: Trình bày theo hướng dẫn nhận diện Sapo
Giao diện SHALL dùng Sapo Blue làm màu chính, Sapo Green làm điểm nhấn trạng thái thành công, nền Off-Blue, chữ viết thường theo câu (không viết hoa toàn bộ), căn lề trái, và hiển thị số tiền dạng 9.800.000đ, ô chưa tính là "—", nhãn "Đề xuất – chờ duyệt" cho kết quả chưa duyệt.

#### Scenario: Ô chưa tính
- **WHEN** một thành viên chưa tính được
- **THEN** ô thu nhập hiện "—" và không hiện 0đ

### Requirement: Màn Cấu hình và các màn nhập dùng bộ soạn bảng chung
Màn Cấu hình và các khối nhập (số liệu theo khu vực, nhật ký công việc, key metrics, tỷ trọng, xác nhận báo cáo) SHALL dùng một bộ soạn bảng chung: ô nhập theo kiểu cột, thêm dòng, xoá dòng, báo có thay đổi chưa lưu, nút Lưu và nút Hủy thay đổi. Khi máy chủ từ chối lưu, bộ soạn MUST hiển thị từng lỗi bằng tiếng Việt kèm vị trí và giữ nguyên nội dung người dùng đang soạn.

#### Scenario: Có thay đổi chưa lưu
- **WHEN** chủ sở hữu sửa một ô
- **THEN** bộ soạn đánh dấu có thay đổi chưa lưu và bật nút Lưu và Hủy thay đổi

#### Scenario: Lưu bị từ chối
- **WHEN** máy chủ từ chối lưu vì một ô số chứa chữ
- **THEN** bộ soạn hiển thị lỗi nêu dòng và cột, và các ô vẫn giữ nội dung người dùng đã gõ

#### Scenario: Hủy thay đổi
- **WHEN** chủ sở hữu bấm Hủy thay đổi
- **THEN** bảng trở về nội dung đã lưu gần nhất và không gọi lưu
