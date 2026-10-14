'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');

const c = nap();
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const maLoi = (kq) => [...kq.loi].map((l) => l.ma);
const plain = (x) => JSON.parse(JSON.stringify(x));

// ---------------------------------------------------------------- 3.1 đọc theo tiêu đề
test('3.1 đủ các tab: đọc ra cấu hình không lỗi', () => {
  const kq = c.docVaKiemTraCauHinh(tabs());
  assert.deepEqual(maLoi(kq), []);
  assert.equal(kq.chanToanBo, false);
});

test('3.1 đổi thứ tự cột trong tab bảng bậc vẫn đọc đúng giá trị', () => {
  const t = tabs();
  t.CH_Bac = t.CH_Bac.map((d) => [d[3], d[2], d[1], d[0]]); // đảo ngược thứ tự cột
  const kq = c.docCauHinh(t);
  assert.equal(kq.loi.length, 0);
  assert.deepEqual(plain(kq.cauHinh.bac[3]), { bac: 4, luongCoDinh: 10000000, min: 250, max: 300 });
});

test('3.1 thiếu cột: báo lỗi nêu tab và tên cột, chặn toàn bộ', () => {
  const t = tabs();
  t.CH_Bac = t.CH_Bac.map((d) => [d[0], d[2], d[3]]); // bỏ cột "Lương cố định"
  const kq = c.docVaKiemTraCauHinh(t);
  const l = [...kq.loi].find((x) => x.ma === 'THIEU_COT');
  assert.ok(l.thongDiep.includes('CH_Bac') && l.thongDiep.includes('Lương cố định'));
  assert.equal(l.chiTiet.cot, 'Lương cố định');
  assert.equal(kq.chanToanBo, true);
});

test('3.1 thiếu một tab cấu hình: nêu tên tab và từ chối tính', () => {
  const t = tabs();
  delete t.CH_HeSoChia;
  const kq = c.docVaKiemTraCauHinh(t);
  const l = [...kq.loi].find((x) => x.ma === 'THIEU_TAB');
  assert.ok(l.thongDiep.includes('CH_HeSoChia'));
  assert.equal(kq.chanToanBo, true);
});

test('3.1 tiêu đề viết khác hoa/thường vẫn nhận', () => {
  const t = tabs();
  t.CH_Bac[0] = ['BẬC', ' lương  cố định', 'min', 'MAX'];
  assert.equal(c.docCauHinh(t).loi.length, 0);
});

// ---------------------------------------------------------------- 3.2 kiểu giá trị
test('3.2 ô đơn giá point chứa chữ: lỗi nêu tab tham số, dòng và tên tham số', () => {
  const t = tabs();
  const dong = t.CH_ThamSo.findIndex((d) => d[0] === 'donGiaPoint');
  t.CH_ThamSo[dong][1] = 'năm mươi nghìn';
  const kq = c.docVaKiemTraCauHinh(t);
  const l = [...kq.loi].find((x) => x.ma === 'O_SO_SAI');
  assert.ok(l.thongDiep.includes('CH_ThamSo') && l.thongDiep.includes(`dòng ${dong + 1}`) && l.thongDiep.includes('donGiaPoint'));
  assert.equal(kq.chanToanBo, true);
});

test('3.2 chuỗi số "50000" không được đoán thành số', () => {
  const t = tabs();
  t.CH_ThamSo[t.CH_ThamSo.findIndex((d) => d[0] === 'donGiaPoint')][1] = '50000';
  assert.ok(maLoi(c.docVaKiemTraCauHinh(t)).includes('O_SO_SAI'));
});

test('3.2 ghi đè lương cố định để trống nghĩa là không ghi đè', () => {
  const kq = c.docCauHinh(tabs());
  const tv = (tk) => kq.cauHinh.thanhVien.find((m) => m.taiKhoan === tk);
  assert.equal(tv('nva1').luongCoDinhGhiDe, null);
  assert.equal(tv('nve5').luongCoDinhGhiDe, 10800000);
});

test('3.2 ghi đè lương cố định chứa chữ là lỗi, không phải "không ghi đè"', () => {
  const t = tabs();
  t.CH_ThanhVien[1][6] = 'mười triệu';
  assert.ok(maLoi(c.docCauHinh(t)).includes('O_SO_SAI'));
});

test('3.2 cờ máy tính cá nhân: TRUE nhận phụ cấp, FALSE không; ô trống hoặc chữ là lỗi', () => {
  const kq = c.docCauHinh(tabs());
  assert.equal(kq.cauHinh.thanhVien.find((m) => m.taiKhoan === 'nva1').mayCaNhan, true);
  assert.equal(kq.cauHinh.thanhVien.find((m) => m.taiKhoan === 'nvg7').mayCaNhan, false);
  const t = tabs();
  t.CH_ThanhVien[1][5] = '';
  t.CH_ThanhVien[2][5] = 'có';
  assert.equal([...c.docCauHinh(t).loi].filter((l) => l.ma === 'O_LOGIC_SAI').length, 2);
  const t2 = tabs();
  t2.CH_ThanhVien[1][5] = 'true'; // chuỗi TRUE/FALSE (không phân biệt hoa/thường) vẫn nhận
  assert.equal(c.docCauHinh(t2).loi.length, 0);
});

