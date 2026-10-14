# Tự soát checklist C1–C13 (lõi tính và lớp Google Sheet)

> Đây là **hồ sơ tự soát để mang đi review**, không phải kết luận "đã đạt chuẩn" hay "đã được duyệt".
> Quyền quyết đạt/không đạt thuộc về con người: quản lý khối, Đội kỹ thuật AI, hoặc Hội đồng AI với các trường hợp dữ liệu Bảo mật đặc biệt.
> Phạm vi: change `tinh-thu-nhap-ky` (lõi tính trong `src/core/`) và change `nhap-du-lieu-ky-sheet` (lớp Google Sheet trong `src/sheet/`) và change `duyet-chot-ky-va-giao-dien` (duyệt, chốt, mở lại kỳ, bảng điều khiển HTML và sửa cấu hình, dữ liệu nhập ngay trong giao diện). Lớp Sheet đã được chủ sở hữu thử trên Sheet thật với dữ liệu giả (Tính kỳ, F1, F3, F10 đạt). **Duyệt, chốt, mở lại và bảng điều khiển HTML mới chỉ kiểm thử trên Sheet giả và DOM giả, chưa chạy trên Sheet hay trình duyệt thật**; chưa chạy trên dữ liệu thật.
> Tier tự phân loại: **Tier 3** (lương thưởng, mục D5). Ngày soát: 2026-10-14 (cập nhật cho lớp Sheet cùng ngày). Bộ test: 515 test, 0 lỗi (`node --test`).

