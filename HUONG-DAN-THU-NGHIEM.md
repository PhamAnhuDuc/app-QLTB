# Hướng dẫn thử nghiệm trên Google Sheet thật (dùng dữ liệu GIẢ)

Mục đích: kiểm tra lớp Google Sheet hoạt động đúng trên Sheet thật, những điều test trên máy không mô phỏng được.
**Chỉ dùng dữ liệu giả** có sẵn trong dự án. Không dán số liệu thật vào đây cho đến khi thử xong và bạn tự tin.

Thời gian: khoảng 30 phút cho phần chính (A–E), thêm 20 phút cho phần thử lỗi (F).

---

## CÁCH NHANH (khoảng 5 phút, nên làm trước)

Dùng **bản thử** `dist/Code-thu.gs`: giống bản thật nhưng có thêm một mục menu nạp sẵn dữ liệu giả, không cần dán 18 tab và không bị vướng locale.

1. Trên máy: `node tools/build-gs.js` (đã chạy sẵn; sinh `dist/Code-thu.gs`).
2. Google Sheets → tạo **bảng tính MỚI hoàn toàn trống** → **Chia sẻ** → "Quyền truy cập chung" phải là **Bị hạn chế**.
3. **Tiện ích mở rộng → Apps Script** → xoá mã mẫu → dán toàn bộ **`dist/Code-thu.gs`** → Lưu → đóng tab đó → **tải lại Sheet** (F5).
4. Menu mới **Tính point** có 3 mục. Chọn **Nạp dữ liệu mẫu GIẢ (chỉ để thử)**. Lần đầu Google hỏi cấp quyền (xem phần D bên dưới), cấp xong chọn lại mục đó. Hộp thoại báo "Đã nạp dữ liệu mẫu GIẢ vào 18 tab".
5. Chọn **Tính point → Tính kỳ**.
6. So với kết quả đúng: tab `KetQua` có **Đủ dữ liệu** và **Tổng team 75.838.000** (bảng đầy đủ ở phần E bên dưới).

Chỉ cần bước 1–6 là đã kiểm được các điều quan trọng nhất trên Sheet thật: cài mã, cấp quyền, đọc/ghi tab, kết quả đúng.
Bước 4 từ chối nếu Sheet đã có dữ liệu ở các tab mẫu (để không đè lên dữ liệu của bạn), nên luôn dùng Sheet mới trống.
Bỏ qua việc dán `appsscript.json` ở lần thử nhanh: Google sẽ tự suy ra quyền từ mã. Phần quyền hẹp (manifest) thử sau ở mục G.

**Ba thử thêm rất đáng làm (mỗi cái dưới 1 phút), xem chi tiết ở phần F:**
- **F1:** đổi chia sẻ thành "Bất kỳ ai có đường liên kết" rồi **Tính kỳ** → phải bị từ chối.
- **F3:** tab `KeyMetrics` xoá dòng 4 rồi **Tính kỳ** → Nhân viên A và B thành "Chưa tính", ô thu nhập là **—**.
- **F10:** gõ tên Nhân viên A thành `'=1+1` rồi **Tính kỳ** → trong `KetQua` phải hiện là chữ; báo tôi có thấy dấu `'` đầu ô không.

Làm xong cách nhanh, bạn **có thể dừng và báo kết quả**. Các phần sau chỉ cần khi muốn thử kỹ hơn hoặc thử bằng cách dán dữ liệu như dùng thật.

## Cách đầy đủ (dán dữ liệu như dùng thật)

## Trước khi bắt đầu: hai điều cần biết

1. **Quyền Drive khá rộng.** Mã chỉ gọi đúng một hàm Drive (đọc mức chia sẻ của chính tệp này), nhưng quyền Google hỏi là
   "Xem, chỉnh sửa, tạo và xoá **tất cả** tệp trên Drive". Vì vậy nên thử bằng **một tài khoản Google không chứa tệp quan trọng**,
   hoặc bạn chấp nhận rủi ro này. Có thể thử thu hẹp quyền ở mục G.
2. **Locale của Sheet quyết định dấu thập phân.** Sheet đặt locale Việt Nam hiểu `0,17` là số và `0.17` là chữ (lõi từ chối chữ).
   Dễ nhất khi thử: đặt locale Sheet là **Hoa Kỳ** (Tệp → Cài đặt → Ngôn ngữ/Locale), dùng dữ liệu mặc định (dấu chấm).

