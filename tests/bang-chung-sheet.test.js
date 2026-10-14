'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');
const { taoBangChung, BO, THU_MUC_RA } = require('./bang-chung-sheet');

const c = nap();
const bc = taoBangChung();
const docTep = (ten) => JSON.parse(fs.readFileSync(path.join(THU_MUC_RA, ten), 'utf8'));

test('7.2 bằng chứng ba bộ qua Sheet giả đã được lưu và khớp kết quả hiện tại', () => {
  for (const bo of BO) {
    for (const hau of ['dau-vao', 'ket-qua']) {
      const tep = `sheet-${bo.ten}-${hau}.json`;
      assert.ok(fs.existsSync(path.join(THU_MUC_RA, tep)), `thiếu ${tep}; chạy node tests/bang-chung-sheet.js`);
      const hienTai = JSON.parse(JSON.stringify(hau === 'dau-vao' ? bc[bo.ten].dauVao : bc[bo.ten].ketQua));
      assert.deepEqual(docTep(tep), hienTai, `${tep} lệch; chạy lại node tests/bang-chung-sheet.js`);
    }
  }
});

for (const bo of ['bo1', 'bo2']) {
  test(`7.2 ${bo}: thu nhập từng người trong tab Kết quả trùng với tính trực tiếp từ JSON`, () => {
    const kqSheet = bc[bo].ketQua;
    assert.equal(kqSheet.tomTat.kyDuDuLieu, true);
    assert.equal(kqSheet.tabDauVaoKhongDoi, true);
    const truc = c.tinhKy(docFixture(bo, 'config.json'), docFixture(bo, 'ky.json'));
    const theoTen = new Map(kqSheet.KetQua.filter((d) => d[1] && d[2] !== undefined).map((d) => [d[1], d[12]]));
    for (const r of truc.thanhVien) {
      const tren = theoTen.get(r.ten);
      assert.equal(tren, r.thuNhap === null ? '—' : r.thuNhap, `${bo} ${r.ten}`);
    }
    const team = kqSheet.KetQua.find((d) => d[0] === 'Tổng team');
    assert.equal(team[12], truc.tong.team.thuNhap);
  });
}

test('7.2 bộ 3: báo lỗi có tab và dòng, không bịa số, đầu vào không đổi', () => {
  const r = bc.bo3.ketQua;
  assert.equal(r.tabDauVaoKhongDoi, true);
  assert.equal(r.tomTat.kyDuDuLieu, false);
  const loiDong = r.KetQua.filter((d) => /^\[tab /.test(String(d[2])));
  assert.ok(loiDong.length >= 6, 'phần lớn lỗi nêu rõ tab');
  assert.ok(loiDong.some((d) => d[2].includes('tab KiemKe_HN') && d[2].includes('dòng 17')));
  assert.ok(loiDong.some((d) => d[2].includes('tab BaoHanh_HoTroSale') && d[2].includes('dòng 2')));
  assert.ok(loiDong.some((d) => d[2].includes('tab NhatKyCongViec')));
  assert.ok(loiDong.some((d) => d[2].includes('tab CH_HeSoChia')));
  const dongNguoi = r.KetQua.filter((d) => /^Nhân viên /.test(String(d[1])));
  assert.equal(dongNguoi.length, 7);
  for (const d of dongNguoi) if (d[13] !== 'Đã tính') assert.equal(d[12], '—', d[1]);
  const team = r.KetQua.find((d) => d[0] === 'Tổng team');
  assert.equal(team[12], '—');
});

test('7.2 cả ba bộ chỉ ghi ba tab đầu ra', () => {
  for (const bo of BO) assert.deepEqual(bc[bo.ten].ketQua.tabDaGhi, ['GiaiThich', 'KetQua', 'NhatKyHeThong'], bo.ten);
});

test('7.2 nhật ký hệ thống của bằng chứng không chứa tên, tài khoản hay số tiền', () => {
  for (const bo of BO) {
    const tab = bc[bo.ten].dauVao.cacTab;
    const nd = JSON.stringify(bc[bo.ten].ketQua.NhatKyHeThong);
    for (const m of tab.CH_ThanhVien.slice(1)) {
      assert.equal(nd.includes(m[0]), false);
      assert.equal(nd.includes(m[1]), false);
    }
    assert.equal(/\d{5,}/.test(nd.replace(/\d{4}-\d{2}-\d{2} [\d:]+/g, '')), false);
  }
});
