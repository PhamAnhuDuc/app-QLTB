'use strict';
// Giao diện sửa dữ liệu và các màn mới (task 10.x): trang thật + DOM giả + các hàm máy chủ THẬT chạy trên Sheet giả.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');
const { FakeDocument, nutCoChu, tatCaChu } = require('./fake-dom');

const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const thieuHaiNguoi = (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); };

class FakeFileReader { readAsText(f) { this.result = f.noiDung; if (f.hong) this.onerror(); else this.onload(); } }

// Cầu nối đồng bộ: google.script.run gọi thẳng hàm máy chủ thật; ghi lại lời gọi để kiểm tra.
function moi(sua, chiaSe) {
  const t = tabs(); if (sua) sua(t);
  const mt = taoMoiTruong(t, chiaSe);
  const c = nap(Object.assign({ FileReader: FakeFileReader }, mt.globals));
  const lenh = [];
  const run = { withSuccessHandler: (ok) => ({ withFailureHandler: (fail) => new Proxy({}, { get: (_, ten) => (...a) => {
    lenh.push({ ten, tham: plain(a) });
    let kq; try { kq = c[ten](...a); } catch (e) { fail(e); return; } ok(kq);
  } }) }) };
  const doc = new FakeDocument();
  c.maKhachGiaoDien(doc, { script: { run } });
  return { c, mt, ss: mt.ss, doc, lenh };
}
const chuyen = (doc, ten) => { const b = nutCoChu(doc, ten); assert.ok(b.length >= 1, `không thấy nút ${ten}`); b[0].click(); };
const nhapO = (n, v) => { n.value = v; n.phat('input'); };
const oText = (doc) => doc.goc.tim((n) => n.tag === 'input' && n.attrs.type === 'text');
const oCoGiaTri = (doc, v) => oText(doc).filter((n) => n.value === v)[0];
const dongY = (doc) => chuyen(doc, 'Đồng ý');
const gocData = (ss, ten) => ss.getSheetByName(ten).data.map((d) => d.slice());

test('10.2 bộ soạn: sửa ô báo có thay đổi chưa lưu, Hủy trả về nội dung đã lưu và không gọi lưu', () => {
  const { doc, lenh } = moi();
  chuyen(doc, 'Cấu hình');
  assert.ok(oCoGiaTri(doc, 'donGiaPoint'));
  const o = oCoGiaTri(doc, '50000');
  const luu = nutCoChu(doc, 'Lưu')[0], huy = nutCoChu(doc, 'Hủy thay đổi')[0];
  assert.equal(luu.disabled, true); assert.equal(huy.disabled, true);
  nhapO(o, '51000');
  assert.equal(luu.disabled, false); assert.equal(huy.disabled, false);
  assert.ok(tatCaChu(doc).includes('Có thay đổi chưa lưu'));
  huy.click();
  assert.equal(oText(doc).some((n) => n.value === '51000'), false);
  assert.ok(oCoGiaTri(doc, '50000'));
  assert.equal(tatCaChu(doc).includes('Có thay đổi chưa lưu'), false);
  assert.equal(lenh.some((l) => l.ten === 'giaoDienLuuBang'), false);
});

test('10.2 lưu: có hộp xác nhận, chỉ khi đồng ý mới gọi máy chủ; ghi đúng tab và giữ kiểu số', () => {
  const { doc, lenh, ss } = moi();
  chuyen(doc, 'Cấu hình');
  nhapO(oCoGiaTri(doc, '50000'), '51000');
  nutCoChu(doc, 'Lưu')[0].click();
  assert.ok(tatCaChu(doc).includes('Lưu bảng'));
  assert.equal(lenh.some((l) => l.ten === 'giaoDienLuuBang'), false, 'chưa gọi khi chưa đồng ý');
  nutCoChu(doc, 'Hủy')[0].click();
  assert.equal(lenh.some((l) => l.ten === 'giaoDienLuuBang'), false);
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  const goi = lenh.filter((l) => l.ten === 'giaoDienLuuBang');
  assert.equal(goi.length, 1);
  assert.equal(goi[0].tham[0], 'thamSo');
  assert.equal(gocData(ss, 'CH_ThamSo')[1][1], 51000);
  assert.ok(tatCaChu(doc).includes('Đã lưu bảng'));
  assert.equal(tatCaChu(doc).includes('Có thay đổi chưa lưu'), false);
});

