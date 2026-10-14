# Tasks

Quy ước chung: mã mới nằm trong `src/sheet/`; phần chuyển đổi và quy tắc là hàm thuần có test bằng Node (`node --test`); mọi lời gọi API Apps Script chỉ nằm trong các tệp `gas*.js` (kể cả `HtmlService`, `protect`, `deleteSheet`); dữ liệu thử chỉ là dữ liệu giả; không thêm thư viện, không dùng `clasp`. `src/core/` giữ nguyên hành vi. Sau khi thêm tệp nguồn, cập nhật thứ tự trong `tools/build-gs.js` (nguồn duy nhất) và kiểm tra không trùng tên toàn cục.

## 1. Định dạng bảng kết quả (`sheet-result-output`)

- [x] 1.1 Cài đặt hàm thuần dựng danh sách định dạng từ bảng kết quả (cột tiền, phần trăm, point, dòng tiêu đề và dòng tổng in đậm, độ rộng cột), chỉ gán định dạng số cho ô có giá trị số; kiểm tra bằng test vị trí vùng trên bộ 1, ô "—" không nằm trong danh sách số, và dòng tổng nhóm, tổng team được in đậm
- [x] 1.2 Mở rộng Sheet giả (`getRange` theo ký hiệu A1, `setNumberFormat`, `setFontWeight`, `setColumnWidth`, `getRangeList`) và áp định dạng trong lớp Apps Script sau khi ghi giá trị; kiểm tra bằng test: giá trị trong ô không đổi (9800000 vẫn là số 9800000), tab đầu vào không bị đổi định dạng, định dạng số có dấu phân cách nghìn
- [x] 1.3 Cập nhật `tests/bang-chung-sheet.js` và bằng chứng nếu giá trị thay đổi; kiểm tra bằng `node --test` xanh và bằng chứng tái lập được khi chạy lại

## 2. Bản chốt và chỉ mục (`period-approval`, phần thuần)

- [x] 2.1 Cài đặt dấu vân tay (băm FNV-1a 32 bit của chuỗi) và chia, ghép đoạn không quá 40.000 ký tự mỗi ô; kiểm tra bằng test chuỗi trên 40.000 ký tự ghép lại nguyên vẹn, ký tự tiếng Việt và ký tự đặc biệt không đổi, và hai chuỗi khác nhau một ký tự cho dấu vân tay khác
- [x] 2.2 Để điều phối trả thêm cấu hình và dữ liệu kỳ đã dùng, cài đặt dựng nội dung bản chốt (cấu hình, dữ liệu kỳ, kết quả từng thành viên, người bị bỏ qua) và chỉ giữ các trường cần (không giá bán, giá trị tồn, mô tả nhật ký); kiểm tra bằng test nội dung bản chốt bộ 1 không chứa các trường bị loại
- [x] 2.3 Cài đặt dựng tab bản sao dạng mảng hai chiều (siêu dữ liệu, bảng kết quả đã duyệt, các đoạn dữ liệu, dấu vân tay) và đọc ngược kèm kiểm tra dấu vân tay; kiểm tra bằng test đọc lại giống hệt bản chốt gốc, "bản chốt bị sửa tay" (cảnh báo) và dữ liệu lớn nhiều đoạn
- [x] 2.4 Cài đặt chỉ mục `KyDaChot`: dựng dòng, đọc lại, và trạng thái hiệu lực là dòng mới nhất của kỳ; kiểm tra bằng test "hai sự kiện của một kỳ" (chốt rồi mở lại), kỳ chưa từng chốt, và nhiều kỳ xen kẽ
- [x] 2.5 Cài đặt đánh giá điều kiện duyệt (lỗi chặn toàn bộ, đối soát lệch, không ai tính được, kỳ đã chốt, thiếu xác nhận từng người, người chỉ theo dõi point không cần xác nhận); kiểm tra bằng test từng scenario của spec kể cả "thiếu xác nhận" nêu đúng tài khoản người còn lại
- [x] 2.6 Cài đặt so sánh kết quả tính lại với bản chốt (số người khác nhau, tài khoản khác nhau); kiểm tra bằng test "tính lại giống bản chốt" và "khác bản chốt hai người"
- [x] 2.7 Cài đặt đặt tên tab bản sao (`Chot_<kỳ>`), tên cũ có hậu tố đánh số khi mở lại, và nhận diện tab mồ côi (có tiền tố `Chot_` nhưng không có dòng chỉ mục); kiểm tra bằng test các tên và trường hợp mồ côi

