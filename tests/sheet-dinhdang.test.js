'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong, oTrongVung } = require('./fake-gas');

const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const c = nap();
const ra = (t = tabs()) => plain(c.dungKetQuaSheet(c.tinhKyTuCacTab(t, '2026-10-14 08:00:00')));
const oCuaFormat = (dd, f) => (dd.soDinhDang.find((g) => g.format === f) || { oSo: [] }).oSo;

// ---------------------------------------------------------------- 1.1 danh sách định dạng
test('1.1 cột tiền, phần trăm, point nằm đúng vị trí trên các dòng thành viên (bộ 1)', () => {
  const dd = ra().ketQua.dinhDang;
  const tien = oCuaFormat(dd, '#,##0');
  for (const o of ['I7', 'J7', 'K7', 'L7', 'M7', 'M8', 'M9', 'M10', 'M11', 'M13', 'M16', 'I16']) assert.ok(tien.includes(o), `thiếu ${o}`);
  assert.ok(oCuaFormat(dd, '0.0%').includes('G7'), 'điểm key metrics là phần trăm');
  assert.ok(oCuaFormat(dd, '0%').includes('H7'), '% thưởng là phần trăm nguyên');
  const point = oCuaFormat(dd, '#,##0.00');
  assert.ok(point.includes('D7') && point.includes('F7') && point.includes('F12') && point.includes('F16'));
});

test('1.1 ô "—" và ô chữ không bao giờ có định dạng số', () => {
  const kq = ra();
  const g = kq.ketQua.giaTri;
  const dd = kq.ketQua.dinhDang;
  const tatCa = new Set(dd.soDinhDang.flatMap((x) => x.oSo));
  // Nhân viên D ở dòng 14: các ô chưa tính hiện "—"
  assert.equal(g[13][6], '—');
  assert.equal(tatCa.has('G14'), false);
  assert.equal(tatCa.has('M14'), false);
  assert.equal(g[13][12], '—');
  // mọi ô trong danh sách số đều thật sự là số
  for (const o of tatCa) {
    const m = /^([A-Z]+)(\d+)$/.exec(o);
    let cot = 0; for (const ch of m[1]) cot = cot * 26 + ch.charCodeAt(0) - 64;
    assert.equal(typeof g[Number(m[2]) - 1][cot - 1], 'number', `${o} không phải số`);
  }
});

test('1.1 dòng tiêu đề, tổng nhóm, tổng team và các đầu mục được in đậm', () => {
  const dam = ra().ketQua.dinhDang.dam;
  for (const hang of [1, 6, 12, 15, 16]) assert.ok(dam.includes(`A${hang}:N${hang}`), `dòng ${hang} phải in đậm`);
  assert.ok(dam.includes('A18:N18'), 'đầu mục LỖI');
  assert.equal(dam.includes('A7:N7'), false, 'dòng thành viên thường không in đậm');
});

test('1.1 độ rộng 14 cột kết quả đủ để không cắt tên nhóm và tên thành viên', () => {
  const dd = ra().ketQua.dinhDang;
  assert.equal(dd.doRong.length, 14);
  assert.ok(dd.doRong[0] >= 180 && dd.doRong[1] >= 160);
});

test('1.1 kết quả bị chặn toàn bộ vẫn có định dạng hợp lệ và không có định dạng số', () => {
  const t = tabs(); delete t.CH_Bac;
  const dd = ra(t).ketQua.dinhDang;
  assert.equal(dd.soDinhDang.length, 0);
  assert.ok(dd.dam[0].startsWith('A1:'), 'tiêu đề vẫn in đậm');
});

test('1.1 tab giải thích: tiêu đề in đậm, cột nội dung đủ rộng', () => {
  const dd = ra().giaiThich.dinhDang;
  assert.deepEqual(dd.dam, ['A1:C1']);
  assert.equal(dd.doRong.length, 3);
  assert.ok(dd.doRong[2] >= 500);
});