test('10.2 lưu bị từ chối: nêu lỗi bằng tiếng Việt và giữ nguyên nội dung đang soạn', () => {
  const { doc, ss } = moi();
  chuyen(doc, 'Cấu hình'); chuyen(doc, 'Bậc');
  const truoc = JSON.stringify(ss.getSheetByName('CH_Bac').data);
  const o = oCoGiaTri(doc, '6000000');
  assert.ok(o, 'ô lương bậc 1');
  nhapO(o, 'năm mươi nghìn');
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  assert.ok(tatCaChu(doc).includes('Không lưu được bảng'));
  assert.ok(oCoGiaTri(doc, 'năm mươi nghìn'), 'nội dung đang soạn được giữ');
  assert.equal(JSON.stringify(ss.getSheetByName('CH_Bac').data), truoc);
  assert.ok(doc.goc.tim((n) => n.className.includes('thong-bao-loi')).length >= 2, 'có lỗi cụ thể trên bảng');
});

test('10.2 ô chứa thẻ HTML giữ như chữ, gửi lên như chữ và không tạo phần tử nào', () => {
  const { doc, lenh, ss } = moi();
  chuyen(doc, 'Cấu hình'); chuyen(doc, 'Thành viên');
  const o = oCoGiaTri(doc, 'Nhân viên A');
  nhapO(o, '<b>x</b>');
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  assert.equal(lenh.filter((l) => l.ten === 'giaoDienLuuBang')[0].tham[1][0][1], '<b>x</b>');
  assert.ok(oCoGiaTri(doc, '<b>x</b>'));
  assert.equal(doc.goc.tim((n) => ['b', 'img', 'script', 'iframe'].includes(n.tag)).length, 0);
  assert.equal(gocData(ss, 'CH_ThanhVien')[1][1], '<b>x</b>');
});

test('10.2 thêm và xoá dòng; thêm dòng trống rồi lưu thì dòng trống bị bỏ', () => {
  const { doc, lenh } = moi();
  chuyen(doc, 'Cấu hình'); chuyen(doc, 'Bậc');
  const truoc = oText(doc).length;
  nutCoChu(doc, 'Thêm dòng')[0].click();
  assert.equal(oText(doc).length, truoc + 4);
  assert.ok(tatCaChu(doc).includes('Có thay đổi chưa lưu'));
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  assert.equal(lenh.filter((l) => l.ten === 'giaoDienLuuBang')[0].tham[1].length, 6, 'dòng trống được gửi nhưng máy chủ bỏ');
  assert.equal(oText(doc).length, truoc, 'sau khi lưu bộ soạn bỏ dòng trống như máy chủ');
  assert.equal(tatCaChu(doc).includes('Có thay đổi chưa lưu'), false);
  nutCoChu(doc, 'Xoá')[0].click();
  assert.equal(oText(doc).length, truoc - 4);
});

test('10.6 Cấu hình: Khôi phục mặc định chỉ có ở bốn bảng và có hộp xác nhận', () => {
  const { doc, lenh, ss } = moi();
  chuyen(doc, 'Cấu hình'); chuyen(doc, 'Bậc');
  nhapO(oText(doc)[1], '1'); nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  assert.equal(gocData(ss, 'CH_Bac')[1][1], 1);
  nutCoChu(doc, 'Khôi phục mặc định')[0].click();
  assert.equal(lenh.some((l) => l.ten === 'giaoDienKhoiPhucMacDinh'), false);
  dongY(doc);
  assert.deepEqual(plain(lenh.filter((l) => l.ten === 'giaoDienKhoiPhucMacDinh').map((l) => l.tham)), [['bac']]);
  assert.equal(gocData(ss, 'CH_Bac')[1][1], 6000000);
  assert.ok(tatCaChu(doc).includes('Đã khôi phục mặc định'));
  chuyen(doc, 'Thành viên');
  assert.equal(nutCoChu(doc, 'Khôi phục mặc định').length, 0);
});