## 3. Duyệt, mở lại, tính lại trên kỳ đã chốt (`period-approval`, lớp Apps Script)

- [x] 3.1 Tạo `src/sheet/gas-chot.js` và cài đặt `duyetKy` (kiểm tra chia sẻ, tính lại, đánh giá điều kiện, ghi tab kết quả, ghi bản sao rồi ghi chỉ mục sau cùng, bảo vệ cảnh báo, ghi nhật ký); kiểm tra bằng test trên Sheet giả: chốt bộ 1 tạo `Chot_2026-09` và `KyDaChot`, dữ liệu sửa sau lần tính gần nhất được phản ánh, chia sẻ rộng thì từ chối và không ghi gì
- [x] 3.2 Kiểm tra duyệt từ chối đúng: đối soát lệch, không ai tính được, kỳ đã chốt; và bộ 3 thiếu xác nhận từng người; kiểm tra bằng test không có tab nào được tạo và chỉ mục không đổi khi từ chối
- [x] 3.3 Kiểm tra bản chốt đóng băng: đổi đơn giá point rồi tính lại, bản chốt vẫn giữ nguyên đơn giá và các số đã duyệt; tab đầu vào không bao giờ bị đổi trong cả quy trình duyệt; kiểm tra bằng test so sánh trước sau
- [x] 3.4 Cài đặt `moLaiKy` (cần lý do, chỉ kỳ đang Đã chốt, đổi tên tab cũ, ghi dòng Đã mở lại, cho chốt lại) và `Chot_<kỳ>_cu<n>`; kiểm tra bằng test "mở lại không có lý do", "mở lại rồi chốt lại" (ba dòng chỉ mục, tab cũ còn), "mở lại kỳ chưa chốt"
- [x] 3.5 Cài đặt cảnh báo khi "Tính kỳ" chạy trên kỳ đã chốt (giống hoặc khác bản chốt) và đọc bản chốt kiểm dấu vân tay; kiểm tra bằng test hai trường hợp và test bản chốt bị sửa tay hiện cảnh báo, đồng thời bản chốt và chỉ mục không đổi
- [x] 3.6 Cài đặt xử lý tab mồ côi khi chốt dở dang và nhật ký sự kiện chốt, mở lại không chứa tên, tài khoản, số tiền, lý do hay tên tab bản sao; kiểm tra bằng test chốt dở dang (lỗi giữa chừng) rồi chốt lại thành công, và test nhật ký hệ thống sau chốt không lộ dữ liệu

## 4. Giao diện bảng điều khiển (`control-panel-ui`)

- [x] 4.1 Cài đặt mô hình hiển thị thuần (`taoMoHinhGiaoDien`): kỳ, trạng thái, bảng thành viên, tổng, người chưa tính kèm lý do, lỗi, cảnh báo, đối soát, tình trạng tab đầu vào, lịch sử, điều kiện chặn duyệt; kiểm tra bằng test mô hình bộ 1 và bộ 3, và test mô hình không chứa giá bán, giá trị tồn, mô tả nhật ký, mã hàng báo cáo
- [x] 4.2 Cài đặt trang HTML/CSS/JS trong `src/sheet/giaodienhtml.js` (năm màn, điều hướng, trạng thái rỗng/đang tải/lỗi/thành công, hộp xác nhận, định dạng tiền 9.800.000đ, "—", nhãn đề xuất, màu Sapo, họ phông hệ thống) chỉ dùng `createElement` và `textContent`; kiểm tra bằng test quét tĩnh: không `innerHTML`, `outerHTML`, `document.write`, `eval`, `new Function`, không địa chỉ `http://` hay `https://`, không thẻ nhúng tài nguyên ngoài
- [x] 4.3 Viết DOM giả tối thiểu bằng tay trong `tests/fake-dom.js` và test hiển thị: bảng thành viên đúng chữ, tên chứa thẻ HTML hiển thị như chữ và không tạo phần tử ảnh, ô chưa tính hiện "—"; kiểm tra bằng các test đó xanh
- [x] 4.4 Kiểm thử hành vi của trang: chuyển màn, nút bị vô hiệu khi đang chạy, màn Duyệt và lưu bật nút chỉ khi mọi người chưa tính được đánh dấu và không có điều kiện chặn, hộp xác nhận trước khi gọi máy chủ, lỗi máy chủ hiện bằng tiếng Việt; kiểm tra bằng test dùng `google.script.run` giả ghi nhận các lời gọi
- [x] 4.5 Tạo `src/sheet/gas-giaodien.js` với hàm mở hộp thoại và các hàm máy chủ cho trang (lấy mô hình, tính, duyệt, mở lại, lịch sử, mở tab) trong đó mở tab chỉ nhận tên thuộc danh sách của ứng dụng; kiểm tra bằng test trên Sheet giả: mở tab ngoài danh sách bị từ chối và không đổi tab nào, các hàm trả mô hình đúng, duyệt qua giao diện cho cùng kết quả như `duyetKy`
- [x] 4.6 Thêm mục menu "Bảng điều khiển" và đảm bảo mở Sheet không mở hộp thoại hay ghi gì; kiểm tra bằng test menu có mục mới ở cả bản thật và bản thử và test mở Sheet không có thao tác ghi

