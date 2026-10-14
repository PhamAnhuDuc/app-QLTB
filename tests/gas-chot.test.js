'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');

const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const TAB_RA = ['KetQua', 'GiaiThich', 'NhatKyHeThong', 'KyDaChot'];
const laTabDauRa = (t) => TAB_RA.includes(t) || /^Chot_/.test(t);
const tabDauVao = (mt) => mt.ss.sheets.map((s) => s.ten).filter((t) => !laTabDauRa(t));

function moi(bo = 'bo1', sua, chiaSe) {
  const t = tabs(bo);
  if (sua) sua(t);
  const mt = taoMoiTruong(t, chiaSe);
  const c = nap(mt.globals);
  return { mt, c, ss: mt.ss };
}
// Bỏ chỉ số bảo hành HN: Nhân viên A và B thành "chưa tính"
const thieuHaiNguoi = (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); };
const chiMuc = (ss) => ss.getSheetByName('KyDaChot').data.slice(1).filter((d) => d.length);

// ---------------------------------------------------------------- 3.1 duyệt thành công
test('3.1 chốt bộ 1: tạo Chot_2026-09 và KyDaChot, trả kết quả đúng', () => {
  const { mt, c, ss } = moi();
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, true);
  assert.equal(r.ky, '2026-09');
  assert.equal(r.tong, 75838000);
  assert.equal(r.soDaTinh, 6);
  assert.ok(ss.getSheetByName('Chot_2026-09'));
  const cm = chiMuc(ss);
  assert.equal(cm.length, 1);
  assert.deepEqual(plain(cm[0]).slice(0, 2), ['2026-09', 'Đã chốt']);
  assert.equal(cm[0][3], 75838000);
  assert.equal(cm[0][6], 'Chot_2026-09');
  assert.equal(ss.getSheetByName('KetQua').data[0][0], 'Đề xuất – chờ duyệt', 'tab kết quả cũng được ghi để khớp với bản chốt');
});

test('3.1 bản chốt đọc lại được, hợp lệ và có cấu hình lẫn dữ liệu đã dùng', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const doc = c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues());
  assert.equal(doc.hopLe, true, JSON.stringify(doc.loi));
  assert.equal(doc.banChot.cauHinh.thamSo.donGiaPoint, 50000);
  assert.equal(doc.banChot.tong.thuNhap, 75838000);
});

test('3.1 tab bản sao và chỉ mục được bảo vệ ở chế độ chỉ cảnh báo', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  assert.deepEqual(plain(ss.getSheetByName('Chot_2026-09').baoVe), { canhBao: true });
  assert.deepEqual(plain(ss.getSheetByName('KyDaChot').baoVe), { canhBao: true });
});

test('3.1 dữ liệu sửa sau lần tính gần nhất được phản ánh (không dùng tab kết quả cũ)', () => {
  const { c, ss } = moi();
  c.tinhKyTuMenu(); // tab kết quả: 75.838.000
  const sh = ss.getSheetByName('CH_ThamSo');
  sh.data[sh.data.findIndex((d) => d[0] === 'donGiaPoint')][1] = 60000; // sửa sau lần tính
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, true);
  assert.notEqual(r.tong, 75838000, 'bản chốt phản ánh đơn giá mới');
  const doc = c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues());
  assert.equal(doc.banChot.cauHinh.thamSo.donGiaPoint, 60000);
});

test('3.1 chia sẻ rộng: từ chối duyệt và không ghi gì', () => {
  const { mt, c, ss } = moi('bo1', null, { truyCap: 'ANYONE_WITH_LINK' });
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, false);
  assert.equal(r.lyDo[0].ma, 'CHIA_SE_RONG');
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(ss.getSheetByName('KyDaChot'), null);
});

test('3.1 chốt chỉ ghi các tab đầu ra, tab đầu vào không đổi', () => {
  const { mt, c, ss } = moi();
  const dv = tabDauVao(mt);
  const truoc = ss.chup(dv);
  mt.nhatKy.length = 0;
  c.thucHienDuyet(ss, []);
  assert.equal(ss.chup(dv), truoc);
  const daGhi = [...new Set(mt.nhatKy.map((n) => n.tab))].sort();
  assert.deepEqual(daGhi, ['Chot_2026-09', 'GiaiThich', 'KetQua', 'KyDaChot', 'NhatKyHeThong']);
});

