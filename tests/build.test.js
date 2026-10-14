'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { build, manifest, gopMa, THU_TU, OAUTH_SCOPES } = require('../tools/build-gs');
const { taoMoiTruong } = require('./fake-gas');

const goc = path.join(__dirname, '..');
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));

test('6.6 lệnh gộp mã tạo Code.gs và appsscript.json, chạy hai lần cho cùng kết quả', () => {
  const ra = build();
  const code1 = fs.readFileSync(path.join(ra, 'Code.gs'), 'utf8');
  const man1 = fs.readFileSync(path.join(ra, 'appsscript.json'), 'utf8');
  build();
  assert.equal(fs.readFileSync(path.join(ra, 'Code.gs'), 'utf8'), code1);
  assert.equal(fs.readFileSync(path.join(ra, 'appsscript.json'), 'utf8'), man1);
  assert.equal(code1, gopMa());
  assert.ok(code1.startsWith('// Tệp SINH TỰ ĐỘNG'));
});

test('6.6 mọi tệp nguồn có mặt đúng thứ tự phụ thuộc, không thiếu tệp nào trong src/', () => {
  const co = [];
  for (const thuMuc of ['core', 'sheet']) for (const t of fs.readdirSync(path.join(goc, 'src', thuMuc))) co.push(`${thuMuc}/${t}`);
  assert.deepEqual([...THU_TU].sort(), co.sort());
  const code = gopMa();
  let vt = -1;
  for (const t of THU_TU) { const i = code.indexOf(`// ===== src/${t} =====`); assert.ok(i > vt, `${t} sai thứ tự`); vt = i; }
});

test('6.6 không có tên hàm hay biến toàn cục bị khai báo hai lần giữa các tệp (Apps Script dùng chung phạm vi)', () => {
  const thay = {};
  for (const t of THU_TU) {
    const nd = fs.readFileSync(path.join(goc, 'src', t), 'utf8').replace(/\/\/.*$/gm, '');
    for (const m of nd.matchAll(/^(?:function\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*))/gm)) {
      const ten = m[1] || m[2];
      (thay[ten] = thay[ten] || []).push(t);
    }
  }
  const trung = Object.entries(thay).filter(([, ds]) => ds.length > 1);
  assert.deepEqual(trung, [], `trùng tên toàn cục: ${JSON.stringify(trung)}`);
});

test('6.6 Code.gs không chứa cú pháp module (Apps Script không hiểu require/import/export)', () => {
  const code = gopMa();
  assert.equal(/\brequire\s*\(/.test(code), false);
  assert.equal(/^\s*(import|export)\s/m.test(code), false);
  assert.equal(/module\.exports/.test(code), false);
});

test('6.6 manifest khai báo quyền tường minh, chỉ gồm Sheet hiện tại, giao diện và Drive; không có quyền mạng, thư, lịch', () => {
  const m = manifest();
  assert.equal(m.runtimeVersion, 'V8');
  assert.deepEqual(m.dependencies, {});
  assert.deepEqual([...m.oauthScopes].sort(), [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/script.container.ui',
    'https://www.googleapis.com/auth/spreadsheets.currentonly'
  ]);
  assert.equal(m.oauthScopes.some((s) => /external_request|gmail|mail|calendar|documents|presentations|forms|scriptapp|send_mail/i.test(s)), false);
  assert.deepEqual(OAUTH_SCOPES, m.oauthScopes);
  const tren = JSON.parse(fs.readFileSync(path.join(goc, 'dist', 'appsscript.json'), 'utf8'));
  assert.deepEqual(tren, m);
  assert.equal(tren.urlFetchWhitelist, undefined, 'không khai báo danh sách địa chỉ được gọi');
});

test('6.6 dist/ nằm trong .gitignore (chỉ chứa mã sinh ra)', () => {
  const gi = fs.readFileSync(path.join(goc, '.gitignore'), 'utf8').split('\n').map((d) => d.trim());
  assert.ok(gi.includes('dist/'));
});

test('6.6 nạp dist/Code.gs vào vùng chạy mới và chạy kỳ bộ 1 qua Sheet giả cho đúng kết quả', () => {
  build();
  const mt = taoMoiTruong(tabs());
  const ctx = vm.createContext(Object.assign({}, mt.globals));
  vm.runInContext(fs.readFileSync(path.join(goc, 'dist', 'Code.gs'), 'utf8'), ctx, { filename: 'dist/Code.gs' });
  assert.equal(typeof ctx.onOpen, 'function');
  ctx.onOpen();
  assert.equal(mt.ui.menu.ten, 'Tính point');
  const r = ctx.tinhKyTuMenu();
  assert.equal(r.daGhi, true);
  assert.equal(r.kyDuDuLieu, true);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g.find((d) => d[0] === 'Tổng team')[12], 75838000);
});

