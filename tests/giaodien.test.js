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
const CHIA_SE_ON = { mucDo: 'on', ma: 'CHIA_SE_RIENG_TU', thongDiep: '' };

function mo(bo = 'bo1', sua, chiMuc = []) {
  const t = tabs(bo); if (sua) sua(t);
  const kq = c.tinhKyTuCacTab(t, T);
  const tt = c.tinhTrangTab(t, kq.khuVuc);
  return plain(c.taoMoHinhGiaoDien(kq, { chiaSe: CHIA_SE_ON, tabs: tt, chiMuc, thang: kq.ky ? kq.ky.thang : null }));
}
const dongCM = (ky, tt, o = {}) => ({ ky, trangThai: tt, thoiDiem: T, tong: 100, soDaTinh: 6, soBoQua: 0, tenTab: 'Chot_' + ky, lyDo: '', dong: 2, ...o });

// ---------------------------------------------------------------- 4.1 mô hình hiển thị
test('4.1 mô hình bộ 1: kỳ, trạng thái, bảng thành viên, tổng, đối soát', () => {
  const m = mo();
  assert.equal(m.daTinh, true);
  assert.equal(m.nhan, 'Đề xuất – chờ duyệt');
  assert.equal(m.thang, '2026-09');
  assert.equal(m.trangThaiDuLieu, 'du');
  assert.equal(m.thanhVien.length, 7);
  const e = m.thanhVien.find((r) => r.taiKhoan === 'nve5');
  assert.equal(e.thuNhap, 16043000);
  assert.equal(e.trangThaiChu, 'Đã tính');
  assert.equal(m.tong.thuNhap, 75838000);
  assert.equal(m.tong.ghiChu, 'cộng của 6/6 người');
  assert.equal(m.nhom.length, 2);
  assert.ok(m.doiSoat.length >= 7 && m.doiSoat.every((d) => d.dat));
  assert.deepEqual(m.loi, []);
});

test('4.1 người chưa tính có lý do, người chỉ theo dõi point có nhãn riêng, thu nhập là null (không phải 0)', () => {
  const m = mo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  const a = m.thanhVien.find((r) => r.taiKhoan === 'nva1');
  assert.equal(a.thuNhap, null);
  assert.ok(a.trangThaiChu.startsWith('Chưa tính:') && a.trangThaiChu.includes('Key metrics'));
  const d = m.thanhVien.find((r) => r.taiKhoan === 'nvd4');
  assert.equal(d.trangThaiChu, 'Không tính (chỉ theo dõi point)');
  assert.equal(m.trangThaiDuLieu, 'chua');
  assert.equal(m.tong.ghiChu, 'cộng của 4/6 người');
});

test('4.1 điều kiện duyệt: bộ 1 không bị chặn; bộ thiếu hai người nêu cần xác nhận hai người', () => {
  assert.deepEqual(mo().duyet.lyDoChan, []);
  assert.deepEqual(mo().duyet.canXacNhan, []);
  const m = mo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); });
  assert.deepEqual(m.duyet.canXacNhan.map((x) => x.taiKhoan), ['nva1', 'nvb2']);
  assert.deepEqual(m.duyet.lyDoChan, []);
});

test('4.1 kỳ đã chốt: điều kiện chặn có KY_DA_CHOT, trạng thái kỳ là Đã chốt', () => {
  const m = mo('bo1', null, [dongCM('2026-09', 'Đã chốt')]);
  assert.equal(m.trangThaiKy, 'Đã chốt');
  assert.ok(m.duyet.lyDoChan.some((l) => l.ma === 'KY_DA_CHOT'));
});

test('4.1 bộ 3 (xấu): vẫn dựng được mô hình, có lỗi và cảnh báo, trạng thái chưa đủ', () => {
  const m = mo('bo3');
  assert.equal(m.trangThaiDuLieu, 'chua');
  assert.ok(m.loi.length >= 8);
  assert.ok(m.duyet.lyDoChan.some((l) => l.ma === 'KHONG_AI_TINH_DUOC'));
});

