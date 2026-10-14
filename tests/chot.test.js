'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');

const c = nap();
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const T = '2026-10-14 08:00:00';
const kqBo = (bo = 'bo1', sua) => { const t = tabs(bo); if (sua) sua(t); return c.tinhKyTuCacTab(t, T); };
const chotBo1 = (xacNhan = []) => c.dungBanChot(kqBo(), T, xacNhan);

// ---------------------------------------------------------------- 2.1 dấu vân tay và chia đoạn
test('2.1 chuỗi trên 40.000 ký tự được chia nhiều đoạn và ghép lại nguyên vẹn', () => {
  const dai = 'Việt Nam ' .repeat(10000) + '{"x":"=+-@"}';
  assert.ok(dai.length > 90000);
  const doan = c.chiaDoan(dai, 40000);
  assert.equal(doan.length, 3);
  assert.ok(doan.every((d) => d.length <= 40000));
  assert.equal(c.ghepDoan([...doan]), dai);
});

test('2.1 ký tự tiếng Việt, ký tự đặc biệt và biểu tượng không đổi sau chia và ghép', () => {
  const s = 'Đảm bảo an toàn thiết bị ₫ ≤ ≥ "ngoặc" \\ \n \t 😀 =SUM(A1) +1 -2 @x'.repeat(5);
  for (const n of [1, 2, 7, 50, 100000]) assert.equal(c.ghepDoan([...c.chiaDoan(s, n)]), s);
});

test('2.1 chuỗi rỗng cho một đoạn rỗng', () => {
  assert.deepEqual([...c.chiaDoan('', 10)], ['']);
});

test('2.1 dấu vân tay: ổn định, 8 ký tự hex, đổi một ký tự thì đổi', () => {
  const a = c.dauVanTay('{"a":1}');
  assert.match(a, /^[0-9a-f]{8}$/);
  assert.equal(a, c.dauVanTay('{"a":1}'));
  assert.notEqual(a, c.dauVanTay('{"a":2}'));
  assert.notEqual(c.dauVanTay('abc'), c.dauVanTay('abd'));
  assert.notEqual(c.dauVanTay('Đ'), c.dauVanTay('D'));
  assert.equal(c.dauVanTay(''), '811c9dc5', 'giá trị khởi đầu của FNV-1a');
  assert.equal(c.dauVanTay('a'), 'e40c292c', 'vectơ kiểm chuẩn FNV-1a 32 bit');
});

// ---------------------------------------------------------------- 2.2 nội dung bản chốt
test('2.2 bản chốt bộ 1 có kỳ, cấu hình, dữ liệu kỳ, thành viên và tổng; không có trường bị loại', () => {
  const b = chotBo1();
  assert.equal(b.ky, '2026-09');
  assert.equal(b.thanhVien.length, 7);
  assert.equal(b.tong.thuNhap, 75838000);
  assert.equal(b.tong.soDaTinh, 6);
  assert.equal(b.cauHinh.thamSo.donGiaPoint, 50000);
  assert.equal(b.duLieuKy.ky.thang, '2026-09');
  const nd = JSON.stringify(b);
  assert.equal(nd.includes('1234567'), false, 'giá bán giả không được mang theo');
  assert.equal(nd.includes('999999'), false, 'giá trị tồn giả không được mang theo');
  assert.equal(nd.includes('Kiểm kho mẫu'), false, 'mô tả nhật ký không được mang theo');
});

test('2.2 người được xác nhận bỏ qua được ghi trong bản chốt', () => {
  const kq = kqBo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  const b = c.dungBanChot(kq, T, ['nva1', 'nvb2']);
  assert.deepEqual([...b.xacNhanBoQua], ['nva1', 'nvb2']);
  assert.equal(b.tong.soDaTinh, 4);
  assert.equal(b.tong.thuNhap, 49838000);
  assert.equal(b.thanhVien.find((r) => r.taiKhoan === 'nva1').thuNhap, null);
});

test('2.2 bản chốt là bản sao sâu: sửa kết quả gốc sau đó không đổi bản chốt', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  kq.cauHinh.thamSo.donGiaPoint = 1;
  assert.equal(b.cauHinh.thamSo.donGiaPoint, 50000);
});

