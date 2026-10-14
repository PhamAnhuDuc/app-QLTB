'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap, docFixture } = require('./load-core');

const c = nap();
const cfg1 = () => docFixture('bo1', 'config.json');
const ky1 = () => docFixture('bo1', 'ky.json');
const gan = (a, b, dung = 1e-6) => assert.ok(Math.abs(a - b) <= dung, `${a} khác ${b}`);
const ma = (mang) => [...mang].map((x) => x.ma);

function chuanBi(cfg = cfg1()) {
  const kt = c.kiemTraCauHinh(cfg);
  return { cfg, idx: c.dungChiMuc(cfg), loiCauHinh: kt.loi };
}
const KY = { tuNgay: '2026-09-01', denNgay: '2026-09-30' };

// ---------------------------------------------------------------- 3.1 quỹ xuất bán / chuyển kho
test('3.1 quỹ khu vực: mã A bán 10, chuyển kho 5, nhóm Thiết bị BH → 4,65', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-002', banRa: 10, chuyenKho: 5 }] }, false);
  gan(kq.quy, 4.65);
  assert.equal(kq.loi.length, 0);
  assert.equal(kq.chiTiet[0].nhom, 'Thiết bị BH');
});

test('3.1 xuất bán và chuyển kho dùng đúng point riêng, không dùng chung', () => {
  const { idx } = chuanBi();
  const chiBan = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-001', banRa: 10, chuyenKho: 0 }] }, false);
  const chiChuyen = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-001', banRa: 0, chuyenKho: 10 }] }, false);
  gan(chiBan.quy, 6.7);      // 10 × 0,67
  gan(chiChuyen.quy, 7.5);   // 10 × 0,75
});

test('3.1 quỹ bộ 1: Hà Nội 237,3 và TP.HCM 203,8 (tính tay từ bảng quy đổi)', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const kq = c.tinhPoint(cfg, idx, ky1(), loiCauHinh);
  gan(kq.quy.xuatBanChuyenKho.hn.quy, 237.3);
  gan(kq.quy.xuatBanChuyenKho.hcm.quy, 203.8);
});

test('3.1 mã viết thường vẫn khớp bảng quy đổi (không phân biệt hoa/thường)', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HCM',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'sp-003', banRa: 10, chuyenKho: 0 }] }, false);
  gan(kq.quy, 3.3);
});

// ---------------------------------------------------------------- 3.2 mã lạ, thiếu mã
test('3.2 mã hàng lạ: báo lỗi nêu mã, khu vực, số lượng và không đưa quỹ ra', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-002', banRa: 1, chuyenKho: 0 }, { ma: 'ABC-999', banRa: 3, chuyenKho: 0 }] }, false);
  assert.equal(kq.quy, null);
  assert.deepEqual(ma(kq.loi.map((l) => ({ ma: l.ma }))), ['MA_HANG_LA']);
  const l = kq.loi[0];
  assert.ok(l.thongDiep.includes('ABC-999') && l.thongDiep.includes('chưa có trong bảng quy đổi'));
  assert.equal(l.chiTiet.banRa, 3);
  assert.equal(l.chiTiet.khuVuc, 'HN');
  assert.equal(l.chan, 'nguon:xuatBanChuyenKho:hn');
});

test('3.2 mã không phát sinh không báo lỗi dù không có trong bảng quy đổi', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-099', banRa: 0, chuyenKho: 0 }, { ma: 'SP-002', banRa: 1, chuyenKho: 0 }] }, false);
  assert.equal(kq.loi.length, 0);
  gan(kq.quy, 0.3);
});

test('3.2 nhóm chưa có point: báo lỗi, không coi là 0', () => {
  const cfg = cfg1();
  cfg.maHang.push({ ma: 'SP-777', nhom: 'Nhóm chưa khai báo' });
  const { idx } = chuanBi(cfg);
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-777', banRa: 2, chuyenKho: 0 }] }, false);
  assert.equal(kq.quy, null);
  assert.equal(kq.loi[0].ma, 'NHOM_CHUA_CO_POINT');
});

