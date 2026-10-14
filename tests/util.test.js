'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nap } = require('./load-core');

const c = nap();

test('so khớp không phân biệt hoa/thường và khoảng trắng', () => {
  assert.equal(c.cungKhoa('MBH cầm tay', 'MBH Cầm tay'), true);
  assert.equal(c.cungKhoa('  sp-001 ', 'SP-001'), true);
  assert.equal(c.cungKhoa('SP-001', 'SP-002'), false);
  assert.equal(c.chuanHoaKhoa(null), '');
});

test('phân biệt ô trống với 0', () => {
  assert.equal(c.laTrong(null), true);
  assert.equal(c.laTrong(undefined), true);
  assert.equal(c.laTrong(''), true);
  assert.equal(c.laTrong('  '), true);
  assert.equal(c.laTrong(0), false);
  assert.equal(c.laTrong('0'), false);
  assert.equal(c.docSo(0).hopLe, true);
  assert.equal(c.docSo(0).giaTri, 0);
  assert.equal(c.docSo('').trong, true);
  assert.equal(c.docSo('abc').hopLe, false);
  assert.equal(c.docSo('abc').trong, false);
  assert.equal(c.docSo('1,5').giaTri, 1.5);
});

test('số không âm', () => {
  assert.equal(c.laSoKhongAm(0), true);
  assert.equal(c.laSoKhongAm(-3), false);
  assert.equal(c.laSoKhongAm(null), false);
});

test('xấp xỉ và làm tròn', () => {
  assert.equal(c.xapXi(0.7999999999999), 0.8);
  assert.equal(c.lamTronDong(2433333.333), 2433333);
  assert.equal(c.lamTronDong(2433333.5), 2433334);
});
