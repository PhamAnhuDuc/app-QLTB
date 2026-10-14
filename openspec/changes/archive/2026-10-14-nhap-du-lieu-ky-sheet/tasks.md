# Tasks

Quy ước chung: phần chuyển đổi nằm trong `src/sheet/` dưới dạng hàm thuần nhận và trả mảng hai chiều (không gọi API Apps Script), lớp Apps Script mỏng nằm riêng trong `src/sheet/gas.js`. Kiểm thử bằng Node có sẵn (`node --test`), dữ liệu mẫu trong `tests/fixtures/` **chỉ là dữ liệu giả**, có cùng cấu trúc với báo cáo thật nhưng không chép số hay tên từ file thật. Không thêm thư viện, không dùng `clasp`. `src/core/` giữ nguyên hành vi; nếu phải chỉnh, ghi rõ lý do và kèm test.

## 1. Khung lớp Sheet và dữ liệu mẫu giả

- [x] 1.1 Tạo `src/sheet/` với tệp hằng số tên tab (một nơi duy nhất) và tiện ích bảng hai chiều (chuẩn hoá chữ để so tiêu đề, tìm ô theo nội dung, đọc ô an toàn); kiểm tra bằng `tests/sheet-util.test.js` xanh
- [x] 1.2 Tạo fixture báo cáo kiểm kê giả dạng mảng hai chiều đúng cấu trúc báo cáo thật (nhiều dòng đầu, dòng "Từ ngày … đến ngày …", tiêu đề hai tầng, dòng "Tổng", dòng sản phẩm gồm một dòng thiếu mã, dòng chân bảng "Tổng số dòng : N") cho hai khu vực, nhất quán với số trong `tests/fixtures/bo1/ky.json`; kiểm tra bằng test đọc fixture ra đúng số dòng
- [x] 1.3 Tạo fixture các bảng cấu hình và bảng nhập tay giả dạng mảng hai chiều tương ứng `bo1` (và các biến thể xấu cho từng bảng); kiểm tra bằng `tests/fixtures/README.md` mô tả ý đồ từng fixture và quét tên/tài khoản thật cho kết quả 0 trùng

## 2. Nhập báo cáo kiểm kê (`kiem-ke-report-import`)

- [x] 2.1 Cài đặt nhận diện cột "Mã hàng", "SL bán ra trong kỳ", "SL chuyển kho" theo tên, chịu được cột dịch chỗ và tiêu đề hai tầng, báo lỗi nêu tên cột và tab khi thiếu; kiểm tra bằng test "cột nằm ở vị trí khác", "tiêu đề hai tầng", "thiếu cột bắt buộc"
- [x] 2.2 Cài đặt đọc khoảng ngày từ dòng "Từ ngày … đến ngày …" (dd/mm/yyyy → năm-tháng-ngày, kiểm tra tồn tại ngày kể cả năm nhuận); kiểm tra bằng test "đọc khoảng ngày", "không có dòng ngày", "ngày không tồn tại"
- [x] 2.3 Cài đặt đọc dòng sản phẩm, bỏ dòng "Tổng", dùng dòng chân bảng để đối chiếu số dòng, giữ dòng thiếu mã; kiểm tra bằng test "bỏ dòng tổng", "dòng thiếu mã", "dán thiếu dòng" (báo thiếu 14 dòng khi 150/164)
- [x] 2.4 Cài đặt giá trị số (trống = 0, chữ hoặc số âm = lỗi nêu tab, dòng, cột, không đoán chuỗi số) và báo cáo rỗng hoặc không nhận ra; kiểm tra bằng test "ô chứa chữ", "ô trống", "số âm", "tab trống"
- [x] 2.5 Cài đặt chỉ giữ mã hàng, tên hàng, số bán ra, số chuyển kho và tab thiếu của khu vực; kiểm tra bằng test dữ liệu sinh ra không chứa cột giá/giá trị tồn và test "thiếu tab của một khu vực"; đồng thời kiểm tra dữ liệu đọc từ fixture khớp `tests/fixtures/bo1/ky.json`

## 3. Cấu hình trong Sheet (`sheet-config-storage`)

