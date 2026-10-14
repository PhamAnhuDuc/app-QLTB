# Design

## Context

- Thu nhập đang được tính bằng một workbook Excel nhiều sheet (point, key metrics, bảng quy đổi công việc, cấu hình bậc). Công thức đã được đọc lại và đối chiếu bằng số: %HT nội suy 0% tại Min đến 100% tại mục tiêu; điểm key metrics theo tỷ trọng từng người; point vượt cắt trần Max; thưởng vượt point nhân đơn giá. Workbook âm thầm bỏ qua mã hàng không có trong bảng quy đổi và có một giá trị point quản lý kho bị nhập tay đè công thức.
- Môi trường dự kiến: Google Sheet riêng tư kèm Apps Script, một người dùng. Lương là dữ liệu Bảo mật, Tier 3 (xem proposal.md - Impact). Chưa có code, chưa có spec nào trong `openspec/specs/`.
- Nguồn dữ liệu đầu vào hằng kỳ: hai báo cáo kiểm kê nhập-xuất-tồn (Hà Nội, TP.HCM; dùng cột "SL bán ra trong kỳ" và "SL chuyển kho"), số ca bảo hành và số đơn hỗ trợ sale theo khu vực, nhật ký công việc quản lý kho theo tài khoản, và mục tiêu/kết quả key metrics. Cách đưa các dữ liệu này vào Sheet thuộc change sau.

## Goals / Non-Goals

**Goals:**
- Một lõi tính **thuần** (không phụ thuộc Apps Script, Sheet hay UI): nhận cấu hình và dữ liệu kỳ, trả kết quả, danh sách lỗi và cảnh báo.
- Kiểm thử được bằng bộ dữ liệu giả, chạy được cả trên máy ngoài Apps Script.
- Cùng kết quả với workbook cũ khi dữ liệu hợp lệ (đối chiếu bằng ví dụ), nhưng báo lỗi ở những chỗ workbook cũ im lặng bỏ qua.

**Non-Goals:**
- Giao diện, import file kiểm kê, duyệt/chốt kỳ, bản sao kỳ, mở lại kỳ, tính theo ngày công, chỉ số tỷ lệ active MBH.
- Thêm thư viện hay dịch vụ ngoài (chuẩn Sapo 2.6).

## Decisions

1. **Tách lõi tính khỏi lớp vào/ra.** Lõi là các hàm thuần JavaScript không gọi API của Apps Script; lớp Sheet chỉ đọc dữ liệu, gọi lõi, ghi kết quả. *Vì sao:* kiểm thử bằng Node với dữ liệu giả, và lõi dùng lại được khi đổi giao diện. *Phương án khác:* viết thẳng công thức trong ô Sheet như workbook cũ, nhưng khó test và khó đối soát.

2. **Dữ liệu vào là cấu trúc rõ, khoá bằng tài khoản.** Thành viên định danh bằng tài khoản (không phân biệt hoa/thường); tên chỉ để hiển thị. Mã hàng và tên nhóm cũng so khớp không phân biệt hoa/thường. *Vì sao:* workbook cũ liên kết nhật ký công việc và bảng point bằng tài khoản; tên dễ lệch dấu và chữ hoa.

3. **Thu thập lỗi, không dừng ở lỗi đầu tiên.** Mỗi lần tính trả về danh sách lỗi (chặn), cảnh báo (không chặn) và kết quả từng thành viên với trạng thái đủ hay thiếu. Một nguồn lỗi chỉ chặn phần phụ thuộc nó (ví dụ mã hàng lạ ở Hà Nội chặn quỹ xuất bán Hà Nội, không chặn TP.HCM). *Vì sao:* chủ sở hữu thấy hết vấn đề một lượt thay vì sửa từng lỗi một.

4. **Phân biệt trống với 0.** Ô chưa nhập là "thiếu"; 0 do người dùng nhập là số liệu. *Vì sao:* tránh bịa kết quả khi dữ liệu thiếu (chuẩn Sapo 2.8); trạng thái "đủ dữ liệu" phụ thuộc phân biệt này.

