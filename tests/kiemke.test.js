'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');

const c = nap();
const tabs = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8'));
const bangHN = () => tabs().KiemKe_HN;
const ma = (mang) => [...mang].map((x) => x.ma);
const doc = (bang, ten = 'KiemKe_HN') => c.docBaoCaoKiemKe(bang, ten);

// ---------------------------------------------------------------- 2.1 nhận diện cột
test('2.1 đọc báo cáo bộ 1: đúng số dòng, mã, số bán và chuyển kho', () => {
  const r = doc(bangHN());
  assert.equal(r.loi.length, 0);
  const nguon = docFixture('bo1', 'ky.json').kiemKe.HN.dong;
  assert.equal(r.baoCao.dong.length, nguon.length);
  r.baoCao.dong.forEach((d, i) => {
    assert.equal(d.ma, nguon[i].ma);
    assert.equal(d.banRa, nguon[i].banRa);
    assert.equal(d.chuyenKho, nguon[i].chuyenKho);
  });
});

test('2.1 cột nằm ở vị trí khác: thêm hai cột phía trước vẫn đọc đúng nhờ tên tiêu đề', () => {
  const dich = bangHN().map((d) => (d.length === 0 ? d : ['x', 'y', ...d]));
  const r = doc(dich);
  assert.equal(r.loi.length, 0);
  assert.deepEqual(ma(r.baoCao.dong), ma(doc(bangHN()).baoCao.dong));
  assert.equal(r.baoCao.dong[0].banRa, 100);
  assert.equal(r.baoCao.dong[0].chuyenKho, 50);
});

test('2.1 đổi thứ tự hai cột số lượng vẫn ghép đúng', () => {
  const bang = bangHN().map((d, i) => {
    if (i >= 7 && d.length >= 9) { const x = [...d]; [x[6], x[8]] = [x[8], x[6]]; return x; } // đổi cột bán ra và chuyển kho
    return d;
  });
  // dòng 7 (chỉ số 6) là tiêu đề tầng 1, bỏ qua; từ dòng tiêu đề tầng 2 trở đi đã đổi chỗ
  const r = doc(bang);
  assert.equal(r.loi.length, 0);
  assert.equal(r.baoCao.dong[0].banRa, 100);
  assert.equal(r.baoCao.dong[0].chuyenKho, 50);
});

test('2.1 tiêu đề hai tầng: "SL bán ra trong kỳ" ở dòng thứ hai dưới nhóm "Xuất trong kỳ"', () => {
  const bang = bangHN();
  assert.equal(bang[6][6], 'Xuất trong kỳ');
  assert.equal(bang[7][6], 'SL bán ra trong kỳ');
  assert.equal(doc(bang).baoCao.dong[1].banRa, 200);
});

test('2.1 tiêu đề viết khác hoa/thường và khoảng trắng vẫn nhận ra', () => {
  const bang = bangHN();
  bang[6][1] = '  MÃ  HÀNG ';
  bang[7][6] = 'sl bán ra  trong kỳ';
  assert.equal(doc(bang).loi.length, 0);
});

test('2.1 thiếu cột bắt buộc: báo lỗi nêu tên cột và tab, không đoán cột khác', () => {
  const bang = bangHN();
  bang[7][8] = 'SL chuyển đi'; // đổi tên "SL chuyển kho"
  const r = doc(bang);
  assert.equal(r.baoCao, null);
  const l = [...r.loi].find((x) => x.ma === 'THIEU_COT');
  assert.ok(l);
  assert.ok(l.thongDiep.includes('SL chuyển kho') && l.thongDiep.includes('KiemKe_HN'));
  assert.equal(l.chiTiet.cot, 'SL chuyển kho');
});

test('2.1 thiếu cả hai cột số lượng: báo lỗi cho từng cột', () => {
  const bang = bangHN();
  bang[7][6] = ''; bang[7][8] = '';
  assert.equal([...doc(bang).loi].filter((x) => x.ma === 'THIEU_COT').length, 2);
});

