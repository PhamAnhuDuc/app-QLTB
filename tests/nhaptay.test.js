'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');

const c = nap();
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const maLoi = (r) => [...r.loi].map((l) => l.ma);

// ---------------------------------------------------------------- 4.1 kỳ từ ô tháng
test('4.1 tháng 2 năm nhuận: 2028-02 → 01 đến 29', () => {
  const t = tabs(); t.Ky[1][1] = '2028-02';
  const r = c.docKy(t);
  assert.deepEqual(plain(r.ky), { thang: '2028-02', tuNgay: '2028-02-01', denNgay: '2028-02-29' });
});

test('4.1 tháng 2 năm thường và tháng 12', () => {
  const t = tabs(); t.Ky[1][1] = '2026-02';
  assert.equal(c.docKy(t).ky.denNgay, '2026-02-28');
  t.Ky[1][1] = '2026-12';
  assert.equal(c.docKy(t).ky.denNgay, '2026-12-31');
  t.Ky[1][1] = '2026-9';
  assert.equal(c.docKy(t).ky.tuNgay, '2026-09-01');
});

test('4.1 ô tháng bị Sheet tự đổi thành ngày (Date): lấy năm và tháng của ngày đó', () => {
  const t = tabs(); t.Ky[1][1] = new Date(2026, 8, 1); // 01/09/2026
  assert.equal(c.docKy(t).ky.thang, '2026-09');
});

test('4.1 chưa chọn tháng hoặc sai dạng: từ chối, nêu ô cần sửa và chặn toàn bộ', () => {
  for (const sai of ['', null, 'tháng chín', '2026-13', '2026/09', '09-2026', 202609]) {
    const t = tabs(); t.Ky[1][1] = sai;
    const r = c.docKy(t);
    assert.equal(r.ky, null, String(sai));
    assert.equal(r.loi[0].chan, 'toanBo');
    assert.ok(r.loi[0].thongDiep.includes('tab Ky'));
  }
});

test('4.1 không có dòng "Tháng" trong tab Ky', () => {
  const t = tabs(); t.Ky = [['Mục', 'Giá trị']];
  assert.equal(c.docKy(t).loi[0].ma, 'KY_THIEU');
});

test('4.1 người dùng không thể nhập ngày bắt đầu/kết thúc: ngày luôn suy ra từ tháng', () => {
  const t = tabs(); t.Ky.push(['Từ ngày', '2026-09-05']);
  const r = c.docKy(t);
  assert.equal(r.ky.tuNgay, '2026-09-01');
});

// ---------------------------------------------------------------- 4.2 bảo hành và hỗ trợ sale
test('4.2 ô trống khác 0: hỗ trợ sale trống là chưa có, bảo hành 0 là đã nhập 0', () => {
  const t = tabs();
  t.BaoHanh_HoTroSale = [['Khu vực', 'Số ca bảo hành', 'Số đơn hỗ trợ sale'], ['HN', 0, ''], ['HCM', 250, 600]];
  const r = c.docBaoHanhHoTroSale(t, ['HN', 'HCM']);
  assert.equal(r.loi.length, 0);
  assert.equal(r.baoHanh.HN, 0);
  assert.equal('HN' in r.hoTroSale, false);
  assert.equal(r.hoTroSale.HCM, 600);
});

test('4.2 khu vực không có trong cấu hình: lỗi nêu khu vực và dòng', () => {
  const t = tabs();
  t.BaoHanh_HoTroSale.push(['MienTrung', 5, 5]);
  const r = c.docBaoHanhHoTroSale(t, ['HN', 'HCM']);
  const l = [...r.loi].find((x) => x.ma === 'KHU_VUC_LA');
  assert.ok(l.thongDiep.includes('MienTrung') && l.thongDiep.includes('dòng 4'));
});

test('4.2 số không hợp lệ: lỗi nêu tab, dòng, cột; không đổi thành 0, giữ thô cho lõi chặn', () => {
  const t = tabs();
  t.BaoHanh_HoTroSale[1][1] = 'nhiều';
  t.BaoHanh_HoTroSale[2][1] = -3;
  const r = c.docBaoHanhHoTroSale(t, ['HN', 'HCM']);
  assert.equal([...r.loi].filter((l) => l.ma === 'SO_LUONG_SAI').length, 2);
  assert.ok(r.loi[0].thongDiep.includes('BaoHanh_HoTroSale') && r.loi[0].thongDiep.includes('Số ca bảo hành'));
  assert.equal(r.baoHanh.HN, 'nhiều');
  assert.equal(r.baoHanh.HCM, -3);
});