---

## A. Chuẩn bị tệp trên máy

Mở terminal tại thư mục dự án, chạy:

```bash
node tools/build-gs.js              # tạo dist/Code.gs và dist/appsscript.json
node tools/xuat-du-lieu-mau.js bo1  # dữ liệu giả bộ 1 vào dist/du-lieu-mau/bo1/*.tsv  (thêm --vi nếu Sheet dùng locale Việt Nam)
```

Bạn sẽ dùng: `dist/Code.gs`, `dist/appsscript.json`, và 18 tệp `.tsv` trong `dist/du-lieu-mau/bo1/`.

## B. Tạo Sheet và cài mã

1. Vào Google Sheets → tạo bảng tính trống, đặt tên "Thử point (dữ liệu giả)".
2. Bấm **Chia sẻ** → ở "Quyền truy cập chung" phải là **Bị hạn chế**. Không mời ai.
3. **Tiện ích mở rộng → Apps Script**. Một tab mới mở ra.
4. Trong tệp `Code.gs` mặc định: chọn hết (Ctrl+A), xoá, dán toàn bộ nội dung `dist/Code.gs`. Bấm **Lưu** (biểu tượng đĩa).
5. Bấm biểu tượng bánh răng **Cài đặt dự án** (bên trái) → bật **Hiện tệp kê khai "appsscript.json" trong trình chỉnh sửa**.
6. Quay lại **Trình chỉnh sửa**, mở tệp `appsscript.json` vừa hiện, xoá hết, dán nội dung `dist/appsscript.json`, Lưu.
7. Đóng tab Apps Script, **tải lại (F5) Google Sheet**. Chờ vài giây: thanh menu có thêm mục **Tính point**.

> Menu không hiện? Mở lại Apps Script, chọn hàm `onOpen` ở thanh trên, bấm **Chạy** (sẽ hỏi quyền, xem mục D), rồi tải lại Sheet.

## C. Khởi tạo khung và nạp dữ liệu giả

1. **Tính point → Khởi tạo khung cấu hình**. Lần đầu sẽ hỏi quyền (mục D). Sau đó hiện hộp thoại "Đã tạo 16 tab…". Kiểm tra dưới chân Sheet đã có các tab `CH_*`, `Ky`, `BaoHanh_HoTroSale`, `XacNhanBaoCao`, `NhatKyCongViec`, `KeyMetrics`.
2. Tạo thêm **hai tab thủ công** (nhấn dấu + ở chân Sheet) đặt tên chính xác: `KiemKe_HN` và `KiemKe_HCM`.
3. **Trước khi dán**, tab `Ky`: chọn ô **B2** → Định dạng → Số → **Văn bản thuần**. (Để `2026-09` không bị đổi thành ngày.)
4. Nạp từng tab. Cách làm: mở tệp `.tsv` bằng trình soạn thảo (VS Code, Notepad), Ctrl+A, Ctrl+C. Trong Sheet, mở tab cùng tên, bấm **ô A1**, Ctrl+V.

| Tab | Việc cần làm |
|---|---|
| `CH_ThamSo`, `CH_Bac`, `CH_BacThang`, `CH_ChiSo` | **Không cần dán**: khung đã có giá trị mặc định giống bộ mẫu |
| `CH_NhomThietBi`, `CH_MaHang`, `CH_ViecQuanLyKho`, `CH_HeSoChia`, `CH_KhuVuc`, `CH_ThanhVien`, `CH_TyTrong` | Dán tệp cùng tên vào A1 |
| `Ky`, `BaoHanh_HoTroSale`, `NhatKyCongViec`, `KeyMetrics` | Dán tệp cùng tên vào A1 (`Ky`: đã đặt định dạng văn bản ở bước 3) |
| `XacNhanBaoCao` | **Để nguyên** (chỉ có dòng tiêu đề) |
| `KiemKe_HN`, `KiemKe_HCM` | Dán tệp cùng tên vào A1 (giống một báo cáo kiểm kê thật, có cả dòng đầu và dòng "Tổng số dòng") |

5. Kiểm tra nhanh: tab `CH_ThanhVien` có 7 dòng thành viên (Nhân viên A đến G); tab `Ky` ô B2 là `2026-09` (căn trái, là chữ); các số không bị căn trái (nếu một số bị căn trái nghĩa là Sheet coi nó là chữ, kiểm tra locale).