| Mã | Trạng thái tự soát | Bằng chứng / ghi chú |
|---|---|---|
| **C1** Trách nhiệm | **Chưa đạt đầy đủ** | Có owner (một người, người check cuối). **Không có backup**; kênh báo lỗi chỉ là owner. Rủi ro đã ghi ở README và design.md. Với Tier 3 chuẩn khuyên phối hợp Đội kỹ thuật AI khi vận hành lâu dài: chưa thực hiện. |
| **C2** Khớp spec | Đạt (tự soát) | Ví dụ mẫu trong spec ra đúng: 9.200.000 và 16.200.000 (`tests/income.test.js`, test 5.3), 14.933.333 (máy công ty). Bộ 1 cộng tay từng người khớp (tổng 75.838.000). %HT: 97,9% và 58,3% (`tests/keymetrics.test.js`). |
| **C3** Ổn định | Đạt (tự soát) | Chạy hai lần cùng đầu vào cho cùng kết quả, và tính không làm đổi đầu vào (test 5.7). Bằng chứng tái lập được: chạy lại `node tests/bang-chung.js` không đổi tệp nào. |
| **C4** Không hardcode | Đạt (tự soát) | Đơn giá point, phụ cấp, hệ số hỗ trợ sale, point mỗi ca, hệ số Min, trần doanh thu, bảng bậc, bậc thang, QĐCV, hệ số chia, danh sách thành viên đều ở `config.json`. `grep` trong `src/core/` không thấy 50000, 200000, 0,17, 0,7, 1,2, 0,375, "HN", "HCM". Có test đổi đơn giá, đổi hệ số Min và đổi % bậc thang. Bộ 2 là kỳ/khu vực/bậc khác và vẫn tính đúng. Còn hằng số kỹ thuật trong code: tên 3 nguồn point, 3 kiểu chỉ số, dung sai so sánh số thực (1e-9, 1e-12), nhãn "Đề xuất – chờ duyệt". |
| **C5** An toàn dữ liệu | Đạt (tự soát), có lưu ý | Dữ liệu mẫu, test và tài liệu chỉ dùng dữ liệu giả. Đã quét toàn bộ `src/`, `tests/`, `openspec/`, `README.md`, `mini-prd-form-tinh-point.md` với danh sách tên và tài khoản lấy từ file thật: không trùng tên người hay tài khoản nào (chỉ trùng thuật ngữ chung). Lưu ý: thư mục `Prototype/` (ngoài phạm vi lõi) chứa file Excel dữ liệu thật; đã thêm vào `.gitignore` để không bị commit nhầm, nhưng nên chuyển ra ngoài repo. Lõi không xử lý dữ liệu khách hàng nên không cần bước ẩn danh hoá. Chưa gặp trường hợp phải xin phê duyệt riêng của Hội đồng AI (không dùng công cụ ngoài whitelist, không gộp dữ liệu nhiều bộ phận, không chạy tự động theo lịch). |
| **C6** Bằng chứng test | Đạt (tự soát) | Ba bộ: `bo1` bình thường, `bo2` kỳ/bậc/đơn giá/hệ số khác, `bo3` xấu/thiếu trường. Cặp đầu vào và kết quả lưu trong `tests/evidence/` (`bo*-dau-vao.json`, `bo*-ket-qua.json`), có test bảo đảm tệp khớp kết quả hiện tại. |
| **C7** Input xấu | Đạt (tự soát) | Bộ 3 báo lỗi rõ và không bịa số: mã hàng lạ, số ca âm, ô trống, tài khoản lạ, loại việc không có hệ số, mục tiêu bằng 0, hệ số chia lệch, tỷ trọng lệch, báo cáo chỉ phủ một phần kỳ. Người thiếu dữ liệu có thu nhập `null` (không phải 0); tổng không ai tính được để trống. Mỗi lỗi chỉ chặn phần phụ thuộc nó (test 6.1). |
| **C8** On-brand khi có UI | **Đạt một phần, cần kiểm tay** | Bảng điều khiển dùng Sapo Blue `#007AFF`, Sapo Green `#16D865` cho thành công, nền Off-Blue `#F0F4F9`, chữ Berkeley Blue, chữ viết theo câu (test kiểm không có `uppercase`), căn trái. **Khác guideline có chủ đích:** dùng phông hệ thống thay vì Inter, vì tải Inter từ ngoài là một yêu cầu mạng (có test cấm tài nguyên ngoài). Có đủ trạng thái: rỗng (kèm nút Tính kỳ), đang tải/đang xử lý (nút bị vô hiệu), lỗi (tiếng Việt), thành công, hộp xác nhận trước duyệt và mở lại, và ô chưa tính hiện "—". Kiểm thử bằng DOM giả viết tay và quét tĩnh, **chưa nhìn bằng mắt trên trình duyệt thật**: cần kiểm tay bố cục, độ rộng, màu thực tế. |
| **C9** Secret an toàn | Đạt (tự soát) | Lõi không dùng secret, API key hay kết nối ngoài (`grep` token/password/secret/fetch/require không có kết quả trong `src/core/`). `.gitignore` chặn `.env`, `.clasprc.json`, `credentials*`, `service-account*`. Hướng dẫn secret nằm ở README. |
| **C10** Môi trường chạy rõ | **Đạt một phần** | Môi trường đã xác định: Google Sheet riêng tư + Apps Script, một người dùng. Dữ liệu và cấu hình nằm trong các tab của Sheet; log nằm ở tab `NhatKyHeThong`; không có secret. Quyền truy cập: chỉ chủ sở hữu, **do lệnh Tính kỳ tự chặn khi Sheet chia sẻ rộng** (kiểm bằng test trên Sheet giả). Chưa triển khai thật nên chưa kiểm được trên Sheet thật: xem danh sách kiểm tay trong README. |
| **C11** Log & vận hành | Đạt (tự soát) cho phần mã; cần kiểm tay trên Sheet thật | Tab `NhatKyHeThong` chỉ thêm dòng gồm thời điểm, mức, loại lỗi, tên trường, phạm vi. Test xác nhận log của cả 3 bộ dữ liệu giả không chứa tên, tài khoản, mã hàng, nội dung nhật ký công việc, email người được chia sẻ hay số tiền (`tests/sheet-ketqua.test.js`, `tests/gas.test.js`, `tests/bang-chung-sheet.test.js`). Lỗi nhập liệu nêu tab, dòng, cột để chủ sở hữu tự xử lý. Chưa có kênh báo lỗi nào ngoài chính chủ sở hữu. |
| **C12** Rollback/dừng app | **Đạt cho phần mã; cần kiểm tay trên Sheet thật** | Tính kỳ không sửa tab đầu vào (test trước và sau). **Duyệt và mở lại cũng không sửa tab đầu vào** (test cả quy trình). Có **bản sao đóng băng** của mỗi kỳ chốt và **mở lại kỳ có lý do và dấu vết**: bản chốt cũ được đổi tên, không bao giờ xoá; chỉ mục là nhật ký sự kiện không sửa dòng cũ; chốt dở dang không mất dữ liệu (dòng chỉ mục ghi sau cùng, tab dở dang được đổi tên khi chốt lại). Dừng app: xoá mã Apps Script hoặc quay lại workbook cũ; các tab chốt đã tạo vẫn là dữ liệu hợp lệ. Chưa có preview/dry-run riêng vì không có bước ghi sang hệ thống khác. Hành vi `protect()`, đổi tên và tạo tab trên Sheet thật cần kiểm tay. |
| **C13** Bảo mật code | Đạt cho phạm vi mã hiện có; một số mục phải kiểm tay | Chia sẻ "bất kỳ ai có liên kết": lệnh tự đọc mức chia sẻ và từ chối khi chia sẻ rộng (ANYONE, ANYONE_WITH_LINK, DOMAIN, DOMAIN_WITH_LINK) hoặc khi không đọc được; cảnh báo khi có người cụ thể. Chuỗi từ dữ liệu bắt đầu bằng `=`, `+`, `-`, `@` được vô hiệu hoá và các ô văn bản được đặt định dạng văn bản trước khi ghi (công thức trong Sheet là dạng injection của app này); test trên Sheet giả cho 0 ô công thức, **nhưng hành vi thật của Sheet cần kiểm tay**. Không gọi ra ngoài: test quét mã nguồn không có `UrlFetchApp`, `MailApp`, `GmailApp`, `fetch`, `eval`, `new Function`, `ScriptApp`... và chỉ dùng `SpreadsheetApp.getActiveSpreadsheet/getUi`, `DriveApp.getFileById`, `Utilities.formatDate`. Quyền khai báo tường minh trong `appsscript.json` (Sheet đang mở, giao diện, Drive; không có quyền mạng, thư, lịch) và có test; quyền `drive` rộng hơn cần thiết nên cần kiểm xem `drive.readonly` có đủ không. Không thêm package nào (không `package.json`), không dùng `clasp`. `.gitignore` chặn `dist/`, `.env`, `.clasprc.json`, dữ liệu thật. Đọc báo cáo: chỉ nhận số thật, từ chối chuỗi số; chỉ lấy trường cần, không mang giá trị tồn hay giá bán vào kết quả/log (có test). SSRF, webhook, CORS, xác thực/mật khẩu: N/A (không có máy chủ web, không nhận URL). XSS và nhận tệp: xem mục cập nhật bảng điều khiển bên dưới. |

