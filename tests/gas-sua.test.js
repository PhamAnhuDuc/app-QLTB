'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');

const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const TAB_SUA = ['CH_ThamSo', 'CH_Bac', 'CH_BacThang', 'CH_ChiSo', 'CH_NhomThietBi', 'CH_MaHang', 'CH_ViecQuanLyKho', 'CH_HeSoChia', 'CH_KhuVuc',
  'CH_ThanhVien', 'CH_TyTrong', 'Ky', 'BaoHanh_HoTroSale', 'XacNhanBaoCao', 'NhatKyCongViec', 'KeyMetrics'];

function moi(sua, chiaSe) {
  const t = tabs(); if (sua) sua(t);
  const mt = taoMoiTruong(t, chiaSe);
  const c = nap(mt.globals);
  return { mt, c, ss: mt.ss };
}
const cap = (ss, ten) => ss.getSheetByName(ten).data.map((d) => d.slice());
const chup = (ss, ten) => JSON.stringify(ss.getSheetByName(ten).data);

test('8.1 lưu bảng bậc: chỉ tab bậc và nhật ký hệ thống đổi, nhật ký không lộ nội dung', () => {
  const { mt, c, ss } = moi();
  const khac = ss.sheets.map((s) => s.ten).filter((t) => t !== 'CH_Bac');
  const truoc = ss.chup(khac);
  const dong = plain(c.giaoDienDocBang('bac').bang.dong);
  dong[0][1] = 7654321;
  mt.nhatKy.length = 0;
  const r = c.giaoDienLuuBang('bac', dong);
  assert.equal(r.daLuu, true, JSON.stringify(r));
  assert.equal(cap(ss, 'CH_Bac')[1][1], 7654321);
  const sau = ss.chup(khac.filter((t) => t !== 'NhatKyHeThong'));
  assert.equal(sau, truoc.length ? ss.chup(khac.filter((t) => t !== 'NhatKyHeThong')) : sau);
  const dung = new Set(mt.nhatKy.filter((n) => /setValues|clear|insertSheet/.test(n.thaoTac)).map((n) => n.tab));
  assert.deepEqual([...dung].sort(), ['CH_Bac', 'NhatKyHeThong']);
  const nk = ss.getSheetByName('NhatKyHeThong').data.flat().join('|');
  assert.ok(/SUA_BANG_CAU_HINH/.test(nk));
  assert.equal(nk.includes('7654321'), false);
});

test('8.1 tab ngoài danh sách, tab chốt, kết quả bị từ chối và không ghi gì', () => {
  const { mt, c } = moi();
  for (const k of ['KetQua', 'KyDaChot', 'Chot_2026-09', 'KiemKe_HN', 'nhatKyHeThong', '__proto__']) {
    mt.nhatKy.length = 0;
    const r = c.giaoDienLuuBang(k, [['1']]);
    assert.equal(r.daLuu, false, k);
    assert.equal(r.lyDo[0].ma, 'BANG_KHONG_HOP_LE');
    assert.equal(mt.nhatKy.length, 0, k);
  }
});

test('8.1 chia sẻ rộng: từ chối mọi thao tác ghi', () => {
  const { mt, c, ss } = moi(null, { truyCap: 'ANYONE_WITH_LINK' });
  const bac = chup(ss, 'CH_Bac');
  mt.nhatKy.length = 0;
  assert.equal(c.giaoDienLuuBang('bac', [['1', 2, 3, 4]]).lyDo[0].ma, 'CHIA_SE_RONG');
  assert.equal(c.giaoDienDatKy('2026-10').lyDo[0].ma, 'CHIA_SE_RONG');
  assert.equal(c.giaoDienKhoiPhucMacDinh('bac').lyDo[0].ma, 'CHIA_SE_RONG');
  assert.equal(c.giaoDienNhapBaoCao('HN', 'a').lyDo[0].ma, 'CHIA_SE_RONG');
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(chup(ss, 'CH_Bac'), bac);
});

test('8.1 lỗi trong bảng: không ghi, nêu lỗi; tên bắt đầu bằng = được lưu thành chữ', () => {
  const { c, ss } = moi();
  const dong = plain(c.giaoDienDocBang('thanhVien').bang.dong);
  const bac = chup(ss, 'CH_ThanhVien');
  const sai = dong.map((d) => d.slice()); sai[0][2] = 'năm';
  const r = c.giaoDienLuuBang('thanhVien', sai);
  assert.equal(r.daLuu, false);
  assert.ok(r.lyDo.length > 0);
  assert.equal(chup(ss, 'CH_ThanhVien'), bac);
  dong[0][1] = '=1+1';
  const r2 = c.giaoDienLuuBang('thanhVien', dong);
  assert.equal(r2.daLuu, true, JSON.stringify(r2));
  assert.equal(ss.getSheetByName('CH_ThanhVien').congThuc.length, 0);
  assert.equal(cap(ss, 'CH_ThanhVien')[1][1], '=1+1');
});

test('8.2 kỳ đã chốt: bảng nhập tay bị từ chối, bảng cấu hình ghi kèm cảnh báo, bản chốt không đổi', () => {
  const { c, ss } = moi();
  const t = c.giaoDienTinh();
  assert.equal(t.ok, true);
  const d = c.giaoDienDuyet([]);
  assert.equal(d.daChot, true, JSON.stringify(d.lyDo));
  const chot = chup(ss, 'Chot_2026-09');
  const nk = plain(c.giaoDienDocBang('nhatKyCongViec').bang.dong);
  const r1 = c.giaoDienLuuBang('nhatKyCongViec', nk);
  assert.equal(r1.daLuu, false);
  assert.equal(r1.lyDo[0].ma, 'KY_DA_CHOT');
  assert.match(r1.lyDo[0].thongDiep, /Mở lại kỳ/);
  const bac = plain(c.giaoDienDocBang('bac').bang.dong);
  const r2 = c.giaoDienLuuBang('bac', bac);
  assert.equal(r2.daLuu, true);
  assert.ok(r2.canhBao.some((x) => x.ma === 'KY_DA_CHOT_SUA_CAU_HINH'));
  assert.equal(chup(ss, 'Chot_2026-09'), chot);
  assert.equal(c.giaoDienNhapBaoCao('HN', 'x').lyDo[0].ma, 'KY_DA_CHOT');
});