## D. Chạy lần đầu và cấp quyền

1. **Tính point → Tính kỳ**.
2. Hiện "Cần được cấp quyền" → **Xem lại các quyền** → chọn tài khoản của bạn.
3. Thấy "Google chưa xác minh ứng dụng này": đây là mã của chính bạn, chọn **Nâng cao** → **Đi tới "…" (không an toàn)**.
4. **Kiểm tra danh sách quyền hiển thị: phải đúng ba loại**:
   - xem và sửa **bảng tính này** (chỉ bảng tính này);
   - hiển thị giao diện (menu, hộp thoại) trong bảng tính;
   - **Drive** (xem mục "hai điều cần biết").
   Nếu thấy quyền về **gửi thư, lịch, kết nối dịch vụ bên ngoài**: DỪNG và báo tôi.
5. Bấm **Cho phép**, rồi bấm lại **Tính point → Tính kỳ** (lần cấp quyền đầu có thể phải bấm lại).

## E. Kết quả đúng phải trông như thế nào

Hộp thoại: "Đã tính xong (đủ dữ liệu). Xem tab KetQua. Kết quả là đề xuất chờ bạn duyệt."

Tab **KetQua**:

| Dòng | Nội dung |
|---|---|
| 1 | Đề xuất – chờ duyệt |
| 2–4 | Kỳ 2026-09; Trạng thái dữ liệu **Đủ dữ liệu**; thời điểm tính |
| Bảng thành viên | xem bảng dưới |
| Dòng cuối của bảng | **Tổng team: cộng của 6/6 người, thu nhập 75.838.000** |
| Phía dưới | `LỖI (0)`, `CẢNH BÁO (8)` (cắt trần ×3, ghi đè lương ×2, thông tin dưới Min ×3), bảng `ĐỐI SOÁT` toàn "Đạt" |

| Thành viên | Σ point | Điểm KM | % thưởng | Lương cố định | Thưởng KM | Thưởng vượt | Phụ cấp | **Thu nhập** |
|---|---|---|---|---|---|---|---|---|
| Nhân viên A | 278,92 | 1,01 | 35% | 6.000.000 | 2.100.000 | 1.500.000 | 200.000 | **9.800.000** |
| Nhân viên B | 326,38 | 1,0125 | 35% | 10.000.000 | 3.500.000 | 2.500.000 | 200.000 | **16.200.000** |
| Nhân viên E | 275,26 | 1,0125 | 35% | 10.800.000 | 3.780.000 | 1.263.000 | 200.000 | **16.043.000** |
| Nhân viên F | 281,54 | 0,8642 | 20% | 6.600.000 | 1.320.000 | 1.500.000 | 200.000 | **9.620.000** |
| Nhân viên G | 5 | 1,01 | 35% | 8.500.000 | 2.975.000 | 0 | 0 | **11.475.000** |
| Nhân viên C | 17 | 0,9791 | 25% | 10.000.000 | 2.500.000 | 0 | 200.000 | **12.700.000** |
| Nhân viên D (chủ sở hữu) | 5 | — | — | — | — | — | — | **—** (Không tính, chỉ theo dõi point) |

Các kiểm tra khác ở giai đoạn này:

- [ ] Tab **GiaiThich**: mỗi người có các dòng "Xuất bán / chuyển kho", "Bảo hành"…, đến "Thu nhập = …".
- [ ] Tab **NhatKyHeThong**: có tiêu đề và 8 dòng; **không** có tên, tài khoản, mã hàng hay số tiền nào.
- [ ] Mở **Tệp → Lịch sử phiên bản → Xem lịch sử phiên bản**: các tab đầu vào (`CH_*`, `KiemKe_*`, `Ky`, v.v.) không bị đổi bởi lần tính; chỉ `KetQua`, `GiaiThich`, `NhatKyHeThong` được tạo mới.
- [ ] Bấm **Tính kỳ** lần hai: `KetQua` giữ nguyên số, `NhatKyHeThong` được thêm 8 dòng (không thêm tiêu đề lần nữa).
- [ ] Các ô tiền không có số lẻ kiểu `3779999.9999999995`.

## F. Thử các tình huống lỗi

