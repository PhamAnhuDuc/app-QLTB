'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap } = require('./load-core');
const c = nap();
const plain = (x) => JSON.parse(JSON.stringify(x));

test('7.7 TSV: số thành số, chữ giữ nguyên', () => {
  const r = c.phanTichVanBanBang('Mã\tSL\nA1\t5\nB2\t3.5');
  assert.deepEqual(plain(r.bang), [['Mã', 'SL'], ['A1', 5], ['B2', 3.5]]);
  assert.equal(r.soDong, 3); assert.equal(r.soCot, 2);
});

test('7.7 CSV phẩy, CSV chấm phẩy, BOM, CRLF', () => {
  assert.deepEqual(plain(c.phanTichVanBanBang('a,b\r\n1,2\r\n').bang), [['a', 'b'], [1, 2]]);
  assert.deepEqual(plain(c.phanTichVanBanBang('a;b\n1;2').bang), [['a', 'b'], [1, 2]]);
  assert.deepEqual(plain(c.phanTichVanBanBang('﻿a,b\n1,2').bang), [['a', 'b'], [1, 2]]);
});

test('7.7 nháy kép: dấu phẩy, xuống dòng và nháy kép đôi trong ô; ô có nháy giữ là chữ', () => {
  const r = c.phanTichVanBanBang('a,b\n"x, y","l1\nl2"\n"say ""hi""","5"');
  assert.deepEqual(plain(r.bang), [['a', 'b'], ['x, y', 'l1\nl2'], ['say "hi"', '5']]);
});

test('7.7 không đoán số theo vùng: 6.000.000 và 0,5 và 007 giữ là chữ', () => {
  const r = c.phanTichVanBanBang('a\tb\tc\n6.000.000\t0,5\t007');
  assert.deepEqual(plain(r.bang[1]), ['6.000.000', '0,5', '007']);
});

test('7.7 dòng ngắn được đệm, dòng trống cuối bị bỏ', () => {
  const r = c.phanTichVanBanBang('a\tb\tc\n1\n\n\n');
  assert.deepEqual(plain(r.bang), [['a', 'b', 'c'], [1, '', '']]);
});

test('7.7 lỗi: rỗng, không phải chữ, quá lớn, quá nhiều dòng/cột, nháy chưa đóng', () => {
  assert.equal(c.phanTichVanBanBang('   \n ').loi[0].ma, 'RONG');
  assert.equal(c.phanTichVanBanBang(5).loi[0].ma, 'DU_LIEU_SAI');
  assert.equal(c.phanTichVanBanBang('abc', { soKyTu: 2, soDong: 9, soCot: 9 }).loi[0].ma, 'QUA_LON');
  assert.equal(c.phanTichVanBanBang('a\nb\nc\nd', { soKyTu: 99, soDong: 2, soCot: 9 }).loi[0].ma, 'QUA_NHIEU_DONG');
  assert.equal(c.phanTichVanBanBang('a\tb\tc', { soKyTu: 99, soDong: 9, soCot: 2 }).loi[0].ma, 'QUA_NHIEU_COT');
  assert.equal(c.phanTichVanBanBang('a\t"b\nc').loi[0].ma, 'NHAY_KEP_CHUA_DONG');
});
