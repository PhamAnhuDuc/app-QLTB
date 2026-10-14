# Tính point và thu nhập tạm tính — Team QL&PTTB (lõi tính + Google Sheet)

## App làm gì?

Tính **point** và **thu nhập tạm tính hằng tháng** cho từng thành viên Team QL&PTTB từ báo cáo kiểm kê, số ca bảo hành,
số đơn hỗ trợ sale, nhật ký công việc quản lý kho và các chỉ số key metrics. Thay cho workbook Excel nhiều sheet đang dùng.

Mọi kết quả là **đề xuất chờ duyệt**. Lõi không chi trả, không ghi sang hệ thống khác, không gửi gì cho ai.
Người duyệt cuối cùng là chủ sở hữu (người check cuối).

Gồm hai phần: **lõi tính** (`src/core/`, hàm thuần) và **lớp Google Sheet** (`src/sheet/`: đọc báo cáo kiểm kê và các bảng nhập tay
từ các tab, gọi lõi, ghi kết quả ra tab riêng), kèm **duyệt và chốt kỳ** (bản sao đóng băng, mở lại có lý do và dấu vết) và một
**bảng điều khiển HTML** trong Sheet (menu **Tính point → Bảng điều khiển**) gom quy trình theo prototype: Tổng quan, Nhập point, Nhập key metrics, Kết quả, Duyệt và lưu, Lịch sử, Cấu hình, cùng ô chọn kỳ. Bảng điều khiển còn **sửa được cấu hình và dữ liệu nhập** (bộ soạn bảng, nhập báo cáo bằng dán văn bản hoặc chọn tệp CSV/TSV, khôi phục mặc định cho 4 bảng); mọi việc ghi do máy chủ kiểm tra và chỉ ghi vào danh sách tab cho phép.
Chưa hỗ trợ tính theo ngày công (người làm không đủ tháng: nhập số đã tự tính vào ô ghi đè lương cố định).

## Triển khai trên Google Sheet (từng bước)

> Muốn thử từng bước kèm kết quả đúng phải thấy và các tình huống lỗi: xem [HUONG-DAN-THU-NGHIEM.md](HUONG-DAN-THU-NGHIEM.md). Muốn thử nhanh nhất: dùng `dist/Code-thu.gs` (có mục menu nạp sẵn dữ liệu giả vào Sheet trống). Dữ liệu giả để dán tay: `node tools/xuat-du-lieu-mau.js bo1`.

Làm trên một Sheet **riêng, dữ liệu giả trước**. Chỉ dùng dữ liệu thật sau khi tự kiểm tra xong (xem "Kiểm tay trên Sheet thật").

1. Tạo Google Sheet mới và đặt chia sẻ **Bị hạn chế** (Riêng tư). Không chia sẻ cho ai khác.
2. Chạy `node tools/build-gs.js` trên máy. Lệnh tạo `dist/Code.gs` (một tệp, đã gộp đúng thứ tự) và `dist/appsscript.json` (manifest quyền).
3. Trong Sheet: **Tiện ích mở rộng → Apps Script**. Dán toàn bộ `dist/Code.gs` vào tệp mã. Bật "Hiện tệp kê khai appsscript.json" trong Cài đặt dự án rồi dán nội dung `dist/appsscript.json`.
4. Tải lại Sheet. Menu **Tính point** xuất hiện. Chọn **Khởi tạo khung cấu hình**: tạo các tab còn thiếu với giá trị mặc định (không ghi đè tab đã có, không có thành viên nào).
5. Điền các tab `CH_*` (cấu hình) và chọn tháng ở tab `Ky` (ví dụ `2026-09`; nên định dạng ô là văn bản).
6. Mỗi khu vực một tab báo cáo kiểm kê: **dán nguyên báo cáo xuất từ hệ thống** (cả các dòng đầu, tiêu đề và chân bảng) vào tab có tên khai báo ở `CH_KhuVuc`.
7. Nhập `BaoHanh_HoTroSale`, `NhatKyCongViec`, `KeyMetrics`, và `XacNhanBaoCao` nếu một báo cáo chỉ phủ một phần kỳ mà bạn vẫn muốn dùng.
8. Menu **Tính point → Bảng điều khiển** (hoặc **Tính kỳ** nếu muốn chỉ tính). Lần đầu Google hỏi cấp quyền, xem mục dưới.

### Quyền cần cấp và lý do