Sau mỗi thử, **đưa dữ liệu về như cũ** rồi mới thử tiếp (Ctrl+Z hoặc nhập lại).

| # | Làm gì | Kết quả đúng |
|---|---|---|
| F1 | **Chia sẻ rộng:** Chia sẻ → Quyền truy cập chung → "Bất kỳ ai có đường liên kết" → Tính kỳ. Rồi đặt lại "Bị hạn chế" | Hộp thoại "Không tính được… Sheet đang được chia sẻ rộng…", `KetQua` **không đổi**. Sau khi đặt lại thì tính được |
| F2 | **Chia sẻ người cụ thể:** thêm email một tài khoản khác của bạn vào Chia sẻ → Tính kỳ → rồi xoá người đó | Vẫn tính, có cảnh báo `CHIA_SE_NGUOI_KHAC` trong KetQua, **không in email** ở đâu cả |
| F3 | **Thiếu key metrics:** tab `KeyMetrics` xoá dòng 4 (`tyLeBaoHanh / Khu vực / HN`) | Nhân viên A và B: "Chưa tính", ô thu nhập **—**; tổng team "cộng của 4/6 người"; trạng thái "Chưa đủ dữ liệu" |
| F4 | **Mã hàng lạ:** tab `KiemKe_HN`, chèn một dòng mới **phía trên** dòng "Tổng số dòng" (dòng 17): A17=`8`, B17=`ABC-999`, C17=`Mã thử`, G17=`3` | Lỗi `MA_HANG_LA` ghi **"[tab KiemKe_HN, dòng 17]"**; A và B chưa tính; E, F, G, C vẫn tính; thêm cảnh báo lệch số dòng (chân bảng ghi 7, đọc được 8) |
| F5 | **Chữ vào ô số:** `CH_ThamSo` ô B2 (`donGiaPoint`) gõ `năm mươi nghìn` | "Không tính được", lỗi nêu **tab CH_ThamSo, dòng 2** |
| F6 | **Tháng sai:** tab `Ky` ô B2 gõ `tháng chín` | Lỗi `KY_SAI`, không tính |
| F7 | **Báo cáo chỉ phủ một phần kỳ:** `KiemKe_HN` ô A5 đổi thành `Từ ngày: 01/09/2026 đến ngày: 14/09/2026` | Lỗi báo cáo chưa phủ hết kỳ, A và B chưa tính. Rồi trong `XacNhanBaoCao` ô A2=`HN`, B2=`TRUE` → tính lại: A và B tính được, có cảnh báo |
| F8 | **Tên tab kết quả trùng:** `CH_ThamSo` ô B9 (`tenTabKetQua`) đổi thành `CH_Bac` | Hộp thoại "tên tab kết quả… trùng", **không ghi gì**. Đặt lại `KetQua` |
| F9 | **Khởi tạo lại khi đã có dữ liệu:** Tính point → Khởi tạo khung cấu hình | "Đã tạo 0 tab… Giữ nguyên …", các tab của bạn không đổi |
| F10 | **Chống công thức (quan trọng):** tab `CH_ThanhVien` ô B2 (tên Nhân viên A) gõ `'=1+1` (có dấu nháy đơn đầu) → Tính kỳ | Trong `KetQua` tên đó hiện là **chữ** `=1+1` (không ra số 2 và không báo lỗi công thức). **Ghi lại**: có thấy dấu nháy đơn `'` đứng đầu ô không? |

## G. Thử thu hẹp quyền Drive (tuỳ chọn, nên làm)

Mục tiêu: dùng quyền hẹp hơn nếu đủ. Làm sau khi mọi thứ ở trên chạy tốt.

1. Apps Script → `appsscript.json`: thay toàn bộ nội dung bằng `dist/appsscript.drive-readonly.json` (do `node tools/build-gs.js` sinh; chỉ khác ở chỗ `drive` thành `drive.readonly`). Lưu.
2. Thu hồi quyền cũ để Google hỏi lại: vào https://myaccount.google.com/permissions → chọn ứng dụng này → Xoá quyền truy cập.
3. Chạy lại Tính kỳ và cấp quyền: hộp thoại giờ chỉ nên nói "**xem** … tệp trên Drive".
4. Nếu lệnh chạy được và F1 vẫn chặn đúng: quyền hẹp đủ dùng. **Báo tôi để đổi mặc định.**
5. Nếu có lỗi dạng "You do not have permission to call DriveApp.getFileById. Required permissions: …": dán nguyên lỗi cho tôi, rồi đặt lại `drive`.