test('6.6 bản gộp cho kết quả y hệt bản nạp từng tệp (bộ 2 và bộ 3)', () => {
  build();
  const { nap } = require('./load-core');
  for (const bo of ['bo2', 'bo3']) {
    const mA = taoMoiTruong(tabs(bo)); nap(mA.globals).tinhKyTuMenu();
    const mB = taoMoiTruong(tabs(bo));
    const ctx = vm.createContext(Object.assign({}, mB.globals));
    vm.runInContext(fs.readFileSync(path.join(goc, 'dist', 'Code.gs'), 'utf8'), ctx);
    ctx.tinhKyTuMenu();
    assert.equal(JSON.stringify(mB.ss.getSheetByName('KetQua').data), JSON.stringify(mA.ss.getSheetByName('KetQua').data), bo);
    assert.equal(JSON.stringify(mB.ss.getSheetByName('GiaiThich').data), JSON.stringify(mA.ss.getSheetByName('GiaiThich').data), bo);
  }
});

// ---------------------------------------------------------------- 5.1 gói triển khai cho bảng điều khiển, duyệt và mở lại
const { manifestDriveReadonly, OAUTH_SCOPES_DRIVE_READONLY } = require('../tools/build-gs');

test('5.1 manifest thay thế chỉ khác ở quyền Drive: drive → drive.readonly, các quyền khác giữ nguyên', () => {
  const md = manifest(), ro = manifestDriveReadonly();
  assert.deepEqual([...ro.oauthScopes].sort(), [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/script.container.ui',
    'https://www.googleapis.com/auth/spreadsheets.currentonly'
  ]);
  assert.equal(ro.oauthScopes.includes('https://www.googleapis.com/auth/drive'), false);
  assert.deepEqual({ ...ro, oauthScopes: null }, { ...md, oauthScopes: null });
  assert.deepEqual(OAUTH_SCOPES_DRIVE_READONLY, ro.oauthScopes);
  assert.equal(ro.oauthScopes.some((s) => /external_request|gmail|mail|calendar|send_mail/i.test(s)), false);
});

test('5.1 build tạo cả hai manifest và chúng khớp hàm sinh', () => {
  const ra = build(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'point-mf-')));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ra, 'appsscript.json'), 'utf8')), manifest());
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ra, 'appsscript.drive-readonly.json'), 'utf8')), manifestDriveReadonly());
});

test('5.1 mọi tệp nguồn mới đã nằm trong bản gộp đúng thứ tự', () => {
  for (const t of ['sheet/chot.js', 'sheet/giaodien.js', 'sheet/giaodienhtml.js', 'sheet/gas-chot.js', 'sheet/gas-giaodien.js']) assert.ok(THU_TU.includes(t), t);
  const code = gopMa();
  assert.ok(code.indexOf('// ===== src/sheet/chot.js') < code.indexOf('// ===== src/sheet/gas-chot.js'));
  assert.ok(code.indexOf('// ===== src/sheet/giaodien.js') < code.indexOf('// ===== src/sheet/gas-giaodien.js'));
});

function chayTronQuyTrinh(tep) {
  const mt = taoMoiTruong({});
  const ctx = vm.createContext(Object.assign({}, mt.globals));
  vm.runInContext(tep, ctx);
  return { mt, ctx };
}