## Cập nhật khi thêm lớp Google Sheet

- **C2/C3 (khớp spec, ổn định):** vòng kiểm tra đầy đủ: bộ 1 và bộ 2 → mảng hai chiều → đọc lại → `tinhKy` cho thu nhập từng người trùng với tính trực tiếp từ JSON; qua lệnh "Tính kỳ" trên Sheet giả cũng trùng (`tests/bang-chung-sheet.test.js`). Chạy hai lần cho cùng kết quả; bản gộp `dist/Code.gs` cho kết quả y hệt bản nạp từng tệp.
- **C6 (bằng chứng test):** thêm 3 cặp đầu vào/kết quả qua Sheet giả trong `tests/evidence/sheet-bo*-dau-vao.json` và `sheet-bo*-ket-qua.json`.
- **C7 (input xấu):** bộ 3 qua Sheet giả báo lỗi có tab và dòng (số ca âm, mã hàng lạ, nhật ký thiếu, hệ số lệch, tỷ trọng lệch, báo cáo thiếu ngày...), người bị ảnh hưởng "chưa tính" với ô "—", tổng không ai tính được là "—".
- **C5:** quét tên và tài khoản lấy từ file thật trên `src/`, `tests/`, `openspec/`, README: không trùng tên người hay tài khoản nào (chỉ trùng thuật ngữ chung và tên cột của báo cáo). Fixture báo cáo kiểm kê là dữ liệu giả có cùng cấu trúc.
- **C9:** vẫn không có secret; không dùng `clasp` nên không có token đăng nhập nào.

### Điều chủ sở hữu phải tự kiểm trên Sheet thật

Xem danh sách kiểm tay trong README mục "Kiểm tay trên Sheet thật": hộp thoại cấp quyền, chặn khi chia sẻ rộng, hành vi định dạng văn bản và dấu nháy đơn, ô tháng bị đổi thành ngày, tính hai lần, nhật ký không lộ dữ liệu, quyền Drive tối thiểu.