test('10.1 ô chọn kỳ: danh sách 13 tháng, chọn tháng gọi đặt kỳ và hiển thị kỳ mới', () => {
  const { doc, lenh, ss } = moi();
  const sel = doc.goc.tim((n) => n.tag === 'select' && n.className.includes('chon-ky'))[0];
  assert.equal(sel.children.length, 13);
  assert.equal(sel.value, '2026-09');
  sel.value = '2026-10'; sel.phat('change');
  assert.deepEqual(plain(lenh.filter((l) => l.ten === 'giaoDienDatKy').map((l) => l.tham)), [['2026-10']]);
  assert.equal(gocData(ss, 'Ky')[1][1], '2026-10');
  assert.ok(tatCaChu(doc).includes('Kỳ 2026-10'));
});

test('10.5 sau khi sửa bảng, màn Kết quả hiện số mới kèm ghi chú chưa ghi ra tab kết quả; Tính kỳ ghi ra và bỏ ghi chú', () => {
  const { doc, ss } = moi();
  chuyen(doc, 'Cấu hình');
  nhapO(oCoGiaTri(doc, '50000'), '51000');
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  chuyen(doc, 'Kết quả');
  assert.ok(tatCaChu(doc).includes('chưa ghi ra tab kết quả'));
  assert.equal(ss.getSheetByName('KetQua'), null);
  assert.equal(tatCaChu(doc).includes('75.838.000đ'), false, 'đơn giá đổi thì tổng đổi');
  chuyen(doc, 'Tính lại');
  assert.equal(tatCaChu(doc).includes('chưa ghi ra tab kết quả'), false);
  assert.ok(ss.getSheetByName('KetQua'));
});

test('10.5 panel Cách tính: bấm tên mở, bấm lại hoặc Đóng thì ẩn; các bước theo đúng thứ tự', () => {
  const { doc, lenh } = moi();
  chuyen(doc, 'Tính kỳ');
  chuyen(doc, 'Kết quả');
  const n0 = lenh.length;
  assert.equal(tatCaChu(doc).includes('Cách tính: Nhân viên A'), false);
  chuyen(doc, 'Nhân viên A');
  assert.ok(tatCaChu(doc).includes('Cách tính: Nhân viên A'));
  const buoc = doc.goc.tim((n) => n.tag === 'li').map((n) => n.textContent);
  assert.ok(/^Xuất bán \/ chuyển kho khu vực HN: quỹ 237,3 × hệ số 0,4 = 94,92 point$/.test(buoc[0]), buoc[0]);
  assert.ok(buoc.findIndex((b) => b.startsWith('Tổng point')) > 0);
  assert.ok(buoc.findIndex((b) => b.startsWith('Điểm key metrics')) > buoc.findIndex((b) => b.startsWith('Tổng point')));
  assert.ok(buoc[buoc.length - 1].includes('9.800.000'));
  chuyen(doc, 'Nhân viên A');
  assert.equal(tatCaChu(doc).includes('Cách tính: Nhân viên A'), false);
  chuyen(doc, 'Nhân viên B'); chuyen(doc, 'Đóng');
  assert.equal(tatCaChu(doc).includes('Cách tính:'), false);
  assert.equal(lenh.length, n0, 'xem cách tính không gọi máy chủ');
});

test('10.4 key metrics: thanh khớp %HT, Σ điểm và % thưởng, ghi chú thấp tốt; thiếu thì báo thiếu thay vì thanh', () => {
  const a = moi();
  chuyen(a.doc, 'Tính kỳ'); chuyen(a.doc, 'Nhập key metrics');
  const thanh = a.doc.goc.tim((n) => n.className.startsWith('thanh-day'));
  assert.ok(thanh.length >= 15);
  assert.ok(thanh.every((n) => /^width:\d+%$/.test(n.attrs.style)));
  assert.ok(thanh.some((n) => n.attrs.style === 'width:100%'));
  const chu = tatCaChu(a.doc);
  assert.ok(chu.includes('Σ điểm key metrics: 1,01 · % thưởng: 35%'));
  assert.ok(chu.includes('càng thấp càng tốt'));
  assert.ok(chu.includes('105,0%'));
  const b = moi(thieuHaiNguoi);
  chuyen(b.doc, 'Tính kỳ'); chuyen(b.doc, 'Nhập key metrics');
  assert.ok(tatCaChu(b.doc).includes('Key metrics: thiếu'));
  assert.ok(tatCaChu(b.doc).includes('Tỷ lệ bảo hành'));
});