test('2.1 không có cột "Mã hàng": không nhận ra báo cáo', () => {
  const bang = bangHN();
  bang[6][1] = 'Mã SP';
  const r = doc(bang);
  assert.equal(r.baoCao, null);
  assert.equal(r.loi[0].ma, 'BAO_CAO_KHONG_NHAN_RA');
});

// ---------------------------------------------------------------- 2.2 khoảng ngày
test('2.2 đọc khoảng ngày: "Từ ngày: 01/10/2026 đến ngày: 14/10/2026" → 2026-10-01 đến 2026-10-14', () => {
  const bang = bangHN();
  bang[4][0] = 'Từ ngày: 01/10/2026 đến ngày: 14/10/2026';
  const r = doc(bang);
  assert.equal(r.baoCao.tuNgay, '2026-10-01');
  assert.equal(r.baoCao.denNgay, '2026-10-14');
});

test('2.2 khoảng ngày của bộ 1 (cả tháng 09)', () => {
  const r = doc(bangHN());
  assert.equal(r.baoCao.tuNgay, '2026-09-01');
  assert.equal(r.baoCao.denNgay, '2026-09-30');
});

test('2.2 không có dòng ngày: khoảng ngày để trống, không đoán', () => {
  const bang = bangHN();
  bang[4] = [];
  const r = doc(bang);
  assert.equal(r.baoCao.tuNgay, null);
  assert.equal(r.baoCao.denNgay, null);
  assert.equal(r.loi.length, 0);
  // lõi sẽ cảnh báo BAO_CAO_THIEU_NGAY khi nhận khoảng ngày trống
});

test('2.2 ngày không tồn tại (31/02) bị coi là không hợp lệ, để trống và cảnh báo', () => {
  const bang = bangHN();
  bang[4][0] = 'Từ ngày: 01/02/2026 đến ngày: 31/02/2026';
  const r = doc(bang);
  assert.equal(r.baoCao.tuNgay, null);
  assert.equal(r.baoCao.denNgay, null);
  assert.ok([...r.canhBao].some((x) => x.ma === 'BAO_CAO_NGAY_SAI'));
});

test('2.2 năm nhuận: 29/02/2028 hợp lệ, 29/02/2026 không', () => {
  const a = bangHN(); a[4][0] = 'Từ ngày: 01/02/2028 đến ngày: 29/02/2028';
  assert.equal(doc(a).baoCao.denNgay, '2028-02-29');
  const b = bangHN(); b[4][0] = 'Từ ngày: 01/02/2026 đến ngày: 29/02/2026';
  assert.equal(doc(b).baoCao.denNgay, null);
});

test('2.2 ngày một chữ số vẫn đọc được', () => {
  const bang = bangHN();
  bang[4][0] = 'Từ ngày: 1/9/2026 đến ngày: 9/9/2026';
  const r = doc(bang);
  assert.equal(r.baoCao.tuNgay, '2026-09-01');
  assert.equal(r.baoCao.denNgay, '2026-09-09');
});

// ---------------------------------------------------------------- 2.3 dòng dữ liệu
test('2.3 bỏ dòng "Tổng" và dòng chân bảng, không tin giá trị trong dòng Tổng', () => {
  const bang = bangHN();
  bang[8] = ['Tổng', '', '', '', 9999, 9999, 9999, 9999, 9999, 9999]; // dòng Tổng mang số lạ
  const r = doc(bang);
  assert.equal(r.baoCao.dong.some((d) => d.ma === 'Tổng'), false);
  assert.equal(r.baoCao.dong.length, 7);
  assert.equal(r.baoCao.dong.reduce((s, d) => s + d.banRa, 0), 100 + 200 + 40 + 1000 + 20);
});