- [x] 3.1 Cài đặt đọc một bảng cấu hình theo tiêu đề cột (không theo thứ tự), báo lỗi nêu tab và cột khi thiếu; kiểm tra bằng test "đổi thứ tự cột", "thiếu cột", "thiếu một tab cấu hình"
- [x] 3.2 Cài đặt kiểu giá trị của ô (số thật, TRUE/FALSE, phần trăm thập phân, ô ghi đè lương trống = không ghi đè, ô số chứa chữ = lỗi nêu tab và dòng); kiểm tra bằng test "ô số chứa chữ", "ghi đè lương cố định trống", "cờ máy tính cá nhân"
- [x] 3.3 Cài đặt đọc đủ các tab thành đối tượng cấu hình của lõi (kể cả khu vực → tab báo cáo và tỷ trọng dạng dài), chạy `kiemTraCauHinh` và gắn tab, dòng, tên trường vào lỗi; kiểm tra bằng test đọc `bo1` ra cấu hình tương đương `bo1/config.json`, "hệ số chia không bằng 1" chỉ chặn đúng nguồn, "tài khoản trùng" chặn toàn bộ
- [x] 3.4 Cài đặt tạo khung cấu hình mặc định (giá trị chính sách đã quy định, không có thành viên) dưới dạng mảng hai chiều và quy tắc không ghi đè tab đã có; kiểm tra bằng test "sheet mới", "tab đã có dữ liệu", "khung mặc định không có thành viên" và test khung mặc định đọc lại hợp lệ

## 4. Nhập tay và lắp dữ liệu kỳ (`period-data-entry`)

- [x] 4.1 Cài đặt kỳ từ ô tháng (ngày đầu, ngày cuối, năm nhuận, từ chối khi trống hoặc sai dạng); kiểm tra bằng test "tháng 2 năm nhuận" và "chưa chọn tháng"
- [x] 4.2 Cài đặt bảng bảo hành và hỗ trợ sale theo khu vực (trống ≠ 0, khu vực lạ, số không hợp lệ); kiểm tra bằng test "ô trống khác 0", "khu vực không có trong cấu hình", "số không hợp lệ"
- [x] 4.3 Cài đặt nhật ký công việc (bỏ dòng trống hoàn toàn, dòng thiếu một phần báo lỗi, số lượng 0 được giữ, giá trị thô không hợp lệ chuyển cho lõi chặn đúng người, mô tả không đi vào kết quả hay log); kiểm tra bằng test "dòng thiếu một phần", "dòng trống hoàn toàn", "số lượng 0 là có số liệu"
- [x] 4.4 Cài đặt bảng key metrics (cấp độ Nhóm/Khu vực/Tài khoản, cấp độ lạ, khai báo trùng, kết quả trống giữ trống); kiểm tra bằng test "cấp độ không hợp lệ", "khai báo trùng", "kết quả để trống"
- [x] 4.5 Cài đặt bảng xác nhận báo cáo một phần theo khu vực (mặc định chưa xác nhận); kiểm tra bằng test "mặc định chưa xác nhận" và "đã xác nhận một khu vực"
- [x] 4.6 Cài đặt lắp mọi bảng thành dữ liệu kỳ cho lõi và gom lỗi nhiều bảng trong một lần; kiểm tra bằng test "nhiều lỗi cùng lúc" và test vòng: bộ 1 → mảng hai chiều → đọc lại → `tinhKy` cho kết quả giống hệt tính trực tiếp từ JSON gốc (so từng thu nhập)

## 5. Dựng nội dung kết quả (`sheet-result-output`, phần thuần)

- [x] 5.1 Cài đặt dựng mảng kết quả: nhãn "Đề xuất – chờ duyệt", kỳ, trạng thái đủ dữ liệu, thời điểm, bảng thành viên theo nhóm, tổng nhóm và team kèm "cộng của N/M người", giá trị chưa tính là "—"; kiểm tra bằng test "người chưa đủ dữ liệu" (không có số 0) và test tổng bộ 1 khớp 75.838.000đ
- [x] 5.2 Cài đặt phần lỗi, cảnh báo và bảng đối soát, và nhánh chặn toàn bộ chỉ ghi lỗi; kiểm tra bằng test "chặn toàn bộ do lỗi cấu hình" và "đối soát"
- [x] 5.3 Cài đặt mảng "Giải thích" từ từng bước của lõi; kiểm tra bằng test "xem giải thích" có đủ các bước theo thứ tự cho một thành viên đã tính và lý do cho người chưa tính
- [x] 5.4 Cài đặt vô hiệu hoá chuỗi bắt đầu bằng "=", "+", "-", "@" và đánh dấu cột văn bản; kiểm tra bằng test "mã hàng bắt đầu bằng dấu bằng" và các ký tự đầu còn lại, kể cả chuỗi bình thường không bị đổi
- [x] 5.5 Cài đặt dòng nhật ký từ `taoLog`; kiểm tra bằng test "lỗi mã hàng lạ" (không có mã hàng) và "tính thành công" (không có số tiền), quét nội dung nhật ký không chứa tên, tài khoản, mã hàng, số lương