## Cập nhật khi thêm duyệt, chốt kỳ và bảng điều khiển

- **C1 (trách nhiệm):** vẫn **chưa đạt đầy đủ**: một owner, không có backup. Với Tier 3 nên có người thứ hai biết cách mở lại kỳ và đọc bản chốt.
- **C2/C3 (khớp spec, ổn định):** vòng đầu cuối trang ↔ máy chủ ↔ Sheet giả: mở, Tính kỳ (75.838.000đ), duyệt, lịch sử, mở lại, chốt lại cho kết quả đúng (`tests/gas-giaodien.test.js`). Bản gộp `dist/Code.gs` và `Code-thu.gs` cho kết quả y hệt bản nạp từng tệp ở quy trình duyệt và mở lại. Bằng chứng tái lập được khi chạy lại (`tests/evidence/chot-*.json`).
- **C5 (an toàn dữ liệu):** bản chốt chỉ lưu các trường cần tái lập kết quả, không giá bán, giá trị tồn hay mô tả nhật ký (test). Mô hình gửi cho trang không chứa bảng thô, giá bán, giá trị tồn, tên hàng hay mô tả nhật ký; **có** mã hàng, nhóm và số lượng (prototype yêu cầu hiển thị phân rã point; test). Bản chốt chứa dữ liệu lương **trong chính Sheet riêng tư**: rủi ro còn lại là Sheet bị chia sẻ nhầm, đã có chặn tự động khi chia sẻ rộng trước mọi thao tác duyệt, mở lại, tính. Quét tên và tài khoản lấy từ file thật cho `src/`, `tests/`, `tools/`, `dist/`, `openspec/`, README: xem kết quả quét ở cuối mục này.
- **C6/C7:** bằng chứng chốt bộ 1 (chốt → sửa dữ liệu → cảnh báo khác bản chốt → từ chối chốt lại → mở lại → chốt lại với hai người bị bỏ qua) và bộ 3 (từ chối, không tạo tab, không thao tác ghi).
- **C10 (môi trường):** thêm hai manifest quyền: mặc định `drive` (đã kiểm chứng) và `drive.readonly` (chưa kiểm chứng). Quyền Drive rộng vẫn là điểm đáng chú ý nhất về an toàn.
- **C11 (log):** nhật ký hệ thống ghi sự kiện `KY_DA_CHOT`, `KY_MO_LAI` chỉ với loại sự kiện và phạm vi `sukien`, không tên, tài khoản, số tiền, lý do hay tên tab bản sao (test với lý do và tài khoản cố ý "nhạy cảm").
- **C13 (bảo mật code):**
  - *XSS:* mã trang chỉ dùng `createElement` và `textContent`; test quét tĩnh cấm `innerHTML`, `outerHTML`, `document.write`, `eval`, `new Function`; DOM giả ném lỗi nếu bị dùng; test tên chứa `<img onerror>` và `<script>` hiển thị thành chữ. **Chưa kiểm trên trình duyệt thật.**
  - *Tài nguyên ngoài:* trang không có `http://` hay `https://`, thẻ `link`, `img`, `iframe`, `@import`, `url()`; test.
  - *Điều khiển từ trang:* trang chỉ gọi 11 hàm trong danh sách cố định (trang tự từ chối tên khác; test khớp danh sách với máy chủ); hàm mở tab chỉ nhận tên trong danh sách và từ chối `Sheet1`, tên rỗng, `../`, tab lạ (test).
  - *Luật ở máy chủ:* xác nhận từng người và điều kiện chặn do máy chủ giữ, không tin giao diện (test gửi tham số sai kiểu, danh sách thiếu).
  - *Công thức:* chuỗi từ dữ liệu bắt đầu bằng `=`, `+`, `-`, `@` được vô hiệu hoá; các đoạn JSON của bản chốt luôn có tiền tố `~` và ô được đặt định dạng văn bản; lý do mở lại bắt đầu bằng `=` được ghi như chữ (test trên Sheet giả).
  - *Quét API:* `HtmlService` chỉ ở `gas-giaodien.js` và chỉ `createHtmlOutput`; cấm `createTemplate`, `createHtmlOutputFromFile`, `UrlFetchApp`, `MailApp`... Đã kiểm chứng bộ quét có hiệu lực: thêm tạm lời gọi cấm làm test đỏ, gỡ ra thì xanh.
  - *Toàn vẹn:* dấu vân tay FNV-1a chỉ phát hiện sửa tay hoặc hỏng, **không** chống kẻ tấn công (đã ghi rõ).