5. **Tiền tính bằng số thực, làm tròn ở cuối.** Từng khoản giữ độ chính xác; thu nhập mỗi người làm tròn đến đồng khi hiển thị và tổng hợp; tổng nhóm/team là tổng các giá trị đã làm tròn. *Vì sao:* tổng hiển thị khớp với cộng tay các dòng. *Phương án khác:* làm tròn từng khoản, nhưng có thể lệch vài đồng so với workbook cũ.

6. **Đối soát là tính năng của lõi.** Tổng point đã chia phải bằng quỹ từng nguồn × khu vực (sai số 0,01); tổng point quản lý kho khớp nhật ký. *Vì sao:* workbook cũ có các ô kiểm tra tương tự và đã có trường hợp nhập tay đè công thức.

7. **Cấu hình có kiểm tra khi lưu.** Min < Max, bậc thang phủ kín không chồng, hệ số mỗi nguồn × khu vực tổng bằng 1, tỷ trọng mỗi người tổng 100%, tài khoản và mã hàng không trùng. *Vì sao:* bắt lỗi cấu hình sớm, không để ra kết quả lương sai âm thầm.

8. **Bộ kiểm thử bằng dữ liệu giả, không thêm thư viện.** Dùng Node có sẵn (assert) và tệp dữ liệu JSON giả; ba bộ bắt buộc: bình thường, khác kỳ/bậc/khu vực, và dữ liệu xấu hoặc thiếu trường. Lưu input và output làm bằng chứng test (chuẩn Sapo 2.8). *Phương án khác:* thư viện test ngoài, bị loại để không thêm phụ thuộc.

9. **Dữ liệu thật không đi qua AI.** Việc build và test chỉ dùng dữ liệu giả; log chỉ ghi loại lỗi, trường thiếu và thời điểm, không ghi lương/thu nhập (chuẩn Sapo 2.1, 3.2, mục D5).

## Risks / Trade-offs

- [Công thức hiểu sai nên lệch lương] → Mọi công thức có ví dụ số trong spec; tự đối chiếu với workbook cũ bằng dữ liệu giả cùng cấu trúc trước khi dùng lương thật; panel "cách tính" để chủ sở hữu kiểm tay.
- [Workbook cũ bỏ sót im lặng nên số mới khác số cũ] → Lỗi mã hàng lạ hiện rõ; khi đối chiếu, khác biệt đó là chủ đích và được liệt kê.
- [Một người vận hành, không có backup] → Rủi ro đã ghi nhận ở owner; viết README bàn giao và giữ cấu hình ở một nơi.
- [Báo cáo kiểm kê chỉ phủ một phần tháng] → Cảnh báo khoảng ngày và yêu cầu xác nhận trước khi dùng.
- [Số thực gây sai số nhỏ] → Làm tròn một lần ở cuối; đối soát dùng sai số 0,01 point.
- [Quy tắc công thức nằm ở workbook, không có văn bản gốc trong repo] → Spec là nơi ghi lại; nếu chính sách lương đổi, sửa spec rồi sửa cấu hình/code.

## Migration Plan

Không có dữ liệu cần di chuyển. Workbook cũ giữ nguyên làm nguồn đối chiếu trong giai đoạn chạy song song: tính một kỳ bằng cả hai và giải thích mọi chênh lệch trước khi dùng kết quả mới. Rollback là tiếp tục dùng workbook cũ.

## Open Questions

- Quy tắc làm tròn (cuối cùng đến đồng, hay từng khoản)? Mặc định theo Decision 5, đổi được mà không ảnh hưởng cấu trúc.
- Có cho ghi đè Min/Max theo người không? Mặc định không (chỉ ghi đè lương cố định); chủ sở hữu chưa xác nhận.
- Nguồn nào bắt buộc để coi "đủ dữ liệu" cho người không có hệ số ở nguồn đó? Spec hiện coi nguồn không có hệ số là không áp dụng; chủ sở hữu cần xác nhận khi review.
- Cách đưa báo cáo kiểm kê và nhật ký công việc vào Sheet (dán hay đọc tệp) sẽ chốt ở change về nhập dữ liệu.