test('3.1 chốt thành công không gửi gì ra ngoài: chỉ có thao tác ghi trong Sheet', () => {
  const { mt, c, ss } = moi();
  mt.nhatKy.length = 0;
  c.thucHienDuyet(ss, []);
  const thaoTac = new Set(mt.nhatKy.map((n) => n.thaoTac));
  for (const t of thaoTac) assert.ok(['insertSheet', 'setValues', 'clear', 'setNumberFormat', 'setFontWeight', 'setColumnWidth', 'protect'].includes(t), t);
});

// ---------------------------------------------------------------- 3.2 từ chối đúng
test('3.2 đối soát lệch: từ chối, nêu nguồn, không tạo tab nào', () => {
  const { mt, c, ss } = moi('bo1', (t) => { t.CH_ThamSo.find((d) => d[0] === 'saiSoDoiSoat')[1] = 0; });
  // làm lệch đối soát bằng cách nhập tay point quản lý kho khác tổng nhật ký không đi qua duyệt; dùng dữ liệu nhật ký có tài khoản lạ
  ss.getSheetByName('NhatKyCongViec').data.push(['khongco', 'Kiểm kho', '', 1]);
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, false);
  assert.ok(r.lyDo.some((l) => l.ma === 'DU_LIEU_CHUA_KHOP'));
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(ss.getSheetByName('Chot_2026-09'), null);
  assert.equal(ss.getSheetByName('KyDaChot'), null);
});

test('3.2 không ai tính được (bộ 3): từ chối vì không có kết quả để chốt', () => {
  const { mt, c, ss } = moi('bo3');
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, ['nva1', 'nvb2', 'nvc3', 'nve5', 'nvf6', 'nvg7']);
  assert.equal(r.daChot, false);
  assert.ok(r.lyDo.some((l) => l.ma === 'KHONG_AI_TINH_DUOC'));
  assert.equal(mt.nhatKy.length, 0);
});

test('3.2 lỗi chặn toàn bộ (thiếu tab cấu hình): từ chối', () => {
  const { mt, c, ss } = moi('bo1', (t) => { delete t.CH_Bac; });
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, false);
  assert.equal(r.lyDo[0].ma, 'CHAN_TOAN_BO');
  assert.equal(mt.nhatKy.length, 0);
});

test('3.2 kỳ đã chốt: duyệt lần nữa bị từ chối, chỉ dẫn mở lại, chỉ mục không đổi', () => {
  const { mt, c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const truoc = JSON.stringify(ss.getSheetByName('KyDaChot').data);
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, false);
  assert.ok(r.lyDo.some((l) => l.ma === 'KY_DA_CHOT' && l.thongDiep.includes('Mở lại kỳ')));
  assert.equal(JSON.stringify(ss.getSheetByName('KyDaChot').data), truoc);
  assert.equal(mt.nhatKy.length, 0);
});

test('3.2 thiếu xác nhận từng người: từ chối, nêu tài khoản người còn lại, không tạo tab', () => {
  const { mt, c, ss } = moi('bo1', thieuHaiNguoi);
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(ss, ['nva1']);
  assert.equal(r.daChot, false);
  assert.deepEqual(plain(r.thieuXacNhan), ['nvb2']);
  assert.ok(r.lyDo.some((l) => l.ma === 'THIEU_XAC_NHAN' && l.thongDiep.includes('nvb2')));
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(ss.getSheetByName('Chot_2026-09'), null);
});

test('3.2 xác nhận đủ hai người: chốt, tổng chỉ gồm người đã tính, bản chốt ghi người bị bỏ qua', () => {
  const { c, ss } = moi('bo1', thieuHaiNguoi);
  const r = c.thucHienDuyet(ss, ['nva1', 'nvb2']);
  assert.equal(r.daChot, true);
  assert.equal(r.tong, 49838000);
  assert.equal(r.soDaTinh, 4);
  assert.equal(r.soBoQua, 2);
  assert.deepEqual(plain(r.boQua), ['nva1', 'nvb2']);
  const doc = c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues());
  assert.deepEqual(plain(doc.banChot.xacNhanBoQua), ['nva1', 'nvb2']);
  assert.equal(chiMuc(ss)[0][5], 2);
  assert.equal(ss.getSheetByName('Chot_2026-09').data[3][1], 'nva1; nvb2');
});

