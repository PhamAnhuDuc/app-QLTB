// Sinh tệp HTML XEM TRƯỚC bảng điều khiển để mở thẳng trong trình duyệt (không cần Google Sheet).
// Chạy: node tools/xem-truoc-giao-dien.js   →  dist/xem-truoc.html và dist/xem-truoc-thieu-du-lieu.html
//
// Trang là CHÍNH XÁC trang thật (taoTrangGiaoDien). Khác duy nhất: thêm một đoạn giả lập chạy NGAY TRONG TRÌNH DUYỆT gồm
// (1) Sheet giả trong bộ nhớ (cùng tests/fake-gas.js mà các test dùng) nạp dữ liệu GIẢ (bộ bo1) và
// (2) CHÍNH mã máy chủ thật (dist/Code.gs) chạy trên Sheet giả đó. Nên mọi nút đều chạy thật: tính, sửa bảng, nhập báo cáo,
// duyệt, mở lại kỳ... nhưng chỉ thay đổi bộ nhớ của trang, KHÔNG ghi vào bất kỳ Sheet nào; tải lại trang là về trạng thái đầu.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('../tests/load-core');
const { gopMa } = require('./build-gs');

const goc = path.join(__dirname, '..');
const docTabs = () => JSON.parse(fs.readFileSync(path.join(goc, 'tests', 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8'));

const HAM_MAY_CHU = ['giaoDienLayMoHinh', 'giaoDienTinh', 'giaoDienDuyet', 'giaoDienMoLai', 'giaoDienLichSu', 'giaoDienMoTab',
  'giaoDienDocBang', 'giaoDienLuuBang', 'giaoDienKhoiPhucMacDinh', 'giaoDienDatKy', 'giaoDienNhapBaoCao'];

// Chèn an toàn vào thẻ script: không để chuỗi "<script" hay "</script" trong mã (nằm trong chuỗi ký tự) làm hỏng thẻ; \u0069 là chữ i.
const anToan = (ma) => ma.replace(/<(\/?)script/gi, '<$1scr\\u0069pt');

function doanGiaLap(tabs) {
  const fakeGas = fs.readFileSync(path.join(goc, 'tests', 'fake-gas.js'), 'utf8');
  return '(function(){' +
    'var FG=(function(){var module={exports:{}};' + anToan(fakeGas) + '\n;return module.exports;})();' +
    'var mt=FG.taoMoiTruong(' + anToan(JSON.stringify(tabs)).replace(/</g, '\\u003c') + ');' +
    'window.SpreadsheetApp=mt.globals.SpreadsheetApp;window.HtmlService=mt.globals.HtmlService;window.DriveApp=mt.globals.DriveApp;window.Utilities=mt.globals.Utilities;' +
    'var S=(function(){' + anToan(gopMa()) + '\n;return {' + HAM_MAY_CHU.map((n) => n + ':' + n).join(',') + '};})();' +
    'function tra(ok,v){setTimeout(function(){ok(JSON.parse(JSON.stringify(v)));},150);}' +
    'window.google={script:{run:{withSuccessHandler:function(ok){return {withFailureHandler:function(fail){return new Proxy({},{get:function(_,ten){return function(){' +
    'var a=Array.prototype.slice.call(arguments);var kq;try{if(!S[ten])throw new Error("Hàm không có trong bản xem trước: "+ten);kq=S[ten].apply(null,a);}' +
    'catch(e){setTimeout(function(){fail(e);},150);return;}' +
    'if(ten==="giaoDienMoTab")alert("(Xem trước) Trên Sheet thật, bước này sẽ chuyển sang tab: "+a[0]);tra(ok,kq);};}});}};}}}};})();';
}

function taoTepXemTruoc(thieuDuLieu) {
  const c = nap();
  const trang = c.taoTrangGiaoDien();
  const tabs = docTabs();
  if (thieuDuLieu) tabs.KeyMetrics = tabs.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN'));
  const bang = '<div style="background:#FFF1CC;color:#7A5200;padding:6px 12px;font:13px system-ui">BẢN XEM TRƯỚC: dữ liệu giả, không nối với Sheet nào, mọi thay đổi chỉ nằm trong trang này (tải lại là về trạng thái đầu). ' +
    (thieuDuLieu ? 'Kịch bản: hai người thiếu dữ liệu, phải tick bỏ qua từng người mới duyệt được; thử sửa bảng Key metrics ở màn Nhập key metrics để đủ dữ liệu.'
      : 'Kịch bản: đủ dữ liệu. Thử Tính kỳ → Duyệt và lưu → Lịch sử → Mở lại kỳ; thử sửa Cấu hình, chọn kỳ khác, nhập báo cáo (dán văn bản) ở màn Nhập point.') + '</div>';
  const a = '<body>', b = '<script>(';
  if (!trang.includes(a) || trang.split(b).length !== 2) throw new Error('Cấu trúc trang không như mong đợi');
  return trang.replace(a, a + bang).replace(b, '<script>' + doanGiaLap(tabs) + '</script><script>(');
}

function build(thuMucRa) {
  const ra = thuMucRa || path.join(goc, 'dist');
  fs.mkdirSync(ra, { recursive: true });
  fs.writeFileSync(path.join(ra, 'xem-truoc.html'), taoTepXemTruoc(false));
  fs.writeFileSync(path.join(ra, 'xem-truoc-thieu-du-lieu.html'), taoTepXemTruoc(true));
  return ra;
}

if (require.main === module) {
  const ra = build();
  console.log('Đã tạo: ' + path.join(ra, 'xem-truoc.html'));
  console.log('Đã tạo: ' + path.join(ra, 'xem-truoc-thieu-du-lieu.html'));
  console.log('Mở bằng trình duyệt (kéo thả tệp vào cửa sổ trình duyệt, hoặc mở bằng Ctrl+O).');
}

module.exports = { build, taoTepXemTruoc };