// ---------------------------------------------------------------- 2.3 tab bản sao
test('2.3 dựng tab rồi đọc lại cho bản chốt giống hệt', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  const ra = plain(c.dungKetQuaSheet(kq));
  const tab = c.dungTabChot(b, ra.ketQua.giaTri);
  const doc = c.docTabChot(plain(tab.giaTri));
  assert.equal(doc.hopLe, true, JSON.stringify(doc.loi));
  assert.deepEqual(plain(doc.banChot), plain(b));
});

test('2.3 tab có siêu dữ liệu và bảng kết quả đã duyệt để đọc bằng mắt', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  const tab = plain(c.dungTabChot(b, plain(c.dungKetQuaSheet(kq)).ketQua.giaTri));
  const g = tab.giaTri;
  assert.ok(g[0][0].startsWith('BẢN SAO KỲ ĐÃ CHỐT'));
  assert.deepEqual(g[1].slice(0, 2), ['Kỳ', '2026-09']);
  assert.equal(g[4][1], 75838000);
  assert.equal(g[5][1], '6/6', 'người chỉ theo dõi point không nằm trong mẫu số');
  assert.equal(g[6][0], 'Dấu vân tay dữ liệu');
  assert.ok(g.some((d) => d[0] === 'Tổng team' && d[12] === 75838000));
});

test('2.3 bản chốt bị sửa tay: đọc ra cảnh báo và không hợp lệ', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  const tab = plain(c.dungTabChot(b, []));
  const iDoan = tab.giaTri.findIndex((d) => d[0] === 'DỮ LIỆU ĐÃ DÙNG (JSON, không sửa tay)') + 1;
  tab.giaTri[iDoan][0] = tab.giaTri[iDoan][0].replace('50000', '99999');
  const doc = c.docTabChot(tab.giaTri);
  assert.equal(doc.hopLe, false);
  assert.ok(doc.loi.some((l) => l.includes('đã bị sửa')));
});

test('2.3 dữ liệu lớn nhiều đoạn: dựng và đọc lại nguyên vẹn, mỗi ô không quá 40.001 ký tự', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  b.duLieuKy.nhatKy = [];
  for (let i = 0; i < 3000; i++) b.duLieuKy.nhatKy.push({ taiKhoan: 'nva1', loai: 'Kiểm kho', soLuong: i });
  const tab = plain(c.dungTabChot(b, []));
  assert.ok(tab.soDoan >= 2);
  for (const d of tab.giaTri) for (const o of d) if (typeof o === 'string') assert.ok(o.length <= 40001);
  const doc = c.docTabChot(tab.giaTri);
  assert.equal(doc.hopLe, true);
  assert.equal(doc.banChot.duLieuKy.nhatKy.length, 3000);
});

test('2.3 mọi đoạn bắt đầu bằng ký tự an toàn (không bao giờ = + - @) và ô chữ được đánh dấu văn bản', () => {
  const kq = kqBo();
  const b = c.dungBanChot(kq, T, []);
  b.cauHinh.ghiChu = '=cmd|calc';
  const tab = plain(c.dungTabChot(b, []));
  const iDoan = tab.giaTri.findIndex((d) => d[0] === 'DỮ LIỆU ĐÃ DÙNG (JSON, không sửa tay)') + 1;
  for (let i = iDoan; i < tab.giaTri.length; i++) assert.equal(/^[=+\-@]/.test(tab.giaTri[i][0]), false);
  assert.ok(tab.oVanBan.includes('A' + (iDoan + 1)));
});

test('2.3 tab không đúng cấu trúc hoặc thiếu đoạn thì không hợp lệ', () => {
  assert.equal(c.docTabChot([['a', 'b']]).hopLe, false);
  assert.equal(c.docTabChot(null).hopLe, false);
  const tab = plain(c.dungTabChot(chotBo1(), []));
  tab.giaTri.pop();
  assert.equal(c.docTabChot(tab.giaTri).hopLe, false);
});

// ---------------------------------------------------------------- 2.4 chỉ mục
function dongCM(ky, tt, o = {}) {
  return c.dungDongChiMuc(Object.assign({ ky, trangThai: tt, thoiDiem: T, tong: 100, soDaTinh: 6, soBoQua: 0, tenTab: 'Chot_' + ky, lyDo: '' }, o));
}
const bangCM = (...d) => [[...c.TIEU_DE_CHI_MUC], ...d.map(plain)];