test('4.1 bị chặn toàn bộ (thiếu tab cấu hình): trạng thái "chan", không có thành viên', () => {
  const m = mo('bo1', (t) => { delete t.CH_Bac; });
  assert.equal(m.trangThaiDuLieu, 'chan');
  assert.deepEqual(m.thanhVien, []);
  assert.equal(m.tong, null);
  assert.equal(m.duyet.lyDoChan[0].ma, 'CHAN_TOAN_BO');
});

test('4.1 mô hình bộ 1 không chứa giá bán, giá trị tồn, mô tả nhật ký, tên hàng hay tên đơn vị của báo cáo', () => {
  const nd = JSON.stringify(mo());
  for (const cam of ['1234567', '999999', 'Kiểm kho mẫu', 'Hỗ trợ vận hành mẫu', 'Thiết bị mẫu', 'Giấy mẫu', 'CÔNG TY GIẢ', 'Không phát sinh']) {
    assert.equal(nd.includes(cam), false, `mô hình lộ "${cam}"`);
  }
  assert.ok(nd.includes('SP-001'), 'mã hàng được hiển thị theo prototype');
});

test('4.1 mô hình chỉ có các khoá dự kiến ở cấp trên cùng (không bảng thô)', () => {
  const khoa = Object.keys(mo()).sort();
  assert.deepEqual(khoa, ['bang', 'canhBao', 'chiaSe', 'daGhiKetQua', 'daTinh', 'doiSoat', 'duyet', 'khuVuc', 'kyGoiY', 'lichSu', 'loi', 'nhan', 'nhom', 'quy',
    'tabs', 'thang', 'thanhVien', 'thoiDiem', 'tong', 'trangThaiDuLieu', 'trangThaiKy']);
});

// ---------------------------------------------------------------- tình trạng tab
test('4.1 tình trạng tab: có dữ liệu, trống (chỉ tiêu đề), thiếu tab', () => {
  const t = tabs();
  t.XacNhanBaoCao = [['Khu vực', 'Xác nhận']];
  delete t.CH_ChiSo;
  const tt = plain(c.tinhTrangTab(t, [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }, { ma: 'HCM', tabBaoCao: 'KiemKe_HCM' }]));
  const lay = (ten) => tt.find((x) => x.ten === ten);
  assert.equal(lay('CH_ThanhVien').trangThai, 'coDuLieu');
  assert.equal(lay('CH_ThanhVien').soDong, 7);
  assert.equal(lay('XacNhanBaoCao').trangThai, 'trong');
  assert.equal(lay('CH_ChiSo').trangThai, 'thieu');
  assert.equal(lay('KiemKe_HN').nhom, 'Báo cáo kiểm kê');
  assert.equal(lay('CH_Bac').nhom, 'Cấu hình');
  assert.equal(lay('Ky').nhom, 'Nhập tay mỗi kỳ');
  assert.equal(tt.length, 11 + 5 + 2);
});

test('4.1 tình trạng tab không đưa nội dung ô vào mô hình', () => {
  const nd = JSON.stringify(c.tinhTrangTab(tabs(), [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }]));
  assert.equal(nd.includes('Nhân viên'), false);
  assert.equal(nd.includes('nva1'), false);
});

