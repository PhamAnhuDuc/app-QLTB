# Design

## Context

- Đã có: lõi tính (`src/core/`, không đổi), lớp Sheet thuần (`src/sheet/`: đọc báo cáo, đọc cấu hình, nhập tay, dựng kết quả, điều phối, chia sẻ) và lớp Apps Script mỏng `gas.js` (menu, Tính kỳ, Khởi tạo khung). 8 main spec. Lớp Sheet đã được thử trên Sheet thật: Tính kỳ cho đúng 75.838.000đ, chặn khi chia sẻ rộng, "chưa tính" khi thiếu dữ liệu, chuỗi bắt đầu bằng `=` không thành công thức.
- Quy ước đang có: mọi lời gọi API Apps Script nằm trong tệp `gas*.js`; phần còn lại là hàm thuần có test bằng Node; không thêm thư viện; test quét mã nguồn để cấm gọi ra ngoài.
- Prototype PDF mô tả 5 bước (Tổng quan, Nhập point, Nhập key metrics, Kết quả, Duyệt và lưu) cộng màn Cấu hình. Giao diện làm **đầy đủ** theo prototype, kể cả sửa dữ liệu và cấu hình; sửa trực tiếp trên Sheet vẫn được và là đường dự phòng.

## Goals / Non-Goals

**Goals:**
- Duyệt và chốt kỳ an toàn, có bản sao đóng băng, có dấu vết, không tin kết quả cũ.
- Một bảng điều khiển gom quy trình, hiển thị an toàn, không mở đường dữ liệu ra ngoài.
- Kết quả dễ đọc.

**Non-Goals:**
- Đọc tệp Excel `.xlsx`; tự tải báo cáo từ hệ thống; tính theo ngày công; chạy theo lịch; nhiều người dùng.

## Decisions

1. **Bản sao kỳ là một tab, không phải nhiều tab.** Tab `Chot_<kỳ>` gồm siêu dữ liệu, bảng kết quả đã duyệt (để đọc bằng mắt) và JSON của toàn bộ cấu hình cùng dữ liệu kỳ đã dùng, chia đoạn 40.000 ký tự mỗi ô (giới hạn ô của Sheet là 50.000). *Vì sao:* một tab dễ bảo vệ, dễ đổi tên khi mở lại, không làm tab tăng theo số bảng. *Phương án khác:* sao chép từng tab đầu vào (nhân số tab lên hơn 18 mỗi kỳ).

2. **Dấu vân tay là băm FNV-1a 32 bit của chuỗi JSON.** Chỉ để phát hiện sửa tay hoặc hỏng dữ liệu, không phải bảo mật chống kẻ tấn công. *Vì sao:* thuần JavaScript, không cần thư viện hay quyền; Sheet đã riêng tư một người dùng. Ghi rõ giới hạn này.

3. **Tab bản sao được `protect()` ở chế độ chỉ cảnh báo.** Không khoá cứng vì chủ sở hữu là người duy nhất và cần quyền xử lý khi lỗi; cảnh báo đủ để tránh sửa nhầm.

4. **Chỉ mục `KyDaChot` là nhật ký sự kiện, không phải bảng trạng thái.** Mỗi lần chốt hoặc mở lại thêm một dòng; trạng thái hiệu lực là dòng mới nhất của kỳ. *Vì sao:* không bao giờ sửa dòng cũ nên dấu vết nguyên vẹn.

5. **Duyệt luôn tính lại từ các tab và dùng chung đường tính với "Tính kỳ"** (`tinhKyTuCacTab`), sau đó cũng ghi tab kết quả để cái bạn thấy là cái đã chốt. Điều kiện chặn dùng chính các dấu hiệu của lõi (`chanToanBo`, đối soát `dat`, `chuaTinh`).

6. **Xác nhận từng người ở máy chủ, không chỉ ở giao diện.** Hàm duyệt nhận danh sách tài khoản đã xác nhận và tự kiểm tra đủ so với danh sách người chưa tính vừa tính lại. *Vì sao:* giao diện chỉ là tiện ích; luật phải do máy chủ giữ để tránh dữ liệu cũ (người đổi dữ liệu giữa lúc mở hộp thoại và lúc bấm duyệt).

7. **Mở lại kỳ đổi tên tab cũ thay vì xoá.** `Chot_2026-09` thành `Chot_2026-09_cu1`, `_cu2`... Lý do mở lại lưu trong chỉ mục (do chủ sở hữu gõ, có thể chứa chữ bất kỳ nên được ghi dạng văn bản, không vào nhật ký hệ thống).

8. **Tính kỳ trên kỳ đã chốt: cảnh báo kèm so sánh, không chặn.** Chủ sở hữu vẫn cần xem số hiện tại để quyết có mở lại không. So sánh theo thu nhập từng người trong JSON bản chốt.

