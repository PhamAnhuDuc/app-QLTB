# Mini PRD: Form tính point & thu nhập tạm tính — Team QL&PTTB

> Trạng thái: **đã được cập nhật theo OpenSpec change `tinh-thu-nhap-ky`**. Nguồn chuẩn cho quy tắc tính là `openspec/changes/tinh-thu-nhap-ky/specs/`; tài liệu này chỉ còn là bản tóm tắt cho người đọc và phần Prompt gen UI. Lõi tính đã có trong `src/core/`, giao diện chưa làm. Mọi số liệu/tên trong tài liệu này là dữ liệu giả.
> Tier: **Tier 3** (owner xác nhận dùng lương thật — nhóm D5, dữ liệu Bảo mật). Khuyến nghị phối hợp Đội kỹ thuật AI khi vận hành lâu dài.
> Môi trường: Google Sheet riêng (chế độ Riêng tư) + Apps Script. Dữ liệu lương thật **không** đưa vào AI.

## 1. Mục tiêu
Thay bảng tính tay bằng một form trong Google Sheet để trưởng nhóm tính **point và thu nhập tạm tính hàng tháng** cho từng thành viên Team QL&PTTB. Kết quả chỉ là **đề xuất chờ duyệt** (QĐ-02 Điều 5.2, chuẩn Sapo 2.9). Một người dùng duy nhất (owner).

## 2. Input → Output

### Input hằng tháng
- **Point (4 nguồn):**
  1. Xuất bán / Chuyển kho: SL "bán ra trong kỳ" và SL "chuyển kho" của từng mã hàng theo khu vực (HN/HCM), mã hàng → nhóm thiết bị (bảng QĐCV), mỗi nhóm có **hai cột point riêng** (xuất bán, chuyển kho) → quỹ point khu vực → chia cho nhân viên theo hệ số.
  2. Bảo hành: số ca × 1 point → chia theo hệ số khu vực.
  3. Hỗ trợ sale: số đơn × 0,17 → chia theo hệ số khu vực.
  4. Quản lý kho: **nhật ký công việc cá nhân** (tài khoản, loại việc, mô tả, số lượng); point = số lượng × hệ số của loại việc trong QĐCV. Không chia theo hệ số.
- **Key metrics (4 chỉ số):** Vòng quay HTK, Tỷ lệ bảo hành, Tỷ lệ hài lòng thiết bị, Hoàn thành doanh thu. **Tập chỉ số và tỷ trọng theo từng người** (ví dụ nhóm Quản lý kho chỉ có vòng quay HTK và doanh thu). Mục tiêu và kết quả nhập một lần theo nhóm hoặc khu vực, có thể đặt riêng cho một tài khoản.
- Nguồn: phần **import** (file export, chỉ đọc) và phần **nhập tay**.

### Công thức (đã chốt)
- %HT chỉ số: **nội suy tuyến tính từ 0% tại Min đến 100% tại Mục tiêu**; tệ hơn hoặc bằng Min thì 0% (không tính tiếp theo tỷ lệ); trần 100%. Min = Mục tiêu / 0,7 nếu chỉ số càng thấp càng tốt (vòng quay HTK, tỷ lệ bảo hành); Mục tiêu × 0,7 nếu càng cao càng tốt (hài lòng thiết bị). Hoàn thành doanh thu = KQ/MT, trần 120%, không có Min.
- Điểm KM = Σ (tỷ trọng × %HT).
- % thưởng KM theo bậc thang: ≤70% → 0; >70–80% → 15%; >80–90% → 20%; >90–100% → 25%; >100% → 35%.
- Point vượt = min(Point, Max) − Min, và không âm (point dưới Min **không bị trừ**).
- Thu nhập tạm tính = Lương cố định + Lương cố định × % thưởng KM + Point vượt × đơn giá point + Phụ cấp.
- **Phụ cấp** = 200.000đ nếu nhân sự dùng **máy tính cá nhân**; = 0 nếu dùng máy công ty cấp phát. Là cờ "Máy tính cá nhân" theo từng người, không phải hằng số chung.
- Không có phạt.

### Output (mỗi thành viên, mỗi tháng)
Σ point, point vượt, điểm KM, % thưởng KM, lương cố định, thưởng KM, thưởng vượt point, phụ cấp, **thu nhập tạm tính**; tổng team. Thành viên có point nhưng chưa có key metrics: nhãn **Theo dõi point**, thu nhập để trống.

### Ví dụ mẫu (dữ liệu giả, dùng làm test)
Nhân viên A, Bậc 1 (cố định 6.000.000; Min/Max 120/150), Σ point 324,1, điểm KM 99,6% → % thưởng 25%, dùng máy cá nhân (phụ cấp 200.000):
- Point vượt = min(324,1; 150) − 120 = 30
- Thưởng vượt = 30 × 50.000 = 1.500.000
- Thưởng KM = 25% × 6.000.000 = 1.500.000
- Thu nhập = 6.000.000 + 1.500.000 + 1.500.000 + 200.000 = **9.200.000**