test('10.3 nhập point: quỹ, chia hệ số, bảo hành, quản lý kho, mã hàng và nhóm theo khu vực', () => {
  const { doc } = moi();
  chuyen(doc, 'Tính kỳ'); chuyen(doc, 'Nhập point');
  const chu = tatCaChu(doc);
  for (const can of ['khu vực HN', 'khu vực HCM', 'Quỹ point của khu vực: 237,3', 'Quỹ point của khu vực: 203,8', 'SP-001', 'MBH S2', 'Hệ số chia', 'Point nhận',
    'Quỹ point: 300', 'Quỹ point: 68', 'Quản lý kho', 'Kiểm kho', 'Đầu mối 360', 'Tổng của Nhân viên C']) assert.ok(chu.includes(can), `thiếu "${can}"`);
  for (const cam of ['1234567', '999999', 'Thiết bị mẫu', 'Kiểm kho mẫu']) assert.equal(chu.includes(cam), false, cam);
  assert.ok(doc.goc.tim((n) => n.tag === 'td' && n.textContent === 'Tổng').length >= 2);
});

test('10.3 khu vực chưa có báo cáo: trạng thái rỗng kèm nút nhập, không có bảng toàn số 0', () => {
  const { doc } = moi((t) => { delete t.KiemKe_HCM; });
  chuyen(doc, 'Nhập point');
  const chu = tatCaChu(doc);
  assert.ok(chu.includes('Chưa có báo cáo kiểm kê đọc được của khu vực HCM'));
  assert.ok(nutCoChu(doc, 'Nhập báo cáo').length >= 1);
  assert.ok(nutCoChu(doc, 'Nhập lại báo cáo').length >= 1, 'HN đã có báo cáo');
});

const BAO_CAO = 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\tSL chuyển kho\nSP-001\tMay A\t5\t2\nSP-002\tMay B\t3\t0';
const moHop = (doc) => { chuyen(doc, 'Nhập point'); nutCoChu(doc, 'Nhập lại báo cáo')[0].click(); };
const vungDan = (doc) => doc.goc.tim((n) => n.tag === 'textarea' && n.className.includes('vung-dan'))[0];

test('10.3 hộp nhập báo cáo: dán văn bản, xác nhận rồi ghi đúng tab của khu vực', () => {
  const { doc, ss, lenh } = moi();
  moHop(doc);
  const nut = () => nutCoChu(doc, 'Nhập báo cáo').filter((n) => n.className.includes('nut-chinh'))[0];
  assert.equal(nut().disabled, true, 'chưa dán thì chưa bấm được');
  vungDan(doc).value = BAO_CAO; vungDan(doc).phat('input');
  assert.equal(nut().disabled, false);
  nut().click();
  assert.equal(lenh.some((l) => l.ten === 'giaoDienNhapBaoCao'), false, 'phải xác nhận trước');
  dongY(doc);
  assert.deepEqual(plain(lenh.filter((l) => l.ten === 'giaoDienNhapBaoCao')[0].tham), ['HN', BAO_CAO]);
  assert.equal(gocData(ss, 'KiemKe_HN')[1][0], 'SP-001');
  assert.ok(tatCaChu(doc).includes('Đã nhập báo cáo khu vực HN'));
  assert.equal(vungDan(doc), undefined, 'hộp đã đóng');
});