9. **Giao diện là hộp thoại phi phương thức (`showModelessDialog`) dựng bằng `HtmlService.createHtmlOutput`.** Trang là một chuỗi HTML/CSS/JS nằm trong mã nguồn, không có tệp riêng, không dùng template tải động. *Vì sao:* không chặn Sheet, không cần thêm quyền OAuth (đã có `script.container.ui`).

10. **Hiển thị an toàn bằng cách chỉ dùng `textContent` và `createElement`.** Không `innerHTML`, `document.write`, `eval`. Có test quét mã khách và test hiển thị chuỗi chứa thẻ HTML bằng DOM giả tối thiểu viết tay (không thêm thư viện kiểu jsdom). *Giới hạn thật:* DOM giả không thay trình duyệt, nên giao diện còn danh sách kiểm tay.

11. **Không có tài nguyên ngoài, kể cả phông Inter.** Guideline Sapo dùng Inter nhưng tải từ Google Fonts là một yêu cầu mạng; dùng họ phông hệ thống (`system-ui`), giữ màu và kiểu chữ của guideline. Ghi rõ đây là khác biệt có chủ đích.

12. **Giao diện chỉ gọi danh sách hàm máy chủ cố định, hàm mở tab chỉ nhận tên trong danh sách tab của ứng dụng** (tab đầu vào, đầu ra, và các tab báo cáo khai báo trong cấu hình). *Vì sao:* tránh cho trang (hoặc dữ liệu độc hại hiển thị trong đó) điều khiển Sheet ngoài ý muốn.

13. **Mô hình hiển thị dựng ở máy chủ bằng hàm thuần** (`taoMoHinhGiaoDien`), chỉ chứa những gì cần hiển thị. Số tiền gửi dạng số, định dạng 9.800.000đ làm ở trang.

14. **Định dạng `KetQua` do hàm thuần trả về danh sách thao tác (vùng, định dạng, in đậm, độ rộng)**, lớp `gas` chỉ áp dụng. *Vì sao:* test được vị trí vùng bằng Node.

15. **Quyền Drive: giữ `drive` mặc định, thêm một manifest `drive.readonly` để thử.** Chưa kiểm được `drive.readonly` đủ dùng với `getSharingAccess` trên Sheet thật; nếu sai, lệnh từ chối an toàn (không đọc được mức chia sẻ thì chặn). Chủ sở hữu thử rồi báo.

16. **Tách `gas.js` thành `gas.js` (menu, tính, khởi tạo), `gas-chot.js` (duyệt, mở lại, đọc bản chốt), `gas-giaodien.js` (mở hộp thoại và các hàm cho trang).** Giữ quy ước "chỉ `gas*.js` gọi API Apps Script"; test quét cập nhật theo mẫu tên.

17. **Bộ soạn bảng dùng chung, định nghĩa bảng ở một nơi.** `bang.js` mô tả mỗi bảng sửa được (tab, tiêu đề chuẩn, kiểu từng cột, danh sách chọn). Máy chủ có hai hàm chung: đọc bảng để sửa và lưu bảng; giao diện có một thành phần soạn bảng dùng cho Cấu hình và mọi khối nhập. *Vì sao:* tránh viết mười lăm form riêng, và mọi quy tắc kiểm tra nằm một chỗ. *Phương án khác:* form riêng từng bảng (nhiều mã, dễ lệch quy tắc).

18. **Kiểm tra trước khi ghi bằng chính bộ đọc và kiểm tra cấu hình hiện có.** Máy chủ dựng bản thử của các tab với bảng mới, chạy `docVaKiemTraCauHinh`, `lapDuLieuKy` và `tinhKyTuCacTab`, rồi chỉ chặn lỗi có `chiTiet.tab` trùng bảng đang lưu. Lỗi ở bảng khác trả về dạng cảnh báo. *Vì sao:* thêm một thành viên rồi mới thêm tỷ trọng của họ phải làm được từng bước; nhưng một bảng tự nó sai thì không được ghi.

19. **Chuyển kiểu rõ ràng, không đoán.** Số chỉ nhận chữ số với một dấu thập phân (chấm hoặc phẩy); "6.000.000" bị coi là chữ và bị từ chối thay vì đoán là sáu triệu hay 6. Ô chữ đặt định dạng văn bản trước khi ghi.

20. **Ghi theo bảng, ghi lại cột chuẩn; Lịch sử phiên bản của Sheets là chỗ khôi phục.** Việc lưu thay các dòng dữ liệu theo đúng cột chuẩn. Không tự sao lưu riêng (tránh thêm tab) mà dựa vào lịch sử phiên bản của Google Sheets và hộp xác nhận trước khi lưu. Cột lạ do người dùng tự thêm vào bên phải bảng không được bảo toàn; hộp xác nhận nói rõ.

21. **Chặn ghi khi kỳ đã chốt hoặc Sheet chia sẻ rộng, do máy chủ giữ.** Bảng nhập tay và nhập báo cáo bị chặn khi kỳ Đã chốt (chỉ dẫn mở lại kỳ); bảng cấu hình vẫn sửa được kèm cảnh báo vì đổi cấu hình cho kỳ sau là việc bình thường và bản chốt đã đóng băng.

