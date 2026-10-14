'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap, docFixture } = require('./load-core');

const c = nap();
const gan = (a, b, dung = 1e-6) => assert.ok(Math.abs(a - b) <= dung, `${a} khác ${b}`);

function chuanBi() {
  const cfg = docFixture('bo1', 'config.json');
  return { cfg, idx: c.dungChiMuc(cfg), loiCauHinh: c.kiemTraCauHinh(cfg).loi };
}
const du = (tong) => ({ trangThai: 'du', tong, nguon: {} });
const km = (diem, pt) => ({ trangThai: 'du', diem, phanTramThuong: pt, chiTiet: [] });
const tvMau = (o) => Object.assign({ taiKhoan: 'mau1', ten: 'Mẫu', bac: 1, khuVuc: 'HN', nhom: 'Nhóm mẫu', mayCaNhan: true, luongCoDinhGhiDe: null, chiSo: [] }, o);

// ---------------------------------------------------------------- 5.1 point vượt
test('5.1 point trong khoảng Min–Max: 298,67 (Min 250, Max 300) → vượt 48,67 → 2.433.333', () => {
  gan(c.tinhPointVuot(298.67, 250, 300), 48.67);
  gan(c.tinhPointVuot(298.67, 250, 300) * 50000, 2433500, 1);
});

test('5.1 point vượt Max bị cắt trần: 466,3 → vượt 50 → 2.500.000', () => {
  assert.equal(c.tinhPointVuot(466.3, 250, 300), 50);
  assert.equal(c.tinhPointVuot(466.3, 250, 300) * 50000, 2500000);
});

test('5.1 point dưới hoặc bằng Min → 0 (không âm), không trừ vào thu nhập', () => {
  assert.equal(c.tinhPointVuot(22, 30, 80), 0);
  assert.equal(c.tinhPointVuot(30, 30, 80), 0);
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 3 }), du(22), km(0.95, 0.25), loiCauHinh);
  assert.equal(r.pointVuot, 0);
  assert.equal(r.thuongVuotPoint, 0);
  assert.equal(r.thuNhap, 8500000 + 0.25 * 8500000 + 0 + 200000); // lương + thưởng KM + 0 + phụ cấp
  assert.ok([...r.canhBao].some((x) => x.ma === 'POINT_DUOI_MIN'));
});

test('5.1 point vượt Max sinh cảnh báo cắt trần nhưng vẫn tính', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 4 }), du(466.3), km(0.95, 0.25), loiCauHinh);
  assert.equal(r.trangThai, 'daTinh');
  assert.ok([...r.canhBao].some((x) => x.ma === 'POINT_CAT_TRAN'));
});

// ---------------------------------------------------------------- 5.2 thưởng KM và phụ cấp
test('5.2 thưởng KM tính trên lương cố định ghi đè: 9.800.000 × 20% = 1.960.000', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 3, luongCoDinhGhiDe: 9800000 }), du(100), km(0.85, 0.2), loiCauHinh);
  assert.equal(r.luongCoDinh, 9800000);
  assert.equal(r.thuongKM, 1960000);
  assert.equal(r.luongGhiDe, true);
  const gb = [...r.canhBao].find((x) => x.ma === 'GHI_DE_LUONG');
  assert.ok(gb);
  assert.equal(gb.chiTiet.giaTriGhiDe, 9800000);
  assert.equal(gb.chiTiet.giaTriChuan, 8500000);
});

test('5.2 ghi đè bằng đúng giá trị chuẩn thì không cảnh báo', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 3, luongCoDinhGhiDe: 8500000 }), du(100), km(0.85, 0.2), loiCauHinh);
  assert.equal(r.luongGhiDe, false);
  assert.equal([...r.canhBao].some((x) => x.ma === 'GHI_DE_LUONG'), false);
});

test('5.2 % thưởng bằng 0: thưởng KM bằng 0, các khoản còn lại vẫn tính', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1 }), du(135), km(0.65, 0), loiCauHinh);
  assert.equal(r.thuongKM, 0);
  assert.equal(r.thuongVuotPoint, 15 * 50000);
  assert.equal(r.thuNhap, 6000000 + 0 + 750000 + 200000);
});

test('5.2 máy công ty: phụ cấp 0, thu nhập không gồm 200.000đ', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1, mayCaNhan: false }), du(135), km(0.65, 0), loiCauHinh);
  assert.equal(r.phuCap, 0);
  assert.equal(r.thuNhap, 6000000 + 750000);
});