## H. Thử bộ dữ liệu xấu (tuỳ chọn)

Tạo **một Sheet mới** (đừng dùng lại Sheet đã nạp bộ 1), làm lại B–C với `node tools/xuat-du-lieu-mau.js bo3`. Bộ này có sẵn: số ca âm, mã lạ, tài khoản lạ, loại việc lạ, mục tiêu bằng 0, hệ số chia lệch, tỷ trọng lệch, báo cáo HCM chỉ phủ đến 14/09.
Kết quả đúng: trạng thái "Chưa đủ dữ liệu", **8 lỗi** mỗi lỗi nêu tab (và dòng khi có), người bị ảnh hưởng hiện "—", tổng team "—" (cộng của 0/6 người). Không có số nào bị bịa.

## I. Thử bảng điều khiển, duyệt và mở lại kỳ (làm sau khi E–F đạt)

Dùng Sheet thử đã nạp dữ liệu mẫu (cách nhanh). Cập nhật mã: chạy lại `node tools/build-gs.js`, dán lại `dist/Code-thu.gs` vào Apps Script, Lưu, tải lại Sheet. Menu **Tính point** nay có 4 mục (thêm **Bảng điều khiển** ở đầu).

| # | Làm gì | Kết quả đúng |
|---|---|---|
| I1 | **Tính point → Bảng điều khiển** | Hộp thoại mở, **không chặn** Sheet, có 7 nút theo thứ tự: Tổng quan, Nhập point, Nhập key metrics, Kết quả, Duyệt và lưu, Lịch sử, Cấu hình; phía trên có ô chọn kỳ. Màn Tổng quan nói "Chưa có kết quả cho kỳ này" kèm nút **Tính kỳ**, bên dưới là tình trạng từng tab |
| I2 | Bấm **Tính kỳ** trong hộp thoại | Hiện "Đã tính xong". Tổng thu nhập **75.838.000đ**, "6/6 người", trạng thái Đủ dữ liệu. Tab `KetQua` nay có tiền dạng `9.800.000` (hoặc `9,800,000` theo locale), điểm KM dạng %, tiêu đề in đậm, cột đủ rộng |
| I3 | Màn **Tổng quan**, kéo xuống phần Tình trạng tab → bấm **Mở tab** ở một dòng | Sheet chuyển tới đúng tab. Tab nào thiếu thì nút bị mờ |
| I4 | Màn **Duyệt và lưu** | Không có ô tick nào, báo "Mọi thành viên đã tính được", nút **Xác nhận duyệt** bật. Bấm → hiện hộp xác nhận → **Hủy** thì không gì xảy ra |
| I5 | Bấm lại **Xác nhận duyệt → Đồng ý** | Thông báo "Đã chốt kỳ 2026-09. Tổng đã duyệt 75.838.000đ (6 người đã tính, 0 người bỏ qua)". Sheet có thêm tab **`Chot_2026-09`** và **`KyDaChot`**. Nút duyệt chuyển mờ |
| I6 | Thử sửa một ô trong `Chot_2026-09` | Google **cảnh báo** khi sửa (bảo vệ chỉ cảnh báo). Chọn Hủy |
| I7 | Đổi `CH_ThamSo` ô B2 (`donGiaPoint`) thành 60000 rồi bấm **Tính lại** ở màn Kết quả | Có cảnh báo "Kỳ 2026-09 đã chốt… KHÁC bản chốt…"; nội dung `Chot_2026-09` **không đổi**. Đặt lại 50000 |
| I8 | Màn **Lịch sử** | Một dòng Đã chốt có nút **Mở lại kỳ** |
| I9 | **Mở lại kỳ** → bỏ trống lý do → Đồng ý | Hiện lỗi "Cần nhập lý do khi mở lại kỳ", không đổi gì |
| I10 | **Mở lại kỳ** với lý do (ví dụ "thử") → Đồng ý | "Đã mở lại kỳ 2026-09. Bản chốt cũ được giữ ở tab Chot_2026-09_cu1". Tab đổi tên, **không bị xoá**; `KyDaChot` có thêm dòng "Đã mở lại" kèm lý do |
| I11 | Xoá dòng `KeyMetrics` số 4 (`tyLeBaoHanh / Khu vực / HN`), tab `Duyệt và lưu` | Hai ô tick (Nhân viên A, B). Nút duyệt **mờ** và ghi "Còn 2 người chưa được xác nhận bỏ qua". Tick cả hai thì nút bật |
| I12 | Duyệt với hai người bị bỏ qua | "Tổng đã duyệt 49.838.000đ (4 người đã tính, 2 người bỏ qua)". Tab `Chot_2026-09` dòng 4 ghi `nva1; nvb2` |
| I13 | Đổi tên Nhân viên A (`CH_ThanhVien!B2`) thành `<b>chữ đậm</b>` rồi Tính kỳ trong bảng điều khiển | Tên hiện **nguyên chữ** `<b>chữ đậm</b>`, không in đậm |
| I14 | Đổi chia sẻ Sheet thành "Bất kỳ ai có liên kết" rồi mở lại bảng điều khiển | Có banner đỏ về chia sẻ rộng; Tính kỳ và Duyệt đều bị từ chối, không tab nào thay đổi |
| I15 | `NhatKyHeThong` | Chỉ có dòng loại `KY_DA_CHOT`, `KY_MO_LAI`, `SUA_BANG_CAU_HINH`, `SUA_BANG_NHAP_TAY`, `NHAP_BAO_CAO`, `DAT_KY`, `KHOI_PHUC_MAC_DINH`; **không** có tên, tài khoản, số tiền, lý do, nội dung bảng |

