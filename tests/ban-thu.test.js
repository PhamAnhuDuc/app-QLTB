'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build } = require('../tools/build-gs');
const { taoMoiTruong } = require('./fake-gas');

const goc = path.join(__dirname, '..');
const bo1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8'));
// Các tệp test chạy song song: xây vào thư mục tạm riêng để không đọc phải tệp đang bị tệp test khác ghi dở.
const thuMucDist = build(fs.mkdtempSync(path.join(os.tmpdir(), 'point-thu-')));
const dist = (t) => fs.readFileSync(path.join(thuMucDist, t), 'utf8');

function nap(tep, cacTab) {
  const mt = taoMoiTruong(cacTab || {});
  const ctx = vm.createContext(Object.assign({}, mt.globals));
  vm.runInContext(dist(tep), ctx, { filename: tep });
  return { mt, ctx };
}

test('bản dùng thật không có hàm nạp dữ liệu mẫu và menu chỉ có ba mục', () => {
  assert.equal(/function\s+napDuLieuMauThu/.test(dist('Code.gs')), false, 'bản thật không định nghĩa hàm nạp mẫu');
  assert.equal(dist('Code.gs').includes('DU_LIEU_MAU_THU'), false);
  const { mt, ctx } = nap('Code.gs');
  ctx.onOpen();
  assert.equal(mt.ui.menu.muc.length, 3);
});

test('bản thử có thêm đúng một mục menu so với bản thật "Nạp dữ liệu mẫu GIẢ"', () => {
  const { mt, ctx } = nap('Code-thu.gs');
  ctx.onOpen();
  assert.deepEqual(mt.ui.menu.muc.map((m) => m[1]), ['moBangDieuKhien', 'tinhKyTuMenu', 'khoiTaoKhungCauHinh', 'napDuLieuMauThu']);
  assert.ok(mt.ui.menu.muc[3][0].includes('GIẢ'));
  assert.equal(mt.nhatKy.length, 0, 'mở Sheet vẫn không ghi gì');
});

test('nạp dữ liệu mẫu vào Sheet trống tạo đủ 18 tab đúng nội dung bộ 1', () => {
  const { mt, ctx } = nap('Code-thu.gs');
  const r = ctx.napDuLieuMauThu();
  assert.equal(r.daNap, true);
  assert.equal(r.soTab, 18);
  for (const ten of Object.keys(bo1)) {
    const sh = mt.ss.getSheetByName(ten);
    assert.ok(sh, `thiếu tab ${ten}`);
    const duoc = sh.getDataRange().getValues();
    const goc1 = bo1[ten];
    goc1.forEach((dong, i) => dong.forEach((o, j) => assert.equal(duoc[i][j], o, `${ten} [${i + 1},${j + 1}]`)));
  }
  assert.ok(mt.ui.thongBao.at(-1).includes('75.838.000'));
});

test('ô tháng ở tab Ky được đặt định dạng văn bản và giữ là chữ "2026-09"', () => {
  const { mt, ctx } = nap('Code-thu.gs');
  ctx.napDuLieuMauThu();
  const ky = mt.ss.getSheetByName('Ky');
  assert.equal(ky.data[1][1], '2026-09');
  assert.equal(ky.dinhDang.B2, '@');
});

test('nạp mẫu rồi bấm Tính kỳ cho đúng kết quả: đủ dữ liệu, tổng team 75.838.000', () => {
  const { mt, ctx } = nap('Code-thu.gs');
  ctx.napDuLieuMauThu();
  const r = ctx.tinhKyTuMenu();
  assert.equal(r.daGhi, true);
  assert.equal(r.kyDuDuLieu, true);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g.find((d) => d[0] === 'Tổng team')[12], 75838000);
  assert.equal(g.find((d) => d[1] === 'Nhân viên E')[9], 3780000, 'không còn nhiễu số thực');
});

test('nạp mẫu lần hai bị từ chối và không ghi gì (không đè dữ liệu)', () => {
  const { mt, ctx } = nap('Code-thu.gs');
  ctx.napDuLieuMauThu();
  const truoc = JSON.stringify(mt.ss.sheets.map((s) => [s.ten, s.data]));
  mt.nhatKy.length = 0;
  const r = ctx.napDuLieuMauThu();
  assert.equal(r.daNap, false);
  assert.equal(r.lyDo, 'TAB_DA_CO_DU_LIEU');
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(JSON.stringify(mt.ss.sheets.map((s) => [s.ten, s.data])), truoc);
  assert.ok(mt.ui.thongBao.at(-1).includes('MỚI'));
});

test('Sheet đã có dữ liệu của bạn ở một tab mẫu thì không nạp gì, kể cả các tab khác còn trống', () => {
  const { mt, ctx } = nap('Code-thu.gs', { CH_Bac: [['Bậc', 'Lương cố định', 'Min', 'Max'], [9, 123, 1, 2]] });
  mt.nhatKy.length = 0;
  const r = ctx.napDuLieuMauThu();
  assert.equal(r.daNap, false);
  assert.deepEqual([...r.tab], ['CH_Bac']);
  assert.equal(mt.nhatKy.length, 0);
  assert.equal(mt.ss.sheets.length, 1, 'không tạo thêm tab nào');
});

test('bản thử cũng không gọi API ngoài danh sách cho phép', () => {
  const nd = dist('Code-thu.gs');
  for (const t of ['UrlFetchApp', 'MailApp', 'GmailApp', 'fetch(', 'eval(', 'new Function', 'ScriptApp', 'openById', 'createFile', 'DriveApp.getFolder']) {
    assert.equal(nd.includes(t), false, `bản thử chứa ${t}`);
  }
  const cho = { SpreadsheetApp: ['getActiveSpreadsheet', 'getUi'], DriveApp: ['getFileById'], Utilities: ['formatDate'] };
  for (const [dt, ds] of Object.entries(cho)) for (const m of nd.matchAll(new RegExp(`${dt}\\.(\\w+)`, 'g'))) assert.ok(ds.includes(m[1]), `${dt}.${m[1]}`);
});

test('bản thử và bản thật khác nhau đúng phần nạp mẫu', () => {
  assert.ok(dist('Code-thu.gs').startsWith(dist('Code.gs')));
  assert.equal(dist('Code-thu.gs').slice(dist('Code.gs').length).includes('napDuLieuMauThu'), true);
});

test('dữ liệu mẫu nhúng trong bản thử là dữ liệu giả (không có tài khoản hay tên thật)', () => {
  const phanMau = dist('Code-thu.gs').slice(dist('Code.gs').length);
  assert.ok(phanMau.includes('Nhân viên A') && phanMau.includes('CÔNG TY GIẢ'));
  assert.equal(phanMau.includes('Sapo'), false, 'không có tên công ty thật trong dữ liệu mẫu');
  assert.equal(/nv[a-z]\d/.test(phanMau.replace(/nv[a-g]\d/g, '')), false);
});