22. **Mô hình có hai cờ: `daTinh` (đã tính để xem) và `daGhiKetQua` (đã ghi ra tab kết quả).** Sau khi sửa bảng, máy chủ tính lại chỉ để xem và đánh dấu chưa ghi; "Tính kỳ" mới ghi. *Vì sao:* các màn chi tiết cần số liệu tươi sau khi sửa mà không ghi tab kết quả ngoài ý muốn.

23. **Nhập báo cáo bằng dán văn bản hoặc chọn tệp CSV/TSV; không đọc `.xlsx`.** Tệp được đọc bằng `FileReader` ngay trong trình duyệt (không tải lên đâu), máy chủ phân tích văn bản (dấu tab, phẩy, chấm phẩy, dấu nháy kép), chuyển ô chỉ gồm chữ số thành số, kiểm tra bằng bộ đọc báo cáo, đặt giới hạn 20.000 dòng, 60 cột và 5.000.000 ký tự. *Vì sao:* đọc xlsx cần thư viện giải nén hoặc dịch vụ Drive nâng cao (thêm quyền); người dùng có thể lưu CSV từ Excel.

24. **Chọn kỳ ghi vào ô tháng của tab `Ky` dạng văn bản**, danh sách tháng từ sáu tháng trước đến sáu tháng sau kỳ hiện tại (hoặc tháng hiện tại nếu chưa chọn).

25. **Màn Dữ liệu cũ gộp vào Tổng quan** (tình trạng tab và nút mở tab) để thanh điều hướng đúng thứ tự prototype.

## Risks / Trade-offs

- [Ghi sai vào bảng cấu hình làm đổi lương] → Kiểm tra trước khi ghi, hộp xác nhận, ghi nhật ký sự kiện, kỳ đã chốt vẫn giữ số cũ, lịch sử phiên bản của Sheets để khôi phục; dùng Sheet thử với dữ liệu giả trước.
- [Ghi bằng giao diện làm mất cột người dùng tự thêm] → Hộp xác nhận nêu rõ và ghi chú trong README; chỉ ảnh hưởng các bảng sửa được.
- [Hộp thoại HTML không chạy thử được trong Node] → DOM giả cho logic hiển thị, quét mã tĩnh cho an toàn, danh sách kiểm tay trên Sheet thật.
- [Bản chốt chứa dữ liệu lương ngay trong Sheet] → Sheet vẫn riêng tư một người, kiểm tra chia sẻ trước mọi thao tác ghi, tab được bảo vệ cảnh báo; ghi rõ ở README.
- [Số tab tăng mỗi kỳ] → Mỗi kỳ chốt một tab; chấp nhận được. Chủ sở hữu có thể ẩn tab cũ.
- [Chốt dở dang nếu script lỗi giữa chừng] → Ghi tab bản sao trước, ghi dòng chỉ mục sau cùng làm điểm xác nhận; tab bản sao không có dòng chỉ mục tương ứng bị coi là mồ côi; lần chốt sau **đổi tên nó thành bản cũ** (`Chot_<kỳ>_cu<n>`) thay vì xoá hay ghi đè, nên không bao giờ mất dữ liệu.
- [Dấu vân tay không chống kẻ tấn công] → Đã nêu giới hạn; Sheet một người dùng.
- [Người dùng đổi dữ liệu giữa lúc mở giao diện và lúc duyệt] → Duyệt luôn tính lại và kiểm tra xác nhận ở máy chủ (Decision 6).
- [Kích thước và thời gian Apps Script] → Quy mô vài trăm dòng, đọc ghi hàng loạt; vẫn ghi trong README.
- [Thử thật mới biết `protect()` và `HtmlService` chạy trên tài khoản Workspace] → Danh sách kiểm tay; lỗi ở đây không làm sai số, chỉ làm hộp thoại hay bảo vệ không hoạt động.

## Migration Plan

Không có dữ liệu cũ. Tab mới (`KyDaChot`, `Chot_*`) chỉ xuất hiện khi chốt lần đầu. Thử trên Sheet thử với dữ liệu giả trước (bản thử có nạp mẫu), rồi dùng thật. Rollback: xoá menu bằng cách dán lại bản mã cũ; các tab chốt đã tạo vẫn là dữ liệu hợp lệ và không ảnh hưởng gì nếu không dùng.

## Open Questions

- `drive.readonly` có đủ cho `getSharingAccess` không? Kết quả của chủ sở hữu quyết định có đổi mặc định hay không; không ảnh hưởng spec.
- Có muốn giao diện hiển thị tên thành viên hay chỉ tài khoản? Mặc định hiển thị tên (kèm tài khoản khi cần), vì đây là Sheet riêng của chủ sở hữu.