test('2.3 dòng thiếu mã vẫn được giữ với mã trống để lõi cảnh báo', () => {
  const r = doc(bangHN());
  const thieuMa = r.baoCao.dong.filter((d) => d.ma === null);
  assert.equal(thieuMa.length, 1);
  assert.ok(thieuMa[0].ten.includes('Demo'));
});

test('2.3 vị trí dòng trong Sheet được ghi lại để báo lỗi đúng chỗ', () => {
  const r = doc(bangHN());
  assert.equal(r.viTriDong.length, r.baoCao.dong.length);
  assert.equal(r.viTriDong[0], 10); // dòng sản phẩm đầu tiên nằm ở dòng 10 của tab
  assert.equal(r.viTriDong.at(-1), 16);
});

test('2.3 chân bảng khớp số dòng thì không cảnh báo', () => {
  const r = doc(bangHN());
  assert.equal([...r.canhBao].some((x) => x.ma === 'BAO_CAO_SO_DONG_LECH'), false);
});

test('2.3 dán thiếu dòng: chân bảng 164 nhưng chỉ đọc 150 → cảnh báo thiếu 14 dòng, vẫn trả dữ liệu đã đọc', () => {
  const bang = bangHN();
  bang[bang.length - 1] = ['Tổng số dòng :164'];
  const dongSp = bang.slice(9, bang.length - 1);
  // dựng bảng 150 dòng sản phẩm bằng cách lặp các dòng mẫu
  const nhieu = [];
  for (let i = 0; i < 150; i++) { const d = [...dongSp[i % dongSp.length]]; d[0] = i + 1; nhieu.push(d); }
  const r = doc([...bang.slice(0, 9), ...nhieu, bang[bang.length - 1]]);
  assert.equal(r.baoCao.dong.length, 150);
  const w = [...r.canhBao].find((x) => x.ma === 'BAO_CAO_SO_DONG_LECH');
  assert.ok(w.thongDiep.includes('thiếu 14 dòng'));
  assert.equal(w.chiTiet.khongDuDuLieu, true);
});

test('2.3 dòng trống xen giữa được bỏ qua', () => {
  const bang = bangHN();
  bang.splice(11, 0, ['', '', '']);
  assert.equal(doc(bang).baoCao.dong.length, 7);
});

// ---------------------------------------------------------------- 2.4 giá trị số, báo cáo rỗng
test('2.4 ô số lượng chứa chữ: lỗi nêu tab, dòng, cột; giá trị thô được giữ để lõi chặn khu vực', () => {
  const bang = bangHN();
  bang[9][6] = 'mười';
  const r = doc(bang);
  const l = [...r.loi].find((x) => x.ma === 'SO_LUONG_SAI');
  assert.ok(l.thongDiep.includes('KiemKe_HN') && l.thongDiep.includes('dòng 10') && l.thongDiep.includes('SL bán ra trong kỳ'));
  assert.equal(l.chiTiet.chiSoDong, 0);
  assert.equal(r.baoCao.dong[0].banRa, 'mười');
});

test('2.4 ô số lượng trống được đọc là 0', () => {
  const bang = bangHN();
  bang[9][8] = '';
  const r = doc(bang);
  assert.equal(r.loi.length, 0);
  assert.equal(r.baoCao.dong[0].chuyenKho, 0);
});

test('2.4 số âm: lỗi nêu dòng', () => {
  const bang = bangHN();
  bang[10][6] = -5;
  const r = doc(bang);
  const l = [...r.loi].find((x) => x.ma === 'SO_LUONG_SAI');
  assert.ok(l.thongDiep.includes('dòng 11'));
  assert.equal(r.baoCao.dong[1].banRa, -5);
});

test('2.4 chuỗi số "123" không được đoán thành số', () => {
  const bang = bangHN();
  bang[9][6] = '123';
  assert.ok([...doc(bang).loi].some((x) => x.ma === 'SO_LUONG_SAI'));
});