test('10.3 hộp nhập báo cáo: thiếu cột bị từ chối, nêu lỗi trong hộp, giữ nội dung đã dán và tab không đổi', () => {
  const { doc, ss } = moi();
  moHop(doc);
  const sai = BAO_CAO.replace('\tSL chuyển kho', '').replace(/\t2\n/, '\n').replace(/\t0$/, '');
  vungDan(doc).value = sai; vungDan(doc).phat('input');
  const truoc = JSON.stringify(ss.getSheetByName('KiemKe_HN').data);
  nutCoChu(doc, 'Nhập báo cáo').filter((n) => n.className.includes('nut-chinh'))[0].click(); dongY(doc);
  assert.ok(tatCaChu(doc).includes('SL chuyển kho'));
  assert.equal(vungDan(doc).value, sai);
  assert.equal(JSON.stringify(ss.getSheetByName('KiemKe_HN').data), truoc);
});

test('10.3 chọn tệp CSV/TSV: đọc bằng FileReader trong trình duyệt rồi đưa vào ô; tệp quá lớn hoặc hỏng bị từ chối', () => {
  const { doc, lenh } = moi();
  moHop(doc);
  const tep = () => doc.goc.tim((n) => n.tag === 'input' && n.attrs.type === 'file')[0];
  tep().files = [{ name: 'hn.tsv', size: 200, noiDung: BAO_CAO }]; tep().phat('change');
  assert.equal(vungDan(doc).value, BAO_CAO);
  assert.ok(tatCaChu(doc).includes('Đã đọc tệp: hn.tsv'));
  tep().files = [{ name: 'to.csv', size: 6000000, noiDung: 'x' }]; tep().phat('change');
  assert.ok(tatCaChu(doc).includes('Tệp lớn hơn 5 MB'));
  tep().files = [{ name: 'hong.csv', size: 10, hong: true }]; tep().phat('change');
  assert.ok(tatCaChu(doc).includes('Không đọc được tệp'));
  assert.equal(lenh.some((l) => l.ten === 'giaoDienNhapBaoCao'), false, 'chọn tệp không tự gửi lên máy chủ');
});

test('10.3 hộp nhập báo cáo: Đóng thì bỏ hộp và không gọi máy chủ', () => {
  const { doc, lenh } = moi();
  moHop(doc);
  vungDan(doc).value = BAO_CAO; vungDan(doc).phat('input');
  nutCoChu(doc, 'Đóng')[0].click();
  assert.equal(vungDan(doc), undefined);
  assert.equal(lenh.some((l) => l.ten === 'giaoDienNhapBaoCao'), false);
});

test('10.7 kỳ đã chốt: bảng nhập tay bị khoá kèm chỉ dẫn mở lại kỳ, bảng cấu hình vẫn sửa được', () => {
  const { doc } = moi();
  chuyen(doc, 'Tính kỳ'); chuyen(doc, 'Duyệt và lưu'); chuyen(doc, 'Xác nhận duyệt'); dongY(doc);
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09'));
  chuyen(doc, 'Nhập point');
  assert.ok(tatCaChu(doc).includes('Mở lại kỳ'));
  assert.equal(nutCoChu(doc, 'Thêm dòng').every((n) => n.disabled), true);
  chuyen(doc, 'Cấu hình');
  assert.equal(nutCoChu(doc, 'Thêm dòng')[0].disabled, false);
});

test('10.7 đầu cuối: sửa đơn giá, tính, duyệt trong một phiên cho kết quả đúng', () => {
  const { doc, ss } = moi();
  chuyen(doc, 'Cấu hình');
  nhapO(oCoGiaTri(doc, '50000'), '60000');
  nutCoChu(doc, 'Lưu')[0].click(); dongY(doc);
  chuyen(doc, 'Kết quả'); chuyen(doc, 'Tính lại');
  const kq = gocData(ss, 'KetQua');
  assert.ok(kq.length > 3);
  chuyen(doc, 'Duyệt và lưu'); chuyen(doc, 'Xác nhận duyệt'); dongY(doc);
  assert.ok(ss.getSheetByName('Chot_2026-09'));
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09'));
  assert.equal(gocData(ss, 'CH_ThamSo')[1][1], 60000);
});
