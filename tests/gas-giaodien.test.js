'use strict';
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
const TAB_RA = ['KetQua', 'GiaiThich', 'NhatKyHeThong', 'KyDaChot'];

function moi(bo = 'bo1', sua, chiaSe) {
  const t = tabs(bo); if (sua) sua(t);
  const mt = taoMoiTruong(t, chiaSe);
  const c = nap(mt.globals);
  return { mt, c, ss: mt.ss };
}
const tabDauVao = (ss) => ss.sheets.map((s) => s.ten).filter((t) => !TAB_RA.includes(t) && !/^Chot_/.test(t));

// ---------------------------------------------------------------- 4.5 các hàm máy chủ
test('4.5 mở bảng điều khiển: hộp thoại không chặn, đúng trang và kích thước; không ghi gì', () => {
  const { mt, c } = moi();
  mt.nhatKy.length = 0;
  c.moBangDieuKhien();
  assert.equal(mt.ui.hopThoai.length, 1);
  assert.equal(mt.ui.hopThoai[0].tieuDe, 'Tính point và thu nhập tạm tính');
  assert.equal(mt.ui.hopThoai[0].noiDung, c.taoTrangGiaoDien());
  assert.equal(mt.ui.hopThoai[0].rong, 1100);
  assert.equal(mt.ui.hopThoai[0].cao, 720);
  assert.deepEqual(mt.nhatKy.map((n) => n.thaoTac), ['showModelessDialog']);
});

test('4.5 giaoDienLayMoHinh: mô hình chưa tính, chỉ đọc, không có dữ liệu thô', () => {
  const { mt, c, ss } = moi();
  mt.nhatKy.length = 0;
  const m = c.giaoDienLayMoHinh();
  assert.equal(mt.nhatKy.length, 0, 'chỉ đọc, không ghi');
  assert.equal(m.daTinh, false);
  assert.equal(m.thang, '2026-09');
  assert.equal(m.chiaSe.mucDo, 'on');
  assert.equal(m.tabs.length, 18);
  assert.deepEqual(plain(m.lichSu), []);
  const nd = JSON.stringify(m);
  for (const cam of ['nva1', 'Nhân viên', 'SP-001', '1234567']) assert.equal(nd.includes(cam), false, `mô hình chưa tính lộ "${cam}"`);
  assert.equal(ss.getSheetByName('KetQua'), null);
});

test('4.5 giaoDienTinh: ghi các tab đầu ra và trả mô hình đã tính (JSON thuần)', () => {
  const { mt, c, ss } = moi();
  const dv = tabDauVao(ss);
  const truoc = ss.chup(dv);
  const r = c.giaoDienTinh();
  assert.equal(r.ok, true);
  assert.equal(r.moHinh.daTinh, true);
  assert.equal(r.moHinh.tong.thuNhap, 75838000);
  assert.equal(ss.chup(dv), truoc, 'tab đầu vào không đổi');
  assert.ok(ss.getSheetByName('KetQua'));
  assert.deepEqual(JSON.parse(JSON.stringify(r)), JSON.parse(JSON.stringify(r)));
  assert.equal(JSON.stringify(r).includes('undefined'), false);
});

test('4.5 giaoDienTinh khi chia sẻ rộng: từ chối, không ghi gì', () => {
  const { mt, c } = moi('bo1', null, { truyCap: 'ANYONE_WITH_LINK' });
  mt.nhatKy.length = 0;
  const r = c.giaoDienTinh();
  assert.equal(r.ok, false);
  assert.ok(r.thongDiep.includes('chia sẻ rộng'));
  assert.equal(mt.nhatKy.length, 0);
});

test('4.5 giaoDienDuyet cho cùng kết quả như thucHienDuyet (bản chốt hợp lệ, chỉ mục đúng)', () => {
  const { c, ss } = moi();
  const r = c.giaoDienDuyet([]);
  assert.equal(r.daChot, true);
  assert.equal(r.ky, '2026-09');
  assert.equal(r.tong, 75838000);
  assert.equal(r.moHinh.trangThaiKy, 'Đã chốt');
  assert.equal(r.moHinh.lichSu.length, 1);
  assert.equal(c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues()).hopLe, true);
});

test('4.5 giaoDienDuyet: thiếu xác nhận bị từ chối ở máy chủ dù giao diện gửi gì; tham số sai kiểu coi như rỗng', () => {
  const { mt, c, ss } = moi('bo1', thieuHaiNguoi);
  mt.nhatKy.length = 0;
  for (const thamSo of [undefined, null, 'nva1', {}, 42, [], ['nva1'], [1, 2, null]]) {
    const r = c.giaoDienDuyet(thamSo);
    assert.equal(r.daChot, false, JSON.stringify(thamSo));
    assert.ok(r.lyDo.some((l) => l.ma === 'THIEU_XAC_NHAN'));
  }
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(ss.getSheetByName('Chot_2026-09'), null);
  assert.equal(c.giaoDienDuyet(['nva1', 'nvb2']).daChot, true);
});