## 5. Gói triển khai và quyền

- [x] 5.1 Cập nhật thứ tự nối tệp trong `tools/build-gs.js`, thêm manifest thay thế dùng `drive.readonly` (`dist/appsscript.drive-readonly.json`) và đảm bảo không trùng tên toàn cục; kiểm tra bằng test gộp mã: bản gộp chạy trọn quy trình nạp mẫu, tính, duyệt, mở lại trên Sheet giả cho kết quả giống bản nạp từng tệp
- [x] 5.2 Cập nhật các test quét API: cho phép `HtmlService` và các hàm Sheet cần thêm (`protect`, `deleteSheet`, đổi tên tab, `showModelessDialog`) chỉ trong `gas*.js`, và vẫn cấm mọi API ngoài; kiểm tra bằng test quét xanh, trong đó thử thêm tạm một lời gọi cấm (như `UrlFetchApp`) cho test đỏ rồi gỡ ra

## 6. Tài liệu, bằng chứng và tự soát

- [x] 6.1 Cập nhật README và `HUONG-DAN-THU-NGHIEM.md` (bảng điều khiển, duyệt, mở lại, thử `drive.readonly`, bản chốt) cùng danh sách kiểm tay trên Sheet thật cho giao diện, `protect()`, `HtmlService`; kiểm tra bằng làm theo phần lệnh chạy được và đọc lại danh sách kiểm tay
- [x] 6.2 Tạo bằng chứng chốt qua Sheet giả cho bộ 1 (chốt, tính lại sau khi sửa dữ liệu, mở lại, chốt lại) và bộ 3 (bị từ chối vì thiếu xác nhận) trong `tests/evidence/`, kèm test khớp kết quả; kiểm tra bằng các tệp có mặt và tái lập được
- [x] 6.3 Cập nhật `tests/evidence/self-check.md` cho C1, C8, C11, C12, C13 với hiện trạng (giao diện, chốt, mở lại, quyền, HTML an toàn), nêu rõ phần chưa kiểm được ngoài Sheet thật; kiểm tra bằng tệp có đủ mục và không tuyên bố "đã đạt chuẩn"
- [x] 6.4 Quét toàn bộ `src/`, `tests/`, `tools/`, `dist/`, `openspec/`, README bằng danh sách tên và tài khoản lấy từ file thật (không in ra) để chắc không có dữ liệu thật lọt vào; kiểm tra bằng kết quả 0 trùng ngoài thuật ngữ chung

## 7. Định nghĩa bảng sửa được và kiểm tra trước khi ghi (`ui-data-editing`, phần thuần)

