'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build, taoTepXemTruoc } = require('../tools/xem-truoc-giao-dien');
const { nap } = require('./load-core');
const { FakeDocument, nutCoChu, tatCaChu } = require('./fake-dom');

const c = nap();

test('xem trước: là đúng trang thật cộng thêm một đoạn giả lập; phần còn lại giữ nguyên từng byte', () => {
  const thang = c.taoTrangGiaoDien();
  const xem = taoTepXemTruoc(false);
  assert.ok(xem.length > thang.length);
  const diem = thang.indexOf('<script>(');
  assert.ok(xem.includes(thang.slice(0, thang.indexOf('<body>') + 6)), 'phần đầu trang (kiểu) giữ nguyên');
  assert.ok(xem.includes(thang.slice(thang.indexOf('<div id="goc">'), diem)), 'khung trang giữ nguyên');
  assert.ok(xem.includes(thang.slice(diem)), 'mã khách giữ nguyên từng byte');
  assert.ok(xem.includes('BẢN XEM TRƯỚC: dữ liệu giả'));
  assert.equal((xem.match(/<script>/g) || []).length, 2, 'đoạn giả lập và mã khách');
});

test('xem trước: chỉ chứa dữ liệu giả, không địa chỉ ngoài', () => {
  for (const thieu of [false, true]) {
    const xem = taoTepXemTruoc(thieu);
    assert.ok(xem.includes('Nhân viên A'));
    assert.equal(/https?:\/\//i.test(xem), false);
    // mã máy chủ nhúng có chú thích nhắc tên innerHTML; trang thật (mã khách) thì đã được test riêng là không dùng
    assert.equal(xem.slice(xem.lastIndexOf('<script>(')).includes('innerHTML'), false);
  }
});

test('xem trước: build ghi cả hai tệp ra thư mục chỉ định', () => {
  const ra = build(fs.mkdtempSync(path.join(os.tmpdir(), 'point-xt-')));
  assert.ok(fs.existsSync(path.join(ra, 'xem-truoc.html')));
  assert.ok(fs.existsSync(path.join(ra, 'xem-truoc-thieu-du-lieu.html')));
});

// Chạy kịch bản giả lập thật sự (đoạn script giả lập + mã khách) trong vùng chạy với DOM giả
function chayXemTruoc(thieu) {
  const html = taoTepXemTruoc(thieu);
  const doan = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const doc = new FakeDocument();
  const hen = [];
  const ngCanh = { document: doc, setTimeout: (f) => { hen.push(f); }, alert: () => {}, Proxy, JSON, Array };
  ngCanh.window = ngCanh;
  vm.createContext(ngCanh);
  vm.runInContext(doan[0], ngCanh); // đoạn giả lập
  vm.runInContext(doan[1].replace(/\)\(document, google\);$/, ')(document, window.google);'), ngCanh);
  const chay = () => { while (hen.length) hen.shift()(); };
  return { doc, chay };
}

test('xem trước đủ dữ liệu: chạy được kịch bản Tính kỳ → Duyệt → Mở lại kỳ trên trang thật', () => {
  const { doc, chay } = chayXemTruoc(false);
  chay();
  assert.ok(tatCaChu(doc).includes('Chưa có kết quả cho kỳ này'));
  nutCoChu(doc, 'Tính kỳ')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('75.838.000đ'));
  nutCoChu(doc, 'Duyệt và lưu')[0].click();
  nutCoChu(doc, 'Xác nhận duyệt')[0].click(); nutCoChu(doc, 'Đồng ý')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09'));
  nutCoChu(doc, 'Lịch sử')[0].click();
  nutCoChu(doc, 'Mở lại kỳ')[0].click();
  doc.goc.tim((n) => n.tag === 'textarea')[0].value = 'thử';
  doc.goc.tim((n) => n.tag === 'textarea')[0].phat('input');
  nutCoChu(doc, 'Đồng ý')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('Đã mở lại kỳ 2026-09'));
});

test('xem trước thiếu dữ liệu: phải tick cả hai người mới duyệt được', () => {
  const { doc, chay } = chayXemTruoc(true);
  chay();
  nutCoChu(doc, 'Tính kỳ')[0].click(); chay();
  nutCoChu(doc, 'Duyệt và lưu')[0].click();
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);
  for (const o of doc.goc.tim((n) => n.tag === 'input')) { o.checked = true; o.phat('change'); }
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, false);
  nutCoChu(doc, 'Xác nhận duyệt')[0].click(); nutCoChu(doc, 'Đồng ý')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('49.838.000đ'));
});

test('xem trước chạy được cả phần sửa: Cấu hình, chọn kỳ và nhập báo cáo trên mã máy chủ thật', () => {
  const { doc, chay } = chayXemTruoc(false);
  chay();
  nutCoChu(doc, 'Cấu hình')[0].click(); chay();
  const o = doc.goc.tim((n) => n.tag === 'input' && n.attrs.type === 'text' && n.value === '50000')[0];
  assert.ok(o, 'bảng thông số đã tải');
  o.value = '51000'; o.phat('input');
  nutCoChu(doc, 'Lưu')[0].click(); nutCoChu(doc, 'Đồng ý')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('Đã lưu bảng'));
  const sel = doc.goc.tim((n) => n.tag === 'select' && n.className.includes('chon-ky'))[0];
  sel.value = '2026-10'; sel.phat('change'); chay();
  assert.ok(tatCaChu(doc).includes('Kỳ 2026-10'));
  nutCoChu(doc, 'Nhập point')[0].click(); chay();
  nutCoChu(doc, 'Nhập lại báo cáo')[0].click();
  const vung = doc.goc.tim((n) => n.tag === 'textarea' && n.className.includes('vung-dan'))[0];
  vung.value = 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\tSL chuyển kho\nSP-001\tA\t5\t2'; vung.phat('input');
  nutCoChu(doc, 'Nhập báo cáo').filter((n) => n.className.includes('nut-chinh'))[0].click(); nutCoChu(doc, 'Đồng ý')[0].click(); chay();
  assert.ok(tatCaChu(doc).includes('Đã nhập báo cáo khu vực HN'));
});