test('3.2 phần trăm là số thập phân: 0,25 nhận đúng', () => {
  const kq = c.docCauHinh(tabs());
  assert.equal(kq.cauHinh.bacThangThuong[3].phanTram, 0.25);
  assert.equal(kq.cauHinh.bacThangThuong[4].den, null, 'ô "Đến" của khoảng cuối trống là không có cận trên');
});

test('3.2 nhãn tiếng Việt cho kiểu chỉ số và nguồn hệ số; nhãn sai bị báo', () => {
  const t = tabs();
  t.CH_ChiSo[1][2] = 'thấp tốt';
  t.CH_HeSoChia[1][0] = 'Bảo hành';
  assert.equal(c.docCauHinh(t).loi.length, 0);
  const t2 = tabs();
  t2.CH_ChiSo[1][2] = 'vui vẻ';
  assert.ok(maLoi(c.docCauHinh(t2)).includes('O_NHAN_SAI'));
});

test('3.2 tham số lạ chỉ cảnh báo; tham số bắt buộc trống thì lõi báo thiếu có kèm tab và dòng', () => {
  const t = tabs();
  t.CH_ThamSo.push(['thamSoLa', 1]);
  const kq1 = c.docVaKiemTraCauHinh(t);
  assert.ok([...kq1.canhBao].some((x) => x.ma === 'THAM_SO_LA'));
  assert.equal(kq1.loi.length, 0);
  const t2 = tabs();
  const dong = t2.CH_ThamSo.findIndex((d) => d[0] === 'phuCap');
  t2.CH_ThamSo[dong][1] = '';
  const kq2 = c.docVaKiemTraCauHinh(t2);
  const l = [...kq2.loi].find((x) => x.ma === 'THIEU_THAM_SO');
  assert.ok(l.thongDiep.includes('CH_ThamSo') && l.thongDiep.includes(`dòng ${dong + 1}`));
});

// ---------------------------------------------------------------- 3.3 đọc đủ thành cấu hình lõi
for (const bo of ['bo1', 'bo2']) {
  test(`3.3 ${bo}: đọc từ Sheet cho cấu hình tương đương ${bo}/config.json`, () => {
    const goc = docFixture(bo, 'config.json');
    const kq = c.docVaKiemTraCauHinh(tabs(bo));
    assert.equal(kq.loi.length, 0);
    const doc = plain(kq.cauHinh);
    for (const k of ['bac', 'bacThangThuong', 'chiSo', 'nhomThietBi', 'maHang', 'viecQuanLyKho', 'heSoChia', 'thanhVien']) {
      assert.deepEqual(doc[k], goc[k], `${bo}.${k} lệch`);
    }
    for (const k of Object.keys(goc.thamSo)) assert.equal(doc.thamSo[k], goc.thamSo[k], `${bo}.thamSo.${k}`);
    assert.equal(doc.thamSo.tenTabKetQua, 'KetQua');
  });
}

test('3.3 khu vực và tab báo cáo được đọc từ CH_KhuVuc', () => {
  const kq = c.docCauHinh(tabs());
  assert.deepEqual(plain(kq.cauHinh.khuVuc), [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }, { ma: 'HCM', tabBaoCao: 'KiemKe_HCM' }]);
});

test('3.3 hệ số chia không bằng 1: lỗi nêu tab, dòng, khu vực, tổng; chỉ chặn đúng nguồn', () => {
  const kq = c.docVaKiemTraCauHinh(tabs('bo3'));
  const l = [...kq.loi].find((x) => x.ma === 'TONG_HE_SO');
  assert.ok(l.thongDiep.includes('CH_HeSoChia') && l.thongDiep.includes('hcm') && l.thongDiep.includes('0.9'));
  assert.ok(l.chiTiet.dong.length >= 1);
  assert.equal(l.chan, 'nguon:baoHanh:hcm');
  assert.equal(kq.chanToanBo, false);
});

test('3.3 tỷ trọng thành viên không bằng 100%: lỗi gắn tab CH_TyTrong và dòng của người đó, chặn riêng người đó', () => {
  const kq = c.docVaKiemTraCauHinh(tabs('bo3'));
  const l = [...kq.loi].find((x) => x.ma === 'TONG_TY_TRONG');
  assert.ok(l.thongDiep.includes('CH_TyTrong'));
  assert.equal(l.chiTiet.taiKhoan, 'nvb2');
  assert.equal(l.chiTiet.tab, 'CH_TyTrong');
  assert.equal(l.chan, 'km:nvb2');
  assert.equal(l.chiTiet.dong.length, 3);
});

test('3.3 tài khoản trùng: nêu hai dòng bị trùng và chặn toàn bộ', () => {
  const t = tabs();
  t.CH_ThanhVien.push([...t.CH_ThanhVien[1]]); // sao chép dòng nva1
  const kq = c.docVaKiemTraCauHinh(t);
  const l = [...kq.loi].find((x) => x.ma === 'TAI_KHOAN_TRUNG');
  assert.ok(l.thongDiep.includes('CH_ThanhVien'));
  assert.deepEqual([...l.chiTiet.dong], [2, t.CH_ThanhVien.length]);
  assert.equal(kq.chanToanBo, true);
});