| Quyền | Dùng để |
|---|---|
| Xem và sửa **Sheet đang mở** (`spreadsheets.currentonly`) | Đọc các tab, ghi tab kết quả. Không đụng Sheet khác |
| Hiển thị giao diện trong Sheet (`script.container.ui`) | Menu, hộp thoại thông báo và bảng điều khiển |
| **Drive** (`drive`) | Chỉ để **đọc mức chia sẻ của chính tệp này** (`DriveApp.getFileById`). Quyền này rộng hơn nhu cầu, bạn đã đồng ý đổi lấy việc tự chặn tính khi Sheet chia sẻ rộng. Mã không gọi hàm Drive nào khác (có test kiểm tra) |

Không có quyền mạng, thư, lịch hay tài liệu khác. Mã không gọi địa chỉ bên ngoài và không có trình kích hoạt tự động.
Bảng điều khiển không tải phông, kiểu, mã hay ảnh từ bên ngoài (dùng phông hệ thống thay cho Inter) và hiển thị mọi chuỗi từ Sheet bằng `textContent`.
`node tools/build-gs.js` còn sinh `dist/appsscript.drive-readonly.json` (quyền Drive chỉ-đọc) để bạn thử thu hẹp quyền; **chưa được kiểm chứng** trên Sheet thật, xem mục G của hướng dẫn thử.

### Các tab

| Loại | Tab |
|---|---|
| Cấu hình | `CH_ThamSo`, `CH_Bac`, `CH_BacThang`, `CH_ChiSo`, `CH_NhomThietBi`, `CH_MaHang`, `CH_ViecQuanLyKho`, `CH_HeSoChia`, `CH_KhuVuc`, `CH_ThanhVien`, `CH_TyTrong` |
| Nhập tay mỗi kỳ | `Ky`, `BaoHanh_HoTroSale`, `XacNhanBaoCao`, `NhatKyCongViec`, `KeyMetrics` |
| Báo cáo kiểm kê | một tab mỗi khu vực, tên khai báo ở `CH_KhuVuc` (ví dụ `KiemKe_HN`) |
| Đầu ra (Tính kỳ ghi) | `KetQua` (tên đổi được bằng tham số `tenTabKetQua`), `GiaiThich`, `NhatKyHeThong` |
| Chốt kỳ (chỉ Duyệt và Mở lại ghi) | `KyDaChot` (chỉ mục: mỗi lần chốt hoặc mở lại một dòng), `Chot_<kỳ>` (bản sao đóng băng, ví dụ `Chot_2026-09`), `Chot_<kỳ>_cu<n>` (bản chốt cũ giữ lại khi mở lại kỳ) |

Cột được tìm theo **tiêu đề**, đổi thứ tự cột không sao; đổi tên tiêu đề thì bị báo thiếu cột. Ô số phải là số thật (chuỗi như "50000" bị từ chối, không đoán).
Ô trống khác số 0. Ô "Máy tính cá nhân" phải là TRUE hoặc FALSE (để trống bị báo lỗi, không tự coi là FALSE).
Người không có dòng nào trong `NhatKyCongViec` bị coi là **thiếu** nguồn quản lý kho; muốn nói "không phát sinh" hãy nhập một dòng có số lượng 0.
Mỗi lệnh Tính kỳ làm mới `KetQua` và `GiaiThich`; `NhatKyHeThong` chỉ được thêm dòng. Các tab chốt không bao giờ bị đọc như dữ liệu đầu vào.

### Đọc kết quả

- Đầu tab `KetQua`: nhãn **Đề xuất – chờ duyệt**, kỳ, trạng thái dữ liệu (Đủ / Chưa đủ / Bị chặn), thời điểm tính.
- Bảng thành viên chia theo nhóm, có dòng tổng nhóm và tổng team ghi rõ "cộng của N/M người". Ô chưa tính hiện **—** (không phải 0), cột Trạng thái nêu lý do.
- Tiếp theo là **LỖI** (có mã, phạm vi bị chặn, và vị trí tab/dòng), **CẢNH BÁO**, và bảng **ĐỐI SOÁT**.
- Tab `GiaiThich`: từng bước tính của từng người để tự kiểm lại bằng tay.
- Báo cáo kiểm kê chỉ phủ một phần kỳ bị **chặn** cho đến khi bạn xác nhận ở `XacNhanBaoCao`.
- Nếu Sheet đang chia sẻ cho "bất kỳ ai có liên kết" hoặc cho cả tên miền, hoặc không đọc được mức chia sẻ, lệnh **từ chối tính** và không ghi gì.
- Tiền có dấu phân cách nghìn, điểm key metrics và % thưởng hiển thị dạng %, dòng tiêu đề và tổng in đậm, cột đủ rộng. Giá trị trong ô vẫn là số nguyên bản (định dạng không đổi giá trị).