test('4.5 giaoDienMoLai và giaoDienLichSu', () => {
  const { c } = moi();
  c.giaoDienDuyet([]);
  assert.equal(c.giaoDienMoLai('2026-09', '').daMoLai, false);
  const r = c.giaoDienMoLai('2026-09', 'sửa doanh thu');
  assert.equal(r.daMoLai, true);
  assert.equal(r.tenTabCu, 'Chot_2026-09_cu1');
  assert.equal(r.moHinh.trangThaiKy, 'Đã mở lại');
  const ls = plain(c.giaoDienLichSu());
  assert.deepEqual(ls.map((x) => x.trangThai), ['Đã chốt', 'Đã mở lại']);
  assert.deepEqual(ls.map((x) => x.coTheMoLai), [false, false]);
});

test('4.5 giaoDienMoTab: tên trong danh sách thì chuyển tab, không ghi gì', () => {
  const { mt, c, ss } = moi();
  mt.nhatKy.length = 0;
  assert.deepEqual(plain(c.giaoDienMoTab('CH_Bac')), { daMo: true });
  assert.equal(ss.tabDangMo, 'CH_Bac');
  assert.deepEqual(plain(c.giaoDienMoTab('  ch_thanhvien ')), { daMo: true });
  assert.equal(ss.tabDangMo, 'CH_ThanhVien');
  assert.deepEqual(plain(c.giaoDienMoTab('KiemKe_HN')), { daMo: true });
  assert.deepEqual([...new Set(mt.nhatKy.map((n) => n.thaoTac))], ['setActiveSheet']);
});

test('4.5 giaoDienMoTab: tên ngoài danh sách bị từ chối và không đổi tab nào', () => {
  const { mt, c, ss } = moi('bo1', (t) => { t.Sheet1 = [['ghi chú riêng']]; t['Tab lạ'] = [['x']]; });
  ss.tabDangMo = 'CH_Bac';
  mt.nhatKy.length = 0;
  for (const ten of ['Sheet1', 'Tab lạ', '', null, undefined, 5, '../CH_Bac', 'Chot_2026-09', { toString: () => 'CH_Bac' }]) {
    const r = c.giaoDienMoTab(ten);
    assert.equal(r.daMo, false, String(ten));
  }
  assert.equal(ss.tabDangMo, 'CH_Bac');
  assert.equal(mt.nhatKy.length, 0);
});

test('4.5 giaoDienMoTab: tab khai báo trong cấu hình nhưng chưa tạo thì báo không thấy tab', () => {
  const { c } = moi('bo1', (t) => { delete t.KiemKe_HCM; });
  const r = c.giaoDienMoTab('KiemKe_HCM');
  assert.equal(r.daMo, false);
  assert.ok(r.thongDiep.includes('Không thấy tab'));
});

test('4.5 tab bản sao mở được sau khi chốt', () => {
  const { c, ss } = moi();
  assert.equal(c.giaoDienMoTab('Chot_2026-09').daMo, false);
  c.giaoDienDuyet([]);
  assert.equal(c.giaoDienMoTab('Chot_2026-09').daMo, true);
  assert.equal(ss.tabDangMo, 'Chot_2026-09');
});

test('4.5 giao diện không sửa cấu hình hay dữ liệu: gọi mọi hàm không duyệt không đổi tab đầu vào', () => {
  const { c, ss } = moi();
  const dv = tabDauVao(ss);
  const truoc = ss.chup(dv);
  c.giaoDienLayMoHinh(); c.giaoDienTinh(); c.giaoDienLichSu(); c.giaoDienMoTab('CH_Bac'); c.giaoDienMoLai('2026-09', 'x');
  assert.equal(ss.chup(dv), truoc);
});

// ---------------------------------------------------------------- 4.6 menu
test('4.6 menu có mục "Bảng điều khiển" đầu tiên; mở Sheet không mở hộp thoại và không ghi gì', () => {
  const { mt, c } = moi();
  c.onOpen();
  assert.deepEqual(mt.ui.menu.muc[0], ['Bảng điều khiển', 'moBangDieuKhien']);
  assert.equal(mt.ui.hopThoai.length, 0);
  assert.equal(mt.nhatKy.length, 0);
});