test('3.2 người chỉ theo dõi point không đòi xác nhận: bộ 1 chốt với danh sách xác nhận rỗng', () => {
  const { c, ss } = moi();
  assert.equal(c.thucHienDuyet(ss, []).daChot, true);
});

test('3.2 tab tên Chot_2026-09 do người dùng tự tạo (không phải bản sao): từ chối, không đè', () => {
  const { mt, c, ss } = moi('bo1', (t) => { t['Chot_2026-09'] = [['ghi chú riêng của tôi']]; });
  const truoc = JSON.stringify(ss.getSheetByName('Chot_2026-09').data);
  const r = c.thucHienDuyet(ss, []);
  assert.equal(r.daChot, false);
  assert.equal(r.lyDo[0].ma, 'TEN_TAB_CHOT_BI_CHIEM');
  assert.equal(JSON.stringify(ss.getSheetByName('Chot_2026-09').data), truoc);
  assert.equal(ss.getSheetByName('KyDaChot'), null);
});

// ---------------------------------------------------------------- 3.3 đóng băng
test('3.3 đổi cấu hình sau khi chốt: bản sao giữ nguyên đơn giá và các số đã duyệt', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const truoc = JSON.stringify(ss.getSheetByName('Chot_2026-09').data);
  const sh = ss.getSheetByName('CH_ThamSo');
  sh.data[sh.data.findIndex((d) => d[0] === 'donGiaPoint')][1] = 70000;
  sh.data[sh.data.findIndex((d) => d[0] === 'phuCap')][1] = 999999;
  c.thucHienTinh(ss); // tính lại sau khi đổi
  assert.equal(JSON.stringify(ss.getSheetByName('Chot_2026-09').data), truoc, 'bản sao không đổi một ô nào');
  const doc = c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues());
  assert.equal(doc.banChot.cauHinh.thamSo.donGiaPoint, 50000);
  assert.equal(doc.banChot.tong.thuNhap, 75838000);
  assert.equal(chiMuc(ss).length, 1, 'chỉ mục không đổi');
});

test('3.3 trong cả quy trình duyệt, không tab đầu vào nào bị đổi', () => {
  const { mt, c, ss } = moi('bo1', thieuHaiNguoi);
  const dv = tabDauVao(mt);
  const truoc = ss.chup(dv);
  c.thucHienDuyet(ss, ['nva1']);
  c.thucHienDuyet(ss, ['nva1', 'nvb2']);
  c.thucHienTinh(ss);
  c.thucHienMoLai(ss, '2026-09', 'cần sửa');
  assert.equal(ss.chup(dv), truoc);
});

// ---------------------------------------------------------------- 3.4 mở lại kỳ
test('3.4 mở lại không có lý do: từ chối và không đổi gì', () => {
  const { mt, c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const truoc = JSON.stringify(ss.sheets.map((s) => [s.ten, s.data]));
  mt.nhatKy.length = 0;
  for (const ly of ['', '   ', null, undefined]) {
    const r = c.thucHienMoLai(ss, '2026-09', ly);
    assert.equal(r.daMoLai, false);
    assert.equal(r.lyDo, 'THIEU_LY_DO');
  }
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(JSON.stringify(ss.sheets.map((s) => [s.ten, s.data])), truoc);
});

test('3.4 mở lại rồi chốt lại: bản cũ còn nguyên, chỉ mục có ba dòng', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const banCu = JSON.stringify(ss.getSheetByName('Chot_2026-09').data);
  const m = c.thucHienMoLai(ss, '2026-09', 'sửa doanh thu');
  assert.equal(m.daMoLai, true);
  assert.equal(m.tenTabCu, 'Chot_2026-09_cu1');
  assert.equal(ss.getSheetByName('Chot_2026-09'), null, 'tab hiện hành đã được đổi tên');
  assert.equal(JSON.stringify(ss.getSheetByName('Chot_2026-09_cu1').data), banCu, 'bản cũ nguyên vẹn');
  const km = ss.getSheetByName('KeyMetrics'); // sửa dữ liệu làm đổi thu nhập: doanh thu nhóm Đảm bảo an toàn thiết bị giảm mạnh
  km.data.find((d) => d[0] === 'doanhThu' && d[2] === 'Đảm bảo an toàn thiết bị')[4] = 1000000000;
  const r2 = c.thucHienDuyet(ss, []);
  assert.equal(r2.daChot, true);
  assert.ok(ss.getSheetByName('Chot_2026-09'));
  assert.ok(ss.getSheetByName('Chot_2026-09_cu1'));
  const cm = chiMuc(ss);
  assert.deepEqual(cm.map((d) => d[1]), ['Đã chốt', 'Đã mở lại', 'Đã chốt']);
  assert.equal(cm[1][7], 'sửa doanh thu');
  assert.equal(cm[1][6], 'Chot_2026-09_cu1');
  assert.notEqual(r2.tong, 75838000, 'bản chốt mới phản ánh dữ liệu đã sửa');
});

