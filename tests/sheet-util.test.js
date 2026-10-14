'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap } = require('./load-core');

const c = nap();

test('1.1 tên tab nằm ở một nơi và không trùng nhau', () => {
  const ten = Object.values(JSON.parse(JSON.stringify(c.TEN_TAB)));
  assert.equal(new Set(ten.map((t) => t.toLowerCase())).size, ten.length);
  assert.ok(ten.every((t) => typeof t === 'string' && t.length > 0));
});

test('1.1 tab đầu vào và tab đầu ra tách bạch', () => {
  const vao = [...c.danhSachTabDauVao()];
  const ra = [...c.danhSachTabDauRa()];
  assert.deepEqual(ra, ['KetQua', 'GiaiThich', 'NhatKyHeThong']);
  assert.equal(vao.some((t) => ra.includes(t)), false);
});

test('1.1 so tiêu đề không phân biệt hoa/thường và khoảng trắng thừa', () => {
  assert.equal(c.chuanHoaTieuDe('  SL bán  ra trong kỳ '), c.chuanHoaTieuDe('sl bán ra trong kỳ'));
});

test('1.1 tìm ô theo nội dung trong khoảng dòng, trả vị trí đếm từ 0', () => {
  const bang = [['a', 'b'], ['x', ' Mã  HÀNG ', 'y'], ['Mã hàng']];
  const o = c.timO(bang, 'mã hàng', 0, 1);
  assert.deepEqual({ ...o }, { dong: 1, cot: 1 });
  assert.equal(c.timO(bang, 'mã hàng', 0, 0), null);
  assert.deepEqual({ ...c.timO(bang, 'mã hàng', 2, 99) }, { dong: 2, cot: 0 });
});

test('1.1 đọc ô an toàn với bảng gồ ghề (dòng ngắn, dòng thiếu)', () => {
  const bang = [['a'], [], null];
  assert.equal(c.layO(bang, 0, 0), 'a');
  assert.equal(c.layO(bang, 0, 5), null);
  assert.equal(c.layO(bang, 1, 0), null);
  assert.equal(c.layO(bang, 2, 0), null);
  assert.equal(c.layO(bang, 9, 0), null);
});

test('1.1 dòng trống hoàn toàn', () => {
  assert.equal(c.dongTrong(['', null, '  ']), true);
  assert.equal(c.dongTrong([]), true);
  assert.equal(c.dongTrong(null), true);
  assert.equal(c.dongTrong(['', 0]), false, 'số 0 không phải ô trống');
});

test('1.1 chỉ nhận số thật, không đoán chuỗi số', () => {
  assert.equal(c.soThat(5).hopLe, true);
  assert.equal(c.soThat(0).hopLe, true);
  assert.equal(c.soThat(-3).giaTri, -3);
  assert.equal(c.soThat('123').hopLe, false, 'chuỗi "123" không được đoán thành số');
  assert.equal(c.soThat('1.234,5').hopLe, false);
  assert.equal(c.soThat('').trong, true);
  assert.equal(c.soThat(null).trong, true);
  assert.equal(c.soThat(NaN).hopLe, false);
});

test('1.1 lỗi nhập liệu có vị trí tab, dòng, cột và không chặn người nào ở lõi', () => {
  const l = c.loiNhapLieu('SO_SAI', 'BaoHanh_HoTroSale', 3, 'Số ca bảo hành', 'ô chứa chữ');
  assert.equal(l.muc, 'loi');
  assert.equal(l.chan, 'nhapLieu');
  assert.ok(l.thongDiep.includes('tab BaoHanh_HoTroSale') && l.thongDiep.includes('dòng 3') && l.thongDiep.includes('"Số ca bảo hành"'));
  assert.equal(l.chiTiet.tab, 'BaoHanh_HoTroSale');
  assert.equal(l.chiTiet.dong, 3);
  const khongDong = c.loiNhapLieu('THIEU_TAB', 'CH_Bac', null, null, 'thiếu tab');
  assert.equal(khongDong.chiTiet.dong, undefined);
});
