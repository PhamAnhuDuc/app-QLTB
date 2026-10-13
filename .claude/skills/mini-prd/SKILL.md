---
name: mini-prd
description: Biến một ý tưởng app/tính năng còn mơ hồ thành một "mini PRD" gọn (khung 5+2 câu) KÈM một đoạn prompt sẵn sàng dán thẳng vào công cụ AI gen giao diện (AI Studio, Claude, v0, Figma Make, Lovable...). Dùng skill này bất cứ khi nào người dùng muốn: viết mini PRD / spec ngắn, mô tả một app hoặc tính năng để AI dựng UI, "làm cho tôi giao diện màn hình X", chuẩn hoá yêu cầu trước khi cho AI gen giao diện, hoặc than phiền rằng "AI dựng UI sai ý tôi". Trigger cả khi người dùng chỉ nói "viết PRD", "spec cái này", "brief cho AI làm giao diện", "mô tả app để gen UI" mà không nói thẳng chữ "mini PRD".
---

# Mini PRD → Prompt gen UI

Mục tiêu: lấy một ý tưởng còn mơ hồ và biến nó thành **hai thứ**:

1. **Mini PRD** — tài liệu ngắn, có cấu trúc, mô tả *cái gì* cần làm (nghiệp vụ).
2. **Prompt gen UI** — một đoạn văn bản gọn, tối ưu để dán thẳng vào công cụ AI dựng giao diện.

Lý do tách hai thứ: mini PRD giúp *con người* thống nhất phạm vi; prompt gen UI là thứ *máy* đọc để dựng đúng hình hài. Người dùng thường chỉ viết một câu "làm app quản lý kho" rồi than AI dựng lệch — vì thiếu phần mô tả màn hình, trạng thái và phong cách. Skill này lấp đúng chỗ đó.

## Bước 0 — Chốt chặn: đây có phải công cụ nội bộ Sapo không?

Chạy bước này **trước tiên**, trước cả khi phỏng vấn 5+2.

Nếu thứ đang làm là **công cụ nội bộ Sapo** (phục vụ công việc, dùng dữ liệu Sapo, hoặc do nhân sự Sapo build), thì mini-prd **không phải là chuẩn** — nó chỉ là công cụ chạy nhanh cho *một phần* của quy trình chuẩn. Nguồn chuẩn duy nhất là file `sapo-vibe-coding-standard-non-tech-v1.2.md`. Khi đó, làm theo thứ tự:

1. **Đọc file `sapo-vibe-coding-standard-non-tech-v1.2.md`** (tìm ở gốc dự án). Đây là nguồn chuẩn, đừng chép nội dung nó ra chỗ khác.
2. Chạy **Bước 0 của chuẩn Sapo — phân loại tier** (0/1/2/3) và **kiểm tra an toàn dữ liệu** (mục 2.1). Hai thứ này gate mọi thứ, không được bỏ qua kể cả app dùng một lần.
3. Rẽ nhánh theo tier:
   - **Tier 0/1** (cá nhân, chỉ đọc): được dùng khung 5+2 gọn nhẹ bên dưới. Vẫn giữ an toàn dữ liệu + không hardcode.
   - **Tier 2+** (dùng chung / có ghi-sửa-xóa dữ liệu): mini PRD này **chính là bản nháp "spec một trang"** của Bước 1 chuẩn Sapo. Trình bày theo **đúng 5 mục template Sapo** (Mục tiêu / Input→Output / Ràng buộc / Định nghĩa "xong" / Ngoài phạm vi) — **không đẻ spec thứ hai**. Phần *màn hình + trạng thái + phong cách* của mini-prd trở thành phụ lục "prompt gen UI" gắn kèm spec đó. Sau đó tiếp tục Bước 0.5 → 4 của chuẩn Sapo (môi trường, secret, test 3 bộ, log/rollback, checklist cổng C1–C12) như bình thường.

Nếu **không phải công cụ Sapo** (prototype cá nhân, dựng UI thử, sản phẩm ngoài), bỏ qua chốt chặn này và dùng thẳng khung 5+2.

Khi chưa chắc có phải công cụ Sapo hay không, **hỏi một câu** rồi mới đi tiếp.

## Khung 5+2

Năm câu gốc lo phần *nghiệp vụ*, hai câu thêm lo phần *hình hài UI* — thứ AI hay tự bịa nếu không nói.

1. **Ai dùng?** — vai trò, trình độ, ngữ cảnh dùng. Quyết định tông & độ phức tạp.
2. **Cần giải quyết việc gì?** — mục tiêu chính. Quyết định nội dung nào ưu tiên.
3. **Luồng chính gồm những bước nào?** — mô tả *theo từng màn hình* nếu được. Đây là câu quan trọng nhất: nó quyết định số màn hình và thứ tự.
4. **Cần nhập và hiển thị dữ liệu gì?** — để dựng form, field, bảng, thẻ, state rỗng.
5. **Điều gì không được làm sai?** — ràng buộc, validation, cảnh báo, quyền.
6. **Chạy trên đâu & bao nhiêu màn hình?** *(thêm)* — web / mobile / responsive; 1 màn hay nhiều màn/nhiều tab; mật độ thông tin (dashboard dày data vs. app đơn giản).
7. **Phong cách & tông muốn?** *(thêm)* — tối giản / hiện đại / doanh nghiệp / vui tươi; màu chủ đạo hoặc brand nếu có; tham chiếu ("giống Notion", "giống Linear").