test('3.4 mở lại hai lần liên tiếp đặt hậu tố tăng dần, không ghi đè bản cũ', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  c.thucHienMoLai(ss, '2026-09', 'lần một');
  c.thucHienDuyet(ss, []);
  const m2 = c.thucHienMoLai(ss, '2026-09', 'lần hai');
  assert.equal(m2.tenTabCu, 'Chot_2026-09_cu2');
  assert.ok(ss.getSheetByName('Chot_2026-09_cu1') && ss.getSheetByName('Chot_2026-09_cu2'));
});

test('3.4 mở lại kỳ chưa chốt hoặc đã mở lại thì từ chối; kỳ sai dạng thì từ chối', () => {
  const { c, ss } = moi();
  assert.equal(c.thucHienMoLai(ss, '2026-09', 'x').lyDo, 'KY_CHUA_CHOT');
  c.thucHienDuyet(ss, []);
  c.thucHienMoLai(ss, '2026-09', 'x');
  assert.equal(c.thucHienMoLai(ss, '2026-09', 'y').lyDo, 'KY_DANG_MO');
  assert.equal(c.thucHienMoLai(ss, 'tháng chín', 'y').lyDo, 'KY_SAI');
  assert.equal(c.thucHienMoLai(ss, null, 'y').lyDo, 'KY_SAI');
});

test('3.4 mở lại khi mất tab bản chốt: từ chối an toàn', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  ss.deleteSheet(ss.getSheetByName('Chot_2026-09'));
  const r = c.thucHienMoLai(ss, '2026-09', 'x');
  assert.equal(r.daMoLai, false);
  assert.equal(r.lyDo, 'THIEU_TAB_BAN_CHOT');
});

test('3.4 mở lại bị chặn khi Sheet chia sẻ rộng', () => {
  const { mt, c, ss } = moi();
  c.thucHienDuyet(ss, []);
  mt.datChiaSe({ truyCap: 'DOMAIN_WITH_LINK' });
  mt.nhatKy.length = 0;
  const r = c.thucHienMoLai(ss, '2026-09', 'x');
  assert.equal(r.daMoLai, false);
  assert.equal(r.lyDo, 'CHIA_SE_RONG');
  assert.equal(mt.nhatKy.length, 0);
});

test('3.4 lý do bắt đầu bằng "=" được ghi như chữ trong chỉ mục', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  c.thucHienMoLai(ss, '2026-09', '=1+1 cần sửa');
  const sh = ss.getSheetByName('KyDaChot');
  assert.deepEqual(plain(sh.congThuc), []);
  assert.ok(String(sh.data[2][7]).includes('=1+1 cần sửa'));
});