// ---------------------------------------------------------------- 5.3 hai ví dụ mẫu của spec
test('5.3 ví dụ mẫu bậc 1: point 324,1, điểm 99,6% → 9.200.000', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1 }), du(324.1), km(0.996, 0.25), loiCauHinh);
  assert.equal(r.thuongKM, 1500000);
  assert.equal(r.thuongVuotPoint, 1500000);
  assert.equal(r.phuCap, 200000);
  assert.equal(r.thuNhap, 9200000);
  assert.equal(r.trangThai, 'daTinh');
});

test('5.3 ví dụ mẫu ghi đè: bậc 4, lương 10.800.000, point 491,7, 25% → 16.200.000', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 4, luongCoDinhGhiDe: 10800000 }), du(491.7), km(0.995, 0.25), loiCauHinh);
  assert.equal(r.thuongKM, 2700000);
  assert.equal(r.thuongVuotPoint, 2500000);
  assert.equal(r.thuNhap, 16200000);
});

test('5.3 ví dụ bậc 4, máy công ty, point 298,67 → 14.933.333', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 4, mayCaNhan: false }), du(298.6666667), km(0.98, 0.25), loiCauHinh);
  assert.equal(r.thuNhap, 14933333);
});

test('5.3 đổi đơn giá point trong cấu hình thì thưởng vượt đổi theo', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  cfg.thamSo.donGiaPoint = 70000;
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1 }), du(324.1), km(0.996, 0.25), loiCauHinh);
  assert.equal(r.thuongVuotPoint, 30 * 70000);
});

// ---------------------------------------------------------------- 5.4 chưa tính / không tính
test('5.4 thiếu key metrics: hiện thưởng vượt point, thu nhập "chưa tính"', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1 }), du(324.1), { trangThai: 'thieu', chiTiet: [], thieuChiSo: ['doanhThu'] }, loiCauHinh);
  assert.equal(r.trangThai, 'chuaTinh');
  assert.equal(r.thuongVuotPoint, 1500000);
  assert.equal(r.thuongKM, null);
  assert.equal(r.thuNhap, null);
  assert.ok(r.lyDo.some((x) => x.includes('Key metrics')));
});

test('5.4 thiếu point: thu nhập "chưa tính", thành phần phụ thuộc point để trống', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 1 }), { trangThai: 'thieu', tong: null, nguon: {} }, km(0.996, 0.25), loiCauHinh);
  assert.equal(r.trangThai, 'chuaTinh');
  assert.equal(r.pointVuot, null);
  assert.equal(r.thuongVuotPoint, null);
  assert.equal(r.thuNhap, null);
  assert.equal(r.thuongKM, 1500000, 'thưởng KM không phụ thuộc point nên vẫn hiện');
});

test('5.4 chỉ theo dõi point: hiện point, không tính thu nhập', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ bac: 4, mayCaNhan: false }), du(35), { trangThai: 'khongApDung', chiTiet: [] }, loiCauHinh);
  assert.equal(r.trangThai, 'khongTinh');
  assert.equal(r.pointTong, 35);
  assert.equal(r.thuNhap, null);
});

test('5.4 không bao giờ tự điền 0 cho thu nhập khi thiếu dữ liệu', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const r = c.tinhThuNhapThanhVien(cfg, idx, tvMau({}), { trangThai: 'thieu', tong: null, nguon: {} }, { trangThai: 'thieu', chiTiet: [], thieuChiSo: [] }, loiCauHinh);
  assert.equal(r.thuNhap, null);
  assert.notEqual(r.thuNhap, 0);
});

// ---------------------------------------------------------------- 5.5 tổng và làm tròn
function dong(nhom, trangThai, thuNhap) {
  return { nhom, trangThai, thuNhap, luongCoDinh: thuNhap === null ? null : 1000, thuongKM: thuNhap === null ? null : 100,
    thuongVuotPoint: thuNhap === null ? null : 10, phuCap: thuNhap === null ? null : 200, pointVuot: thuNhap === null ? null : 1 };
}

test('5.5 tổng khi còn người thiếu dữ liệu: 5/7 người, mọi cột chỉ gồm 5 người', () => {
  const ds = [
    dong('A', 'daTinh', 100), dong('A', 'daTinh', 200), dong('A', 'chuaTinh', null),
    dong('B', 'daTinh', 300), dong('B', 'daTinh', 400), dong('B', 'chuaTinh', null), dong('B', 'daTinh', 500)
  ];
  const t = c.tongHopThuNhap(ds);
  assert.equal(t.team.thuNhap, 1500);
  assert.equal(t.team.soDaTinh, 5);
  assert.equal(t.team.tongSo, 7);
  assert.equal(t.team.ghiChu, 'cộng của 5/7 người');
  assert.equal(t.team.luongCoDinh, 5000, 'cột lương cố định cũng chỉ cộng 5 người');
  assert.equal(t.team.thuongKM, 500);
  assert.equal(t.team.phuCap, 1000);
  assert.equal(t.theoNhom.length, 2);
  assert.equal(t.theoNhom[0].ghiChu, 'cộng của 2/3 người');
  assert.equal(t.theoNhom[1].ghiChu, 'cộng của 3/4 người');
});