test('5.1 bản gộp (thử) chạy trọn quy trình: nạp mẫu, tính, duyệt, mở lại, chốt lại, bảng điều khiển', () => {
  const { mt, ctx } = chayTronQuyTrinh(require('../tools/build-gs').gopMaThu());
  ctx.onOpen();
  assert.deepEqual(mt.ui.menu.muc.map((m) => m[1]), ['moBangDieuKhien', 'tinhKyTuMenu', 'khoiTaoKhungCauHinh', 'napDuLieuMauThu']);
  assert.equal(ctx.napDuLieuMauThu().daNap, true);
  const t = ctx.tinhKyTuMenu();
  assert.equal(t.kyDuDuLieu, true);
  assert.equal(mt.ss.getSheetByName('KetQua').data.find((d) => d[0] === 'Tổng team')[12], 75838000);
  const d = ctx.thucHienDuyet(mt.ss, []);
  assert.equal(d.daChot, true);
  assert.equal(d.tong, 75838000);
  assert.equal(ctx.thucHienDuyet(mt.ss, []).daChot, false, 'chốt lại bị từ chối');
  assert.equal(ctx.thucHienMoLai(mt.ss, '2026-09', 'thử mở lại').daMoLai, true);
  assert.equal(ctx.thucHienDuyet(mt.ss, []).daChot, true, 'chốt lại sau khi mở lại');
  assert.deepEqual([...ctx.docChiMucTuSheet(mt.ss)].map((s) => s.trangThai), ['Đã chốt', 'Đã mở lại', 'Đã chốt']);
  ctx.moBangDieuKhien();
  assert.equal(mt.ui.hopThoai.length, 1);
  assert.ok(mt.ui.hopThoai[0].noiDung.includes('<div id="goc">'));
});

test('5.1 bản gộp cho kết quả y hệt bản nạp từng tệp ở quy trình duyệt và mở lại', () => {
  const { nap } = require('./load-core');
  const lam = (taoCtx) => {
    const mt = taoMoiTruong(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8')));
    const ctx = taoCtx(mt);
    ctx.thucHienDuyet(mt.ss, []);
    ctx.thucHienMoLai(mt.ss, '2026-09', 'x');
    return JSON.stringify(mt.ss.sheets.map((s) => [s.ten, s.data]));
  };
  const a = lam((mt) => nap(mt.globals));
  const b = lam((mt) => { const ctx = vm.createContext(Object.assign({}, mt.globals)); vm.runInContext(gopMa(), ctx); return ctx; });
  assert.equal(a, b);
});

test('5.1 bản dùng thật cũng có bảng điều khiển, duyệt và mở lại nhưng không có hàm nạp mẫu', () => {
  const { ctx } = chayTronQuyTrinh(gopMa());
  for (const h of ['moBangDieuKhien', 'thucHienDuyet', 'thucHienMoLai', 'giaoDienTinh', 'giaoDienDuyet']) assert.equal(typeof ctx[h], 'function', h);
  assert.equal(typeof ctx.napDuLieuMauThu, 'undefined');
});

test('11.1 các tệp mới của phần sửa dữ liệu có mặt đúng thứ tự trong bản gộp', () => {
  for (const t of ['sheet/bang.js', 'sheet/nhapbang.js', 'sheet/gas-sua.js']) assert.ok(THU_TU.includes(t), t);
  const code = gopMa();
  assert.ok(code.indexOf('// ===== src/sheet/dieuphoi.js') < code.indexOf('// ===== src/sheet/bang.js'));
  assert.ok(code.indexOf('// ===== src/sheet/bang.js') < code.indexOf('// ===== src/sheet/gas-sua.js'));
  assert.ok(code.indexOf('// ===== src/sheet/gas-giaodien.js') < code.indexOf('// ===== src/sheet/gas-sua.js'));
});

test('11.1 bản gộp chạy trọn quy trình sửa, tính, duyệt và cho kết quả y hệt bản nạp từng tệp', () => {
  const { nap } = require('./load-core');
  const lam = (taoCtx) => {
    const mt = taoMoiTruong(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8')));
    const ctx = taoCtx(mt);
    const bt = JSON.parse(JSON.stringify(ctx.giaoDienDocBang('thamSo').bang.dong));
    bt[0][1] = 52000;
    assert.equal(ctx.giaoDienLuuBang('thamSo', bt).daLuu, true);
    assert.equal(ctx.giaoDienDatKy('2026-09').daLuu, true);
    assert.equal(ctx.giaoDienKhoiPhucMacDinh('bacThang').daLuu, true);
    assert.equal(ctx.giaoDienTinh().ok, true);
    assert.equal(ctx.giaoDienDuyet([]).daChot, true);
    assert.equal(ctx.giaoDienLuuBang('nhatKyCongViec', []).lyDo[0].ma, 'KY_DA_CHOT');
    return JSON.stringify(mt.ss.sheets.map((s) => [s.ten, s.data]));
  };
  const a = lam((mt) => nap(mt.globals));
  const b = lam((mt) => { const ctx = vm.createContext(Object.assign({}, mt.globals)); vm.runInContext(gopMa(), ctx); return ctx; });
  assert.equal(a, b);
});