### Duyệt và chốt kỳ

- **Xác nhận duyệt = chốt**, một bước, trong **Bảng điều khiển → Duyệt và lưu**. Hệ thống **tính lại từ dữ liệu hiện tại** (không dùng tab `KetQua` đang hiện), kiểm tra chia sẻ, rồi lưu bản sao kỳ.
- Bị từ chối nếu: lỗi chặn toàn bộ, đối soát lệch hoặc nhật ký chưa khớp, không ai tính được, Sheet chia sẻ rộng, hoặc kỳ **đã chốt**.
- Người chưa tính được phải được **tick bỏ qua từng người**; thiếu người nào máy chủ cũng từ chối và nêu tài khoản. Người chỉ theo dõi point không cần xác nhận.
- Bản sao `Chot_<kỳ>` chứa: siêu dữ liệu, bảng kết quả đã duyệt, và toàn bộ cấu hình cùng dữ liệu đã dùng (JSON chia đoạn) kèm dấu vân tay để phát hiện sửa tay. Tab được bảo vệ ở chế độ chỉ cảnh báo. Đổi cấu hình sau đó **không** làm đổi bản chốt.
- Tính kỳ trên kỳ đã chốt vẫn chạy nhưng cảnh báo và nói kết quả **giống hay khác** bản chốt (và ai khác); không bao giờ đổi bản chốt.
- **Mở lại kỳ** (màn Lịch sử) cần **lý do**. Bản chốt cũ được **đổi tên** thành `Chot_<kỳ>_cu<n>` (không xoá), chỉ mục thêm dòng "Đã mở lại", rồi chốt lại được.
- Chốt dở dang (lỗi giữa chừng) không mất dữ liệu: dòng chỉ mục được ghi sau cùng; tab bản sao dở dang được đổi tên thành bản cũ ở lần chốt sau.
- Nhật ký hệ thống chỉ ghi loại sự kiện (`KY_DA_CHOT`, `KY_MO_LAI`): không tên, tài khoản, số tiền, lý do hay tên tab.
- **Lưu ý riêng tư:** bản sao kỳ chứa dữ liệu lương trong chính Sheet này; Sheet phải luôn ở chế độ riêng tư. Dấu vân tay chỉ phát hiện sửa tay, không chống kẻ tấn công.

### Kiểm tay trên Sheet thật (test Node không mô phỏng được)

Làm một lần trên Sheet riêng chứa dữ liệu giả, trước khi dùng dữ liệu thật:

- [ ] Hộp thoại cấp quyền hiện đúng ba quyền ở bảng trên, không hơn. Nếu thiếu quyền Drive, lệnh phải từ chối và nói cần cấp quyền.
- [ ] **Bảng điều khiển:** menu Tính point → Bảng điều khiển mở hộp thoại không chặn Sheet; bố cục đọc được; các nút Tính kỳ, Duyệt, Mở lại hoạt động; hộp xác nhận hiện đúng trước khi duyệt; văn bản không bị cắt xấu.
- [ ] Trong bảng điều khiển, tên thành viên chứa thẻ HTML (ví dụ `<b>x</b>`) hiện như chữ, không in đậm.
- [ ] **Sửa trong giao diện:** ở Cấu hình sửa `donGiaPoint`, Lưu có hộp xác nhận, tab `CH_ThamSo` đổi đúng ô đó; ô số gõ chữ bị từ chối kèm lỗi và nội dung vẫn còn trong ô; tên bắt đầu bằng `=` được lưu thành chữ.
- [ ] **Nhập báo cáo:** ở Nhập point, dán báo cáo thật dạng bảng (từ Excel) vào hộp, và chọn thử một tệp CSV UTF-8; xem báo cáo vào đúng tab của khu vực. Báo cáo Excel có dấu phân cách nghìn hoặc dấu phẩy thập phân kiểu Việt Nam sẽ bị từ chối (báo lỗi, không đoán).
- [ ] **Chọn kỳ:** đổi sang tháng khác trong ô chọn kỳ, tab `Ky` ô tháng là chữ (không thành ngày); đổi lại về tháng đang làm.
- [ ] **Duyệt:** chốt bộ mẫu thành công, xuất hiện tab `Chot_2026-09` và `KyDaChot`; tab `Chot_...` hiện cảnh báo khi bạn thử sửa một ô (bảo vệ chỉ cảnh báo).
- [ ] Sau khi chốt, đổi một số trong cấu hình rồi Tính kỳ: có cảnh báo kỳ đã chốt, và nội dung `Chot_2026-09` không đổi.
- [ ] **Mở lại kỳ** không có lý do bị từ chối; có lý do thì tab cũ đổi thành `Chot_2026-09_cu1` và chốt lại được.
- [ ] Bảng điều khiển hiển thị phông chữ gần giống giao diện Sapo (không có Inter vì không tải ngoài); nếu cần đúng Inter, báo để bàn lại.
- [ ] Đặt Sheet chia sẻ "Bất kỳ ai có liên kết" rồi bấm Tính kỳ: bị từ chối, tab `KetQua` không đổi. Đặt lại "Bị hạn chế" thì tính được.
- [ ] Thêm một người cụ thể vào chia sẻ: tính được và có cảnh báo trong `KetQua`.
- [ ] Dán vào báo cáo kiểm kê một dòng có mã hàng `=HYPERLINK("http://example.com")`: trong `KetQua` ô đó hiện như văn bản (có thể có dấu nháy đơn đầu), không phải liên kết bấm được. Nếu dấu nháy đơn hiện ra khó chịu, báo lại để đổi cách vô hiệu hoá.
- [ ] Ô tháng ở tab `Ky`: gõ `2026-09` với ô định dạng **văn bản** thì đọc đúng; với ô định dạng thường, Sheet có thể tự đổi thành ngày (mã vẫn nhận ngày đó và lấy năm-tháng).
- [ ] Mở Sheet không làm tab nào đổi (chỉ thêm menu). Chạy **Khởi tạo khung cấu hình** trên tab đã có dữ liệu không làm đổi tab đó.
- [ ] Tính hai lần liên tiếp cho cùng kết quả; `NhatKyHeThong` được thêm dòng, tiêu đề chỉ một lần.
- [ ] Xem `NhatKyHeThong`: không có tên, tài khoản, mã hàng hay số tiền nào.
- [ ] Kiểm tra quyền Drive tối thiểu có đủ dùng không (đang khai báo `drive`); nếu `drive.readonly` đủ thì nên thu hẹp.

## Ai dùng? / Tier / Chạy ở đâu?

| | |
|---|---|
| Người dùng | Một người: chủ sở hữu |
| Tier | **Tier 3** (lương thưởng, dữ liệu Bảo mật theo QĐ-02, mục D5 của chuẩn Sapo) |
| Môi trường | Google Sheet riêng tư + Apps Script (đã có mã, **chưa triển khai thật**; cần chủ sở hữu tự dán mã và cấp quyền). Mã là JavaScript thuần chạy được cả trong Apps Script và Node |
| Dữ liệu thật | Chỉ nằm trong Sheet riêng của chủ sở hữu. **Không đưa dữ liệu thật vào AI, code, README, test hay ví dụ** |

## Cách chạy test

Cần Node 20 trở lên (đã dùng 24). Không cài thêm thư viện nào.

```bash
node --test                          # chạy toàn bộ test (vài giây)
node tools/build-gs.js               # gộp mã thành dist/Code.gs và dist/appsscript.json để dán vào Apps Script
node tests/bang-chung.js             # ghi lại bằng chứng 3 bộ dữ liệu cho lõi vào tests/evidence/
node tests/sheet-fixture.js          # sinh lại fixture Sheet giả từ tests/fixtures/bo1..bo3
node tests/bang-chung-sheet.js       # ghi lại bằng chứng 3 bộ dữ liệu qua Sheet giả (tests/evidence/sheet-*.json)
node tests/bang-chung-chot.js        # ghi lại bằng chứng duyệt, chốt, mở lại kỳ (tests/evidence/chot-*.json)
node tools/xem-truoc-giao-dien.js  # tạo dist/xem-truoc.html: chạy bảng điều khiển và mã máy chủ thật trên Sheet giả ngay trong trình duyệt (dữ liệu giả, sửa được, không cần Sheet)
```

Các test kiểm tra tệp bằng chứng và fixture khớp kết quả hiện tại. Nếu sửa mã tính hay lớp Sheet, chạy lại các lệnh ghi bằng chứng
rồi xem `git diff tests/evidence/` để biết con số nào đã đổi.

## Dùng lõi như thế nào