test('2.4 hai sự kiện của một kỳ: chốt rồi mở lại thì trạng thái hiệu lực là Đã mở lại', () => {
  const cm = c.docChiMuc(bangCM(dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại', { lyDo: 'sửa số ca' })));
  assert.equal(cm.length, 2);
  assert.equal(c.trangThaiHieuLuc(cm, '2026-09'), 'Đã mở lại');
});

test('2.4 kỳ chưa từng chốt không có trạng thái; nhiều kỳ xen kẽ không lẫn nhau', () => {
  const cm = c.docChiMuc(bangCM(dongCM('2026-08', 'Đã chốt'), dongCM('2026-09', 'Đã chốt'), dongCM('2026-08', 'Đã mở lại')));
  assert.equal(c.trangThaiHieuLuc(cm, '2026-10'), null);
  assert.equal(c.trangThaiHieuLuc(cm, '2026-09'), 'Đã chốt');
  assert.equal(c.trangThaiHieuLuc(cm, '2026-08'), 'Đã mở lại');
  assert.equal(c.dongChotMoiNhat(cm, '2026-09').tenTab, 'Chot_2026-09');
});

test('2.4 chốt, mở lại, chốt lại: ba dòng và hiệu lực là Đã chốt', () => {
  const cm = c.docChiMuc(bangCM(dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại'), dongCM('2026-09', 'Đã chốt')));
  assert.equal(cm.length, 3);
  assert.equal(c.trangThaiHieuLuc(cm, '2026-09'), 'Đã chốt');
});

test('2.4 đọc chỉ mục bỏ qua dòng trống và dòng tiêu đề; tổng trống thành null; ghi nhận số dòng trong Sheet', () => {
  const cm = c.docChiMuc([[...c.TIEU_DE_CHI_MUC], [], dongCM('2026-09', 'Đã mở lại', { tong: null })]);
  assert.equal(cm.length, 1);
  assert.equal(cm[0].tong, null);
  assert.equal(cm[0].dong, 3);
  assert.deepEqual(plain(c.docChiMuc([])), []);
  assert.deepEqual(plain(c.docChiMuc(null)), []);
});

// ---------------------------------------------------------------- 2.5 điều kiện duyệt
test('2.5 bộ 1 đủ dữ liệu: được duyệt, không cần xác nhận ai (người chỉ theo dõi point không cần)', () => {
  const r = c.danhGiaDieuKienDuyet(kqBo(), null, []);
  assert.equal(r.duocPhep, true);
  assert.deepEqual(plain(r.canXacNhan), []);
});

test('2.5 thiếu xác nhận: hai người chưa tính, xác nhận một người thì nêu đúng tài khoản người còn lại', () => {
  const kq = kqBo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  const r = c.danhGiaDieuKienDuyet(kq, null, ['nva1']);
  assert.equal(r.duocPhep, false);
  assert.deepEqual(plain(r.thieuXacNhan), ['nvb2']);
  assert.deepEqual(plain(r.canXacNhan).map((x) => x.taiKhoan), ['nva1', 'nvb2']);
  assert.ok(r.canXacNhan[0].lyDo.includes('Key metrics'));
});

test('2.5 xác nhận đủ (không phân biệt hoa/thường) thì được duyệt', () => {
  const kq = kqBo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  assert.equal(c.danhGiaDieuKienDuyet(kq, null, ['NVA1', 'nvb2']).duocPhep, true);
  assert.equal(c.danhGiaDieuKienDuyet(kq, null, ['nva1', 'nvb2', 'nguoi-thua']).duocPhep, true, 'xác nhận thừa không gây hại');
});

test('2.5 lỗi chặn toàn bộ, không ai tính được, đối soát lệch, kỳ đã chốt đều chặn duyệt kèm lý do', () => {
  const t1 = tabs(); delete t1.CH_Bac;
  const chan = c.danhGiaDieuKienDuyet(c.tinhKyTuCacTab(t1, T), null, []);
  assert.equal(chan.duocPhep, false);
  assert.equal(chan.lyDo[0].ma, 'CHAN_TOAN_BO');

  const khongAi = c.danhGiaDieuKienDuyet(kqBo('bo3'), null, ['nva1', 'nvb2', 'nvc3', 'nve5', 'nvf6', 'nvg7']);
  assert.ok(khongAi.lyDo.some((l) => l.ma === 'KHONG_AI_TINH_DUOC'));
  assert.equal(khongAi.duocPhep, false);

  const kq = kqBo();
  kq.doiSoat.push({ nguon: 'baoHanh', khuVuc: 'hn', quy: 300, daChia: 290, lech: -10, dat: false });
  const lech = c.danhGiaDieuKienDuyet(kq, null, []);
  assert.ok(lech.lyDo.some((l) => l.ma === 'DOI_SOAT_LECH' && l.thongDiep.includes('baoHanh')));

  const daChot = c.danhGiaDieuKienDuyet(kqBo(), 'Đã chốt', []);
  assert.equal(daChot.duocPhep, false);
  assert.ok(daChot.lyDo.some((l) => l.ma === 'KY_DA_CHOT' && l.thongDiep.includes('Mở lại kỳ')));
});

test('2.5 kỳ đã mở lại thì được duyệt lại; nhật ký chưa khớp chặn duyệt', () => {
  assert.equal(c.danhGiaDieuKienDuyet(kqBo(), 'Đã mở lại', []).duocPhep, true);
  const t = tabs(); t.NhatKyCongViec.push(['khongco', 'Kiểm kho', '', 1]);
  const r = c.danhGiaDieuKienDuyet(c.tinhKyTuCacTab(t, T), null, []);
  assert.ok(r.lyDo.some((l) => l.ma === 'DU_LIEU_CHUA_KHOP'));
});

// ---------------------------------------------------------------- 2.6 so sánh với bản chốt
test('2.6 tính lại giống bản chốt', () => {
  const b = chotBo1();
  const r = c.soSanhVoiBanChot(kqBo(), b);
  assert.equal(r.giong, true);
  assert.equal(r.tongKhac, 0);
});

test('2.6 tính lại khác bản chốt hai người sau khi đổi một ô', () => {
  const b = chotBo1();
  const kq = kqBo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  const r = c.soSanhVoiBanChot(kq, b);
  assert.equal(r.giong, false);
  assert.equal(r.tongKhac, 2);
  assert.deepEqual(plain(r.khac).map((x) => [x.taiKhoan, x.cu, x.moi]), [['nva1', 9800000, null], ['nvb2', 16200000, null]]);
});

test('2.6 thêm hoặc bớt thành viên cũng tính là khác', () => {
  const b = chotBo1();
  b.thanhVien.push({ taiKhoan: 'nvx9', trangThai: 'daTinh', thuNhap: 1 });
  const r = c.soSanhVoiBanChot(kqBo(), b);
  assert.equal(r.tongKhac, 1);
  assert.equal(r.khac[0].taiKhoan, 'nvx9');
});

// ---------------------------------------------------------------- 2.7 tên tab và tab mồ côi
test('2.7 tên tab bản sao và bản cũ', () => {
  assert.equal(c.tenTabChot('2026-09'), 'Chot_2026-09');
  assert.equal(c.tenTabChotCu('2026-09', 2), 'Chot_2026-09_cu2');
  assert.equal(c.soThuTuTabCu(['A', 'Chot_2026-09'], '2026-09'), 1);
  assert.equal(c.soThuTuTabCu(['Chot_2026-09_cu1', 'Chot_2026-09_cu2', 'Chot_2026-10_cu7'], '2026-09'), 3);
});

test('2.7 laTabChot nhận tab chỉ mục và mọi tab có tiền tố Chot_ (không phân biệt hoa/thường)', () => {
  for (const t of ['KyDaChot', 'kydachot', 'Chot_2026-09', 'chot_2026-09_cu1']) assert.equal(c.laTabChot(t), true, t);
  for (const t of ['KetQua', 'CH_Bac', 'Chotmau', 'KiemKe_HN']) assert.equal(c.laTabChot(t), false, t);
});

test('2.7 tab mồ côi: có Chot_<kỳ> nhưng chỉ mục không coi kỳ đang Đã chốt', () => {
  const cm = c.docChiMuc(bangCM(dongCM('2026-08', 'Đã chốt')));
  assert.deepEqual([...c.timTabMoCoi(['KetQua', 'Chot_2026-08', 'Chot_2026-09'], cm)], ['Chot_2026-09']);
  const cm2 = c.docChiMuc(bangCM(dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại')));
  assert.deepEqual([...c.timTabMoCoi(['Chot_2026-09', 'Chot_2026-09_cu1'], cm2)], ['Chot_2026-09'], 'sau khi mở lại, tab Chot_<kỳ> còn sót là mồ côi; bản _cu giữ nguyên');
  assert.deepEqual([...c.timTabMoCoi(['Chot_2026-09_cu1'], cm2)], []);
  assert.deepEqual([...c.timTabMoCoi([], [])], []);
});