test('8.3 khôi phục mặc định: bốn bảng có, bảng thành viên bị từ chối, tab khác không đổi', () => {
  const { c, ss } = moi();
  const dong = plain(c.giaoDienDocBang('bac').bang.dong);
  dong[0][1] = 1; c.giaoDienLuuBang('bac', dong);
  const khac = ss.sheets.map((s) => s.ten).filter((t) => t !== 'CH_Bac' && t !== 'NhatKyHeThong');
  const truoc = ss.chup(khac);
  const r = c.giaoDienKhoiPhucMacDinh('bac');
  assert.equal(r.daLuu, true);
  assert.equal(cap(ss, 'CH_Bac').length, 6, 'tiêu đề và năm bậc');
  assert.equal(ss.chup(khac), truoc);
  const tv = chup(ss, 'CH_ThanhVien');
  assert.equal(c.giaoDienKhoiPhucMacDinh('thanhVien').lyDo[0].ma, 'KHONG_CO_MAC_DINH');
  assert.equal(chup(ss, 'CH_ThanhVien'), tv);
  for (const k of ['thamSo', 'bacThang', 'chiSo']) assert.equal(c.giaoDienKhoiPhucMacDinh(k).daLuu, true, k);
});

test('8.4 đặt kỳ: hợp lệ ghi chữ, sai thì tab Ky giữ nguyên', () => {
  const { c, ss } = moi();
  const r = c.giaoDienDatKy('2026-10');
  assert.equal(r.daLuu, true);
  assert.equal(cap(ss, 'Ky')[1][1], '2026-10');
  assert.equal(ss.getSheetByName('Ky').dinhDang['B2'], '@');
  const ky = chup(ss, 'Ky');
  for (const x of ['2026-13', 'tháng chín', '', null, 5, '2026-00', '26-10']) {
    assert.equal(c.giaoDienDatKy(x).lyDo[0].ma, 'KY_SAI', String(x));
  }
  assert.equal(chup(ss, 'Ky'), ky);
});

const BAO_CAO = 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\tSL chuyển kho\nSP-001\tMay A\t5\t2\nSP-002\tMay B\t3\t0';

test('8.5 nhập báo cáo hợp lệ thay đúng tab; thiếu cột, khu vực lạ, quá lớn thì tab giữ nguyên', () => {
  const { c, ss } = moi();
  const hcm = chup(ss, 'KiemKe_HCM');
  const hn = cap(ss, 'KiemKe_HN');
  const goc = chup(ss, 'KiemKe_HN');
  const sai = c.giaoDienNhapBaoCao('HN', 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\nSP-001\tA\t5');
  assert.equal(sai.daLuu, false);
  assert.ok(sai.lyDo.some((l) => /SL chuyển kho/.test(l.thongDiep)), JSON.stringify(sai.lyDo));
  assert.equal(chup(ss, 'KiemKe_HN'), goc);
  assert.equal(c.giaoDienNhapBaoCao('XX', BAO_CAO).lyDo[0].ma, 'KHU_VUC_LA');
  assert.equal(c.giaoDienNhapBaoCao('HN', 'a\n'.repeat(20001)).lyDo[0].ma, 'QUA_NHIEU_DONG');
  assert.equal(chup(ss, 'KiemKe_HN'), goc);
  const r = c.giaoDienNhapBaoCao('HN', BAO_CAO);
  assert.equal(r.daLuu, true, JSON.stringify(r));
  assert.equal(cap(ss, 'KiemKe_HN')[1][0], 'SP-001');
  assert.equal(chup(ss, 'KiemKe_HCM'), hcm);
  assert.notDeepEqual(cap(ss, 'KiemKe_HN'), hn);
});

test('8.6 quy trình: sửa nhiều bảng rồi tính cho ra kết quả mới; mọi ghi chỉ vào tab được phép', () => {
  const { mt, c, ss } = moi();
  const baseline = c.giaoDienTinh();
  assert.equal(baseline.ok, true);
  const truoc = JSON.stringify(ss.getSheetByName('KetQua').data);
  mt.nhatKy.length = 0;
  const bt = plain(c.giaoDienDocBang('thamSo').bang.dong);
  const i = bt.findIndex((d) => d[0] === 'donGiaPoint');
  assert.ok(i >= 0, 'tham số đơn giá point');
  bt[i][1] = Number(bt[i][1]) + 1000;
  assert.equal(c.giaoDienLuuBang('thamSo', bt).daLuu, true);
  c.giaoDienDatKy('2026-09');
  const t2 = c.giaoDienTinh();
  assert.equal(t2.ok, true);
  assert.notEqual(JSON.stringify(ss.getSheetByName('KetQua').data), truoc);
  const cho = new Set([...TAB_SUA, 'KetQua', 'GiaiThich', 'NhatKyHeThong', 'KiemKe_HN', 'KiemKe_HCM']);
  for (const n of mt.nhatKy) if (n.tab !== null) assert.ok(cho.has(n.tab), `ghi ngoài danh sách: ${n.tab}`);
});