```js
// Trong Node (xem tests/load-core.js), các tệp src/core/*.js nạp chung một phạm vi toàn cục như Apps Script.
const ketQua = tinhKy(cauHinh, duLieuKy);   // hàm thuần: không đọc/ghi Sheet
ketQua.nhan            // 'Đề xuất – chờ duyệt'
ketQua.thanhVien       // từng người: trạng thái, point, điểm key metrics, các khoản, thu nhập, giải thích từng bước
ketQua.tong            // tổng theo nhóm và team, ghi rõ "cộng của N/M người"
ketQua.loi             // lỗi chặn (mã hàng lạ, hệ số lệch, ...)
ketQua.canhBao         // cảnh báo không chặn (point cắt trần, dưới Min, lương ghi đè, ...)
ketQua.kyDuDuLieu      // true khi không có lỗi, đối soát đạt và mọi người đã tính được
taoLog(ketQua, thoiDiem)  // log tối thiểu, không chứa tên, tài khoản hay số tiền
```

## Đầu vào mẫu (dữ liệu giả)

Xem `tests/fixtures/` và `tests/fixtures/README.md`. Mỗi bộ gồm `config.json` (cấu hình) và `ky.json` (dữ liệu một kỳ):

- `bo1`: tháng 09/2026, đủ dữ liệu, 7 thành viên giả.
- `bo2`: kỳ khác, đơn giá khác, bậc khác, hệ số chia khác.
- `bo3`: dữ liệu xấu hoặc thiếu trường, mỗi lỗi chỉ chặn phần phụ thuộc nó.

## Đầu ra mẫu

Thu nhập tạm tính của thành viên bậc 1 (dữ liệu giả): lương cố định 6.000.000, point tổng 324,1 (Min 120, Max 150),
điểm key metrics 99,6% (thưởng 25%), dùng máy tính cá nhân:

```
thưởng key metrics = 6.000.000 × 25%        = 1.500.000
point vượt         = min(324,1; 150) − 120  = 30
thưởng vượt point  = 30 × 50.000            = 1.500.000
phụ cấp                                      =   200.000
thu nhập tạm tính                            = 9.200.000
```

Cách tự kiểm lại bằng tay: dùng `giaiThich` của từng thành viên trong kết quả, đối chiếu với các bước trên.

## Quy tắc tính (tóm tắt)

- **%HT chỉ số:** nội suy tuyến tính từ 0% tại Min đến 100% tại mục tiêu, tệ hơn hoặc bằng Min thì 0%, trần 100%.
  Min = mục tiêu × 0,7 (chỉ số cao tốt) hoặc mục tiêu / 0,7 (chỉ số thấp tốt). Hoàn thành doanh thu = KQ / mục tiêu, trần 120%.
- **Điểm key metrics** = Σ tỷ trọng × %HT, tỷ trọng và tập chỉ số theo từng người.
- **% thưởng** theo bậc thang: ≤70% → 0; >70–80% → 15%; >80–90% → 20%; >90–100% → 25%; >100% → 35% (cấu hình được).
- **Point:** xuất bán và chuyển kho (hai cột point theo nhóm thiết bị), bảo hành, hỗ trợ sale (quỹ theo khu vực, chia theo hệ số),
  quản lý kho (nhật ký công việc cá nhân).
- **Thu nhập** = lương cố định + thưởng key metrics + thưởng vượt point + phụ cấp. Không phạt; point dưới Min không bị trừ.
- **Không bịa số:** thiếu dữ liệu → "chưa tính", mã hàng lạ → lỗi, hệ số/tỷ trọng lệch → lỗi.
  Ô trống khác số 0.

Chi tiết và ví dụ: `openspec/changes/tinh-thu-nhap-ky/specs/`.

## Tham số cấu hình và giá trị mặc định

Tất cả nằm trong `config.json` (về sau là tab Cấu hình), không hardcode trong code:

| Tham số | Mặc định | Ai được đổi |
|---|---|---|
| `donGiaPoint` | 50.000đ | Chủ sở hữu, khi chính sách đổi |
| `phuCap` (máy tính cá nhân) | 200.000đ | Chủ sở hữu |
| `heSoHoTroSale` | 0,17 | Chủ sở hữu |
| `pointMoiCaBaoHanh` | 1 | Chủ sở hữu |
| `heSoMin` | 0,7 | Chủ sở hữu |
| `tranDoanhThu` | 1,2 (120%) | Chủ sở hữu |
| `saiSoDoiSoat` | 0,01 point | Chủ sở hữu |
| Bảng bậc (lương cố định, Min, Max) | Bậc 1–5: 6 / 7,5 / 8,5 / 10 / 12 triệu; Min–Max 120–150 … 300–350 | Chủ sở hữu |
| Bậc thang thưởng key metrics | như trên | Chủ sở hữu |
| Bảng quy đổi công việc (nhóm thiết bị, mã hàng, việc quản lý kho) | theo bảng quy đổi hiện hành | Chủ sở hữu |
| Hệ số chia theo nguồn × khu vực × người | cố định đến khi sửa | Chủ sở hữu |
| Danh sách thành viên (tài khoản, bậc, khu vực, nhóm, cờ máy cá nhân, ghi đè lương, chỉ số và tỷ trọng) | — | Chủ sở hữu |