test('3.3 min lớn hơn max: lỗi nêu tab CH_Bac và dòng của bậc đó', () => {
  const t = tabs();
  t.CH_Bac[2][2] = 999; // bậc 2: min 999 > max
  const l = [...c.docVaKiemTraCauHinh(t).loi].find((x) => x.ma === 'BAC_MIN_MAX');
  assert.ok(l.thongDiep.includes('CH_Bac') && l.thongDiep.includes('dòng 3'));
});

test('3.3 tỷ trọng thuộc tài khoản không có trong thành viên bị báo lỗi', () => {
  const t = tabs();
  t.CH_TyTrong.push(['khongco', 'doanhThu', 1]);
  assert.ok(maLoi(c.docVaKiemTraCauHinh(t)).includes('TY_TRONG_TAI_KHOAN_LA'));
});

test('3.3 kết quả đọc rồi tính cho thu nhập giống tính từ JSON gốc', () => {
  const kq = c.docVaKiemTraCauHinh(tabs());
  const ky = docFixture('bo1', 'ky.json');
  const tuSheet = c.tinhKy(kq.cauHinh, ky);
  const tuJson = c.tinhKy(docFixture('bo1', 'config.json'), ky);
  assert.deepEqual([...tuSheet.thanhVien].map((r) => r.thuNhap), [...tuJson.thanhVien].map((r) => r.thuNhap));
  assert.equal(tuSheet.tong.team.thuNhap, 75838000);
});

// ---------------------------------------------------------------- 3.4 khung mặc định
test('3.4 sheet mới: tạo mọi tab với giá trị mặc định, chưa có thành viên', () => {
  const r = c.laKhungCanTao([]);
  const can = plain(r.tabCanTao);
  assert.equal(r.tabDaCo.length, 0);
  assert.ok(can.CH_ThamSo && can.CH_Bac && can.CH_BacThang && can.CH_ChiSo && can.CH_ThanhVien);
  assert.equal(can.CH_ThanhVien.length, 1, 'khung thành viên chỉ có dòng tiêu đề');
  assert.deepEqual(can.CH_ThanhVien[0], ['Tài khoản', 'Tên', 'Bậc', 'Khu vực', 'Nhóm', 'Máy tính cá nhân', 'Ghi đè lương cố định']);
  const ts = Object.fromEntries(can.CH_ThamSo.slice(1));
  assert.equal(ts.donGiaPoint, 50000);
  assert.equal(ts.phuCap, 200000);
  assert.equal(ts.heSoHoTroSale, 0.17);
  assert.equal(ts.pointMoiCaBaoHanh, 1);
  assert.equal(ts.heSoMin, 0.7);
  assert.equal(ts.tranDoanhThu, 1.2);
  assert.equal(ts.saiSoDoiSoat, 0.01);
  assert.equal(can.CH_Bac.length, 6);
  assert.deepEqual(can.CH_Bac[1], [1, 6000000, 120, 150]);
  assert.equal(can.CH_BacThang.length, 6);
});

test('3.4 tab đã có dữ liệu được giữ nguyên, chỉ tạo các tab còn thiếu', () => {
  const r = c.laKhungCanTao(['CH_Bac', 'ch_thamso']);
  assert.deepEqual([...r.tabDaCo].sort(), ['CH_Bac', 'CH_ThamSo']);
  assert.equal(plain(r.tabCanTao).CH_Bac, undefined);
  assert.equal(plain(r.tabCanTao).CH_ThamSo, undefined);
  assert.ok(plain(r.tabCanTao).CH_BacThang);
});

test('3.4 khung mặc định đọc lại hợp lệ (không lỗi) và không có thành viên', () => {
  const khung = plain(c.laKhungCanTao([]).tabCanTao);
  const kq = c.docVaKiemTraCauHinh(khung);
  assert.deepEqual(maLoi(kq), []);
  assert.equal(kq.cauHinh.thanhVien.length, 0);
  assert.equal(kq.cauHinh.thamSo.donGiaPoint, 50000);
  assert.equal(kq.cauHinh.bac.length, 5);
});

test('3.4 khung mặc định gồm cả bảng nhập tay chỉ có tiêu đề', () => {
  const can = plain(c.laKhungCanTao([]).tabCanTao);
  assert.deepEqual(can.NhatKyCongViec, [['Tài khoản', 'Loại việc', 'Mô tả', 'Số lượng']]);
  assert.deepEqual(can.Ky[1], ['Tháng', '']);
});

test('3.4 khung mặc định không chứa tên, tài khoản hay số lương thật', () => {
  const noiDung = JSON.stringify(c.laKhungCanTao([]).tabCanTao);
  assert.equal(/nv[a-z]\d/.test(noiDung), false);
  assert.equal(noiDung.includes('Nhân viên'), false);
});