- [x] 7.1 Tạo `src/sheet/bang.js` mô tả mọi bảng sửa được (tab, tiêu đề chuẩn, kiểu cột số/chữ/logic/chọn, danh sách chọn, nhóm cấu hình hay nhập tay, có mặc định hay không) và danh sách tab được phép ghi; kiểm tra bằng test danh sách khớp `TIEU_DE` và không chứa tab báo cáo, tab kết quả, `KyDaChot`, `Chot_*`
- [x] 7.2 Cài đặt đọc một bảng thành dạng để sửa (tiêu đề, kiểu cột, dòng) kể cả khi tab chưa có; kiểm tra bằng test bảng bậc của bộ 1, bảng thiếu tab và bảng có cột đổi thứ tự
- [x] 7.3 Cài đặt chuyển giá trị từ giao diện theo kiểu cột (số nhận một dấu thập phân chấm hoặc phẩy, chuỗi "6.000.000" giữ thô, TRUE/FALSE, danh sách chọn, ô trống, cắt khoảng trắng); kiểm tra bằng test "0,17" thành 0.17, "6.000.000" bị giữ thô, ô trống giữ trống
- [x] 7.4 Cài đặt dựng bảng mới và kiểm tra trước khi ghi (bản thử các tab, chỉ chặn lỗi thuộc bảng đang lưu, lỗi bảng khác thành cảnh báo); kiểm tra bằng test tổng hệ số 0,9 bị chặn, ô số chứa chữ bị chặn nêu dòng và cột, thêm thành viên chưa có tỷ trọng chỉ cảnh báo
- [x] 7.5 Cài đặt danh sách ô cần định dạng văn bản (chuỗi bắt đầu bằng = + - @) khi ghi; kiểm tra bằng test tên `=1+1` và `@x`
- [x] 7.6 Cài đặt phân tích văn bản CSV/TSV (nhận tab, phẩy, chấm phẩy, dấu nháy kép, dấu BOM, dòng cuối trống, ô số nguyên và số thập phân dấu chấm thành số), giới hạn kích thước; kiểm tra bằng test báo cáo giả dạng TSV và CSV đọc ra đúng bảng như fixture và vượt giới hạn bị từ chối

## 8. Ghi bảng từ giao diện (`ui-data-editing`, lớp Apps Script)

- [x] 8.1 Tạo `src/sheet/gas-sua.js` với `giaoDienDocBang` và `giaoDienLuuBang` (chia sẻ, kỳ đã chốt, danh sách tab, kiểm tra trước khi ghi, ghi theo cột chuẩn, định dạng văn bản, nhật ký sự kiện không lộ nội dung); kiểm tra bằng test trên Sheet giả: lưu bảng bậc chỉ đổi tab đó và nhật ký, tab ngoài danh sách bị từ chối, bị từ chối khi chia sẻ rộng
- [x] 8.2 Cài đặt chặn khi kỳ Đã chốt: bảng nhập tay bị từ chối kèm chỉ dẫn mở lại kỳ, bảng cấu hình được ghi kèm cảnh báo; kiểm tra bằng test hai trường hợp và bản chốt không đổi
- [x] 8.3 Cài đặt `giaoDienKhoiPhucMacDinh` chỉ cho bốn bảng có mặc định; kiểm tra bằng test khôi phục bảng bậc, từ chối bảng thành viên, các tab khác không đổi
- [x] 8.4 Cài đặt `giaoDienDatKy` ghi ô tháng dạng văn bản và từ chối giá trị sai; kiểm tra bằng test "2026-10" hợp lệ, "2026-13", "tháng chín" và tab Ky giữ nguyên khi sai
- [x] 8.5 Cài đặt `giaoDienNhapBaoCao` (khu vực phải có trong cấu hình, phân tích văn bản, kiểm tra bằng bộ đọc báo cáo, chỉ ghi khi không lỗi, định dạng văn bản cho ô chữ nguy hiểm); kiểm tra bằng test nhập hợp lệ thay đúng tab, thiếu cột bị từ chối và tab giữ nguyên, khu vực lạ, quá lớn
- [x] 8.6 Kiểm tra tổng thể: mọi hàm ghi của giao diện chỉ tạo thao tác ghi trong danh sách tab cho phép và nhật ký hệ thống, chạy cả quy trình sửa nhiều bảng rồi tính ra đúng kết quả mới; kiểm tra bằng test quét nhật ký thao tác trên Sheet giả

## 9. Mô hình chi tiết và màn xem (`control-panel-ui`, phần thuần)

- [x] 9.1 Mở rộng mô hình: chip point và key metrics từng người, phân rã point theo nguồn và khu vực (mã hàng, nhóm, số lượng, point, quỹ, hệ số, point nhận), nhật ký quản lý kho theo người, chỉ số key metrics từng người (tên, tỷ trọng, mục tiêu, kết quả, %HT, thấp tốt hay cao tốt), các bước giải thích, cờ `daGhiKetQua`; kiểm tra bằng test số liệu khớp tính tay bộ 1 (quỹ HN 237,3 và HCM 203,8, point nhận từng người) và mô hình không có giá bán, giá trị tồn, mô tả nhật ký
- [x] 9.2 Cập nhật tình trạng tab và danh sách tab cho giao diện dùng chung với Tổng quan, kèm danh sách tên bảng sửa được; kiểm tra bằng test cập nhật
- [x] 9.3 Cập nhật danh sách hàm máy chủ được phép (11 hàm) ở mô hình và trang; kiểm tra bằng test khớp giữa hai nơi

