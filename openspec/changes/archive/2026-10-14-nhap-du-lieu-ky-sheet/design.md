# Design

## Context

- Lõi tính đã có (`src/core/`, 4 main spec): `kiemTraCauHinh`, `tinhKy(cauHinh, duLieuKy)`, `taoLog`. Hàm thuần, nhận và trả đối tượng JSON; xem `tests/fixtures/` để biết cấu trúc `config.json` và `ky.json`. Lõi không đọc hay ghi Sheet.
- Báo cáo kiểm kê thật (chỉ xem cấu trúc, không dùng số): một tab nhiều dòng đầu (đơn vị, địa chỉ, tên báo cáo, dòng "Từ ngày … đến ngày …"), hai dòng tiêu đề với nhóm "Xuất trong kỳ" phía trên "SL bán ra trong kỳ" và "SL chuyển kho", một dòng "Tổng", các dòng sản phẩm, và dòng chân bảng "Tổng số dòng : N". Có dòng sản phẩm không có mã hàng. Giá trị trong dòng "Tổng" của file xuất có thể là kết quả công thức chưa tính lại nên không đáng tin.
- Môi trường: Google Sheet riêng tư + Apps Script, một người dùng, Tier 3. Apps Script là V8, mọi tệp `.gs` dùng chung phạm vi toàn cục, đúng cách `src/core/` đang được viết (không module).
- Design của change trước để ngỏ cách đưa báo cáo vào Sheet (dán hay đọc tệp). Change này chốt.

## Goals / Non-Goals

**Goals:**
- Chủ sở hữu dán báo cáo, nhập các bảng còn lại, bấm một lệnh trong menu, và xem kết quả có giải thích.
- Toàn bộ phần chuyển đổi dữ liệu chạy và test được bằng Node với bảng hai chiều giả, không cần Apps Script.
- Lỗi nhập liệu chỉ ra tab và dòng; dữ liệu đầu vào không bao giờ bị ghi đè.

**Non-Goals:**
- Duyệt/chốt kỳ, bản sao kỳ, mở lại kỳ; giao diện HTML; tải tệp tự động; chạy theo lịch; tính theo ngày công.
- Dùng `clasp`, thư viện ngoài hay dịch vụ ngoài.

## Decisions

1. **Ba lớp: lõi, bộ chuyển đổi thuần, lớp Apps Script mỏng.**
   - `src/core/` giữ nguyên.
   - `src/sheet/` có hai nhóm: bộ chuyển đổi thuần (nhận mảng hai chiều, trả đối tượng và lỗi có tab/dòng; ngược lại biến kết quả thành mảng hai chiều để ghi), và lớp `gas` chỉ gọi `SpreadsheetApp`, `DriveApp`, `Utilities`.
   - *Vì sao:* phần dễ sai (nhận diện cột, ngày, số, ô trống) nằm ở hàm thuần nên test được bằng Node. *Phương án khác:* viết thẳng trong Apps Script, nhưng không test được và rất khó đối soát.

2. **Dán báo cáo vào tab, không tải tệp.** Mỗi khu vực một tab; khu vực lấy từ tên tab cấu hình. *Vì sao:* đọc xlsx trong Apps Script cần Drive API nâng cao và thêm quyền, phức tạp và tăng bề mặt rủi ro; dán thì chủ sở hữu thấy ngay dữ liệu và dễ kiểm. *Phương án khác:* chọn tệp từ Drive (cần hộp thoại HTML, để change sau nếu thật sự cần).

3. **Nhận diện bảng theo tên cột, không theo vị trí.** Quét các dòng đầu tìm "Mã hàng", rồi tìm tiêu đề "SL bán ra trong kỳ" và "SL chuyển kho" trong dòng đó và dòng kế tiếp, ghép theo cột; dữ liệu bắt đầu sau dòng tiêu đề cuối. So khớp bỏ phân biệt hoa/thường và khoảng trắng. Dòng nào có chữ "Tổng" ở cột đầu bị bỏ; dòng chân bảng được dùng để đối chiếu số dòng. Không tin dòng "Tổng" vì có thể là giá trị cũ.

4. **Chuyển giá trị bất hợp lệ cho lõi quyết định khi có thể.** Với nhật ký, số ca/đơn và báo cáo kiểm kê, bộ chuyển đổi giữ nguyên giá trị thô không hợp lệ (chữ, âm, thiếu loại việc) để lõi chặn đúng người hoặc nguồn bị ảnh hưởng, đồng thời ghi lỗi tab/dòng riêng. *Vì sao:* nếu bộ chuyển đổi âm thầm bỏ dòng lỗi thì điểm của người liên quan bị tính thiếu mà trông vẫn hợp lệ; để lõi chặn thì "chưa tính" xuất hiện thay vì số sai. Chỉ lỗi cấu trúc mà lõi không nhìn thấy (thiếu tab, thiếu cột, ngày sai, cấp độ lạ, khai báo trùng) mới được xử lý riêng ở bộ chuyển đổi, và khu vực bị lỗi cấu trúc coi như chưa có báo cáo.

5. **Ngày xử lý thuần chuỗi.** Khoảng ngày được trích bằng biểu thức chính quy và kiểm tra tồn tại ngày bằng bảng số ngày trong tháng (có năm nhuận); ngày đầu và cuối kỳ suy ra từ tháng. Không dùng `Date` nên không phụ thuộc múi giờ của Sheet hay của máy chạy test.

6. **Số: chỉ nhận số thật.** `getValues()` trả số cho ô số; chuỗi không phải số là lỗi, không đoán dấu phân cách nghìn hay thập phân theo vùng. *Vì sao:* đoán định dạng là nguồn sai số tiềm ẩn khi dán dữ liệu từ nơi khác.