// ---------------------------------------------------------------- 1.2 áp dụng bằng lớp Apps Script
test('1.2 giá trị trong ô không đổi: 9800000 vẫn là số 9800000 và có định dạng nghìn', () => {
  const mt = taoMoiTruong(tabs());
  nap(mt.globals).tinhKyTuMenu();
  const sh = mt.ss.getSheetByName('KetQua');
  assert.equal(sh.data[6][12], 9800000);
  assert.equal(sh.dinhDang.M7, '#,##0');
  assert.equal(sh.dinhDang.G7, '0.0%');
  assert.equal(sh.dinhDang.H7, '0%');
  assert.equal(sh.dinhDang.D7, '#,##0.00');
});

test('1.2 ô chưa tính "—" vẫn là chữ và không bị gán định dạng số', () => {
  const mt = taoMoiTruong(tabs());
  nap(mt.globals).tinhKyTuMenu();
  const sh = mt.ss.getSheetByName('KetQua');
  assert.equal(sh.data[13][12], '—');
  assert.equal(sh.dinhDang.M14, '@', 'ô chữ giữ định dạng văn bản đặt khi ghi');
});

test('1.2 tiêu đề in đậm và đặt độ rộng 14 cột; tab giải thích cũng được định dạng', () => {
  const mt = taoMoiTruong(tabs());
  nap(mt.globals).tinhKyTuMenu();
  const sh = mt.ss.getSheetByName('KetQua');
  assert.equal(sh.dam.A1, 'bold');
  assert.equal(sh.dam.A6, 'bold');
  assert.equal(sh.dam.N16, 'bold');
  assert.equal(Object.keys(sh.doRong).length, 14);
  assert.equal(mt.ss.getSheetByName('GiaiThich').dam.A1, 'bold');
});

test('1.2 định dạng không đụng đầu vào: không tab đầu vào nào bị đổi định dạng hay giá trị', () => {
  const t = tabs();
  const mt = taoMoiTruong(t);
  const truoc = mt.ss.chup(Object.keys(t));
  mt.nhatKy.length = 0;
  nap(mt.globals).tinhKyTuMenu();
  assert.equal(mt.ss.chup(Object.keys(t)), truoc);
  const daDung = new Set(mt.nhatKy.filter((n) => ['setNumberFormat', 'setFontWeight', 'setColumnWidth'].includes(n.thaoTac)).map((n) => n.tab));
  assert.deepEqual([...daDung].sort(), ['GiaiThich', 'KetQua']);
  for (const ten of Object.keys(t)) assert.equal(Object.keys(mt.ss.getSheetByName(ten).dinhDang).length, 0, `${ten} bị đổi định dạng`);
});

test('1.2 tính lại không để lại định dạng cũ của lần trước (xoá rồi áp lại)', () => {
  const mt = taoMoiTruong(tabs());
  const c2 = nap(mt.globals);
  c2.tinhKyTuMenu();
  const truoc = JSON.stringify(mt.ss.getSheetByName('KetQua').dinhDang);
  c2.tinhKyTuMenu();
  assert.equal(JSON.stringify(mt.ss.getSheetByName('KetQua').dinhDang), truoc);
});

test('1.2 bộ 3 (nhiều lỗi): vẫn áp định dạng và không có ô số nào mang định dạng sai', () => {
  const mt = taoMoiTruong(tabs('bo3'));
  nap(mt.globals).tinhKyTuMenu();
  const sh = mt.ss.getSheetByName('KetQua');
  for (const [o, f] of Object.entries(sh.dinhDang)) {
    if (f === '@') continue;
    const m = /^([A-Z]+)(\d+)$/.exec(o);
    let cot = 0; for (const ch of m[1]) cot = cot * 26 + ch.charCodeAt(0) - 64;
    assert.equal(typeof sh.data[Number(m[2]) - 1][cot - 1], 'number', `${o} có định dạng ${f} nhưng không phải số`);
  }
});

test('1.2 fake: vùng A1 và danh sách vùng được giải đúng', () => {
  assert.deepEqual(oTrongVung('A1:B2'), ['A1', 'B1', 'A2', 'B2']);
  assert.deepEqual(oTrongVung('C5'), ['C5']);
});
