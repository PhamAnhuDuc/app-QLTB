'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap, docFixture } = require('./load-core');

const c = nap();
const gan = (a, b, dung = 1e-4) => assert.ok(Math.abs(a - b) <= dung, `${a} khác ${b}`);
const TS = { heSoMin: 0.7, tranDoanhThu: 1.2 };

function chuanBi(cfg = docFixture('bo1', 'config.json')) {
  const kt = c.kiemTraCauHinh(cfg);
  return { cfg, idx: c.dungChiMuc(cfg), loiCauHinh: kt.loi };
}
const tv = (cfg, tk) => cfg.thanhVien.find((t) => t.taiKhoan === tk);

// ---------------------------------------------------------------- 4.1 Min
test('4.1 Min của chỉ số thấp tốt = mục tiêu / 0,7; cao tốt = mục tiêu × 0,7', () => {
  gan(c.minChiSo('thapTot', 21, 0.7), 30);
  gan(c.minChiSo('caoTot', 0.8, 0.7), 0.56);
  assert.equal(c.minChiSo('doanhThu', 100, 0.7), null);
});

// ---------------------------------------------------------------- 4.2 %HT
test('4.2 thấp tốt ở giữa Min và mục tiêu: (30 − 21,19) / (30 − 21) ≈ 97,9%', () => {
  gan(c.tinhPhanTramHoanThanh('thapTot', 21, 21.19, TS), (30 - 21.19) / (30 - 21));
  gan(c.tinhPhanTramHoanThanh('thapTot', 21, 21.19, TS), 0.9789);
});

test('4.2 thấp tốt tốt hơn hoặc bằng mục tiêu → 100%', () => {
  assert.equal(c.tinhPhanTramHoanThanh('thapTot', 21, 18, TS), 1);
  assert.equal(c.tinhPhanTramHoanThanh('thapTot', 21, 21, TS), 1);
});

test('4.2 thấp tốt bằng hoặc tệ hơn Min → 0%, không tính tiếp theo tỷ lệ', () => {
  assert.equal(c.tinhPhanTramHoanThanh('thapTot', 21, 30, TS), 0);
  assert.equal(c.tinhPhanTramHoanThanh('thapTot', 21, 45, TS), 0);
});

test('4.2 cao tốt ở giữa: (0,7 − 0,56) / (0,8 − 0,56) ≈ 58,3%', () => {
  gan(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.7, TS), 0.14 / 0.24);
  gan(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.7, TS), 0.5833);
});

test('4.2 cao tốt bằng hoặc tệ hơn Min → 0%; đạt mục tiêu → 100%', () => {
  assert.equal(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.56, TS), 0);
  assert.equal(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.4, TS), 0);
  assert.equal(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.846, TS), 1);
});

test('4.2 hệ số Min là tham số cấu hình: đổi 0,7 sang 0,5 thì đổi %HT', () => {
  const ts = { heSoMin: 0.5, tranDoanhThu: 1.2 };
  // Min = 0,8 × 0,5 = 0,4; KQ 0,6 → (0,6 − 0,4) / (0,8 − 0,4) = 50%
  gan(c.tinhPhanTramHoanThanh('caoTot', 0.8, 0.6, ts), 0.5);
});

// ---------------------------------------------------------------- 4.3 doanh thu
test('4.3 doanh thu: 130% → trần 120%; 98% → 98%; không có Min', () => {
  gan(c.tinhPhanTramHoanThanh('doanhThu', 100, 130, TS), 1.2);
  gan(c.tinhPhanTramHoanThanh('doanhThu', 100, 98, TS), 0.98);
  gan(c.tinhPhanTramHoanThanh('doanhThu', 100, 10, TS), 0.1); // vẫn tính tỷ lệ, không về 0
});

// ---------------------------------------------------------------- 4.4 điểm key metrics và bậc thang
test('4.4 điểm key metrics bằng Σ tỷ trọng × %HT (hai chỉ số 80/20 → ≈ 97,9%)', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvc3'), docFixture('bo1', 'ky.json').keyMetrics, loiCauHinh);
  assert.equal(kq.trangThai, 'du');
  gan(kq.diem, 0.8 * ((30 - 21.19) / 9) + 0.2 * 0.98);
  gan(kq.diem, 0.9791);
  assert.equal(kq.phanTramThuong, 0.25);
});