// ---------------------------------------------------------------- 3.5 tính lại trên kỳ đã chốt
test('3.5 tính lại giống bản chốt: cảnh báo cho biết giống, bản chốt và chỉ mục không đổi', () => {
  const { mt, c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const truoc = JSON.stringify([ss.getSheetByName('Chot_2026-09').data, ss.getSheetByName('KyDaChot').data]);
  const r = c.thucHienTinh(ss);
  assert.equal(r.daGhi, true);
  const w = [...r.kq.canhBao].find((x) => x.ma === 'KY_DA_CHOT');
  assert.ok(w && w.thongDiep.includes('GIỐNG bản chốt'));
  assert.equal(JSON.stringify([ss.getSheetByName('Chot_2026-09').data, ss.getSheetByName('KyDaChot').data]), truoc);
  const g = ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.ok(g.some((d) => d[1] === 'KY_DA_CHOT'), 'cảnh báo hiện trong tab kết quả');
});

test('3.5 tính lại khác bản chốt: nêu hai người khác nhau, bản chốt vẫn nguyên', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const truoc = JSON.stringify(ss.getSheetByName('Chot_2026-09').data);
  const km = ss.getSheetByName('KeyMetrics');
  km.data = km.data.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); // sau khi chốt
  const r = c.thucHienTinh(ss);
  const w = [...r.kq.canhBao].find((x) => x.ma === 'KY_DA_CHOT');
  assert.ok(w.thongDiep.includes('KHÁC bản chốt ở 2 người') && w.thongDiep.includes('nva1') && w.thongDiep.includes('nvb2'));
  assert.equal(JSON.stringify(ss.getSheetByName('Chot_2026-09').data), truoc);
  assert.equal(chiMuc(ss).length, 1);
});

test('3.5 bản chốt bị sửa tay: cảnh báo "đã bị sửa"', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const sh = ss.getSheetByName('Chot_2026-09');
  const i = sh.data.findIndex((d) => d[0] === 'DỮ LIỆU ĐÃ DÙNG (JSON, không sửa tay)') + 1;
  sh.data[i][0] = sh.data[i][0].replace('50000', '55555');
  const r = c.thucHienTinh(ss);
  assert.ok([...r.kq.canhBao].some((x) => x.ma === 'BAN_CHOT_BI_SUA'));
});

test('3.5 kỳ chưa chốt hoặc đã mở lại thì không có cảnh báo kỳ đã chốt', () => {
  const { c, ss } = moi();
  assert.equal([...c.thucHienTinh(ss).kq.canhBao].some((x) => x.ma === 'KY_DA_CHOT'), false);
  c.thucHienDuyet(ss, []);
  c.thucHienMoLai(ss, '2026-09', 'x');
  assert.equal([...c.thucHienTinh(ss).kq.canhBao].some((x) => x.ma === 'KY_DA_CHOT'), false);
});

test('3.5 mất tab bản chốt hoặc hỏng thì cảnh báo, không lỗi', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  ss.getSheetByName('Chot_2026-09').data = [['linh tinh']];
  assert.ok([...c.thucHienTinh(ss).kq.canhBao].some((x) => x.ma === 'BAN_CHOT_HONG'));
  ss.deleteSheet(ss.getSheetByName('Chot_2026-09'));
  assert.ok([...c.thucHienTinh(ss).kq.canhBao].some((x) => x.ma === 'BAN_CHOT_THIEU_TAB'));
});

test('3.5 tab chốt và chỉ mục không bị đọc như dữ liệu đầu vào (không lọt vào tính toán)', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const dv = c.docCacTabDauVao(ss);
  assert.equal(Object.keys(dv).some((t) => /^Chot_|^KyDaChot$/.test(t)), false);
  assert.equal(Object.keys(dv).includes('KetQua'), false);
});

test('3.5 tên tab kết quả không được trùng tab chỉ mục hay bản sao', () => {
  for (const ten of ['KyDaChot', 'Chot_2026-09', 'chot_x']) {
    const { mt, c, ss } = moi('bo1', (t) => { t.CH_ThamSo.find((d) => d[0] === 'tenTabKetQua')[1] = ten; });
    mt.nhatKy.length = 0;
    const r = c.thucHienTinh(ss);
    assert.equal(r.daGhi, false, ten);
    assert.equal(r.lyDo, 'TEN_TAB_KET_QUA_TRUNG');
    assert.equal(mt.nhatKy.length, 0);
  }
});