test('4.2 khu vực viết khác hoa/thường vẫn khớp; khai báo trùng bị báo', () => {
  const t = tabs();
  t.BaoHanh_HoTroSale = [['Khu vực', 'Số ca bảo hành', 'Số đơn hỗ trợ sale'], ['hn', 1, 2], ['HN', 3, 4]];
  const r = c.docBaoHanhHoTroSale(t, ['HN', 'HCM']);
  assert.equal(r.baoHanh.HN, 1);
  assert.ok(maLoi(r).includes('KHU_VUC_TRUNG'));
});

// ---------------------------------------------------------------- 4.3 nhật ký công việc
test('4.3 đọc nhật ký bộ 1: giữ số lượng 0, bỏ mô tả', () => {
  const r = c.docNhatKyCongViec(tabs());
  assert.equal(r.loi.length, 0);
  assert.equal(r.nhatKy.length, 9);
  assert.deepEqual(plain(r.nhatKy[0]), { taiKhoan: 'nva1', loai: 'Đầu mối 360', soLuong: 0 });
  assert.equal(JSON.stringify(r.nhatKy).includes('Kiểm kho mẫu'), false, 'mô tả không đi vào dữ liệu kỳ');
});

test('4.3 dòng thiếu một phần (thiếu loại việc): lỗi nêu tab và dòng, dòng vẫn chuyển cho lõi', () => {
  const t = tabs();
  t.NhatKyCongViec.push(['nva1', '', 'quên chọn loại', 5]);
  const r = c.docNhatKyCongViec(t);
  const l = [...r.loi].find((x) => x.ma === 'NHAT_KY_THIEU');
  assert.ok(l.thongDiep.includes('NhatKyCongViec') && l.thongDiep.includes('dòng 11') && l.thongDiep.includes('Loại việc'));
  assert.equal(r.nhatKy.length, 10, 'dòng không bị bỏ âm thầm');
  assert.equal(r.nhatKy.at(-1).loai, '');
});

test('4.3 dòng trống hoàn toàn được bỏ qua không báo lỗi', () => {
  const t = tabs();
  t.NhatKyCongViec.splice(3, 0, ['', '', '', '']);
  const r = c.docNhatKyCongViec(t);
  assert.equal(r.loi.length, 0);
  assert.equal(r.nhatKy.length, 9);
});

test('4.3 số lượng 0 là có số liệu; số lượng trống hoặc chữ hoặc âm là lỗi', () => {
  const t = tabs();
  t.NhatKyCongViec.push(['nva1', 'Kiểm kho', '', 0], ['nva1', 'Kiểm kho', '', ''], ['nva1', 'Kiểm kho', '', 'mười'], ['nva1', 'Kiểm kho', '', -1]);
  const r = c.docNhatKyCongViec(t);
  assert.equal(r.loi.length, 3);
  assert.equal(r.nhatKy[9].soLuong, 0);
});