## Secret / API key

Mã không dùng secret, API key hay kết nối ra ngoài. `.gitignore` chặn `.env`, `.clasprc.json`, tệp `credentials*`,
các tệp dữ liệu thật trong `Prototype/` (`*.xlsx`, `*.xls`, `*.csv`) và thư mục `dist/` (mã sinh ra).
Không dùng `clasp` nên không có token đăng nhập nào cần giữ. Không để ID Sheet hay liên kết chia sẻ trong mã nguồn.

## Dữ liệu và quyền sử dụng

- Nguồn dữ liệu thật: báo cáo kiểm kê nhập-xuất-tồn của hai khu vực, số liệu bảo hành và hỗ trợ sale, nhật ký công việc, số liệu key metrics.
  Chủ sở hữu có quyền dùng cho mục đích tính lương của team; kết quả không được chia sẻ ra ngoài bộ phận sở hữu dữ liệu khi chưa được phép.
- Log chỉ ghi loại lỗi, tên trường, phạm vi và thời điểm. Không ghi tên, tài khoản, số lương, thu nhập hay nội dung nhật ký.

## Owner, dừng app và rollback

- **Owner:** chủ sở hữu (một người). **Backup: không có.** Rủi ro đã được ghi nhận: nếu owner vắng, không ai vận hành được.
  Nên giữ README này và tệp cấu hình ở một nơi để người khác có thể tiếp quản.
- **Kênh báo lỗi:** chỉ owner.
- **Dừng app / rollback:** lệnh Tính kỳ chỉ ghi ba tab đầu ra, **không sửa tab đầu vào**, nên không cần khôi phục dữ liệu nhập.
  Muốn dừng thì xoá menu (xoá mã Apps Script) hoặc ngừng dùng kết quả và quay lại workbook Excel cũ (giữ làm nguồn đối chiếu trong giai đoạn chạy song song).
  Với kỳ đã chốt: bản chốt là bản chính thức; muốn đổi phải **mở lại kỳ có lý do** (bản cũ được giữ, không xoá).

## Ngày review lại

Đề xuất rà soát quy tắc tính mỗi khi chính sách lương/KPI đổi, và tối thiểu mỗi năm: **2027-10-14**.

## Giới hạn đã biết

- Chưa tính theo ngày công; chưa tự tải báo cáo (phải dán hoặc chọn tệp CSV/TSV; **không đọc `.xlsx`**). Bảng điều khiển sửa được cấu hình và dữ liệu nhập, nhưng mỗi lần lưu **thay toàn bộ nội dung bảng**; nếu sửa nhầm, dùng Lịch sử phiên bản của Google Sheets để khôi phục. Các sửa tay trực tiếp trên Sheet vẫn được.
- Mục tiêu và kết quả key metrics hiển thị đúng đơn vị bạn đã nhập (ví dụ 0,0329), hệ thống không đoán là phần trăm hay số ngày.
- Bảng điều khiển hiển thị tối đa 500 dòng hàng của mỗi báo cáo ở màn Nhập point (phần còn lại vẫn được tính).
- Bảng điều khiển được kiểm thử bằng một DOM giả viết tay và quét tĩnh, **chưa chạy trên trình duyệt hay Sheet thật**: xem danh sách kiểm tay.
- Lớp Apps Script mới được kiểm thử trên một Sheet giả trong bộ nhớ; hành vi trên Sheet thật cần chủ sở hữu kiểm tay theo danh sách ở trên.
- Đã đối chiếu với công thức workbook cũ trên dữ liệu giả (xem `tests/evidence/reconciliation.md`),
  **chưa** trên số liệu thật. Chủ sở hữu cần tự so một kỳ thật trong môi trường riêng trước khi dùng.
- Kết quả là thông tin hỗ trợ quyết định; chủ sở hữu phải đọc và kiểm tra lại trước khi dùng.