// ---------------------------------------------------------------- 3.6 chốt dở dang và nhật ký
test('3.6 chốt dở dang (có tab bản sao, chưa có chỉ mục): lần chốt sau giữ tab cũ, không xoá, rồi chốt thành công', () => {
  const { mt, c, ss } = moi();
  // mô phỏng lỗi giữa chừng: tab bản sao được ghi nhưng chỉ mục chưa
  const goc = c.ghiDongChiMuc;
  let lanGoi = 0;
  c.ghiDongChiMuc = () => { lanGoi++; throw new Error('lỗi giả giữa chừng'); };
  assert.throws(() => c.thucHienDuyet(ss, []), /lỗi giả/);
  assert.ok(ss.getSheetByName('Chot_2026-09'), 'tab bản sao đã ghi');
  assert.equal(ss.getSheetByName('KyDaChot'), null, 'chưa có chỉ mục');
  const dongTab = JSON.stringify(ss.getSheetByName('Chot_2026-09').data);
  c.ghiDongChiMuc = goc;
  const r = c.thucHienDuyet(ss, []);
  assert.equal(lanGoi, 1);
  assert.equal(r.daChot, true);
  assert.equal(JSON.stringify(ss.getSheetByName('Chot_2026-09_cu1').data), dongTab, 'tab dở dang còn nguyên dưới tên bản cũ');
  assert.equal(chiMuc(ss).length, 1);
  assert.equal(c.trangThaiHieuLuc(c.docChiMucTuSheet(ss), '2026-09'), 'Đã chốt');
});

test('3.6 nhật ký hệ thống sau chốt và mở lại: chỉ loại sự kiện, không tên, tài khoản, số tiền, lý do hay tên tab', () => {
  const { c, ss } = moi('bo1', thieuHaiNguoi);
  c.thucHienDuyet(ss, ['nva1', 'nvb2']);
  c.thucHienMoLai(ss, '2026-09', 'LÝ DO RIÊNG TƯ 12345678');
  const nd = JSON.stringify(ss.getSheetByName('NhatKyHeThong').data);
  assert.ok(nd.includes('KY_DA_CHOT') && nd.includes('KY_MO_LAI'));
  for (const cam of ['nva1', 'nvb2', 'Nhân viên', '49838000', '75838000', 'LÝ DO RIÊNG TƯ', '12345678', 'Chot_2026']) assert.equal(nd.includes(cam), false, `nhật ký lộ "${cam}"`);
});

test('3.6 sự kiện chốt ghi đúng mức và phạm vi', () => {
  const { c, ss } = moi();
  c.thucHienDuyet(ss, []);
  const dong = ss.getSheetByName('NhatKyHeThong').data.find((d) => d[2] === 'KY_DA_CHOT');
  assert.deepEqual(plain(dong).slice(1), ['thongTin', 'KY_DA_CHOT', '', 'sukien']);
});

test('3.6 chỉ mục nhiều kỳ: chốt tháng 09 rồi tháng 10 (bộ 2) không lẫn nhau', () => {
  const t1 = tabs('bo1'); const t2 = tabs('bo2');
  const mt = taoMoiTruong(t1);
  const c = nap(mt.globals);
  c.thucHienDuyet(mt.ss, []);
  // đổi toàn bộ Sheet sang dữ liệu bộ 2 (kỳ 2026-10) nhưng giữ các tab chốt và chỉ mục
  for (const s of mt.ss.sheets.filter((x) => !/^Chot_|^KyDaChot$|^NhatKyHeThong$/.test(x.ten))) mt.ss.deleteSheet(s);
  for (const [ten, du] of Object.entries(t2)) mt.ss.insertSheet(ten).data = JSON.parse(JSON.stringify(du));
  const r = c.thucHienDuyet(mt.ss, []);
  assert.equal(r.daChot, true, JSON.stringify(r));
  assert.equal(r.ky, '2026-10');
  const cm = c.docChiMucTuSheet(mt.ss);
  assert.deepEqual([...cm].map((s) => [s.ky, s.trangThai]), [['2026-09', 'Đã chốt'], ['2026-10', 'Đã chốt']]);
  assert.ok(mt.ss.getSheetByName('Chot_2026-09') && mt.ss.getSheetByName('Chot_2026-10'));
});
