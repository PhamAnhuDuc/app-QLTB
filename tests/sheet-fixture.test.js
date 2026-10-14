'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { taoTatCa, BO, THU_MUC } = require('./sheet-fixture');
const { docFixture } = require('./load-core');

const docTabs = (bo) => JSON.parse(fs.readFileSync(path.join(THU_MUC, `${bo}.tabs.json`), 'utf8'));

test('1.2 fixture Sheet giả đã lưu khớp với bộ dữ liệu nguồn (chạy node tests/sheet-fixture.js nếu lệch)', () => {
  const hienTai = taoTatCa();
  for (const bo of BO) assert.deepEqual(docTabs(bo), JSON.parse(JSON.stringify(hienTai[bo])), `${bo} lệch`);
});

test('1.2 báo cáo kiểm kê giả có đúng cấu trúc báo cáo thật và số dòng khớp bo1', () => {
  const tabs = docTabs('bo1');
  const ky = docFixture('bo1', 'ky.json');
  for (const kv of ['HN', 'HCM']) {
    const bc = tabs[`KiemKe_${kv}`];
    assert.ok(bc[4][0].startsWith('Từ ngày: 01/09/2026 đến ngày: 30/09/2026'));
    assert.equal(bc[6][1], 'Mã hàng');
    assert.equal(bc[6][6], 'Xuất trong kỳ');
    assert.equal(bc[7][6], 'SL bán ra trong kỳ');
    assert.equal(bc[7][8], 'SL chuyển kho');
    assert.equal(bc[8][0], 'Tổng');
    const soSanPham = ky.kiemKe[kv].dong.length;
    assert.equal(bc.length, 9 + soSanPham + 1);
    assert.equal(bc.at(-1)[0], `Tổng số dòng :${soSanPham}`);
  }
  // dòng sản phẩm thiếu mã
  assert.equal(tabs.KiemKe_HN.some((d) => d[1] === '' && String(d[2]).includes('Demo')), true);
});

test('1.3 các bảng cấu hình và nhập tay giả đủ tab và đúng tiêu đề', () => {
  const tabs = docTabs('bo1');
  for (const ten of ['CH_ThamSo', 'CH_Bac', 'CH_BacThang', 'CH_ChiSo', 'CH_NhomThietBi', 'CH_MaHang', 'CH_ViecQuanLyKho',
    'CH_HeSoChia', 'CH_KhuVuc', 'CH_ThanhVien', 'CH_TyTrong', 'Ky', 'BaoHanh_HoTroSale', 'XacNhanBaoCao', 'NhatKyCongViec', 'KeyMetrics']) {
    assert.ok(Array.isArray(tabs[ten]) && tabs[ten].length >= 1, `thiếu ${ten}`);
  }
  assert.deepEqual(tabs.CH_Bac[0], ['Bậc', 'Lương cố định', 'Min', 'Max']);
  assert.equal(tabs.CH_ThanhVien.length, 1 + 7);
  assert.equal(tabs.CH_TyTrong.length, 1 + 3 + 3 + 2 + 3 + 3 + 3);
});

test('1.3 bộ 3 giữ nguyên các giá trị xấu ở dạng thô để lớp Sheet và lõi cùng phát hiện', () => {
  const t = docTabs('bo3');
  assert.deepEqual(t.BaoHanh_HoTroSale.find((d) => d[0] === 'HN'), ['HN', -3, 400]);
  assert.deepEqual(t.BaoHanh_HoTroSale.find((d) => d[0] === 'HCM'), ['HCM', 250, '']);
  assert.ok(t.NhatKyCongViec.some((d) => d[0] === 'khongco'));
  assert.ok(t.KiemKe_HN.some((d) => d[1] === 'ABC-999'));
  assert.ok(t.KiemKe_HCM[4][0].includes('14/09/2026'));
});
