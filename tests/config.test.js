'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap, docFixture } = require('./load-core');

const c = nap();
const goc = () => docFixture('bo1', 'config.json');
// Mảng tạo trong vùng vm khác prototype với mảng Node, nên chép sang mảng thường trước khi so sánh sâu.
const maLoi = (kq) => [...kq.loi].map((l) => l.ma);

test('cấu hình bộ 1 hợp lệ, không có lỗi', () => {
  const kq = c.kiemTraCauHinh(goc());
  assert.deepEqual(maLoi(kq), []);
});

test('2.1 bảng bậc: Min không nhỏ hơn Max bị từ chối', () => {
  const cfg = goc();
  cfg.bac[1].min = 200; // bậc 2: min 200, max 200
  const kq = c.kiemTraCauHinh(cfg);
  assert.ok(maLoi(kq).includes('BAC_MIN_MAX'));
  assert.equal(kq.loi.find((l) => l.ma === 'BAC_MIN_MAX').chiTiet.bac, 2);
  assert.equal(c.coLoiToanBo(kq), true);
});

test('2.1 bậc thang: khoảng chồng lấn hoặc hở bị từ chối', () => {
  const chong = goc();
  chong.bacThangThuong[1].den = 0.85; // 0.7-0.85 chồng với khoảng bắt đầu từ 0.8
  assert.ok(maLoi(c.kiemTraCauHinh(chong)).includes('BAC_THANG_LOI'));

  const ho = goc();
  ho.bacThangThuong[2].tu = 0.82; // hở giữa 0.8 và 0.82
  assert.ok(maLoi(c.kiemTraCauHinh(ho)).includes('BAC_THANG_LOI'));

  const khongTu0 = goc();
  khongTu0.bacThangThuong[0].tu = 0.1;
  assert.ok(maLoi(c.kiemTraCauHinh(khongTu0)).includes('BAC_THANG_LOI'));

  const cuoiCoCanTren = goc();
  cuoiCoCanTren.bacThangThuong[4].den = 2;
  assert.ok(maLoi(c.kiemTraCauHinh(cuoiCoCanTren)).includes('BAC_THANG_LOI'));
});

test('2.2 quy đổi: so khớp tên nhóm không phân biệt hoa/thường', () => {
  const cfg = goc();
  const idx = c.dungChiMuc(cfg);
  // "MBH cầm tay" trong danh mục mã hàng, "MBH Cầm tay" trong bảng point nhóm
  const ma = idx.maHang[c.chuanHoaKhoa('sp-006')];
  assert.equal(ma.nhom, 'MBH cầm tay');
  assert.ok(idx.nhom[c.chuanHoaKhoa(ma.nhom)]);
  assert.deepEqual(maLoi(c.kiemTraCauHinh(cfg)), []);
  assert.equal(c.kiemTraCauHinh(cfg).canhBao.length, 0);
});

test('2.2 quy đổi: mã hàng trùng bị báo', () => {
  const cfg = goc();
  cfg.maHang.push({ ma: 'sp-001', nhom: 'Giấy' }); // trùng SP-001, khác hoa/thường
  const kq = c.kiemTraCauHinh(cfg);
  assert.ok(maLoi(kq).includes('MA_TRUNG'));
  assert.equal(c.coLoiToanBo(kq), true);
});

test('2.2 quy đổi: mã thuộc nhóm chưa có point chỉ cảnh báo ở cấu hình', () => {
  const cfg = goc();
  cfg.maHang.push({ ma: 'SP-777', nhom: 'Nhóm chưa khai báo' });
  const kq = c.kiemTraCauHinh(cfg);
  assert.deepEqual(maLoi(kq), []);
  assert.deepEqual([...kq.canhBao].map((x) => x.ma), ['MA_NHOM_CHUA_CO_POINT']);
});

test('2.3 hệ số chia: tổng khác 1 chỉ chặn đúng nguồn và khu vực đó', () => {
  const cfg = goc();
  const h = cfg.heSoChia.find((x) => x.nguon === 'baoHanh' && x.khuVuc === 'HCM' && x.taiKhoan === 'nvf6');
  h.heSo = 0.7; // HCM bảo hành: 0.2 + 0.7 = 0.9
  const kq = c.kiemTraCauHinh(cfg);
  const l = kq.loi.find((x) => x.ma === 'TONG_HE_SO');
  assert.ok(l);
  assert.equal(l.chan, 'nguon:baoHanh:hcm');
  assert.equal(l.chiTiet.nguon, 'baoHanh');
  assert.equal(l.chiTiet.khuVuc, 'hcm');
  assert.ok(Math.abs(l.chiTiet.tong - 0.9) < 1e-9);
  assert.equal(c.coLoiToanBo(kq), false, 'không chặn toàn bộ');
  assert.equal(c.biChan(kq.loi, 'nguon:baoHanh:hcm'), true);
  assert.equal(c.biChan(kq.loi, 'nguon:baoHanh:hn'), false);
});

test('2.3 hệ số chia: thành viên không có hệ số thì nguồn không áp dụng, không lỗi', () => {
  const cfg = goc();
  const idx = c.dungChiMuc(cfg);
  assert.equal(c.coHeSo(idx, 'baoHanh', 'HN', 'nvc3'), false);
  assert.equal(c.coHeSo(idx, 'baoHanh', 'HN', 'NVA1'), true, 'tài khoản không phân biệt hoa/thường');
  assert.deepEqual(maLoi(c.kiemTraCauHinh(cfg)), []);
});