## 10. Giao diện đầy đủ theo prototype (`control-panel-ui`)

- [x] 10.1 Viết lại trang: thanh điều hướng bảy mục đúng thứ tự, ô chọn kỳ, màn Tổng quan có chip point và key metrics, tình trạng tab và nút mở tab; kiểm tra bằng test DOM giả thứ tự điều hướng, chip, gộp màn Dữ liệu vào Tổng quan
- [x] 10.2 Thêm bộ soạn bảng dùng chung (ô theo kiểu cột, thêm và xoá dòng, báo thay đổi chưa lưu, Lưu, Hủy thay đổi, hộp xác nhận, hiển thị lỗi theo vị trí, giữ nội dung đang soạn khi bị từ chối); kiểm tra bằng test sửa ô, thêm, xoá, hủy, lưu thành công, lưu bị từ chối giữ nguyên nội dung, ô chứa thẻ HTML giữ như chữ
- [x] 10.3 Thêm màn Nhập point (bốn nhóm): bảng mã hàng, quỹ, chia hệ số, nút nhập báo cáo theo khu vực (dán văn bản hoặc chọn tệp CSV/TSV đọc bằng `FileReader`), bộ soạn số liệu theo khu vực, nhật ký công việc, xác nhận báo cáo; kiểm tra bằng test hiển thị khớp mô hình, hộp nhập báo cáo, chọn tệp, trạng thái rỗng khi chưa có báo cáo
- [x] 10.4 Thêm màn Nhập key metrics: bộ soạn bảng key metrics và tỷ trọng, thẻ từng người có thanh %HT, Σ điểm, % thưởng, ghi chú chỉ số thấp tốt, thông báo khi thiếu; kiểm tra bằng test thanh khớp %HT và thông báo thiếu
- [x] 10.5 Màn Kết quả: cảnh báo hiện phía trên bảng, panel "Cách tính" khi bấm một thành viên, ghi chú chưa ghi ra tab kết quả; kiểm tra bằng test mở và đóng panel, các bước đúng thứ tự, ghi chú theo cờ
- [x] 10.6 Màn Cấu hình: các bảng cấu hình dùng bộ soạn, nút Khôi phục mặc định có hộp xác nhận cho bốn bảng; kiểm tra bằng test sửa và lưu một bảng, khôi phục mặc định gọi đúng hàm
- [x] 10.7 Cập nhật máy chủ giao diện và kịch bản đầu cuối: sửa đơn giá trong Cấu hình, nhập số liệu, tính, duyệt, trong một phiên trên Sheet giả cho kết quả đúng; cập nhật bản xem trước để mô phỏng các hàm mới; kiểm tra bằng test đầu cuối và test bản xem trước

## 11. Gói triển khai, tài liệu và tự soát cho phần bổ sung

- [x] 11.1 Thêm các tệp mới vào thứ tự gộp mã, cập nhật quét API (các hàm ghi chỉ trong `gas*.js`, `FileReader` chỉ ở mã khách, không `XMLHttpRequest`), kiểm tra không trùng tên toàn cục; kiểm tra bằng test gộp mã chạy trọn quy trình sửa, tính, duyệt
- [x] 11.2 Cập nhật README và `HUONG-DAN-THU-NGHIEM.md` (màn mới, sửa trong giao diện, nhập báo cáo, khôi phục mặc định, giới hạn cột lạ) cùng danh sách kiểm tay cho các màn nhập và Cấu hình; kiểm tra bằng đọc lại và chạy các lệnh trong tài liệu
- [x] 11.3 Cập nhật bằng chứng test (kịch bản sửa bảng, nhập báo cáo, bị chặn khi kỳ chốt) và tự soát C5, C8, C12, C13 cho việc giao diện được ghi dữ liệu; kiểm tra bằng bằng chứng tái lập được và tự soát không tuyên bố "đã đạt chuẩn"
- [x] 11.4 Quét tên và tài khoản thật trên toàn bộ kho sau các thay đổi; kiểm tra bằng kết quả 0 trùng ngoài thuật ngữ chung

## Workflow follow-up

- Chủ sở hữu thử giao diện, duyệt, mở lại trên Sheet thử với dữ liệu giả theo danh sách kiểm tay, và thử `drive.readonly`.
- Archive change sau khi hoàn tất và được chủ sở hữu xem lại.