### I-2. Sửa dữ liệu ngay trong bảng điều khiển (làm sau I1–I15, trên Sheet thử)

Dùng Sheet thử đã nạp mẫu. Nếu kỳ đang **Đã chốt**, bấm **Mở lại kỳ** ở màn Lịch sử trước (bảng nhập tay bị khoá khi kỳ đã chốt).

| # | Làm gì | Kết quả đúng |
|---|---|---|
| I16 | Màn **Tổng quan** sau khi Tính kỳ | Mỗi người có hai chip riêng **Point: đủ** và **Key metrics: đủ**; Nhân viên D (chỉ theo dõi point) hiện **Key metrics: không áp dụng** và thu nhập "—" |
| I17 | Màn **Nhập point** | Với từng khu vực: quỹ (HN 237,3; HCM 203,8), bảng mã hàng (SP-001...), nhóm, SL bán và chuyển kho, rồi bảng chia (hệ số, tổng, point nhận). Bên dưới có bảo hành, hỗ trợ sale, quản lý kho từng dòng việc. **Không** có giá bán hay giá trị tồn |
| I18 | Màn **Nhập key metrics** | Mỗi người có thanh xanh cho từng chỉ số (%HT, thanh đầy ở 100% còn số vẫn hiện 105%), dòng "Σ điểm key metrics" và "% thưởng". Chỉ số tỷ lệ bảo hành/vòng quay có nhãn "càng thấp càng tốt" |
| I19 | Màn **Cấu hình** → chọn **Thông số** → đổi `donGiaPoint` thành 60000 | Xuất hiện nhãn "Có thay đổi chưa lưu"; nút Lưu và Hủy thay đổi bật. **Hủy thay đổi** trả về 50000 mà không ghi gì |
| I20 | Đổi lại 60000 → **Lưu → Đồng ý** | "Đã lưu bảng". `CH_ThamSo!B2` là số 60000. Tab khác không đổi. Sang màn **Kết quả**: số mới, kèm ghi chú "chưa ghi ra tab kết quả"; tab `KetQua` vẫn là số cũ cho tới khi bấm **Tính kỳ/Tính lại**. Đặt lại 50000 |
| I21 | Ở Cấu hình → **Bậc**, sửa một ô lương thành chữ `năm mươi nghìn` → Lưu → Đồng ý | Bị từ chối kèm lỗi nêu tab, dòng và cột; chữ bạn gõ **vẫn nằm trong ô**; `CH_Bac` không đổi |
| I22 | Cấu hình → **Bậc** → **Khôi phục mặc định** → Hủy, rồi làm lại và Đồng ý | Hủy: không gì đổi. Đồng ý: `CH_Bac` về 5 bậc mặc định. Bảng **Thành viên** không có nút này |
| I23 | Cấu hình → **Thành viên**, đổi tên Nhân viên A thành `=1+1` → Lưu | Tên hiện nguyên chữ `=1+1` (không thành 2, không là công thức). Đặt lại tên cũ |
| I24 | Màn **Nhập point → Nhập lại báo cáo** (HN), dán nội dung bảng của `KiemKe_HN` (copy từ chính tab đó) → Nhập báo cáo → Đồng ý | "Đã nhập báo cáo khu vực HN"; tab giữ nội dung như cũ. Thử lại với nội dung thiếu cột "SL chuyển kho": bị từ chối, nêu cột thiếu, **tab không đổi** |
| I25 | Chọn **tệp CSV**: xuất tab `KiemKe_HN` ra CSV (Tệp → Tải xuống → CSV), chọn tệp đó trong hộp nhập | Nội dung hiện trong ô dán, bấm Nhập báo cáo → Đồng ý được; không có gì gửi đi ngoài Sheet |
| I26 | Ô **chọn kỳ**: chọn tháng kế tiếp | Chip đổi thành "Kỳ 2026-10", `Ky!B2` là chữ `2026-10`; màn Tổng quan báo thiếu dữ liệu hợp lý. Chọn lại 2026-09 |
| I27 | Màn **Kết quả** → bấm tên một thành viên | Panel "Cách tính" liệt kê từng bước (point từng nguồn, Min–Max, point vượt, điểm KM, thưởng, phụ cấp, thu nhập). Bấm lại hoặc **Đóng** thì ẩn |
| I28 | Khi kỳ **Đã chốt**: màn Nhập point, thử Thêm dòng ở bảng nhật ký | Bảng báo "kỳ đang Đã chốt… dùng Mở lại kỳ" và các nút sửa bị mờ; ở Cấu hình vẫn sửa được kèm cảnh báo "bản chốt giữ nguyên số cũ" |