test('3.2 dòng demo thiếu mã có phát sinh: cảnh báo và không cộng point', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: null, ten: 'Máy mẫu - Demo', banRa: 5, chuyenKho: 0 }, { ma: 'SP-002', banRa: 1, chuyenKho: 0 }] }, false);
  assert.equal(kq.loi.length, 0);
  assert.deepEqual([...kq.canhBao].map((x) => x.ma), ['DONG_THIEU_MA']);
  gan(kq.quy, 0.3);
});

test('3.2 dòng thiếu mã nhưng không phát sinh thì im lặng', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: null, banRa: 0, chuyenKho: 0 }] }, false);
  assert.equal(kq.canhBao.length, 0);
  assert.equal(kq.quy, 0);
});

test('3.2 số lượng âm hoặc chữ bị báo lỗi', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN',
    { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong: [{ ma: 'SP-002', banRa: -1, chuyenKho: 0 }, { ma: 'SP-001', banRa: 'abc', chuyenKho: 0 }] }, false);
  assert.equal(kq.quy, null);
  assert.equal(kq.loi.length, 2);
});

// ---------------------------------------------------------------- 3.3 khoảng ngày báo cáo
test('3.3 báo cáo 01–14 của kỳ tháng 10: chặn cho đến khi chủ sở hữu xác nhận', () => {
  const { idx } = chuanBi();
  const ky = { tuNgay: '2026-10-01', denNgay: '2026-10-31' };
  const bc = { tuNgay: '2026-10-01', denNgay: '2026-10-14', dong: [{ ma: 'SP-002', banRa: 1, chuyenKho: 0 }] };
  const chuaXacNhan = c.tinhQuyXuatBanChuyenKho(idx, ky, 'HN', bc, false);
  assert.equal(chuaXacNhan.quy, null);
  assert.equal(chuaXacNhan.loi[0].ma, 'BAO_CAO_CHUA_PHU_KY');
  const daXacNhan = c.tinhQuyXuatBanChuyenKho(idx, ky, 'HN', bc, true);
  gan(daXacNhan.quy, 0.3);
  assert.equal(daXacNhan.loi.length, 0);
  assert.equal(daXacNhan.canhBao[0].ma, 'BAO_CAO_CHUA_PHU_KY');
});

test('3.3 báo cáo phủ trọn kỳ không bị cảnh báo; thiếu ngày thì cảnh báo', () => {
  const { idx } = chuanBi();
  const dong = [{ ma: 'SP-002', banRa: 1, chuyenKho: 0 }];
  const dung = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN', { tuNgay: '2026-09-01', denNgay: '2026-09-30', dong }, false);
  assert.equal(dung.canhBao.length + dung.loi.length, 0);
  const thieu = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN', { dong }, false);
  assert.equal(thieu.canhBao[0].ma, 'BAO_CAO_THIEU_NGAY');
});

test('3.3 chưa có báo cáo kiểm kê của khu vực thì quỹ là thiếu, không phải 0', () => {
  const { idx } = chuanBi();
  const kq = c.tinhQuyXuatBanChuyenKho(idx, KY, 'HN', undefined, false);
  assert.equal(kq.thieu, true);
  assert.equal(kq.quy, null);
});

// ---------------------------------------------------------------- 3.4 bảo hành, hỗ trợ sale
test('3.4 quỹ bảo hành và hỗ trợ sale: 20 ca → 20, 100 đơn → 17', () => {
  const { cfg } = chuanBi();
  gan(c.tinhQuyBaoHanh(cfg, 'HCM', 20).quy, 20);
  gan(c.tinhQuyHoTroSale(cfg, 'HCM', 100).quy, 17);
});