test('5.5 người chỉ theo dõi point không có mặt trong tổng và mẫu số', () => {
  const ds = [dong('A', 'daTinh', 100), { nhom: 'A', trangThai: 'khongTinh', thuNhap: null }];
  const t = c.tongHopThuNhap(ds);
  assert.equal(t.team.tongSo, 1);
  assert.equal(t.team.soDaTinh, 1);
  assert.equal(t.team.ghiChu, 'cộng của 1/1 người');
});

test('5.5 thưởng lẻ đồng: thu nhập làm tròn đến đồng, tổng là tổng các số đã làm tròn', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const a = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ taiKhoan: 'a', bac: 4, mayCaNhan: false }), du(298.6666667), km(0.98, 0.25), loiCauHinh);
  const b = c.tinhThuNhapThanhVien(cfg, idx, tvMau({ taiKhoan: 'b', bac: 4, mayCaNhan: false }), du(298.6666667), km(0.98, 0.25), loiCauHinh);
  assert.ok(Math.abs(a.thuNhapChuaLamTron - Math.round(a.thuNhapChuaLamTron)) > 0, 'giá trị gốc lẻ đồng');
  assert.equal(a.thuNhap, Math.round(a.thuNhapChuaLamTron));
  assert.equal(Number.isInteger(a.thuNhap), true);
  const t = c.tongHopThuNhap([a, b]);
  assert.equal(t.team.thuNhap, a.thuNhap + b.thuNhap);
});

// ---------------------------------------------------------------- 5.6 nhãn, cảnh báo, giải thích
test('5.6 mọi kết quả mang nhãn "Đề xuất – chờ duyệt"', () => {
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  assert.equal(kq.nhan, 'Đề xuất – chờ duyệt');
  assert.ok([...kq.thanhVien].every((r) => r.nhan === 'Đề xuất – chờ duyệt'));
});

test('5.6 cảnh báo không chặn: cắt trần, dưới Min, ghi đè lương', () => {
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  const ma = [...kq.canhBao].map((x) => x.ma);
  assert.ok(ma.includes('POINT_CAT_TRAN'));
  assert.ok(ma.includes('POINT_DUOI_MIN'));
  assert.ok(ma.includes('GHI_DE_LUONG'));
  assert.ok([...kq.thanhVien].filter((r) => r.trangThai === 'daTinh').length > 0, 'cảnh báo không chặn việc tính');
});

test('5.6 giải thích từng bước có đủ point từng nguồn, Min–Max, %HT, thưởng và thu nhập', () => {
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  const e = [...kq.thanhVien].find((r) => r.taiKhoan === 'nve5');
  const loai = [...e.giaiThich].map((b) => b.buoc);
  for (const can of ['point', 'pointTong', 'minMax', 'pointVuot', 'thuongVuot', 'chiSo', 'diemKM', 'thuongKM', 'phuCap', 'thuNhap']) {
    assert.ok(loai.includes(can), `thiếu bước ${can}`);
  }
  assert.ok([...e.giaiThich].find((b) => b.buoc === 'thuNhap').noiDung.includes('16043000'));
});

test('5.6 người chưa tính có giải thích lý do thay vì số 0', () => {
  const ky = docFixture('bo1', 'ky.json');
  ky.keyMetrics = ky.keyMetrics.filter((m) => !(m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN'));
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), ky);
  const a = [...kq.thanhVien].find((r) => r.taiKhoan === 'nva1');
  assert.equal(a.trangThai, 'chuaTinh');
  const buocCuoi = [...a.giaiThich].pop();
  assert.ok(buocCuoi.noiDung.startsWith('Chưa tính'));
});

// ---------------------------------------------------------------- 5.7 ổn định
test('5.7 chạy hai lần cùng đầu vào cho cùng kết quả (bộ 1)', () => {
  const lan1 = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  const lan2 = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  assert.equal(JSON.stringify(lan1), JSON.stringify(lan2));
});