test('2.4 báo cáo trống: lỗi, không coi là báo cáo toàn số 0', () => {
  for (const rong of [[], [[], ['', '']], null, undefined]) {
    const r = doc(rong);
    assert.equal(r.baoCao, null);
    assert.equal(r.loi[0].ma, 'BAO_CAO_TRONG');
  }
});

test('2.4 có tiêu đề nhưng không có dòng sản phẩm: lỗi báo cáo trống', () => {
  const r = doc(bangHN().slice(0, 9));
  assert.equal(r.baoCao, null);
  assert.equal(r.loi[0].ma, 'BAO_CAO_TRONG');
});

test('2.4 không nhận ra tiêu đề (tab dán nhầm nội dung khác)', () => {
  const r = doc([['Tuần', 'Doanh thu'], [1, 100], [2, 200]]);
  assert.equal(r.baoCao, null);
  assert.equal(r.loi[0].ma, 'BAO_CAO_KHONG_NHAN_RA');
});

// ---------------------------------------------------------------- 2.5 chỉ giữ trường cần, tab thiếu, khớp bo1
test('2.5 dữ liệu sinh ra chỉ có mã, tên, số bán ra, số chuyển kho; không có giá và giá trị tồn', () => {
  const r = doc(bangHN());
  for (const d of r.baoCao.dong) assert.deepEqual(Object.keys(d).sort(), ['banRa', 'chuyenKho', 'ma', 'ten']);
  const noiDung = JSON.stringify(r.baoCao);
  assert.equal(noiDung.includes('1234567'), false, 'giá bán giả không được mang theo');
  assert.equal(noiDung.includes('999999'), false, 'giá trị tồn giả không được mang theo');
});

test('2.5 tab báo cáo của một khu vực bị thiếu: lỗi nêu tab và khu vực, khu vực khác vẫn đọc được', () => {
  const t = tabs();
  delete t.KiemKe_HCM;
  const r = c.docMoiBaoCao(t, [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }, { ma: 'HCM', tabBaoCao: 'KiemKe_HCM' }]);
  assert.ok(r.kiemKe.HN);
  assert.equal(r.kiemKe.HCM, undefined, 'khu vực thiếu báo cáo là "chưa có", không phải 0 dòng');
  const l = [...r.loi].find((x) => x.ma === 'THIEU_TAB_BAO_CAO');
  assert.ok(l.thongDiep.includes('KiemKe_HCM') && l.thongDiep.includes('HCM'));
});

test('2.5 khu vực lấy từ cấu hình, không từ nội dung báo cáo', () => {
  const t = tabs();
  const r = c.docMoiBaoCao(t, [{ ma: 'KV_A', tabBaoCao: 'KiemKe_HN' }, { ma: 'KV_B', tabBaoCao: 'KiemKe_HCM' }]);
  assert.equal(r.kiemKe.KV_A.dong[0].banRa, 100);
  assert.equal(r.kiemKe.KV_B.dong[0].banRa, 60);
});

test('2.5 đọc hai khu vực bộ 1 cho dữ liệu khớp bo1/ky.json (kể cả khoảng ngày)', () => {
  const t = tabs();
  const ky = docFixture('bo1', 'ky.json');
  const r = c.docMoiBaoCao(t, [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }, { ma: 'HCM', tabBaoCao: 'KiemKe_HCM' }]);
  assert.equal(r.loi.length, 0);
  for (const kv of ['HN', 'HCM']) {
    const nguon = ky.kiemKe[kv];
    assert.equal(r.kiemKe[kv].tuNgay, nguon.tuNgay);
    assert.equal(r.kiemKe[kv].denNgay, nguon.denNgay);
    assert.deepEqual(JSON.parse(JSON.stringify(r.kiemKe[kv].dong)).map((d) => [d.ma, d.banRa, d.chuyenKho]),
      nguon.dong.map((d) => [d.ma, d.banRa, d.chuyenKho]));
  }
});
