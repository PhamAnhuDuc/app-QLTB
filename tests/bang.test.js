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

test('7.1 danh sách bảng: mỗi bảng có tab, tiêu đề và kiểu cột cùng độ dài', () => {
  const ks = c.danhSachKhoaBang();
  assert.equal(ks.length, 15);
  for (const k of ks) {
    const b = c.bangTheoKhoa(k);
    assert.ok(b.tab, k);
    assert.equal(b.kieuCot.length, b.tieuDe.length, k);
  }
});

test('7.1 không có tab báo cáo, kết quả, chỉ mục hay bản sao trong danh sách sửa được', () => {
  for (const ten of ['KetQua', 'KyDaChot', 'Chot_2026-09', 'KiemKe_HCM', 'NhatKy', 'Ky']) assert.equal(c.laTabSuaDuoc(ten), false, ten);
  assert.equal(c.laTabSuaDuoc(c.TEN_TAB.bac), true);
  assert.equal(c.laTabSuaDuoc(String(c.TEN_TAB.bac).toUpperCase()), true);
  assert.equal(c.bangTheoKhoa('kyDaChot'), null);
  assert.equal(c.bangTheoKhoa('__proto__'), null);
  assert.equal(c.bangTheoKhoa(5), null);
});

test('7.2 đọc bảng để sửa: có dòng, danh sách gợi ý và cột chọn', () => {
  const t = tabs();
  const r = c.docBangDeSua('heSoChia', t[c.TEN_TAB.heSoChia], t);
  assert.ok(r.coTab);
  assert.ok(r.dong.length > 0);
  assert.deepEqual(plain(r.luaChon[0]), ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale']);
  assert.ok(r.luaChon[1].length > 0);
  assert.ok(r.luaChon[2].length > 0);
});

test('7.2 tab chưa tồn tại: khung rỗng, không lỗi', () => {
  const r = c.docBangDeSua('bac', undefined, {});
  assert.equal(r.coTab, false);
  assert.deepEqual(plain(r.dong), []);
  assert.deepEqual(plain(r.tieuDe), plain(c.bangTheoKhoa('bac').tieuDe));
});

test('7.3 chuyển kiểu: số, dấu phẩy, chuỗi nghìn, trống, logic, chữ', () => {
  assert.equal(c.chuyenGiaTri('so', '0,17'), 0.17);
  assert.equal(c.chuyenGiaTri('so', ' 12 '), 12);
  assert.equal(c.chuyenGiaTri('so', '6.000.000'), '6.000.000');
  assert.equal(c.chuyenGiaTri('so', 'năm mươi'), 'năm mươi');
  assert.equal(c.chuyenGiaTri('so', ''), '');
  assert.equal(c.chuyenGiaTri('so', null), '');
  assert.equal(c.chuyenGiaTri('logic', 'true'), true);
  assert.equal(c.chuyenGiaTri('logic', 'FALSE'), false);
  assert.equal(c.chuyenGiaTri('logic', 'có'), 'có');
  assert.equal(c.chuyenGiaTri('chu', '  =1+1 '), '=1+1');
});

test('7.3 bảng thông số: ô giá trị nhận cả số và chữ', () => {
  assert.equal(c.chuyenGiaTriTheoBang('thamSo', 1, '50000'), 50000);
  assert.equal(c.chuyenGiaTriTheoBang('thamSo', 1, 'KetQua'), 'KetQua');
  assert.equal(c.chuyenGiaTriTheoBang('thamSo', 0, '50000'), '50000');
});

test('7.4 dựng bảng mới: bỏ dòng trống, đủ cột, từ chối dữ liệu sai', () => {
  const ok = c.dungBangMoi('bac', [['1', '2', '3', '4'], ['', '', '', ''], ['5', '6', '7']]);
  assert.deepEqual(plain(ok.loi), []);
  assert.equal(ok.bang.length, 3);
  assert.deepEqual(plain(ok.bang[2]), [5, 6, 7, '']);
  assert.equal(c.dungBangMoi('KetQua', []).loi[0].ma, 'BANG_KHONG_HOP_LE');
  assert.equal(c.dungBangMoi('bac', 'x').loi[0].ma, 'DU_LIEU_SAI');
  assert.equal(c.dungBangMoi('bac', [5]).loi[0].ma, 'DU_LIEU_SAI');
  assert.equal(c.dungBangMoi('bac', new Array(5001).fill(['1'])).loi[0].ma, 'QUA_NHIEU_DONG');
  assert.equal(c.dungBangMoi('bac', [new Array(21).fill('1')]).loi[0].ma, 'QUA_NHIEU_COT');
});

test('7.4 kiểm tra trước khi ghi: lưu lại đúng bảng hiện có thì không có lỗi chặn', () => {
  const t = tabs();
  const cur = c.docBangDeSua('bac', t[c.TEN_TAB.bac], t);
  const m = c.dungBangMoi('bac', cur.dong);
  const kt = c.kiemTraBangMoi(t, 'bac', m.bang, T);
  assert.deepEqual(plain(kt.chan), []);
});

test('7.4 ô số chứa chữ trong bảng bậc bị chặn và nêu dòng', () => {
  const t = tabs();
  const cur = c.docBangDeSua('bac', t[c.TEN_TAB.bac], t);
  const dong = plain(cur.dong);
  dong[0][1] = 'năm mươi nghìn';
  const kt = c.kiemTraBangMoi(t, 'bac', c.dungBangMoi('bac', dong).bang, T);
  assert.ok(kt.chan.length > 0);
});

test('7.4 tổng hệ số chia khác 1 bị chặn', () => {
  const t = tabs();
  const cur = c.docBangDeSua('heSoChia', t[c.TEN_TAB.heSoChia], t);
  const dong = plain(cur.dong);
  const i = dong.findIndex((d) => d[0] === 'baoHanh');
  assert.ok(i >= 0);
  dong[i][3] = 0.01;
  const kt = c.kiemTraBangMoi(t, 'heSoChia', c.dungBangMoi('heSoChia', dong).bang, T);
  assert.ok(kt.chan.length > 0, 'phải chặn');
});

test('7.4 lỗi thuộc bảng khác chỉ là cảnh báo: thêm thành viên chưa có tỷ trọng vẫn cho lưu bảng thành viên', () => {
  const t = tabs();
  const cur = c.docBangDeSua('thanhVien', t[c.TEN_TAB.thanhVien], t);
  const dong = plain(cur.dong);
  const moi = dong[0].slice();
  moi[0] = 'Nhân sự mới'; moi[1] = 'nsmoi';
  dong.push(moi);
  const kt = c.kiemTraBangMoi(t, 'thanhVien', c.dungBangMoi('thanhVien', dong).bang, T);
  assert.deepEqual(plain(kt.chan), []);
});

test('7.5 ô chữ cần văn bản: chỉ ô chuỗi không rỗng, toạ độ A1', () => {
  const ds = c.oCanVanBanCuaBang([['Tên', 'Số'], ['=1+1', 5], ['', '@x']]);
  assert.deepEqual(plain(ds), ['A1', 'B1', 'A2', 'B3']);
});

test('7.6 bảng mặc định: chỉ bốn bảng có mặc định', () => {
  for (const k of ['thamSo', 'bac', 'bacThang', 'chiSo']) assert.ok(c.bangMacDinh(k).length > 1, k);
  assert.equal(c.bangMacDinh('thanhVien'), null);
  assert.equal(c.bangMacDinh('nhatKyCongViec'), null);
});