test('3.4 số ca âm bị từ chối; ô trống là thiếu; 0 là có số liệu', () => {
  const { cfg } = chuanBi();
  const am = c.tinhQuyBaoHanh(cfg, 'HN', -3);
  assert.equal(am.quy, null);
  assert.equal(am.loi[0].ma, 'SO_LUONG_SAI');
  const trong = c.tinhQuyBaoHanh(cfg, 'HN', null);
  assert.equal(trong.thieu, true);
  assert.equal(trong.quy, null);
  const khong = c.tinhQuyBaoHanh(cfg, 'HN', 0);
  assert.equal(khong.thieu, false);
  assert.equal(khong.quy, 0);
});

// ---------------------------------------------------------------- 3.5 nhật ký quản lý kho
test('3.5 cộng nhật ký theo người: Kiểm kho 10×0,5 + Đầu mối 4×1 = 9', () => {
  const { idx } = chuanBi();
  const kq = c.tinhNhatKy(idx, [
    { taiKhoan: 'nva1', loai: 'Kiểm kho', soLuong: 10 },
    { taiKhoan: 'NVA1', loai: 'Đầu mối 360', soLuong: 4 }
  ]);
  gan(kq.theoNguoi.nva1.point, 9);
  assert.equal(kq.loi.length, 0);
});

test('3.5 hệ số riêng đã cấu hình được dùng (quản lý sale admin tỉnh 0,375)', () => {
  const { idx } = chuanBi();
  const kq = c.tinhNhatKy(idx, [{ taiKhoan: 'nvc3', loai: 'Quản lý sale admin tỉnh', soLuong: 8 }]);
  gan(kq.theoNguoi.nvc3.point, 3);
});

test('3.5 loại việc không có hệ số: báo lỗi chặn người đó, không coi là 0', () => {
  const { idx } = chuanBi();
  const kq = c.tinhNhatKy(idx, [
    { taiKhoan: 'nvc3', loai: 'Kiểm kho', soLuong: 10 },
    { taiKhoan: 'nvc3', loai: 'Việc lạ', soLuong: 2 }
  ]);
  assert.equal(kq.loi[0].ma, 'LOAI_VIEC_LA');
  assert.equal(kq.loi[0].chiTiet.loai, 'Việc lạ');
  assert.equal(kq.biChan.nvc3, true);
});

test('3.5 tài khoản không có trong danh sách: báo lỗi nêu tài khoản đó', () => {
  const { idx } = chuanBi();
  const kq = c.tinhNhatKy(idx, [{ taiKhoan: 'khongco', loai: 'Kiểm kho', soLuong: 1 }]);
  assert.equal(kq.loi[0].ma, 'TAI_KHOAN_LA');
  assert.ok(kq.loi[0].thongDiep.includes('khongco'));
});

// ---------------------------------------------------------------- 3.6 chia quỹ, cộng nguồn, đối soát
test('3.6 chia theo hệ số: quỹ 100 chia 40/60 cho hai người', () => {
  const cfg = cfg1();
  cfg.nhomThietBi.push({ nhom: 'Chuẩn', pointXuatBan: 1, pointChuyenKho: 1 });
  cfg.maHang.push({ ma: 'TEST', nhom: 'Chuẩn' });
  const { idx, loiCauHinh } = chuanBi(cfg);
  const ky = ky1();
  ky.kiemKe.HN.dong = [{ ma: 'TEST', banRa: 100, chuyenKho: 0 }];
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  gan(kq.quy.xuatBanChuyenKho.hn.quy, 100);
  gan(kq.thanhVien.nva1.nguon.xuatBanChuyenKho.point, 40);
  gan(kq.thanhVien.nvb2.nguon.xuatBanChuyenKho.point, 60);
});