7. **Cấu hình theo tiêu đề cột; có lệnh khởi tạo khung.** Mỗi bảng cấu hình một tab, đọc cột theo tiêu đề, có kiểm tra ngay khi đọc bằng `kiemTraCauHinh`. Tỷ trọng key metrics của thành viên ở tab riêng dạng dài (tài khoản, chỉ số, tỷ trọng). Khung mặc định tạo tab còn thiếu và không bao giờ ghi đè.

8. **Ghi kết quả bằng ghi hàng loạt vào tab riêng, ở dạng văn bản.** Các ô văn bản (thông điệp, mã, tên) đặt định dạng văn bản thuần trước khi ghi để Sheet không hiểu thành công thức, thêm một lớp vô hiệu hoá khi chuỗi bắt đầu bằng "=", "+", "-", "@". Hàm thuần dựng sẵn mảng hai chiều; lớp `gas` chỉ gọi một lần `setValues` mỗi vùng. Tab kết quả bị xoá và ghi lại; không bao giờ động tới tab đầu vào, và từ chối nếu tên tab kết quả trùng tab đầu vào.

9. **Kiểm tra chia sẻ bằng Drive (chủ sở hữu đã đồng ý cấp quyền).** `DriveApp.getFileById(...).getSharingAccess()` để phát hiện chia sẻ theo liên kết hoặc theo tên miền, từ chối tính nếu rộng hoặc nếu không đọc được. *Cái giá:* quyền Drive rộng hơn quyền chỉ đọc Sheet (xem Risks). *Phương án khác:* chỉ dặn chủ sở hữu tự kiểm, nhưng chuẩn Sapo 2.11 coi "bất kỳ ai có link" là lỗi phổ biến nhất nên nên kiểm tự động.

10. **Gộp mã bằng một lệnh Node, không thêm công cụ.** Lệnh nối `src/core/*.js` và `src/sheet/*.js` theo thứ tự thành `dist/Code.gs` kèm `dist/appsscript.json` khai báo rõ quyền (`oauthScopes`), bỏ `dist/` khỏi git. Chủ sở hữu dán vào trình soạn Apps Script. *Phương án khác:* `clasp` (thêm công cụ và token đăng nhập cần giữ an toàn).

11. **Kiểm thử lớp Apps Script bằng một Sheet giả trong bộ nhớ.** Một đối tượng giả tối thiểu của `SpreadsheetApp`, `DriveApp`, `Utilities` đủ để test menu, thứ tự đọc-tính-ghi, chặn khi chia sẻ rộng, không ghi vào tab đầu vào. Những gì chỉ kiểm được trên Sheet thật (hành vi định dạng văn bản, hộp thoại cấp quyền) đi vào danh sách kiểm tay.

12. **Tên tab là hằng số ở một nơi.** Các tab cấu hình và tab kết quả/giải thích/nhật ký có tên cố định trong một tệp hằng số; tên tab báo cáo của từng khu vực nằm trong cấu hình.

## Risks / Trade-offs

- [Dán thiếu hoặc sai dòng] → Đối chiếu số dòng với chân bảng, kiểm khoảng ngày, báo lỗi khi cột thiếu; chủ sở hữu thấy dữ liệu ngay trên tab.
- [Báo cáo đổi cách trình bày (đổi tên cột, thêm dòng)] → Nhận diện theo tên cột nên chịu được dịch chỗ; đổi tên cột thì báo lỗi rõ thay vì đọc sai.
- [Chuỗi từ báo cáo bị Sheet hiểu thành công thức] → Định dạng văn bản trước khi ghi cộng vô hiệu hoá ký tự đầu; kiểm tay một lần trên Sheet thật vì Node không mô phỏng được.
- [Quyền Drive rộng để kiểm tra chia sẻ (chủ sở hữu đã chấp nhận)] → Chỉ dùng cho đọc mức chia sẻ của đúng tệp này; không gọi gì khác của Drive; ghi rõ trong README. Nếu chủ sở hữu không muốn cấp quyền, hệ thống từ chối tính (an toàn) hoặc phải đổi quyết định này.
- [Apps Script chạy với quyền của chủ sở hữu] → Không gọi mạng, không gửi thư, không thêm thư viện; liệt kê quyền trong `appsscript.json`.
- [Dữ liệu thật rơi vào repo] → Fixture báo cáo dùng dữ liệu giả cùng cấu trúc; `.gitignore` chặn `dist/` và tệp dữ liệu thật; quét tên/tài khoản thật như change trước.
- [Giới hạn thời gian và kích thước Apps Script] → Quy mô vài trăm dòng, đọc và ghi hàng loạt; không đáng lo, vẫn ghi trong README.
- [Định dạng số theo vùng khi ô được nhập tay dạng chữ] → Từ chối chuỗi số thay vì đoán (Decision 6).

## Migration Plan

Không có dữ liệu cũ phải di chuyển. Triển khai thử trên một Sheet riêng chứa dữ liệu giả: chạy lệnh khởi tạo, dán báo cáo giả, nhập các bảng, tính và so với kết quả của lõi trên cùng dữ liệu. Chỉ sau khi chủ sở hữu tự kiểm tra trên Sheet riêng mới dùng dữ liệu thật. Rollback: xoá các tab và script, quay lại workbook cũ; không có thay đổi nào ngoài Sheet này.

## Open Questions

- Tên tab cụ thể cho từng bảng (đặt tiếng Việt có dấu hay không dấu) chốt khi viết khung mặc định; không đổi hành vi.
- Khi cần nhập từ tệp thay vì dán (nhiều tháng, nhiều khu vực), có làm change riêng không?