Ví dụ 2 (ghi đè lương cố định): Nhân viên B, Bậc 4, lương cố định ghi tay 10.800.000, Min/Max 250/300, Σ point 491,7, % thưởng 25%, máy cá nhân (phụ cấp 200.000) → thưởng KM 2.700.000; thưởng vượt = 50 × 50.000 = 2.500.000; thu nhập = **16.200.000**.

Ví dụ 3 (point dưới trần): Nhân viên C, Bậc 4 (cố định 10.000.000; 250/300), Σ point 298,67, % thưởng 25%, máy công ty (phụ cấp 0) → point vượt 48,67 × 50.000 ≈ 2.433.333; thu nhập ≈ **14.933.333**.

## 3. Ràng buộc
- **Không hardcode:** đơn giá point (50.000đ), mức phụ cấp máy cá nhân (200.000đ), hệ số hỗ trợ sale (0,17), point/ca bảo hành (1), bảng Bậc 1–5, bậc thang thưởng KM, bảng QĐCV (124 mã hàng → nhóm thiết bị → point), hệ số chia theo khu vực, hệ số 0,375 "Quản lý sale admin tỉnh", danh sách thành viên (kèm cờ "Máy tính cá nhân") → đều nằm ở tab **Cấu hình**, sửa được.
- Bảng Bậc mặc định: Bậc 1 = 6tr (120–150), Bậc 2 = 7,5tr (150–200), Bậc 3 = 8,5tr (200–250), Bậc 4 = 10tr (250–300), Bậc 5 = 12tr (300–350). Cho phép **ghi đè lương cố định theo người** (nhập tay), hiện cảnh báo vàng, không chặn.
- Hệ số chia mỗi khu vực phải có tổng = 1; tổng tỷ trọng key metrics = 100%; vi phạm → báo lỗi, không tính.
- Mã hàng lạ (chưa có trong QĐCV) → báo rõ dòng/mã, không tự điền.
- Chỉ owner truy cập; Sheet chế độ Riêng tư, không để "bất kỳ ai có link".
- Log chỉ ghi loại lỗi + trường thiếu; không ghi lương/thu nhập chi tiết.
- Duyệt và chốt kỳ là **một bước**: bấm "Xác nhận duyệt" là lưu bản sao và khoá kỳ. Mở lại kỳ (có dấu vết) là đề xuất chưa được chủ sở hữu xác nhận. Phần này thuộc change sau, chưa làm.

## 4. Định nghĩa "xong"
- Ví dụ mẫu 1 và 2 ra đúng 9.200.000 và 16.200.000.
- Chạy 2 lần cùng input cho cùng kết quả.
- Đổi đơn giá point/phụ cấp/bậc thang ở Cấu hình → kết quả đổi đúng, không sửa code.
- Test 3 bộ dữ liệu giả, lưu input + output: (1) bình thường; (2) tháng khác hoặc bậc khác; (3) thiếu trường/sai kiểu → báo lỗi rõ, không bịa số.
- Mặc định mọi kết quả là "Đề xuất – chờ duyệt"; chỉ đổi thành "Đã duyệt" khi owner bấm xác nhận.

## 5. Ngoài phạm vi
Tự động chi trả hoặc ghi sang hệ thống lương; phạt/trừ point dưới Min; chia sẻ cho thành viên; phân quyền nhiều người; chạy theo lịch tự động; chỉ số "Tỷ lệ active MBH"; xử lý dữ liệu lương thật bằng AI.

## Quyết định đã chốt (owner)
1. Bậc thang thưởng KM theo công thức: 80–90% → 20%.
2. Lương cố định cho phép ghi tay đè bảng bậc.
3. Point dưới Min không trừ gì.
4. Hệ số 0,375 đưa vào Cấu hình.
5. Bỏ "Tỷ lệ active MBH".
6. Người có point nhưng chưa có key metrics: theo dõi point, chưa tính thu nhập.

## Giả định (owner soát)
- "Theo dõi" ở mục 6 = vẫn hiển thị trong danh sách với nhãn "Theo dõi point", thu nhập để trống.
- Owner: bạn. **Không có backup**, kênh báo lỗi = chỉ owner (đã xác nhận). Rủi ro: owner vắng thì không ai vận hành; nên ghi README bàn giao để người khác tiếp quản nếu cần.
- Tier 3, dùng lương thật: Sheet chỉ owner truy cập; không chia sẻ link; dữ liệu thật không đưa vào AI; phát triển và test bằng dữ liệu giả.