**Kết quả quét tên và tài khoản thật (2026-10-14):** 135 tệp (`src/`, `tests/`, `tools/`, `dist/`, `openspec/`, README, hướng dẫn thử), danh sách tên và tài khoản lấy từ file thật (không in ra). 0 trùng tên người hay tài khoản; chỉ trùng thuật ngữ chung (tên cột báo cáo, nhãn như "email", "tên nhân viên").

### Điều chủ sở hữu phải tự kiểm trên Sheet thật (thêm)

Danh sách kiểm tay trong README và mục I của `HUONG-DAN-THU-NGHIEM.md`: hộp thoại mở và bố cục, các nút, hộp xác nhận, bảo vệ chỉ cảnh báo của tab bản sao, đổi tên tab khi mở lại, giới hạn ô 50.000 ký tự với dữ liệu thật lớn hơn, `drive.readonly`.


## Cập nhật khi cho bảng điều khiển sửa cấu hình và dữ liệu nhập

Đây là thay đổi **đảo ngược một nguyên tắc cũ** ("giao diện không sửa dữ liệu"), nên các điểm sau cần người review nhìn kỹ.

- **C2/C3 (khớp spec, ổn định):** các test chạy trang thật với DOM giả và **các hàm máy chủ thật** trên Sheet giả: sửa đơn giá, lưu, tính, duyệt cho kết quả mới đúng (`tests/giaodien-sua.test.js`); bản gộp `dist/Code.gs` cho kết quả y hệt bản nạp từng tệp ở quy trình sửa, đặt kỳ, khôi phục mặc định, tính, duyệt (`tests/build.test.js`). Quỹ theo nguồn khớp tính tay bộ 1 (HN 237,3, HCM 203,8; bảo hành 300 và 250; hỗ trợ sale 68 và 102; quản lý kho 28).
- **C5 (an toàn dữ liệu):** dữ liệu vẫn chỉ nằm trong Sheet riêng tư; thêm đường **ghi từ giao diện** nên mọi thao tác ghi bị chặn khi Sheet chia sẻ rộng hoặc không đọc được mức chia sẻ (test cho lưu bảng, đặt kỳ, khôi phục mặc định, nhập báo cáo). Việc đọc tệp CSV/TSV diễn ra **trong trình duyệt** bằng `FileReader` (chỉ `readAsText`; test cấm `readAsDataURL`/`readAsArrayBuffer`), tệp không đi đâu ngoài cuộc gọi máy chủ của chính Sheet. Giới hạn: 5 MB, 20.000 dòng, 60 cột, 5.000.000 ký tự; vượt thì từ chối.
- **C6/C7 (bằng chứng, input xấu):** `tests/evidence/sua-bo1.json` (tái lập được, có test khớp): ô số chứa chữ, hệ số chia lệch tổng, báo cáo thiếu cột, khu vực lạ, tháng sai, khôi phục mặc định bảng không có mặc định đều bị từ chối **không ghi thao tác nào**; kỳ đã chốt khoá bảng nhập tay nhưng cho sửa cấu hình kèm cảnh báo.
- **C11 (log):** nhật ký hệ thống chỉ thêm mã sự kiện (`SUA_BANG_CAU_HINH`, `SUA_BANG_NHAP_TAY`, `NHAP_BAO_CAO`, `DAT_KY`, `KHOI_PHUC_MAC_DINH`); test với giá trị, tên và tài khoản cố ý cụ thể xác nhận không lộ nội dung bảng.
- **C12 (rollback):** mỗi lần lưu **thay toàn bộ nội dung một tab**, nên sửa nhầm chỉ khôi phục được bằng Lịch sử phiên bản của Google Sheets (đã ghi ở hộp xác nhận và README). Nút Khôi phục mặc định chỉ cho bốn bảng có mặc định. Không có dry-run riêng ngoài bước kiểm tra bản thử trước khi ghi.
- **C13 (bảo mật code):**
  - *Danh sách tab ghi được cố định ở máy chủ* (`BANG_SUA_DUOC`): tab báo cáo (chỉ qua chức năng nhập báo cáo), `KetQua`, `GiaiThich`, `NhatKyHeThong`, `KyDaChot`, `Chot_*` đều bị từ chối (test, kể cả tên lạ như `__proto__`).
  - *Kiểm tra trước khi ghi:* dựng bản thử các tab, chạy bộ đọc và bộ kiểm tra cấu hình; chặn lỗi thuộc chính bảng đang lưu, lỗi bảng khác chỉ cảnh báo.
  - *Chuyển kiểu không đoán:* "0,17" thành 0.17, "6.000.000" giữ thô và bị từ chối; không đoán định dạng hàng nghìn.
  - *Công thức:* ô chữ được đặt định dạng văn bản trước khi ghi; tên bắt đầu bằng `=` được lưu thành chữ, 0 ô công thức (test trên Sheet giả, **hành vi thật cần kiểm tay**).
  - *XSS trong bộ soạn:* ô nhập, thông điệp lỗi, danh sách gợi ý đều dựng bằng `createElement`, `textContent` và thuộc tính; test gõ `<b>x</b>` vào ô thì giữ như chữ, gửi lên như chữ, không có phần tử `b`, `img`, `script`, `iframe`.
  - *Quét tĩnh:* thao tác ghi Sheet (`setValues`, `insertSheet`, `setName`, `protect`, `setActiveSheet`...) chỉ nằm trong các tệp `gas*.js`; `FileReader` chỉ ở trang; vẫn cấm `UrlFetchApp`, `MailApp`, `XMLHttpRequest`, `fetch`, `eval`, `new Function`.
  - *Điều khiển từ trang:* 11 hàm trong danh sách cố định, trang tự từ chối tên khác, test khớp danh sách giữa trang và máy chủ. Máy chủ **không tin giao diện**: chặn kỳ đã chốt, chia sẻ rộng, kiểm tra bảng đều ở máy chủ.
