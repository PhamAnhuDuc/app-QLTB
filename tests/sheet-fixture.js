// Dựng các tab Sheet GIẢ (mảng hai chiều) từ bộ dữ liệu giả bo1/bo2/bo3 trong tests/fixtures/.
// Báo cáo kiểm kê được dựng đúng CẤU TRÚC của báo cáo thật (nhiều dòng đầu, dòng "Từ ngày … đến ngày …",
// tiêu đề hai tầng, dòng "Tổng", dòng sản phẩm, chân bảng "Tổng số dòng : N") nhưng toàn bộ số liệu là giả.
// Chạy: node tests/sheet-fixture.js   (ghi lại tests/fixtures/sheet/<bo>.tabs.json)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');

const c = nap();
const TD = (ten) => [...c.TIEU_DE[ten]];
const NHAN_CAP = { nhom: 'Nhóm', khuVuc: 'Khu vực', taiKhoan: 'Tài khoản' };
const NHAN_NGUON_VN = { xuatBanChuyenKho: 'xuatBanChuyenKho', baoHanh: 'baoHanh', hoTroSale: 'hoTroSale' };
const trongNeuNull = (v) => (v === null || v === undefined ? '' : v);

function ngayVN(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Báo cáo kiểm kê giả. Các cột giá bán, giá trị tồn là số giả để kiểm tra việc "không mang theo".
function taoBaoCaoKiemKe(kiemKe) {
  const rows = [
    ['Đơn vị: CÔNG TY GIẢ'],
    ['Địa chỉ: Địa chỉ giả'],
    [],
    ['BÁO CÁO KIỂM KÊ NHẬP XUẤT TỒN KHO'],
    [`Từ ngày: ${ngayVN(kiemKe.tuNgay)} đến ngày: ${ngayVN(kiemKe.denNgay)}`],
    ['', '', '', '', '', '', '', '', '', 'Đơn vị tính: VND'],
    ['STT', 'Mã hàng', 'Tên hàng', 'Giá bán', 'Tồn kho đầu kỳ', 'Nhập trong kỳ', 'Xuất trong kỳ', '', '', 'Giá trị'],
    ['', '', '', '', 'SL', 'SL nhập', 'SL bán ra trong kỳ', 'SL trả nhà cung cấp', 'SL chuyển kho', 'GT tồn cuối kỳ'],
    // dòng "Tổng" của file xuất có thể mang giá trị cũ (0) nên chương trình không được tin nó
    ['Tổng', '', '', '', 0, 0, 0, 0, 0, 0]
  ];
  kiemKe.dong.forEach((d, i) => {
    rows.push([i + 1, trongNeuNull(d.ma), d.ten || '', 1234567, 7, 3, d.banRa, 0, d.chuyenKho, 999999]);
  });
  rows.push([`Tổng số dòng :${kiemKe.dong.length}`]);
  return rows;
}

function taoCacTab(cfg, ky) {
  const t = {};
  const e = (x) => trongNeuNull(x);
  // --- cấu hình
  t.CH_ThamSo = [TD('thamSo'), ...Object.entries(cfg.thamSo).map(([k, v]) => [k, v])];
  if (!('tenTabKetQua' in cfg.thamSo)) t.CH_ThamSo.push(['tenTabKetQua', 'KetQua']); // tên tab kết quả, đổi được
  t.CH_Bac = [TD('bac'), ...cfg.bac.map((b) => [b.bac, b.luongCoDinh, b.min, b.max])];
  t.CH_BacThang = [TD('bacThang'), ...cfg.bacThangThuong.map((b) => [b.tu, e(b.den), b.phanTram])];
  t.CH_ChiSo = [TD('chiSo'), ...cfg.chiSo.map((s) => [s.id, s.ten, s.kieu])];
  t.CH_NhomThietBi = [TD('nhomThietBi'), ...cfg.nhomThietBi.map((n) => [n.nhom, n.pointXuatBan, n.pointChuyenKho])];
  t.CH_MaHang = [TD('maHang'), ...cfg.maHang.map((m) => [m.ma, m.nhom])];
  t.CH_ViecQuanLyKho = [TD('viecQuanLyKho'), ...cfg.viecQuanLyKho.map((v) => [v.loai, v.heSo])];
  t.CH_HeSoChia = [TD('heSoChia'), ...cfg.heSoChia.map((h) => [NHAN_NGUON_VN[h.nguon], h.khuVuc, h.taiKhoan, h.heSo])];
  const khuVuc = cfg.khuVuc || [...new Set(cfg.heSoChia.map((h) => h.khuVuc))].map((ma) => ({ ma, tabBaoCao: `KiemKe_${ma}` }));
  t.CH_KhuVuc = [TD('khuVuc'), ...khuVuc.map((k) => [k.ma, k.tabBaoCao])];
  t.CH_ThanhVien = [TD('thanhVien'), ...cfg.thanhVien.map((m) =>
    [m.taiKhoan, m.ten, m.bac, m.khuVuc, m.nhom, m.mayCaNhan, e(m.luongCoDinhGhiDe)])];
  t.CH_TyTrong = [TD('tyTrong')];
  for (const m of cfg.thanhVien) for (const s of m.chiSo) t.CH_TyTrong.push([m.taiKhoan, s.chiSo, s.tyTrong]);
  // --- nhập tay của kỳ
  t.Ky = [TD('ky'), ['Tháng', ky.ky.thang]];
  const kvNhap = [...new Set([...Object.keys(ky.baoHanh || {}), ...Object.keys(ky.hoTroSale || {})])];
  t.BaoHanh_HoTroSale = [TD('baoHanhHoTroSale'), ...kvNhap.map((kv) => [kv, e((ky.baoHanh || {})[kv]), e((ky.hoTroSale || {})[kv])])];
  t.XacNhanBaoCao = [TD('xacNhanBaoCao'), ...Object.entries(ky.xacNhanBaoCaoMotPhan || {}).map(([kv, v]) => [kv, v])];
  t.NhatKyCongViec = [TD('nhatKyCongViec'), ...(ky.nhatKy || []).map((d) => [d.taiKhoan, d.loai, d.moTa || '', e(d.soLuong)])];
  t.KeyMetrics = [TD('keyMetrics'), ...(ky.keyMetrics || []).map((m) => [m.chiSo, NHAN_CAP[m.capDo], m.khoa, e(m.mucTieu), e(m.ketQua)])];
  // --- báo cáo kiểm kê theo khu vực
  for (const k of khuVuc) {
    const bc = Object.entries(ky.kiemKe || {}).find(([ten]) => ten.toLowerCase() === k.ma.toLowerCase());
    if (bc) t[k.tabBaoCao] = taoBaoCaoKiemKe(bc[1]);
  }
  return t;
}

const BO = ['bo1', 'bo2', 'bo3'];
const THU_MUC = path.join(__dirname, 'fixtures', 'sheet');

function taoTatCa() {
  const ra = {};
  for (const bo of BO) ra[bo] = taoCacTab(docFixture(bo, 'config.json'), docFixture(bo, 'ky.json'));
  return ra;
}

function ghi() {
  fs.mkdirSync(THU_MUC, { recursive: true });
  const tatCa = taoTatCa();
  for (const bo of BO) fs.writeFileSync(path.join(THU_MUC, `${bo}.tabs.json`), JSON.stringify(tatCa[bo], null, 1) + '\n');
  return BO;
}

if (require.main === module) console.log('Đã ghi fixture Sheet giả cho:', ghi().join(', '));

module.exports = { taoCacTab, taoBaoCaoKiemKe, taoTatCa, BO, THU_MUC };