test('5.7 tính không làm thay đổi dữ liệu đầu vào', () => {
  const cfg = docFixture('bo1', 'config.json');
  const ky = docFixture('bo1', 'ky.json');
  const truoc = JSON.stringify([cfg, ky]);
  c.tinhKy(cfg, ky);
  assert.equal(JSON.stringify([cfg, ky]), truoc);
});

// ---------------------------------------------------------------- bộ 1 đầy đủ (tính tay)
test('bộ 1: thu nhập từng người khớp tính tay và tổng team', () => {
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  const t = Object.fromEntries([...kq.thanhVien].map((r) => [r.taiKhoan, r]));
  assert.equal(t.nva1.thuNhap, 9800000);    // 6.000.000 + 35% · 6.000.000 + 30 · 50.000 + 200.000
  assert.equal(t.nvb2.thuNhap, 16200000);   // 10.000.000 + 3.500.000 + 2.500.000 + 200.000
  assert.equal(t.nvc3.thuNhap, 12700000);   // 10.000.000 + 25% · 10.000.000 + 0 + 200.000
  assert.equal(t.nvd4.trangThai, 'khongTinh');
  assert.equal(t.nvd4.thuNhap, null);
  assert.equal(t.nve5.thuNhap, 16043000);   // 10.800.000 + 3.780.000 + 1.263.000 + 200.000
  assert.equal(t.nvf6.thuNhap, 9620000);    // 6.600.000 + 20% · 6.600.000 + 1.500.000 + 200.000
  assert.equal(t.nvg7.thuNhap, 11475000);   // 8.500.000 + 35% · 8.500.000 + 0 + 0
  assert.equal(kq.tong.team.thuNhap, 75838000);
  assert.equal(kq.tong.team.ghiChu, 'cộng của 6/6 người');
  assert.equal(kq.kyDuDuLieu, true);
  assert.equal(kq.loi.length, 0);
});

test('bộ 2: kỳ khác, đơn giá khác, bậc khác', () => {
  const kq = c.tinhKy(docFixture('bo2', 'config.json'), docFixture('bo2', 'ky.json'));
  assert.equal(kq.loi.length, 0, JSON.stringify([...kq.loi].map((l) => l.thongDiep)));
  const t = Object.fromEntries([...kq.thanhVien].map((r) => [r.taiKhoan, r]));
  // nvh8: quỹ HN xuất bán/chuyển kho = 10×0,67 + 10×0,75 + 40×0,3 = 26,2; hệ số 0,5 → 13,1
  // bảo hành HN 40 × 0,3 = 12; hỗ trợ sale HN 100 × 0,17 × 0,5 = 8,5; nhật ký 400 × 0,5 = 200
  gan(t.nvh8.pointTong, 13.1 + 12 + 8.5 + 200);
  assert.equal(t.nvh8.pointVuot, 50);                 // bậc 2: Min 150, Max 200 → cắt trần
  assert.equal(t.nvh8.thuongVuotPoint, 50 * 60000);   // đơn giá bộ 2 là 60.000đ
  // %HT bảo hành HN thấp tốt: Min = 0,033/0,7; KQ 0,0345; doanh thu 0,9
  const min = 0.033 / 0.7;
  const htBh = (min - 0.0345) / (min - 0.033);
  gan(t.nvh8.diemKM, 0.5 * htBh + 0.5 * 0.9);
  // nvk10 (bậc 3) nhận 100% mọi quỹ HCM; mã "sp-003" viết thường vẫn khớp bảng quy đổi
  // xuất bán/chuyển kho HCM = 100 × 0,33 + 100 × 0,33 = 66; bảo hành 20; hỗ trợ sale 50 × 0,17 = 8,5; nhật ký 0
  gan(t.nvk10.point.nguon.xuatBanChuyenKho.point, 66);
  gan(t.nvk10.pointTong, 66 + 20 + 8.5 + 0);
  // %HT bảo hành HCM thấp tốt: mục tiêu 0,04, Min = 0,04/0,7, kết quả 0,055 → điểm ≈ 12,5% → thưởng 0%
  const minHcm = 0.04 / 0.7;
  gan(t.nvk10.diemKM, (minHcm - 0.055) / (minHcm - 0.04));
  assert.equal(t.nvk10.phanTramThuong, 0);
  assert.equal(t.nvk10.thuongKM, 0);
  // nvi9 (bậc 5, máy công ty) không có phụ cấp; nvl11 chỉ theo dõi... có chỉ số nên vẫn tính
  assert.equal(t.nvi9.phuCap, 0);
  assert.equal(t.nvl11.trangThai, 'daTinh');
});
