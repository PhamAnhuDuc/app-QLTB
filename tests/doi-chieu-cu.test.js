'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap, docFixture } = require('./load-core');
const { tinhCu } = require('./doi-chieu-cu');

const c = nap();
const gan = (a, b, dung = 0.5) => assert.ok(Math.abs(a - b) <= dung, `${a} khác ${b}`);
const tvMap = (kq) => Object.fromEntries([...kq.thanhVien].map((r) => [r.taiKhoan, r]));

for (const bo of ['bo1', 'bo2']) {
  test(`7.4 ${bo}: lõi mới cho cùng thu nhập với công thức workbook cũ (khi dữ liệu hợp lệ)`, () => {
    const cfg = docFixture(bo, 'config.json');
    const ky = docFixture(bo, 'ky.json');
    const cu = tinhCu(cfg, ky);
    const moi = tvMap(c.tinhKy(cfg, ky));
    let soSoSanh = 0;
    for (const tk of Object.keys(cu)) {
      if (!cu[tk].coKeyMetrics) continue; // workbook cũ không có thu nhập cho người chỉ theo dõi point
      assert.equal(moi[tk].trangThai, 'daTinh', tk);
      gan(moi[tk].pointTong, cu[tk].point, 1e-6);
      gan(moi[tk].thuNhapChuaLamTron, cu[tk].thuNhap, 1e-3);
      soSoSanh++;
    }
    assert.ok(soSoSanh >= 4);
  });
}

test('7.4 khác biệt có chủ đích #1: mã hàng lạ — workbook cũ bỏ qua âm thầm, lõi mới báo lỗi và không đưa ra số', () => {
  const cfg = docFixture('bo1', 'config.json');
  const ky = docFixture('bo1', 'ky.json');
  ky.kiemKe.HN.dong.push({ ma: 'ABC-999', ten: 'Mã lạ', banRa: 100, chuyenKho: 0 });
  const cu = tinhCu(cfg, ky);
  const cuGoc = tinhCu(cfg, docFixture('bo1', 'ky.json'));
  // workbook cũ: số y hệt như chưa có mã lạ, người dùng không hề biết 100 đơn bị bỏ sót
  gan(cu.nva1.thuNhap, cuGoc.nva1.thuNhap, 1e-6);
  const moi = tvMap(c.tinhKy(cfg, ky));
  assert.equal(moi.nva1.trangThai, 'chuaTinh');
  assert.equal(moi.nva1.thuNhap, null);
  assert.ok([...c.tinhKy(cfg, ky).loi].some((l) => l.ma === 'MA_HANG_LA'));
  // TP.HCM không bị ảnh hưởng
  assert.equal(moi.nve5.trangThai, 'daTinh');
});

test('7.4 khác biệt có chủ đích #2: dữ liệu trống — workbook cũ coi như 0, lõi mới báo thiếu', () => {
  const cfg = docFixture('bo1', 'config.json');
  const ky = docFixture('bo1', 'ky.json');
  ky.keyMetrics = ky.keyMetrics.filter((m) => !(m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN'));
  const cu = tinhCu(cfg, ky);
  assert.ok(cu.nva1.thuNhap > 0, 'workbook cũ vẫn ra một con số (chỉ số thiếu bị coi là 0%)');
  const moi = tvMap(c.tinhKy(cfg, ky));
  assert.equal(moi.nva1.thuNhap, null);
  assert.equal(moi.nva1.trangThai, 'chuaTinh');
});

test('7.4 khác biệt có chủ đích #3: point quản lý kho nhập tay đè công thức — lõi mới đối soát và dùng nhật ký', () => {
  const cfg = docFixture('bo1', 'config.json');
  const ky = docFixture('bo1', 'ky.json');
  ky.pointQuanLyKhoNhapTay = { nvc3: 99 };
  const moi = c.tinhKy(cfg, ky);
  gan(tvMap(moi).nvc3.pointTong, 17, 1e-9);
  assert.ok([...moi.loi].some((l) => l.ma === 'DOI_SOAT_LECH'));
  assert.equal(moi.kyDuDuLieu, false);
});

test('7.4 khác biệt có chủ đích #4: tổng team chỉ cộng người đã tính và ghi rõ số người', () => {
  const cfg = docFixture('bo1', 'config.json');
  const ky = docFixture('bo1', 'ky.json');
  ky.keyMetrics = ky.keyMetrics.filter((m) => !(m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN'));
  const moi = c.tinhKy(cfg, ky);
  assert.equal(moi.tong.team.ghiChu, 'cộng của 4/6 người');
  const tay = [...moi.thanhVien].filter((r) => r.trangThai === 'daTinh').reduce((s, r) => s + r.thuNhap, 0);
  assert.equal(moi.tong.team.thuNhap, tay);
});