// ---------------------------------------------------------------- đầu cuối: trang <-> máy chủ
function noiTrangVoiMayChu(c) {
  const ghiNhan = [];
  const gg = { script: { run: {
    withSuccessHandler: (ok) => ({ withFailureHandler: (fail) => new Proxy({}, { get: (_, ten) => (...tham) => {
      ghiNhan.push(ten);
      try {
        const thamQuaDay = JSON.parse(JSON.stringify(tham)); // mô phỏng việc tuần tự hoá khi đi qua google.script.run
        const kq = c[ten](...thamQuaDay);
        ok(JSON.parse(JSON.stringify(kq === undefined ? null : kq)));
      } catch (e) { fail(e); }
    } }) })
  } } };
  return { gg, ghiNhan };
}

test('đầu cuối: mở trang, tính, duyệt, xem lịch sử, mở lại kỳ', () => {
  const { mt, c, ss } = moi();
  const doc = new FakeDocument();
  const { gg, ghiNhan } = noiTrangVoiMayChu(c);
  c.maKhachGiaoDien(doc, gg);
  assert.ok(tatCaChu(doc).includes('Chưa có kết quả cho kỳ này'));

  nutCoChu(doc, 'Tính kỳ')[0].click();
  assert.ok(tatCaChu(doc).includes('75.838.000đ'));
  assert.ok(ss.getSheetByName('KetQua'));

  nutCoChu(doc, 'Duyệt và lưu')[0].click();
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09. Tổng đã duyệt 75.838.000đ (6 người đã tính, 0 người bỏ qua).'));
  assert.ok(ss.getSheetByName('Chot_2026-09'));
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);

  nutCoChu(doc, 'Lịch sử')[0].click();
  assert.ok(tatCaChu(doc).includes('2026-09') && tatCaChu(doc).includes('Đã chốt'));
  nutCoChu(doc, 'Mở lại kỳ')[0].click();
  const o = doc.goc.tim((n) => n.tag === 'textarea')[0];
  o.value = 'sửa dữ liệu bảo hành'; o.phat('input');
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.ok(tatCaChu(doc).includes('Đã mở lại kỳ 2026-09. Bản chốt cũ được giữ ở tab Chot_2026-09_cu1.'));
  assert.ok(ss.getSheetByName('Chot_2026-09_cu1'));
  assert.equal(ss.getSheetByName('Chot_2026-09'), null);

  const cho = new Set(c.HAM_MAY_CHU_GIAO_DIEN);
  assert.ok(ghiNhan.every((t) => cho.has(t)), `gọi hàm ngoài danh sách: ${ghiNhan}`);
  assert.deepEqual(ghiNhan, ['giaoDienLayMoHinh', 'giaoDienTinh', 'giaoDienDuyet', 'giaoDienMoLai']);
});

test('đầu cuối: thiếu hai người thì phải tick từng người mới duyệt được; bản chốt ghi người bị bỏ qua', () => {
  const { c, ss } = moi('bo1', thieuHaiNguoi);
  const doc = new FakeDocument();
  c.maKhachGiaoDien(doc, noiTrangVoiMayChu(c).gg);
  nutCoChu(doc, 'Tính kỳ')[0].click();
  nutCoChu(doc, 'Duyệt và lưu')[0].click();
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);
  const o = () => doc.goc.tim((n) => n.tag === 'input' && n.attrs.type === 'checkbox');
  o()[0].checked = true; o()[0].phat('change');
  o()[1].checked = true; o()[1].phat('change');
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, false);
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09. Tổng đã duyệt 49.838.000đ (4 người đã tính, 2 người bỏ qua).'));
  const doc2 = c.docTabChot(ss.getSheetByName('Chot_2026-09').getDataRange().getValues());
  assert.deepEqual(plain(doc2.banChot.xacNhanBoQua), ['nva1', 'nvb2']);
});

test('đầu cuối: chia sẻ rộng thì trang báo và không ghi gì khi bấm Tính kỳ', () => {
  const { mt, c, ss } = moi('bo1', null, { truyCap: 'DOMAIN' });
  const doc = new FakeDocument();
  c.maKhachGiaoDien(doc, noiTrangVoiMayChu(c).gg);
  assert.ok(tatCaChu(doc).includes('chia sẻ rộng'));
  mt.nhatKy.length = 0;
  nutCoChu(doc, 'Tính kỳ')[0].click();
  assert.ok(tatCaChu(doc).includes('Không tính được.'));
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(ss.getSheetByName('KetQua'), null);
});

test('đầu cuối: tên thành viên chứa thẻ HTML trong Sheet hiển thị như chữ trên trang', () => {
  const { c } = moi('bo1', (t) => { t.CH_ThanhVien[1][1] = '<img src=x onerror=alert(1)>'; });
  const doc = new FakeDocument();
  c.maKhachGiaoDien(doc, noiTrangVoiMayChu(c).gg);
  nutCoChu(doc, 'Tính kỳ')[0].click();
  assert.ok(tatCaChu(doc).includes('<img src=x onerror=alert(1)>'));
  assert.equal(doc.goc.tim((n) => n.tag === 'img').length, 0);
});