test('2.3 hệ số chia: tài khoản lạ và hệ số khai báo hai lần', () => {
  const lạ = goc();
  lạ.heSoChia.push({ nguon: 'hoTroSale', khuVuc: 'HN', taiKhoan: 'khongco', heSo: 0 });
  assert.ok(maLoi(c.kiemTraCauHinh(lạ)).includes('HE_SO_TAI_KHOAN_LA'));
  const trung = goc();
  trung.heSoChia.push({ nguon: 'hoTroSale', khuVuc: 'HN', taiKhoan: 'nva1', heSo: 0 });
  assert.ok(maLoi(c.kiemTraCauHinh(trung)).includes('HE_SO_TRUNG'));
});

test('2.4 thành viên: tài khoản trùng (không phân biệt hoa/thường) bị từ chối', () => {
  const cfg = goc();
  cfg.thanhVien[1].taiKhoan = 'NVA1';
  const kq = c.kiemTraCauHinh(cfg);
  assert.ok(maLoi(kq).includes('TAI_KHOAN_TRUNG'));
  assert.equal(c.coLoiToanBo(kq), true);
});

test('2.4 thành viên: ghi đè lương cố định hợp lệ, không phải lỗi', () => {
  const cfg = goc();
  const nve5 = cfg.thanhVien.find((t) => t.taiKhoan === 'nve5');
  assert.equal(nve5.luongCoDinhGhiDe, 10800000);
  assert.deepEqual(maLoi(c.kiemTraCauHinh(cfg)), []);
  nve5.luongCoDinhGhiDe = -5;
  assert.ok(maLoi(c.kiemTraCauHinh(cfg)).includes('GHI_DE_LUONG_SAI'));
});

test('2.4 thành viên: tổng tỷ trọng khác 100% chỉ chặn key metrics của người đó', () => {
  const cfg = goc();
  cfg.thanhVien.find((t) => t.taiKhoan === 'nvb2').chiSo[0].tyTrong = 0.3; // 0.3+0.35+0.25 = 0.9
  const kq = c.kiemTraCauHinh(cfg);
  const l = kq.loi.find((x) => x.ma === 'TONG_TY_TRONG');
  assert.ok(l);
  assert.equal(l.chan, 'km:nvb2');
  assert.equal(c.coLoiToanBo(kq), false);
  assert.ok(l.thongDiep.includes('90%'));
});

test('2.4 thành viên: bậc lạ và chỉ số lạ', () => {
  const cfg = goc();
  cfg.thanhVien[0].bac = 9;
  cfg.thanhVien[1].chiSo[0].chiSo = 'chiSoKhongCo';
  const kq = c.kiemTraCauHinh(cfg);
  assert.ok(maLoi(kq).includes('THANH_VIEN_BAC_LA'));
  assert.ok(maLoi(kq).includes('CHI_SO_LA'));
  assert.equal(c.coLoiToanBo(kq), false);
});

test('2.5 thiếu tham số bắt buộc: từ chối và nêu rõ tên tham số', () => {
  const cfg = goc();
  cfg.thamSo.donGiaPoint = null;
  const kq = c.kiemTraCauHinh(cfg);
  const l = kq.loi.find((x) => x.ma === 'THIEU_THAM_SO');
  assert.ok(l);
  assert.equal(l.chiTiet.thamSo, 'donGiaPoint');
  assert.ok(l.thongDiep.includes('donGiaPoint'));
  assert.equal(l.chan, 'toanBo');
});

test('2.5 tham số sai kiểu hoặc âm bị từ chối; không có cấu hình', () => {
  const cfg = goc();
  cfg.thamSo.phuCap = -1;
  assert.ok(maLoi(c.kiemTraCauHinh(cfg)).includes('THAM_SO_SAI'));
  const cfg2 = goc();
  cfg2.thamSo.heSoMin = 1.2;
  assert.ok(maLoi(c.kiemTraCauHinh(cfg2)).includes('THAM_SO_SAI'));
  assert.deepEqual(maLoi(c.kiemTraCauHinh(null)), ['THIEU_CAU_HINH']);
});

test('2.5 đổi đơn giá point chỉ là đổi một tham số, cấu hình vẫn hợp lệ', () => {
  const cfg = goc();
  cfg.thamSo.donGiaPoint = 70000;
  assert.deepEqual(maLoi(c.kiemTraCauHinh(cfg)), []);
  assert.equal(c.dungChiMuc(cfg).bac['4'].luongCoDinh, 10000000);
});

test('bộ 2 hợp lệ; bộ 3 chỉ có lỗi cục bộ, không chặn toàn bộ', () => {
  assert.deepEqual(maLoi(c.kiemTraCauHinh(docFixture('bo2', 'config.json'))), []);
  const kq3 = c.kiemTraCauHinh(docFixture('bo3', 'config.json'));
  assert.deepEqual(maLoi(kq3).sort(), ['TONG_HE_SO', 'TONG_TY_TRONG']);
  assert.equal(c.coLoiToanBo(kq3), false);
});
