# Proposal

## Why

Hiện tại thu nhập hằng tháng của Team QL&PTTB được tính bằng một file Excel nhiều sheet (point, key metrics, bảng quy đổi công việc) với công thức dài, một số giá trị nhập tay hoặc hardcode, và công thức tra cứu âm thầm bỏ qua mã hàng không có trong bảng quy đổi. Đây là số liệu lương thưởng (nhóm D5, Tier 3 theo chuẩn Sapo): sai số nhỏ cũng đổi bậc thưởng, và người tính phải tự soát bằng mắt. Cần một lõi quy tắc tính được kiểm chứng bằng ví dụ, cấu hình được, báo lỗi rõ khi dữ liệu thiếu hoặc sai, và chỉ ra **đề xuất chờ duyệt** thay vì tự quyết.

## What Changes

- Tách toàn bộ quy tắc tính từ file Excel ra thành các spec có thể kiểm chứng: cấu hình, tính và chia point, chấm key metrics, tính thu nhập tạm tính.
- Công thức %HT theo đúng file đang dùng: nội suy tuyến tính từ 0% tại Min đến 100% tại Mục tiêu, tệ hơn hoặc bằng Min thì 0%, trần 100%; chỉ số "thấp tốt" (vòng quay HTK, tỷ lệ bảo hành) và "cao tốt" (hài lòng thiết bị) đối xứng; doanh thu dùng KQ/Mục tiêu trần 120%.
- Điểm key metrics là tổng tỷ trọng × %HT, **tỷ trọng và tập chỉ số cấu hình theo từng người**.
- Point có 4 nguồn (xuất bán/chuyển kho, bảo hành, hỗ trợ sale, quản lý kho là nhật ký công việc). Quỹ point theo khu vực được chia theo hệ số cấu hình theo nguồn × khu vực × người.
- Bảng quy đổi công việc có **hai cột point** (xuất bán, chuyển kho) theo nhóm thiết bị; mã hàng → nhóm; tra cứu không phân biệt hoa/thường.
- Thu nhập tạm tính = lương cố định + thưởng key metrics + thưởng vượt point + phụ cấp (cờ máy tính cá nhân). Point dưới Min không bị trừ; không có phạt.
- Mã hàng lạ, hệ số chia không bằng 1, tỷ trọng không bằng 100%, tổng point chia không khớp quỹ đều **báo lỗi rõ**, không âm thầm bỏ qua và không tự điền số.
- Người thiếu dữ liệu không bị tính (hiện "chưa tính") và không bị tự điền 0.
- Mọi kết quả là **đề xuất chờ duyệt**; người duyệt cuối là owner (một người dùng).

Không thuộc change này (để các change sau): giao diện Apps Script, nhập/import file kiểm kê vào Sheet, duyệt và chốt kỳ (bản sao kỳ, mở lại kỳ), tính theo ngày công, chỉ số "tỷ lệ active MBH".

## Capabilities

### New Capabilities
- `income-config`: Cấu hình sửa được không cần đổi code: bảng bậc (lương cố định, point Min/Max), bậc thang thưởng key metrics, đơn giá point, mức phụ cấp, bảng quy đổi công việc, hệ số chia point, danh sách thành viên (bậc, khu vực, tài khoản, cờ máy tính cá nhân, ghi đè lương cố định, tỷ trọng và tập chỉ số).
- `point-allocation`: Tính point từ 4 nguồn trong một kỳ và chia quỹ point khu vực cho từng người theo hệ số, kèm đối soát tổng chia bằng quỹ.
- `key-metrics-scoring`: Tính %HT từng chỉ số, điểm key metrics theo tỷ trọng của từng người, và % thưởng theo bậc thang.
- `income-calculation`: Tính thu nhập tạm tính từng người và tổng theo nhóm/team, xử lý trạng thái thiếu dữ liệu, và gắn nhãn đề xuất chờ duyệt.

### Modified Capabilities
<!-- Chưa có spec nào trong dự án; không có capability hiện hữu bị thay đổi. -->

## Impact

- **Dữ liệu:** thu nhập, lương, tên và tài khoản nhân sự là dữ liệu Bảo mật (QĐ-02). Ví dụ trong spec chỉ dùng dữ liệu giả. Báo cáo kiểm kê và file tính point thật chỉ được đọc để lấy cấu trúc và công thức, không chép giá trị vào tài liệu hay code.
- **Môi trường dự kiến:** Google Sheet riêng tư kèm Apps Script, một người dùng (owner). Spec này không gắn cứng vào công nghệ để phần tính có thể kiểm thử độc lập.
- **Phân loại:** Tier 3 (lương thật), owner không có backup (rủi ro đã ghi nhận trong spec cũ `mini-prd-form-tinh-point.md`).
- **Tài liệu hiện có bị lệch:** `mini-prd-form-tinh-point.md` và PDF Prototype còn công thức %HT cũ, tỷ trọng chung và một cột point; cần cập nhật theo change này.
- **Chưa có code**; change sau mới viết Apps Script và giao diện.