test('4.4 điểm vượt 100% nhờ doanh thu: 0,75 × 100% + 0,25 × 120% = 105%', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const t = { taiKhoan: 'x', khuVuc: 'HN', nhom: 'N',
    chiSo: [{ chiSo: 'tyLeBaoHanh', tyTrong: 0.35 }, { chiSo: 'tyLeHaiLong', tyTrong: 0.4 }, { chiSo: 'doanhThu', tyTrong: 0.25 }] };
  const gt = [
    { chiSo: 'tyLeBaoHanh', capDo: 'nhom', khoa: 'N', mucTieu: 0.033, ketQua: 0.02 },
    { chiSo: 'tyLeHaiLong', capDo: 'nhom', khoa: 'N', mucTieu: 0.8, ketQua: 0.9 },
    { chiSo: 'doanhThu', capDo: 'nhom', khoa: 'N', mucTieu: 100, ketQua: 130 }
  ];
  // chạy thẳng hàm tính với thành viên tự dựng (không cần có trong cấu hình)
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, t, gt, loiCauHinh);
  gan(kq.diem, 0.75 + 0.3);
  assert.equal(kq.phanTramThuong, 0.35);
});

test('4.4 bậc thang: biên 70%, 80%, 90%, 100% thuộc khoảng dưới; 100,01% → 35%; 65% → 0%', () => {
  const { idx } = chuanBi();
  const f = (d) => c.phanTramThuongTheoDiem(idx.bacThang, d);
  assert.equal(f(0), 0);
  assert.equal(f(0.65), 0);
  assert.equal(f(0.7), 0);
  assert.equal(f(0.7001), 0.15);
  assert.equal(f(0.8), 0.15);
  assert.equal(f(0.8001), 0.2);
  assert.equal(f(0.9), 0.2);
  assert.equal(f(0.9001), 0.25);
  assert.equal(f(1), 0.25);
  assert.equal(f(1.0001), 0.35);
  assert.equal(f(1.06), 0.35);
});

test('4.4 nhiễu dấu phẩy động không làm lệch biên (0,1 + 0,7 + 0,0000000001)', () => {
  const { idx } = chuanBi();
  assert.equal(c.phanTramThuongTheoDiem(idx.bacThang, 0.1 + 0.7), 0.15);
  assert.equal(c.phanTramThuongTheoDiem(idx.bacThang, 0.4 * 1 + 0.35 * 1 + 0.25 * 1), 0.25);
});

test('4.4 bậc thang đọc từ cấu hình: đổi % thưởng thì kết quả đổi', () => {
  const cfg = docFixture('bo1', 'config.json');
  cfg.bacThangThuong[3].phanTram = 0.3;
  const { idx } = chuanBi(cfg);
  assert.equal(c.phanTramThuongTheoDiem(idx.bacThang, 0.95), 0.3);
});

// ---------------------------------------------------------------- 4.5 dùng chung theo nhóm/khu vực
test('4.5 kết quả dùng chung theo khu vực: hai người cùng khu vực cùng %HT, tỷ trọng riêng', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  const a = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nva1'), gt, loiCauHinh);
  const b = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvb2'), gt, loiCauHinh);
  const htBaoHanh = (kq) => kq.chiTiet.find((x) => x.chiSo === 'tyLeBaoHanh').phanTramHT;
  assert.equal(htBaoHanh(a), htBaoHanh(b));
  assert.equal(a.chiTiet.find((x) => x.chiSo === 'tyLeBaoHanh').tyTrong, 0.4);
  assert.equal(b.chiTiet.find((x) => x.chiSo === 'tyLeBaoHanh').tyTrong, 0.4);
  assert.equal(a.chiTiet.find((x) => x.chiSo === 'tyLeHaiLong').tyTrong, 0.4);
  assert.equal(b.chiTiet.find((x) => x.chiSo === 'tyLeHaiLong').tyTrong, 0.35);
});

test('4.5 giá trị riêng của tài khoản được ưu tiên hơn giá trị theo nhóm', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  const f = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvf6'), gt, loiCauHinh);
  const hl = f.chiTiet.find((x) => x.chiSo === 'tyLeHaiLong');
  assert.equal(hl.ketQua, 0.7);
  gan(hl.phanTramHT, 0.14 / 0.24);
  const e = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nve5'), gt, loiCauHinh);
  assert.equal(e.chiTiet.find((x) => x.chiSo === 'tyLeHaiLong').ketQua, 0.846);
});