test('3.6 bộ 1: point từng nguồn và point tổng khớp tính tay', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const kq = c.tinhPoint(cfg, idx, ky1(), loiCauHinh);
  const t = kq.thanhVien;
  gan(t.nva1.tong, 278.92);   // 94,92 + 150 + 34 + 0
  gan(t.nvb2.tong, 326.38);   // 142,38 + 150 + 34 + 0
  gan(t.nvc3.tong, 17);       // chỉ nhật ký: 10 + 4 + 3
  gan(t.nvd4.tong, 5);
  gan(t.nve5.tong, 275.26);   // 142,66 + 50 + 81,6 + 1
  gan(t.nvf6.tong, 281.54);   // 61,14 + 200 + 20,4 + 0
  gan(t.nvg7.tong, 5);
  gan(t.nva1.nguon.xuatBanChuyenKho.point, 94.92);
  gan(t.nve5.nguon.hoTroSale.point, 81.6);
});

test('3.6 cộng bốn nguồn: 40 + 14 + 8 + 9 = 71 (cấu hình tự dựng)', () => {
  const cfg = cfg1();
  cfg.nhomThietBi.push({ nhom: 'Chuẩn', pointXuatBan: 1, pointChuyenKho: 1 });
  cfg.maHang.push({ ma: 'TEST', nhom: 'Chuẩn' });
  // nva1 có hệ số: xuất bán 0,4 · bảo hành 0,5 · hỗ trợ sale 0,5. Đặt heSoHoTroSale = 1 để số đơn bằng quỹ.
  // xuất bán 100 × 0,4 = 40 · bảo hành 28 × 0,5 = 14 · hỗ trợ sale 16 × 0,5 = 8 · nhật ký 18 × 0,5 = 9.
  cfg.thamSo.heSoHoTroSale = 1;
  const { idx, loiCauHinh } = chuanBi(cfg);
  const ky = ky1();
  ky.kiemKe.HN.dong = [{ ma: 'TEST', banRa: 100, chuyenKho: 0 }];
  ky.baoHanh.HN = 28;
  ky.hoTroSale.HN = 16;
  ky.nhatKy = ky.nhatKy.filter((d) => d.taiKhoan !== 'nva1');
  ky.nhatKy.push({ taiKhoan: 'nva1', loai: 'Kiểm kho', soLuong: 18 }); // 18 × 0,5 = 9
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  gan(kq.thanhVien.nva1.tong, 71);
  assert.equal(kq.thanhVien.nva1.trangThai, 'du');
});

test('3.6 đối soát bộ 1 đạt ở mọi nguồn và khu vực', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const kq = c.tinhPoint(cfg, idx, ky1(), loiCauHinh);
  assert.equal(kq.loi.length, 0);
  assert.ok(kq.doiSoat.length >= 7);
  assert.ok([...kq.doiSoat].every((d) => d.dat));
});

test('3.6 đối soát: point quản lý kho nhập tay lệch tổng nhật ký thì báo lệch kèm tài khoản', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const ky = ky1();
  ky.pointQuanLyKhoNhapTay = { nvc3: 20 };
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  const l = [...kq.loi].find((x) => x.ma === 'DOI_SOAT_LECH');
  assert.ok(l);
  assert.equal(l.chiTiet.taiKhoan, 'nvc3');
  gan(l.chiTiet.lech, 3);
  gan(kq.thanhVien.nvc3.nguon.quanLyKho.point, 17, 1e-9); // kết quả dùng tổng nhật ký
  assert.equal(l.chan, 'doiSoat');
});

test('3.6 đối soát: nhập tay đúng bằng tổng nhật ký thì không báo', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const ky = ky1();
  ky.pointQuanLyKhoNhapTay = { nvc3: 17 };
  assert.equal(c.tinhPoint(cfg, idx, ky, loiCauHinh).loi.length, 0);
});

test('3.6 quỹ có phát sinh nhưng chưa ai có hệ số thì báo lệch', () => {
  const cfg = cfg1();
  cfg.heSoChia = cfg.heSoChia.filter((h) => !(h.nguon === 'hoTroSale' && h.khuVuc === 'HCM'));
  const { idx, loiCauHinh } = chuanBi(cfg);
  const kq = c.tinhPoint(cfg, idx, ky1(), loiCauHinh);
  assert.ok([...kq.loi].some((l) => l.ma === 'CHUA_CO_HE_SO'));
});