- **C8 (on-brand):** thêm bộ soạn bảng, thanh %HT, chip, hộp nhập báo cáo theo cùng kiểu Sapo (màu, chữ theo câu, "—" cho ô chưa tính). **Vẫn chưa nhìn bằng mắt trên trình duyệt thật.** Mục tiêu và kết quả key metrics hiển thị đúng đơn vị đã nhập (hệ thống không đoán phần trăm hay số ngày).
- **Bản xem trước** (`dist/xem-truoc.html`) nay chạy **mã máy chủ thật trên Sheet giả trong trình duyệt**, sửa và nhập được nhưng chỉ thay đổi bộ nhớ trang, không ghi vào Sheet nào.

**Kết quả quét tên và tài khoản thật (2026-10-14, sau thay đổi này):** 148 tệp (`src/`, `tests/`, `tools/`, `dist/`, `openspec/`, README, hướng dẫn thử). 0 trùng tên người hay tài khoản; một trùng duy nhất là nhãn cột chung "tên nhân viên" (thuật ngữ, không phải tên người).

### Điều chủ sở hữu phải tự kiểm trên Sheet thật (thêm lần nữa)

Mục I-2 (I16–I28) của `HUONG-DAN-THU-NGHIEM.md` và ba mục kiểm tay mới trong README: sửa bảng, nhập báo cáo (dán và chọn tệp CSV), chọn kỳ. Cần chú ý hai điều chỉ thử được trên Sheet thật: báo cáo dán từ Excel có thể mang dấu phân cách theo vùng (bị từ chối, không đoán), và `FileReader` trong hộp thoại của Apps Script.


## Việc còn lại trước khi dùng lương thật

1. Chủ sở hữu tự chạy lõi mới và workbook cũ trên một kỳ thật trong môi trường riêng, so từng dòng (xem `reconciliation.md`).
2. Xác nhận các giả định trong `design.md`: ghi đè chỉ đổi lương cố định, nguồn không có hệ số là không áp dụng, làm tròn thu nhập từng người, mở lại kỳ.
3. Chuyển file Excel thật khỏi thư mục `Prototype/` (hoặc khỏi repo).
4. Chủ sở hữu tự thử bảng điều khiển, duyệt và mở lại trên một Sheet riêng chứa **dữ liệu giả** theo mục I của hướng dẫn thử; sau đó soát lại C8, C10, C12 theo kết quả thật.
5. Cân nhắc phối hợp Đội kỹ thuật AI theo khuyến nghị cho Tier 3, và chỉ định người backup.