Khôi phục sau khi thử: đặt lại dữ liệu (dòng `KeyMetrics`, tên, đơn giá) hoặc dùng một Sheet thử mới và nạp lại mẫu.

## Sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Không thấy menu **Tính point** | Chưa tải lại Sheet, hoặc lỗi cú pháp khi dán mã | Tải lại; hoặc trong Apps Script chạy hàm `onOpen` xem lỗi |
| "Không có tab …" | Chưa tạo `KiemKe_HN`/`KiemKe_HCM` hoặc gõ sai tên | Tạo đúng tên (khớp cột "Tab báo cáo" ở `CH_KhuVuc`) |
| "Ô phải là số, hiện là văn bản" | Locale Sheet không hợp với dấu thập phân của dữ liệu | Đổi locale sang Hoa Kỳ, hoặc dán lại bằng `--vi` |
| "Tháng … không đúng dạng" | Ô `Ky!B2` bị đổi thành ngày | Định dạng ô là Văn bản thuần và gõ lại; (mã vẫn nhận ngày, báo tôi nếu vẫn lỗi) |
| "Thiếu cột …" | Dán lệch hàng/cột hoặc đổi tên tiêu đề | Dán lại vào ô A1 đúng tab |
| Báo cáo "chưa phủ hết kỳ" | Khoảng ngày trong báo cáo ngắn hơn tháng của `Ky` | Dán báo cáo cả tháng, hoặc xác nhận ở `XacNhanBaoCao` |
| Bị chặn "không đọc được mức chia sẻ" | Chưa cấp quyền Drive hoặc cấp thiếu | Cấp quyền khi được hỏi; hoặc xem mục G bước 2 |
| Ô tiền hiện `###` | Cột quá hẹp | Kéo rộng cột (không phải lỗi dữ liệu) |

## Cách báo kết quả cho tôi

Chỉ cần cho biết cho từng mục (E, F1–F10, G, I1–I28): **Đạt / Không đạt / Không thử**, kèm:

- với mục **Không đạt**: bạn thấy gì (dán nguyên chữ trong hộp thoại hoặc ô, **đã xoá mọi dữ liệu thật nếu có**) và bạn đã làm gì ngay trước đó;
- riêng F10: có thấy dấu nháy đơn đầu ô không;
- riêng G: có chạy được với `drive.readonly` không.

Từ đó tôi lập change điều chỉnh (ví dụ thu hẹp quyền, bỏ dấu nháy đơn thừa, thêm định dạng tiền).