// ---------------------------------------------------------------- 3.7 trạng thái đủ/thiếu
test('3.7 nguồn áp dụng còn trống thì point thiếu, không tính như 0', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const ky = ky1();
  ky.hoTroSale.HN = null; // nva1 và nvb2 có hệ số ở nguồn này
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  assert.equal(kq.thanhVien.nva1.trangThai, 'thieu');
  assert.deepEqual([...kq.thanhVien.nva1.thieuNguon], ['hoTroSale']);
  assert.equal(kq.thanhVien.nva1.tong, null);
  assert.equal(kq.thanhVien.nva1.nguon.hoTroSale.trangThai, 'thieu');
  // người ở khu vực khác không bị ảnh hưởng
  assert.equal(kq.thanhVien.nve5.trangThai, 'du');
});

test('3.7 nhập 0 thì nguồn có số liệu', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const ky = ky1();
  ky.baoHanh.HN = 0;
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  assert.equal(kq.thanhVien.nva1.trangThai, 'du');
  assert.equal(kq.thanhVien.nva1.nguon.baoHanh.point, 0);
});

test('3.7 nguồn không có hệ số thì không áp dụng và không làm thiếu dữ liệu', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const kq = c.tinhPoint(cfg, idx, ky1(), loiCauHinh);
  assert.equal(kq.thanhVien.nvc3.nguon.baoHanh.trangThai, 'khongApDung');
  assert.equal(kq.thanhVien.nvc3.trangThai, 'du');
});

test('3.7 người không có dòng nhật ký nào thì quản lý kho là thiếu; có dòng 0 thì đủ', () => {
  const { idx, loiCauHinh, cfg } = chuanBi();
  const ky = ky1();
  ky.nhatKy = ky.nhatKy.filter((d) => d.taiKhoan !== 'nva1');
  const kq = c.tinhPoint(cfg, idx, ky, loiCauHinh);
  assert.equal(kq.thanhVien.nva1.nguon.quanLyKho.trangThai, 'thieu');
  assert.equal(kq.thanhVien.nva1.trangThai, 'thieu');
  assert.equal(kq.thanhVien.nvb2.nguon.quanLyKho.point, 0, 'dòng có số lượng 0 là có số liệu');
});

test('bộ 3: mã lạ ở Hà Nội chỉ chặn quỹ Hà Nội, TP.HCM vẫn tính', () => {
  const cfg = docFixture('bo3', 'config.json');
  const kt = c.kiemTraCauHinh(cfg);
  const idx = c.dungChiMuc(cfg);
  const kq = c.tinhPoint(cfg, idx, docFixture('bo3', 'ky.json'), kt.loi);
  assert.equal(kq.quy.xuatBanChuyenKho.hn.quy, null);
  assert.ok(kq.quy.xuatBanChuyenKho.hcm.quy === null, 'TP.HCM chưa được xác nhận báo cáo một phần');
  assert.equal([...kq.loi].some((l) => l.ma === 'MA_HANG_LA'), true);
  assert.equal([...kq.loi].some((l) => l.ma === 'BAO_CAO_CHUA_PHU_KY'), true);
  assert.equal([...kq.loi].some((l) => l.ma === 'LOAI_VIEC_LA'), true);
  assert.equal([...kq.loi].some((l) => l.ma === 'TAI_KHOAN_LA'), true);
  // bảo hành HN âm; bảo hành HCM bị chặn bởi cấu hình hệ số lệch
  assert.equal(kq.quy.baoHanh.hn.quy, null);
  assert.equal(kq.thanhVien.nve5.nguon.baoHanh.trangThai, 'biChan');
  assert.equal(kq.thanhVien.nve5.trangThai, 'thieu');
  // hỗ trợ sale HCM trống nên là thiếu
  assert.equal(kq.thanhVien.nvf6.nguon.hoTroSale.trangThai, 'thieu');
});