test('4.3 viTri ghi lại số dòng trong Sheet của từng dòng nhật ký', () => {
  const r = c.docNhatKyCongViec(tabs());
  assert.deepEqual([...r.viTri], [2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('4.3 giá trị thô lỗi được chuyển cho lõi, lõi chặn đúng người và không trùng thông báo', () => {
  const t = tabs();
  t.NhatKyCongViec[3][3] = 'mười'; // nvc3, Kiểm kho
  const d = c.lapDuLieuKy(t, c.docCauHinh(t).cauHinh);
  const kq = c.tinhKy(c.docCauHinh(t).cauHinh, d.duLieuKy);
  const nvc3 = [...kq.thanhVien].find((r) => r.taiKhoan === 'nvc3');
  assert.equal(nvc3.trangThai, 'chuaTinh');
  assert.equal(nvc3.thuNhap, null);
});

// ---------------------------------------------------------------- 4.4 key metrics
test('4.4 đọc bảng key metrics bộ 1 khớp ky.json (cấp độ tiếng Việt → mã)', () => {
  const r = c.docKeyMetrics(tabs(), ['vongQuayHTK', 'tyLeBaoHanh', 'tyLeHaiLong', 'doanhThu']);
  assert.equal(r.loi.length, 0);
  assert.deepEqual(plain(r.keyMetrics), docFixture('bo1', 'ky.json').keyMetrics);
});

test('4.4 cấp độ không hợp lệ: lỗi nêu dòng và liệt kê ba cấp độ hợp lệ', () => {
  const t = tabs();
  t.KeyMetrics.push(['doanhThu', 'phòng ban', 'X', 1, 1]);
  const r = c.docKeyMetrics(t);
  const l = [...r.loi].find((x) => x.ma === 'CAP_DO_SAI');
  assert.ok(l.thongDiep.includes('dòng 9') && l.thongDiep.includes('Nhóm') && l.thongDiep.includes('Khu vực') && l.thongDiep.includes('Tài khoản'));
});

test('4.4 khai báo trùng: lỗi nêu cả hai dòng, không chọn bừa (bỏ cả hai)', () => {
  const t = tabs();
  t.KeyMetrics.push(['tyLeBaoHanh', 'Khu vực', 'HN', 0.04, 0.05]);
  const r = c.docKeyMetrics(t);
  const l = [...r.loi].find((x) => x.ma === 'KEY_METRICS_TRUNG');
  assert.deepEqual([...l.chiTiet.dong], [4, 9]);
  assert.equal(r.keyMetrics.some((k) => k.chiSo === 'tyLeBaoHanh' && k.khoa === 'HN'), false);
});

test('4.4 kết quả để trống được giữ là trống', () => {
  const t = tabs();
  t.KeyMetrics[3][4] = '';
  const r = c.docKeyMetrics(t);
  assert.equal(r.loi.length, 0);
  const k = r.keyMetrics.find((x) => x.chiSo === 'tyLeBaoHanh' && x.khoa === 'HN');
  assert.equal(k.ketQua, null);
  assert.equal(k.mucTieu, 0.033);
});

test('4.4 kết quả chứa chữ: lỗi nêu dòng và cột; giá trị thô giữ cho lõi', () => {
  const t = tabs();
  t.KeyMetrics[1][4] = 'khoảng 2 tỷ';
  const r = c.docKeyMetrics(t);
  const l = [...r.loi].find((x) => x.ma === 'O_SO_SAI');
  assert.ok(l.thongDiep.includes('dòng 2') && l.thongDiep.includes('Kết quả'));
});

test('4.4 chỉ số không có trong cấu hình chỉ cảnh báo và bị bỏ qua', () => {
  const t = tabs();
  t.KeyMetrics.push(['chiSoLa', 'Nhóm', 'X', 1, 1]);
  const r = c.docKeyMetrics(t, ['vongQuayHTK', 'tyLeBaoHanh', 'tyLeHaiLong', 'doanhThu']);
  assert.equal(r.loi.length, 0);
  assert.equal(r.canhBao[0].ma, 'CHI_SO_LA');
  assert.equal(r.keyMetrics.length, 7);
});

// ---------------------------------------------------------------- 4.5 xác nhận báo cáo một phần
test('4.5 mặc định chưa xác nhận: bảng không có dòng thì không khu vực nào được xác nhận', () => {
  const r = c.docXacNhanBaoCao(tabs(), ['HN', 'HCM']);
  assert.deepEqual(plain(r.xacNhan), {});
});

test('4.5 xác nhận khu vực A thì chỉ A được xác nhận; FALSE là chưa xác nhận', () => {
  const t = tabs();
  t.XacNhanBaoCao.push(['hn', true], ['HCM', false]);
  const r = c.docXacNhanBaoCao(t, ['HN', 'HCM']);
  assert.deepEqual(plain(r.xacNhan), { HN: true });
});

test('4.5 khu vực lạ hoặc ô không phải TRUE/FALSE bị báo lỗi', () => {
  const t = tabs();
  t.XacNhanBaoCao.push(['Lạ', true], ['HN', 'ừ']);
  const r = c.docXacNhanBaoCao(t, ['HN', 'HCM']);
  assert.deepEqual(maLoi(r).sort(), ['KHU_VUC_LA', 'O_LOGIC_SAI']);
});

test('4.5 xác nhận thật sự làm lõi dùng báo cáo chỉ phủ một phần của đúng khu vực đó', () => {
  const t = tabs('bo3');
  const cauHinh = c.docCauHinh(t).cauHinh;
  const truoc = c.lapDuLieuKy(t, cauHinh);
  assert.equal(c.tinhKy(cauHinh, truoc.duLieuKy).quy.xuatBanChuyenKho.hcm.quy, null);
  t.XacNhanBaoCao.push(['HCM', true]);
  const sau = c.lapDuLieuKy(t, cauHinh);
  assert.ok(c.tinhKy(cauHinh, sau.duLieuKy).quy.xuatBanChuyenKho.hcm.quy > 0);
});

// ---------------------------------------------------------------- 4.6 lắp dữ liệu kỳ
test('4.6 nhiều lỗi cùng lúc: số ca bảo hành là chữ và nhật ký thiếu loại việc đều được báo trong một lần đọc', () => {
  const t = tabs();
  t.BaoHanh_HoTroSale[1][1] = 'nhiều';
  t.NhatKyCongViec.push(['nva1', '', '', 5]);
  const r = c.lapDuLieuKy(t, c.docCauHinh(t).cauHinh);
  assert.ok(maLoi(r).includes('SO_LUONG_SAI'));
  assert.ok(maLoi(r).includes('NHAT_KY_THIEU'));
  assert.ok(r.duLieuKy, 'kỳ vẫn xác định được nên lõi vẫn chạy để chặn đúng phần phụ thuộc');
});

test('4.6 lỗi kỳ (chưa chọn tháng) thì không có dữ liệu kỳ', () => {
  const t = tabs(); t.Ky[1][1] = '';
  const r = c.lapDuLieuKy(t, c.docCauHinh(t).cauHinh);
  assert.equal(r.duLieuKy, null);
  assert.ok(maLoi(r).includes('KY_THIEU'));
});

for (const bo of ['bo1', 'bo2']) {
  test(`4.6 vòng: ${bo} → mảng hai chiều → đọc lại → tinhKy giống hệt tính trực tiếp từ JSON`, () => {
    const t = tabs(bo);
    const kt = c.docVaKiemTraCauHinh(t);
    const d = c.lapDuLieuKy(t, kt.cauHinh);
    assert.equal(d.loi.length, 0, JSON.stringify(plain(d.loi)));
    const tuSheet = c.tinhKy(kt.cauHinh, d.duLieuKy);
    const tuJson = c.tinhKy(docFixture(bo, 'config.json'), docFixture(bo, 'ky.json'));
    const tomTat = (kq) => plain([...kq.thanhVien].map((r) => [r.taiKhoan, r.trangThai, r.pointTong, r.diemKM, r.phanTramThuong, r.thuNhap]));
    assert.deepEqual(tomTat(tuSheet), tomTat(tuJson));
    assert.equal(tuSheet.tong.team.thuNhap, tuJson.tong.team.thuNhap);
    assert.equal(tuSheet.kyDuDuLieu, tuJson.kyDuDuLieu);
  });
}

test('4.6 dữ liệu kỳ đọc từ bộ 1 khớp ky.json ở các phần chính', () => {
  const t = tabs();
  const d = c.lapDuLieuKy(t, c.docCauHinh(t).cauHinh).duLieuKy;
  const g = docFixture('bo1', 'ky.json');
  assert.deepEqual(plain(d.ky), g.ky);
  assert.deepEqual(plain(d.baoHanh), g.baoHanh);
  assert.deepEqual(plain(d.hoTroSale), g.hoTroSale);
  assert.deepEqual(plain(d.keyMetrics), g.keyMetrics);
  assert.deepEqual(plain(d.nhatKy).map((x) => [x.taiKhoan, x.loai, x.soLuong]), g.nhatKy.map((x) => [x.taiKhoan, x.loai, x.soLuong]));
});

test('4.6 bộ 3: người nào bị lỗi thì chưa tính, không bị bịa số', () => {
  const t = tabs('bo3');
  const kt = c.docVaKiemTraCauHinh(t);
  const d = c.lapDuLieuKy(t, kt.cauHinh);
  const kq = c.tinhKy(kt.cauHinh, d.duLieuKy);
  assert.equal(kq.kyDuDuLieu, false);
  for (const r of kq.thanhVien) if (r.trangThai !== 'daTinh') assert.equal(r.thuNhap, null);
  assert.ok(maLoi(d).includes('SO_LUONG_SAI'));
});