## 6. Lớp Apps Script và gói triển khai

- [x] 6.1 Tạo Sheet giả tối thiểu trong bộ nhớ (`SpreadsheetApp`, `DriveApp`, `Utilities`) cho test, ghi nhận mọi thao tác ghi; kiểm tra bằng test chính nó (đọc, ghi, tạo tab, định dạng văn bản, mức chia sẻ)
- [x] 6.2 Cài đặt `onOpen` chỉ thêm menu và lệnh "Tính kỳ" đọc cấu hình, dữ liệu, kiểm tra, gọi lõi, ghi kết quả; kiểm tra bằng test "mở Sheet không ghi gì", "tính lại chỉ làm mới tab kết quả, không ô đầu vào nào đổi" (so sánh trạng thái trước và sau)
- [x] 6.3 Cài đặt kiểm tra chia sẻ trước khi ghi (từ chối khi chia sẻ rộng, khi không đọc được; cảnh báo khi có người cụ thể); kiểm tra bằng test ba tình huống chia sẻ của spec và test không ghi gì khi bị từ chối
- [x] 6.4 Cài đặt từ chối khi tên tab kết quả trùng tab đầu vào và lệnh khởi tạo khung cấu hình trong menu; kiểm tra bằng test "tên tab kết quả trùng tab đầu vào" và "tab đã có dữ liệu giữ nguyên"
- [x] 6.5 Cài đặt quy tắc không gọi ra ngoài; kiểm tra bằng test quét mã nguồn `src/` không có `UrlFetchApp`, `MailApp`, `GmailApp`, `fetch`, `eval`, `new Function`, `XMLHttpRequest`, và quét danh sách quyền khai báo chỉ gồm Sheet và Drive
- [x] 6.6 Tạo lệnh gộp mã (`node tools/build-gs.js`) sinh `dist/Code.gs` đúng thứ tự phụ thuộc và `dist/appsscript.json` có `oauthScopes` tường minh, thêm `dist/` vào `.gitignore`; kiểm tra bằng test nạp `dist/Code.gs` vào vùng chạy Node và chạy một kỳ bộ 1 qua Sheet giả cho đúng kết quả

## 7. Tài liệu và kiểm tra tích hợp

- [x] 7.1 Cập nhật README: cách triển khai từng bước (tạo Sheet riêng, chạy lệnh gộp, dán mã, cấp quyền Sheet và Drive, đặt Riêng tư, khởi tạo khung, dán báo cáo, nhập bảng, tính), các quyền cần cấp và lý do, cách đọc kết quả, và danh sách kiểm tay trên Sheet thật (định dạng văn bản, hộp thoại cấp quyền, chia sẻ rộng bị chặn); kiểm tra bằng làm theo phần lệnh chạy được trong README (`node --test`, lệnh gộp mã) và đọc lại danh sách kiểm tay
- [x] 7.2 Chạy ba bộ dữ liệu giả (bình thường, kỳ/khu vực/bậc khác, xấu hoặc thiếu trường) đi qua mảng hai chiều và Sheet giả, lưu cặp đầu vào/kết quả vào `tests/evidence/sheet-*`; kiểm tra bằng 3 cặp tệp có mặt, bộ 1 và bộ 2 trùng tính trực tiếp, bộ 3 báo lỗi có tab và dòng và không bịa số
- [x] 7.3 Cập nhật `tests/evidence/self-check.md` cho các mục C8, C10, C11, C12, C13 với hiện trạng thực tế của lớp Sheet (quyền, chia sẻ, văn bản/công thức, không gọi ngoài, log), nêu rõ mục nào cần kiểm tay trên Sheet thật; kiểm tra bằng tệp có đủ các mục và không tuyên bố "đã đạt chuẩn"
- [x] 7.4 Quét toàn bộ `src/`, `tests/`, `openspec/`, README bằng danh sách tên và tài khoản lấy từ file thật (không in ra) để chắc không có dữ liệu thật lọt vào; kiểm tra bằng kết quả 0 trùng ngoài thuật ngữ chung

## Workflow follow-up

- Change sau: duyệt và chốt kỳ (bản sao, xác nhận từng người thiếu, mở lại kỳ), giao diện HTML theo prototype, nhập từ tệp nếu cần.
- Chủ sở hữu tự thử trên Sheet riêng chứa dữ liệu giả trước khi dùng dữ liệu thật.
- Archive change sau khi hoàn tất và được chủ sở hữu xem lại.