// ---------------------------------------------------------------- 4.6 thiếu / sai / không áp dụng
test('4.6 thiếu kết quả: key metrics là thiếu, không có điểm và không có % thưởng', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics.filter((m) => !(m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN'));
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nva1'), gt, loiCauHinh);
  assert.equal(kq.trangThai, 'thieu');
  assert.deepEqual([...kq.thieuChiSo], ['tyLeBaoHanh']);
  assert.equal(kq.diem, null);
  assert.equal(kq.phanTramThuong, null);
});

test('4.6 kết quả để trống (null) là thiếu, kết quả 0 là có số liệu', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  gt.find((m) => m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN').ketQua = null;
  assert.equal(c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nva1'), gt, loiCauHinh).trangThai, 'thieu');
  gt.find((m) => m.chiSo === 'tyLeBaoHanh' && m.khoa === 'HN').ketQua = 0;
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nva1'), gt, loiCauHinh);
  assert.equal(kq.trangThai, 'du');
  assert.equal(kq.chiTiet.find((x) => x.chiSo === 'tyLeBaoHanh').phanTramHT, 1, '0% bảo hành là tốt nhất');
});

test('4.6 mục tiêu bằng 0: báo lỗi nêu chỉ số, không chia cho 0', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  gt.find((m) => m.chiSo === 'doanhThu' && m.khoa === 'Quản lý kho').mucTieu = 0;
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvc3'), gt, loiCauHinh);
  assert.equal(kq.trangThai, 'biChan');
  assert.equal(kq.loi[0].ma, 'MUC_TIEU_SAI');
  assert.equal(kq.loi[0].chiTiet.chiSo, 'doanhThu');
  assert.equal(kq.loi[0].chiTiet.taiKhoan, 'nvc3');
  assert.equal(kq.diem, null);
});

test('4.6 kết quả âm hoặc không phải số bị báo lỗi', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  gt.find((m) => m.chiSo === 'doanhThu' && m.khoa === 'Quản lý kho').ketQua = -5;
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvc3'), gt, loiCauHinh);
  assert.equal(kq.loi[0].ma, 'KET_QUA_SAI');
});

test('4.6 thành viên chỉ theo dõi point: key metrics là "không áp dụng"', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const kq = c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvd4'), docFixture('bo1', 'ky.json').keyMetrics, loiCauHinh);
  assert.equal(kq.trangThai, 'khongApDung');
  assert.equal(kq.loi.length, 0);
});

test('4.6 tỷ trọng cấu hình lệch (bộ 3): key metrics của người đó bị chặn, người khác không', () => {
  const { cfg, idx, loiCauHinh } = chuanBi(docFixture('bo3', 'config.json'));
  const gt = docFixture('bo3', 'ky.json').keyMetrics;
  assert.equal(c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nvb2'), gt, loiCauHinh).trangThai, 'biChan');
  assert.equal(c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, 'nva1'), gt, loiCauHinh).trangThai, 'thieu', 'hài lòng nhóm bị trống');
});

test('bộ 1: điểm key metrics từng người khớp tính tay', () => {
  const { cfg, idx, loiCauHinh } = chuanBi();
  const gt = docFixture('bo1', 'ky.json').keyMetrics;
  const diem = (tk) => c.tinhKeyMetricsThanhVien(cfg, idx, tv(cfg, tk), gt, loiCauHinh);
  gan(diem('nva1').diem, 0.4 * 1 + 0.4 * 1 + 0.2 * 1.05);                 // 1,01 → 35%
  gan(diem('nvb2').diem, 0.4 * 1 + 0.35 * 1 + 0.25 * 1.05);               // 1,0125 → 35%
  gan(diem('nve5').diem, 0.35 * 1 + 0.4 * 1 + 0.25 * 1.05);               // 1,0125 → 35%
  gan(diem('nvf6').diem, 0.45 * 1 + 0.35 * (0.14 / 0.24) + 0.2 * 1.05);   // ≈ 0,8642 → 20%
  gan(diem('nvg7').diem, 0.4 * 1 + 0.4 * 1 + 0.2 * 1.05);
  assert.equal(diem('nva1').phanTramThuong, 0.35);
  assert.equal(diem('nvf6').phanTramThuong, 0.2);
});