## Open Questions
Không còn câu hỏi chặn. Các giả định còn chờ owner xác nhận nằm ở `design.md` của change: ghi đè chỉ đổi lương cố định (không đổi Min/Max), người không có hệ số ở một nguồn thì nguồn đó không áp dụng, làm tròn thu nhập từng người đến đồng, và cơ chế mở lại kỳ.

---

## Prompt gen UI

```
Thiết kế giao diện web responsive cho: "Form tính point & thu nhập tạm tính hàng tháng" của Team QL&PTTB (công cụ nội bộ, chỉ 1 người dùng là trưởng nhóm; kết quả chỉ là ĐỀ XUẤT chờ người duyệt).

NGƯỜI DÙNG: Trưởng nhóm không rành kỹ thuật, dùng mỗi tháng một lần để tính point và thu nhập cho khoảng 5–7 thành viên ở 2 khu vực (Hà Nội, TP.HCM). Dữ liệu là lương thưởng nên cần cảm giác chắc chắn, minh bạch cách tính, không cẩu thả.

PHONG CÁCH: Doanh nghiệp, gọn, nhiều dữ liệu dạng bảng nhưng thoáng. Sapo Blue #007AFF là màu chính; Sapo Green #16D865 chỉ làm điểm nhấn (đạt, thành công); cảnh báo dùng vàng #FFAE06. Nền Off-Blue #F0F4F9, thẻ trắng, chữ đậm Berkeley Blue #0F1437. Font Inter. Sentence case, KHÔNG viết hoa toàn bộ, căn lề trái, không đổ bóng chữ, không gradient tuỳ tiện. Góc bo tròn nhẹ.

KHUNG CHUNG: Thanh bước ở trên theo thứ tự: 1 Tổng quan → 2 Nhập point → 3 Nhập key metrics → 4 Kết quả → 5 Duyệt & lưu. Có nút "Cấu hình" riêng ở góc phải. Luôn hiện kỳ đang làm (ví dụ "Tháng 09/2026") và nhãn trạng thái: Nháp / Đề xuất – chờ duyệt / Đã duyệt.

CÁC MÀN HÌNH:
1. Tổng quan kỳ
   - Chọn tháng, thẻ tổng thu nhập tạm tính của team, danh sách thành viên (tên giả, bậc, khu vực) kèm 2 chip trạng thái: "Point: đủ/thiếu" và "Key metrics: đủ/thiếu".
   - Thành viên có point nhưng chưa có key metrics: nhãn "Theo dõi point", thu nhập hiện "—" (không tự điền, không tính).

2. Nhập point — 4 tab con theo nguồn point
   - Tab "Xuất bán / Chuyển kho": nút "Import từ file export", bảng số lượng theo mã hàng × khu vực (HN/HCM). Mỗi mã hàng hiện nhóm thiết bị và point quy đổi (chỉ đọc). Cuối bảng: quỹ point mỗi khu vực.
   - Tab "Bảo hành": ô số ca theo khu vực (1 ca = 1 point).
   - Tab "Hỗ trợ sale": ô số đơn theo khu vực (1 đơn = 0,17 point).
   - Tab "Quản lý kho" (nhật ký công việc): bảng mỗi dòng gồm tài khoản, loại việc (chọn từ danh sách), mô tả, số lượng, hệ số (tự điền từ bảng quy đổi, chỉ đọc), point. Cuối bảng: tổng point của từng người. Dòng có số lượng 0 nghĩa là đã xác nhận không phát sinh.
   - Dưới mỗi tab: bảng "Chia cho nhân viên" hiển thị hệ số chia theo khu vực (ví dụ HN: A 0,6 / B 0,4; HCM: C 0,7 / D 0,3), tổng hệ số mỗi khu vực phải bằng 1 (báo lỗi nếu lệch), và point mỗi người nhận được.
   - Cột "import" chỉ đọc nền xám nhạt; cột "nhập tay" sửa được.

3. Nhập key metrics
   - Phần "Kết quả dùng chung": nhập mục tiêu và kết quả của từng chỉ số (Vòng quay HTK, Tỷ lệ bảo hành, Tỷ lệ hài lòng thiết bị, Hoàn thành doanh thu) theo nhóm hoặc khu vực; có thể đặt riêng cho một thành viên.
   - Phần theo từng thành viên: chỉ hiện các chỉ số áp dụng cho người đó (có người chỉ có 2 chỉ số), mỗi chỉ số gồm tỷ trọng riêng của người đó, mục tiêu, kết quả, %HT (tự tính, thanh tiến độ nhỏ). Chỉ số "thấp tốt" (vòng quay HTK, tỷ lệ bảo hành) ghi chú rõ để người dùng không nhầm chiều.
   - Hiển thị Σ điểm key metrics và % thưởng theo bậc thang (≤70%: 0; >70–80%: 15%; >80–90%: 20%; >90–100%: 25%; >100%: 35%).
   - Tổng tỷ trọng các chỉ số của mỗi thành viên phải bằng 100%, nếu lệch hiện lỗi cho đúng người đó. Thành viên không có chỉ số nào hiện nhãn "Theo dõi point".

4. Kết quả tính
   - Bảng: Thành viên, Bậc, Σ point, Min–Max, Point vượt, Điểm KM, % thưởng KM, Lương cố định, Thưởng KM, Thưởng vượt point, Phụ cấp (0 hoặc 200.000đ tuỳ máy cá nhân/máy công ty), Thu nhập tạm tính. Hàng tổng theo từng nhóm công việc và hàng tổng team, mỗi hàng ghi rõ "cộng của N/M người" (chỉ cộng người đã tính; không ai tính được thì để trống, không hiện 0).
   - Bấm một hàng mở panel "Cách tính" liệt kê từng bước: point vượt = min(point, Max) − Min; thưởng vượt = point vượt × đơn giá point; thưởng KM = lương cố định × % thưởng; thu nhập = cố định + thưởng KM + thưởng vượt + phụ cấp.
   - Cảnh báo (vàng, không chặn): lương cố định đã bị ghi tay khác bảng bậc; point thấp hơn Min (chỉ hiện thông tin, không trừ gì); point vượt Max bị cắt trần.
   - Nhãn nổi bật "Đề xuất – chờ duyệt".

5. Duyệt & lưu kỳ
   - Tóm tắt kỳ, danh sách người chưa đủ dữ liệu (mỗi người phải được xác nhận bỏ qua), một nút "Xác nhận duyệt" (có hộp thoại xác nhận; duyệt là chốt kỳ và lưu bản sao), lịch sử các kỳ đã duyệt (chỉ xem).

6. Cấu hình (mọi giá trị đều sửa được, không hardcode)
   - Bảng Bậc 1–5: lương cố định, point Min, point Max.
   - Bậc thang thưởng key metrics (các ngưỡng và % thưởng).
   - Đơn giá point (mặc định 50.000đ), mức phụ cấp máy cá nhân (mặc định 200.000đ), hệ số hỗ trợ sale (mặc định 0,17), point mỗi ca bảo hành (mặc định 1), hệ số "Quản lý sale admin tỉnh" (mặc định 0,375).
   - Bảng quy đổi công việc (QĐCV): mã hàng → nhóm thiết bị; nhóm thiết bị → hai cột point (xuất bán, chuyển kho); việc quản lý kho → hệ số. So khớp không phân biệt hoa/thường.
   - Bảng hệ số chia: theo nguồn (xuất bán/chuyển kho, bảo hành, hỗ trợ sale) × khu vực × thành viên, tổng mỗi nguồn và khu vực phải bằng 1.
   - Danh sách thành viên: tài khoản (khoá định danh), tên hiển thị, bậc, khu vực, nhóm, ghi tay lương cố định (nếu có), cờ "Dùng máy tính cá nhân" (bật = nhận phụ cấp), tập chỉ số key metrics và tỷ trọng riêng.
   - Nút Lưu và Khôi phục mặc định.

TRẠNG THÁI cần thể hiện cho mỗi màn có dữ liệu:
- Rỗng: "Chưa có dữ liệu kỳ này. Hãy import file export hoặc nhập tay." kèm nút hành động.
- Loading: skeleton hoặc spinner khi import và tính.
- Lỗi: file import sai định dạng, thiếu cột hoặc mã hàng lạ chưa có trong bảng QĐCV (nêu rõ dòng/mã nào, không tự điền số); hệ số chia không bằng 1; tổng tỷ trọng lệch 100%.
- Thành công: "Đã tính xong", "Đã duyệt kỳ MM/YYYY".

RÀNG BUỘC:
- Toàn bộ số liệu và tên trong thiết kế mẫu là dữ liệu giả (Nhân viên A, B, C, D…), không dùng tên hay lương thật.
- Kết quả luôn mang nhãn "Đề xuất – chờ duyệt" cho đến khi người dùng bấm xác nhận; duyệt (cũng là chốt kỳ) phải có hộp thoại xác nhận. Ô chưa nhập khác số 0: hiện "chưa có", không hiện 0.
- Không có phạt; point dưới Min không bị trừ. Point vượt bị chặn bởi trần Max của bậc.
- Chỉ một người dùng; không hiển thị tính năng chia sẻ hay phân quyền.
- Số tiền định dạng 9.200.000đ; point 1 chữ số thập phân; phần trăm 1 chữ số thập phân.

Trả về từng màn hình một. Ngôn ngữ giao diện: Tiếng Việt.
```