## Quy trình

### Bước 1 — Phỏng vấn

Trình bày 7 câu hỏi cho người dùng một lần, gọn gàng, và mời họ trả lời (có thể trả lời hết một lượt, hoặc để trống câu chưa nghĩ ra). Đừng bắn từng câu một qua nhiều lượt — nó mệt. Đặt câu hỏi bằng ngôn ngữ của người dùng.

Nếu người dùng đã mô tả sẵn ý tưởng trong hội thoại, **tự điền trước** những câu suy ra được, rồi chỉ hỏi lại những chỗ còn trống hoặc mơ hồ. Đừng bắt họ lặp lại thứ đã nói.

Nếu người dùng bảo "cứ làm đi, đừng hỏi nhiều" — tự điền hợp lý nhất có thể, đánh dấu rõ chỗ nào là giả định của bạn (mục *Giả định* trong PRD) để họ soát lại.

### Bước 2 — Viết Mini PRD

Dùng đúng khung dưới. Giữ ngắn — mỗi mục vài dòng, không viết văn dài. Với câu 3, nếu tách được thành *danh sách màn hình*, hãy tách — nó khớp 1:1 với cách AI dựng UI.

```markdown
# Mini PRD: [Tên app/tính năng]

## 1. Ai dùng
[Vai trò + ngữ cảnh, 1–2 dòng]

## 2. Giải quyết việc gì
[Mục tiêu chính, 1–2 dòng]

## 3. Luồng chính (theo màn hình)
- Màn 1 — [Tên]: [người dùng làm gì ở đây]
- Màn 2 — [Tên]: [...]
- ...

## 4. Dữ liệu nhập & hiển thị
- Nhập: [các field cần nhập]
- Hiển thị: [các thứ cần hiện ra: danh sách, thẻ, số liệu...]

## 5. Không được làm sai
- [Ràng buộc / validation / quyền / cảnh báo]

## 6. Nền tảng & số màn hình
[Web/mobile/responsive; số màn; mật độ thông tin]

## 7. Phong cách & tông
[Style + màu/brand + tham chiếu nếu có]

## Giả định (nếu có)
- [Những chỗ bạn tự điền, cần người dùng xác nhận]
```

### Bước 3 — Sinh Prompt gen UI

Đây là phần giá trị nhất. Prompt gen UI *không phải* copy y nguyên PRD — nó được viết lại theo cách một công cụ dựng giao diện đọc tốt nhất: nói rõ **từng màn hình**, **thành phần trên màn**, **trạng thái**, và **phong cách**.

Điểm mà AI gen UI hay dựng thiếu nhất là **trạng thái giao diện** — luôn nhắc: rỗng (chưa có data), loading, lỗi, thành công. Và **phân quyền** nếu có nhiều loại người dùng.

Xuất prompt trong một khối code riêng (để người dùng copy dễ), theo mẫu:

````markdown
```
Thiết kế giao diện [web/mobile responsive] cho: [tên + mô tả 1 câu].

NGƯỜI DÙNG: [ai, ngữ cảnh].

PHONG CÁCH: [tối giản/hiện đại/...]; màu chủ đạo [...]; tham chiếu [giống X]. Ưu tiên rõ ràng, dễ đọc, khoảng trắng thoáng.

CÁC MÀN HÌNH:
1. [Tên màn] — [mục đích]
   - Thành phần: [header, form, bảng, thẻ, nút...]
   - Nhập: [field]
   - Hiển thị: [dữ liệu]
   - Hành động chính: [nút/thao tác]
2. [Màn tiếp theo] — [...]

TRẠNG THÁI cần thể hiện cho mỗi màn có dữ liệu:
- Rỗng (chưa có data): [gợi ý nội dung]
- Loading
- Lỗi
- Thành công / xác nhận

RÀNG BUỘC:
- [validation, quyền, cảnh báo — thứ không được làm sai]

Trả về [từng màn hình một / một luồng hoàn chỉnh]. Ngôn ngữ giao diện: [Tiếng Việt/English].
```
````

### Bước 4 — Bàn giao

Đưa cả hai: mini PRD trước, rồi prompt gen UI trong khối code. Nói ngắn gọn người dùng có thể dán prompt vào đâu (AI Studio, Claude, v0, Figma Make, Lovable...). Hỏi xem có muốn chỉnh màn nào hoặc đổi phong cách không.

## Nguyên tắc chất lượng

- **Mô tả luồng = danh sách màn hình.** Đây là thứ giúp AI map đúng nhất. Nếu người dùng mô tả luồng dạng văn xuôi, tự tách ra thành các màn.
- **Luôn có trạng thái.** Rỗng/loading/lỗi/thành công. Bỏ qua là ra UI "đẹp lúc demo, vỡ lúc thật".
- **Đừng ép chi tiết pixel.** Phong cách chỉ cần 1–2 dòng đủ để AI không đi lệch hướng; để AI tự do phần thẩm mỹ chi tiết.
- **Ngắn gọn thắng dài dòng.** Mini PRD dài quá thì mất tác dụng "mini". Prompt dài quá thì AI bỏ sót. Ưu tiên gạch đầu dòng.
- **Giữ ngôn ngữ của người dùng.** Nếu họ làm việc bằng tiếng Việt, xuất PRD và prompt bằng tiếng Việt (chỉ định rõ "ngôn ngữ giao diện" trong prompt).