// ---------------------------------------------------------------- lịch sử
test('4.1 lịch sử: chỉ dòng mới nhất của kỳ đang Đã chốt mới mở lại được', () => {
  const m = mo('bo1', null, [dongCM('2026-08', 'Đã chốt'), dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại', { lyDo: 'x' }), dongCM('2026-09', 'Đã chốt')]);
  const ls = m.lichSu;
  assert.equal(ls.length, 4);
  assert.deepEqual(ls.map((x) => x.coTheMoLai), [true, false, false, true]);
  assert.equal(ls[3].hieuLuc, 'Đã chốt');
});

test('4.1 lịch sử: kỳ đã mở lại thì không còn nút mở lại', () => {
  const ls = mo('bo1', null, [dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại')]).lichSu;
  assert.deepEqual(ls.map((x) => x.coTheMoLai), [false, false]);
});

test('4.1 mô hình chưa tính chỉ có thông tin nền', () => {
  const m = plain(c.taoMoHinhChuaTinh({ chiaSe: CHIA_SE_ON, tabs: [], chiMuc: [], thang: '2026-09' }));
  assert.equal(m.daTinh, false);
  assert.equal(m.thanhVien, undefined);
  assert.deepEqual(m.lichSu, []);
});

// ---------------------------------------------------------------- tên tab được mở
test('4.1 tên tab được mở: tab của ứng dụng và tab báo cáo khai báo; từ chối mọi tên khác', () => {
  const kv = [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }];
  for (const ten of ['CH_Bac', 'ky', 'KetQua', 'GiaiThich', 'NhatKyHeThong', 'KyDaChot', 'KiemKe_HN', 'kiemke_hn']) assert.equal(c.tenTabDuocMo(ten, kv, []), true, ten);
  for (const ten of ['Sheet1', '', null, undefined, 123, 'KiemKe_HCM', '../x', 'Chot_2026-09', 'CH_Bac; DROP']) assert.equal(c.tenTabDuocMo(ten, kv, []), false, String(ten));
  assert.equal(c.tenTabDuocMo('  CH_Bac  ', kv, []), true, 'khoảng trắng thừa được bỏ qua như mọi chỗ so khớp tên khác');
});

test('4.1 tab bản sao chỉ mở được khi đang tồn tại', () => {
  assert.equal(c.tenTabDuocMo('Chot_2026-09', [], ['Chot_2026-09']), true);
  assert.equal(c.tenTabDuocMo('Chot_2026-09', [], ['KetQua']), false);
  assert.equal(c.tenTabDuocMo('Chot_2026-09_cu1', [], ['Chot_2026-09_cu1']), true);
});

test('4.1 danh sách hàm máy chủ được phép gọi là cố định', () => {
  assert.deepEqual([...c.HAM_MAY_CHU_GIAO_DIEN], ['giaoDienLayMoHinh', 'giaoDienTinh', 'giaoDienDuyet', 'giaoDienMoLai', 'giaoDienLichSu', 'giaoDienMoTab',
    'giaoDienDocBang', 'giaoDienLuuBang', 'giaoDienKhoiPhucMacDinh', 'giaoDienDatKy', 'giaoDienNhapBaoCao']);
  assert.equal(c.HAM_MAY_CHU_GIAO_DIEN.length, 11);
});

// ---------------------------------------------------------------- 9.1 mô hình chi tiết
test('9.1 quỹ theo nguồn khớp tính tay bộ 1 (HN 237,3 và HCM 203,8, bảo hành 300 và 250, hỗ trợ sale 68 và 102, quản lý kho 28)', () => {
  const q = plain(mo().quy);
  const quy = (n, kv) => q[n].find((x) => x.khuVuc === kv).quy;
  assert.equal(quy('xuatBanChuyenKho', 'HN'), 237.3);
  assert.equal(quy('xuatBanChuyenKho', 'HCM'), 203.8);
  assert.equal(quy('baoHanh', 'HN'), 300); assert.equal(quy('baoHanh', 'HCM'), 250);
  assert.equal(quy('hoTroSale', 'HN'), 68); assert.equal(quy('hoTroSale', 'HCM'), 102);
  assert.equal(q.quanLyKho.tong, 28);
  const dong = q.xuatBanChuyenKho.find((x) => x.khuVuc === 'HN').dong[0];
  assert.deepEqual(Object.keys(dong).sort(), ['banRa', 'chuyenKho', 'ma', 'nhom', 'point', 'pointChuyenKho', 'pointXuatBan']);
});

test('9.1 mỗi người có chip, phân rã point theo nguồn, key metrics và các bước giải thích', () => {
  const m = plain(mo());
  const a = m.thanhVien.find((x) => x.taiKhoan === 'nva1');
  assert.equal(a.khuVuc, 'HN');
  assert.deepEqual(a.chipPoint, { trangThai: 'du', thieu: [] });
  assert.deepEqual(a.chipKM, { trangThai: 'du', thieu: [] });
  const xb = a.nguon.find((n) => n.khoa === 'xuatBanChuyenKho');
  assert.deepEqual(xb.chiTiet[0], { khuVuc: 'HN', quy: 237.3, heSo: 0.4, point: 94.92 });
  assert.equal(a.nguon.find((n) => n.khoa === 'baoHanh').point, 150);
  assert.equal(a.keyMetrics.chiTiet.length, 3);
  const bh = a.keyMetrics.chiTiet.find((x) => x.chiSo === 'tyLeBaoHanh');
  assert.equal(bh.ten, 'Tỷ lệ bảo hành'); assert.equal(bh.kieu, 'thapTot'); assert.equal(bh.phanTramHT, 1);
  assert.ok(a.giaiThich.some((b) => /237,3 × hệ số 0,4 = 94,92 point/.test(b)), a.giaiThich.join('\n'));
  assert.ok(a.giaiThich[a.giaiThich.length - 1].includes('9.800.000'));
  const kho = m.thanhVien.find((x) => x.taiKhoan === 'nvc3');
  assert.deepEqual(kho.nguon.find((n) => n.khoa === 'quanLyKho').chiTiet.map((d) => [d.loai, d.soLuong, d.point]),
    [['Kiểm kho', 20, 10], ['Đầu mối 360', 4, 4], ['Quản lý sale admin tỉnh', 8, 3]]);
});

test('9.1 người chỉ theo dõi point và người thiếu dữ liệu có bước giải thích đúng', () => {
  const m = plain(mo('bo1', (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); }));
  const theoDoi = m.thanhVien.find((x) => x.trangThai === 'khongTinh');
  assert.match(theoDoi.giaiThich[0], /chỉ theo dõi point/);
  const thieu = m.thanhVien.find((x) => x.taiKhoan === 'nva1');
  assert.notEqual(thieu.chipKM.trangThai, 'du');
  assert.ok(thieu.chipKM.thieu.includes('tyLeBaoHanh'), JSON.stringify(thieu.chipKM));
  assert.match(thieu.giaiThich[0], /Chưa tính được/);
});

test('9.1 số theo kiểu Việt Nam và dải kỳ gợi ý', () => {
  assert.equal(c.chuoiSoVi(9800000, 0), '9.800.000');
  assert.equal(c.chuoiSoVi(237.3, 2), '237,3');
  assert.equal(c.chuoiSoVi(-1234.5, 2), '-1.234,5');
  assert.equal(c.chuoiSoVi(0.35 * 100, 1), '35');
  assert.equal(c.chuoiPhanTram(0.35), '35%');
  const ky = plain(c.danhSachKyGoiY('2026-01'));
  assert.equal(ky.length, 13); assert.equal(ky[0], '2025-07'); assert.equal(ky[6], '2026-01'); assert.equal(ky[12], '2026-07');
  assert.deepEqual(plain(c.danhSachKyGoiY('xx')), []);
});

test('9.2 tình trạng tab có khoá bảng sửa được và danh sách bảng cho giao diện', () => {
  const m = plain(c.taoMoHinhChuaTinh({ chiaSe: { mucDo: 'on', ma: '', thongDiep: '' }, tabs: c.tinhTrangTab(tabs(), [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }]), chiMuc: [], thang: '2026-09', daGhiKetQua: true }));
  assert.equal(m.daGhiKetQua, true);
  assert.equal(m.tabs.find((t) => t.ten === 'CH_Bac').khoa, 'bac');
  assert.equal(m.tabs.find((t) => t.ten === 'KiemKe_HN').khoa, null);
  assert.equal(m.tabs.find((t) => t.ten === 'Ky').khoa, null);
  assert.equal(m.bang.length, 15);
  assert.deepEqual(m.bang.filter((b) => b.coMacDinh).map((b) => b.khoa).sort(), ['bac', 'bacThang', 'chiSo', 'thamSo']);
});
