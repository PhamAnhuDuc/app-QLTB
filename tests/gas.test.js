'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');
const { taoMoiTruong, FakeSheet, FakeSpreadsheet, a1, giaiA1 } = require('./fake-gas');

const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const TAB_RA = ['KetQua', 'GiaiThich', 'NhatKyHeThong'];
const tabDauVao = (cacTab) => Object.keys(cacTab).filter((t) => !TAB_RA.includes(t));

function chay(cacTab, chiaSe, lenh = 'tinhKyTuMenu') {
  const mt = taoMoiTruong(cacTab, chiaSe);
  const c = nap(mt.globals);
  const truoc = mt.ss.chup(tabDauVao(cacTab));
  mt.nhatKy.length = 0;
  const kq = c[lenh]();
  return { mt, c, kq, truoc };
}

// ---------------------------------------------------------------- 6.1 Sheet giả
test('6.1 sheet giả: đọc bằng getDataRange, tab trống trả [[""]]', () => {
  const mt = taoMoiTruong({ A: [['x', 1], ['y']], B: [] });
  assert.deepEqual(mt.ss.getSheetByName('A').getDataRange().getValues(), [['x', 1], ['y', '']]);
  assert.deepEqual(mt.ss.getSheetByName('B').getDataRange().getValues(), [['']]);
  assert.equal(mt.ss.getSheetByName('Khong'), null);
});

test('6.1 sheet giả: ghi, tạo tab, xoá và ghi lại thao tác', () => {
  const mt = taoMoiTruong({ A: [['x']] });
  const sh = mt.ss.insertSheet('Moi');
  sh.getRange(1, 1, 2, 2).setValues([[1, 2], [3, 4]]);
  assert.deepEqual(sh.getDataRange().getValues(), [[1, 2], [3, 4]]);
  assert.equal(sh.getLastRow(), 2);
  sh.clear();
  assert.equal(sh.getLastRow(), 0);
  assert.deepEqual(mt.nhatKy.map((n) => n.thaoTac), ['insertSheet', 'setValues', 'clear']);
});

test('6.1 sheet giả: định dạng văn bản chặn việc hiểu "=" thành công thức; dấu nháy đơn cũng vô hiệu', () => {
  const mt = taoMoiTruong({});
  const sh = mt.ss.insertSheet('T');
  sh.getRange(1, 1, 1, 3).setValues([['=1+1', "'=1+1", 'a']]);
  assert.deepEqual(sh.congThuc, ['A1'], 'ô không định dạng văn bản bị coi là công thức');
  const sh2 = mt.ss.insertSheet('T2');
  sh2.getRangeList(['A1']).setNumberFormat('@');
  sh2.getRange(1, 1, 1, 1).setValues([['=1+1']]);
  assert.deepEqual(sh2.congThuc, [], 'ô đã định dạng văn bản thì không thành công thức');
});

test('6.1 sheet giả: mức chia sẻ và ký hiệu A1', () => {
  const mt = taoMoiTruong({}, { truyCap: 'DOMAIN', nguoiKhac: ['a@x.test'] });
  const f = mt.globals.DriveApp.getFileById('id');
  assert.equal(f.getSharingAccess(), 'DOMAIN');
  assert.equal(f.getEditors().length, 1);
  assert.equal(a1(0, 0), 'A1');
  assert.equal(a1(2, 27), 'AB3');
  assert.deepEqual(giaiA1('AB3'), { r: 2, c: 27 });
});

test('6.1 sheet giả: bản chụp so sánh được trước và sau', () => {
  const mt = taoMoiTruong({ A: [['x']], B: [['y']] });
  const t = mt.ss.chup(['A']);
  mt.ss.getSheetByName('B').getRange(1, 1, 1, 1).setValues([['z']]);
  assert.equal(mt.ss.chup(['A']), t);
});

// ---------------------------------------------------------------- 6.2 menu và tính kỳ
test('6.2 mở Sheet chỉ thêm menu, không tính và không ghi tab nào', () => {
  const mt = taoMoiTruong(tabs());
  const c = nap(mt.globals);
  const truoc = mt.ss.chup(Object.keys(tabs()));
  c.onOpen();
  assert.equal(mt.ui.menu.ten, 'Tính point');
  assert.deepEqual(mt.ui.menu.muc, [['Bảng điều khiển', 'moBangDieuKhien'], ['Tính kỳ', 'tinhKyTuMenu'], ['Khởi tạo khung cấu hình', 'khoiTaoKhungCauHinh']]);
  assert.equal(mt.nhatKy.length, 0, 'không có thao tác ghi nào');
  assert.equal(mt.ss.chup(Object.keys(tabs())), truoc);
  assert.equal(mt.ui.thongBao.length, 0);
});

test('6.2 tính kỳ bộ 1: chỉ ghi các tab đầu ra, mọi tab đầu vào không đổi một ô nào', () => {
  const { mt, kq, truoc } = chay(tabs());
  assert.equal(kq.daGhi, true);
  assert.equal(kq.kyDuDuLieu, true);
  assert.equal(mt.ss.chup(tabDauVao(tabs())), truoc);
  const tabDaGhi = [...new Set(mt.nhatKy.map((n) => n.tab))].sort();
  assert.deepEqual(tabDaGhi, ['GiaiThich', 'KetQua', 'NhatKyHeThong']);
});

test('6.2 tab kết quả có nhãn đề xuất và tổng team đúng; thông báo cho chủ sở hữu', () => {
  const { mt } = chay(tabs());
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g[0][0], 'Đề xuất – chờ duyệt');
  assert.equal(g.find((d) => d[0] === 'Tổng team')[12], 75838000);
  assert.ok(mt.ui.thongBao.at(-1).includes('Đã tính xong') && mt.ui.thongBao.at(-1).includes('đề xuất chờ bạn duyệt'));
});

test('6.2 tính lại lần hai: tab kết quả chỉ có kết quả mới nhất, nhật ký hệ thống chỉ thêm dòng, đầu vào vẫn không đổi', () => {
  const mt = taoMoiTruong(tabs());
  const c = nap(mt.globals);
  const truoc = mt.ss.chup(tabDauVao(tabs()));
  c.tinhKyTuMenu();
  const lan1 = JSON.stringify(mt.ss.getSheetByName('KetQua').data);
  const soDongNhatKy1 = mt.ss.getSheetByName('NhatKyHeThong').getLastRow();
  c.tinhKyTuMenu();
  assert.equal(JSON.stringify(mt.ss.getSheetByName('KetQua').data), lan1, 'cùng đầu vào cho cùng kết quả, không chồng lên nhau');
  assert.equal(mt.ss.getSheetByName('NhatKyHeThong').getLastRow(), 1 + (soDongNhatKy1 - 1) * 2, 'tiêu đề một lần, dòng log được thêm');
  assert.equal(mt.ss.chup(tabDauVao(tabs())), truoc);
});

test('6.2 tính lại sau khi sửa dữ liệu: tab kết quả đổi theo và không còn dư dòng cũ', () => {
  const mt = taoMoiTruong(tabs());
  const c = nap(mt.globals);
  c.tinhKyTuMenu();
  const dai1 = mt.ss.getSheetByName('KetQua').getLastRow();
  const sh = mt.ss.getSheetByName('CH_ThamSo');
  sh.data[sh.data.findIndex((d) => d[0] === 'donGiaPoint')][1] = 60000; // người dùng sửa cấu hình
  mt.nhatKy.length = 0;
  c.tinhKyTuMenu();
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.notEqual(g.find((d) => d[0] === 'Tổng team')[12], 75838000);
  assert.ok(mt.ss.getSheetByName('KetQua').getLastRow() <= dai1 + 2);
});

test('6.2 bộ 3 (dữ liệu xấu): vẫn chỉ ghi tab đầu ra, báo CHƯA đủ dữ liệu, không ai bị bịa số', () => {
  const { mt, kq, truoc } = chay(tabs('bo3'));
  assert.equal(kq.daGhi, true);
  assert.equal(kq.kyDuDuLieu, false);
  assert.equal(mt.ss.chup(tabDauVao(tabs('bo3'))), truoc);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g[2][1], 'Chưa đủ dữ liệu');
  assert.ok(mt.ui.thongBao.at(-1).includes('CHƯA đủ dữ liệu'));
});

test('6.2 lỗi cấu hình chặn toàn bộ: ghi lỗi vào tab kết quả, không có bảng thành viên', () => {
  const t = tabs(); delete t.CH_Bac;
  const { mt, kq } = chay(t);
  assert.equal(kq.chanToanBo, true);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g.some((d) => d[0] === 'Tổng team'), false);
  assert.ok(mt.ui.thongBao.at(-1).includes('Không tính được'));
});

test('6.2 chuỗi từ dữ liệu bắt đầu bằng "=" không thành công thức trong bất kỳ tab đầu ra nào', () => {
  const t = tabs();
  t.KiemKe_HN.splice(t.KiemKe_HN.length - 1, 0, [99, '=HYPERLINK("http://x")', '=Mã độc', 1, 1, 1, 5, 0, 0, 1]);
  t.CH_ThanhVien[1][1] = '=1+1';
  const { mt } = chay(t);
  for (const ten of TAB_RA) assert.deepEqual(mt.ss.getSheetByName(ten).congThuc, [], `tab ${ten} có ô công thức`);
});

// ---------------------------------------------------------------- 6.3 kiểm tra chia sẻ
test('6.3 danhGiaChiaSe: các tình huống của spec', () => {
  const c = nap();
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'ANYONE_WITH_LINK', soNguoiKhac: 0 }).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'ANYONE', soNguoiKhac: 0 }).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'DOMAIN', soNguoiKhac: 0 }).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'DOMAIN_WITH_LINK', soNguoiKhac: 0 }).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'PRIVATE', soNguoiKhac: 1 }).mucDo, 'canhBao');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'PRIVATE', soNguoiKhac: 0 }).mucDo, 'on');
  assert.equal(c.danhGiaChiaSe({ docDuoc: false }).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe(null).mucDo, 'chan');
  assert.equal(c.danhGiaChiaSe({ docDuoc: true, truyCap: 'anyone_with_link', soNguoiKhac: 0 }).mucDo, 'chan', 'không phân biệt hoa/thường');
});

test('6.3 chia sẻ rộng: từ chối tính, không ghi gì, báo cách đưa về Riêng tư', () => {
  for (const truyCap of ['ANYONE_WITH_LINK', 'ANYONE', 'DOMAIN', 'DOMAIN_WITH_LINK']) {
    const { mt, kq, truoc } = chay(tabs(), { truyCap });
    assert.equal(kq.daGhi, false, truyCap);
    assert.equal(kq.lyDo, 'CHIA_SE_RONG');
    assert.equal(mt.nhatKy.length, 0, `không có thao tác ghi nào khi ${truyCap}`);
    assert.equal(mt.ss.chup(tabDauVao(tabs())), truoc);
    assert.equal(mt.ss.getSheetByName('KetQua'), null);
    assert.ok(mt.ui.thongBao[0].includes('Bị hạn chế'));
  }
});

test('6.3 chia sẻ cho người cụ thể: cảnh báo trong tab kết quả nhưng vẫn tính; không lộ email', () => {
  const { mt, kq } = chay(tabs(), { truyCap: 'PRIVATE', nguoiKhac: ['nguoi.khac@vi-du.test', 'nguoi.hai@vi-du.test'] });
  assert.equal(kq.daGhi, true);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.ok(g.some((d) => d[1] === 'CHIA_SE_NGUOI_KHAC' && String(d[2]).includes('2 người khác')));
  const noiDung = JSON.stringify([mt.ss.getSheetByName('KetQua').data, mt.ss.getSheetByName('NhatKyHeThong').data, mt.ui.thongBao]);
  assert.equal(noiDung.includes('vi-du.test'), false, 'email không được ghi vào kết quả, nhật ký hay thông báo');
});

test('6.3 chủ sở hữu có trong danh sách chỉnh sửa không bị tính là người khác', () => {
  const { kq } = chay(tabs(), { truyCap: 'PRIVATE', chu: 'chu@vi-du.test', nguoiKhac: ['CHU@vi-du.test'] });
  assert.equal(kq.daGhi, true);
});

test('6.3 không đọc được mức chia sẻ (thiếu quyền Drive): từ chối, không coi là an toàn', () => {
  const { mt, kq } = chay(tabs(), { khongDoc: true });
  assert.equal(kq.daGhi, false);
  assert.equal(kq.lyDo, 'CHIA_SE_KHONG_DOC_DUOC');
  assert.equal(mt.nhatKy.length, 0);
  assert.ok(mt.ui.thongBao[0].includes('quyền Drive'));
});

test('6.3 riêng tư hoàn toàn thì tính bình thường và không có cảnh báo chia sẻ', () => {
  const { mt } = chay(tabs(), { truyCap: 'PRIVATE' });
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.equal(g.some((d) => String(d[1]).startsWith('CHIA_SE')), false);
});

// ---------------------------------------------------------------- 6.4 tên tab kết quả và khởi tạo
test('6.4 tên tab kết quả trùng tab đầu vào bị từ chối, không ghi gì', () => {
  for (const ten of ['CH_Bac', 'ch_bac', 'KiemKe_HN', 'GiaiThich', 'NhatKyHeThong', 'NhatKyCongViec']) {
    const t = tabs();
    t.CH_ThamSo[t.CH_ThamSo.findIndex((d) => d[0] === 'tenTabKetQua')][1] = ten;
    const { mt, kq, truoc } = chay(t);
    assert.equal(kq.daGhi, false, ten);
    assert.equal(kq.lyDo, 'TEN_TAB_KET_QUA_TRUNG');
    assert.equal(mt.nhatKy.length, 0, ten);
    assert.equal(mt.ss.chup(tabDauVao(t)), truoc);
    assert.ok(mt.ui.thongBao[0].includes('trùng'));
  }
});

test('6.4 đổi tên tab kết quả hợp lệ: ghi vào tab mới, không đụng tab KetQua mặc định', () => {
  const t = tabs();
  t.CH_ThamSo[t.CH_ThamSo.findIndex((d) => d[0] === 'tenTabKetQua')][1] = 'KetQua_T09';
  const { mt, kq } = chay(t);
  assert.equal(kq.daGhi, true);
  assert.equal(kq.tenTabKetQua, 'KetQua_T09');
  assert.ok(mt.ss.getSheetByName('KetQua_T09'));
  assert.equal(mt.ss.getSheetByName('KetQua'), null);
});

test('6.4 khởi tạo trên Sheet mới tạo đủ tab cấu hình và nhập tay với giá trị mặc định', () => {
  const { mt, kq } = chay({ Sheet1: [['ghi chú của tôi']] }, null, 'khoiTaoKhungCauHinh');
  assert.equal(kq.daTao.length, 16);
  assert.equal(mt.ss.getSheetByName('Sheet1').data[0][0], 'ghi chú của tôi');
  assert.equal(mt.ss.getSheetByName('CH_ThamSo').data.find((d) => d[0] === 'donGiaPoint')[1], 50000);
  assert.equal(mt.ss.getSheetByName('CH_ThanhVien').data.length, 1, 'không có thành viên nào');
  assert.ok(mt.ui.thongBao[0].includes('Đã tạo 16 tab'));
});

test('6.4 khởi tạo khi tab đã có dữ liệu: giữ nguyên tab đó, chỉ tạo tab còn thiếu', () => {
  const cacTab = { CH_Bac: [['Bậc', 'Lương cố định', 'Min', 'Max'], [9, 123, 1, 2]], CH_ThamSo: [['Tham số', 'Giá trị'], ['donGiaPoint', 70000]] };
  const { mt, kq } = chay(cacTab, null, 'khoiTaoKhungCauHinh');
  assert.deepEqual([...kq.giuNguyen].sort(), ['CH_Bac', 'CH_ThamSo']);
  assert.deepEqual(plain(mt.ss.getSheetByName('CH_Bac').data), cacTab.CH_Bac);
  assert.deepEqual(plain(mt.ss.getSheetByName('CH_ThamSo').data), cacTab.CH_ThamSo);
  assert.equal(mt.nhatKy.some((n) => ['CH_Bac', 'CH_ThamSo'].includes(n.tab)), false, 'không có thao tác nào lên tab đã có');
});

test('6.4 khởi tạo xong thì chạy "Tính kỳ" ngay không lỗi cấu hình (chỉ báo thiếu kỳ)', () => {
  const mt = taoMoiTruong({});
  const c = nap(mt.globals);
  c.khoiTaoKhungCauHinh();
  const kq = c.tinhKyTuMenu();
  assert.equal(kq.daGhi, true);
  const g = mt.ss.getSheetByName('KetQua').getDataRange().getValues();
  assert.ok(g.some((d) => d[0] === 'KY_THIEU'), 'chưa chọn tháng nên báo thiếu kỳ');
  assert.equal(g.some((d) => d[0] === 'THIEU_TAB'), false);
});

// ---------------------------------------------------------------- 6.5 không gọi ra ngoài
function docNguon() {
  const ra = {};
  for (const thuMuc of ['core', 'sheet']) {
    for (const ten of fs.readdirSync(path.join(__dirname, '..', 'src', thuMuc))) {
      ra[`${thuMuc}/${ten}`] = fs.readFileSync(path.join(__dirname, '..', 'src', thuMuc, ten), 'utf8');
    }
  }
  return ra;
}

test('6.5 mã nguồn không có API gọi ra ngoài hay thực thi động', () => {
  const cam = ['UrlFetchApp', 'MailApp', 'GmailApp', 'fetch(', 'eval(', 'new Function', 'XMLHttpRequest', 'require(', 'ScriptApp', 'CalendarApp',
    'DocumentApp', 'SlidesApp', 'FormApp', 'UrlFetch', 'LockService', 'PropertiesService', 'CacheService', 'ContentService', 'XmlService',
    'createTemplate', 'createHtmlOutputFromFile', 'createTemplateFromFile', 'evaluate(', 'getBlob', 'XFrameOptionsMode',
    'setSharing', 'createFile', 'makeCopy', 'addEditor', 'addViewer', 'openById', 'openByUrl'];
  for (const [tep, nd] of Object.entries(docNguon())) {
    for (const t of cam) assert.equal(nd.includes(t), false, `${tep} chứa "${t}"`);
  }
});

test('6.5 chỉ dùng đúng các hàm Apps Script cần thiết', () => {
  const cho = {
    SpreadsheetApp: ['getActiveSpreadsheet', 'getUi'],
    DriveApp: ['getFileById'],
    HtmlService: ['createHtmlOutput'],
    Utilities: ['formatDate']
  };
  for (const [tep, nd] of Object.entries(docNguon())) {
    for (const [doiTuong, ds] of Object.entries(cho)) {
      for (const m of nd.matchAll(new RegExp(`${doiTuong}\\.(\\w+)`, 'g'))) {
        assert.ok(ds.includes(m[1]), `${tep} dùng ${doiTuong}.${m[1]} ngoài danh sách cho phép`);
      }
    }
  }
});

test('6.5 chỉ các tệp gas*.js được gọi API Apps Script (phần còn lại là hàm thuần)', () => {
  for (const [tep, nd] of Object.entries(docNguon())) {
    if (/^sheet\/gas[\w-]*\.js$/.test(tep)) continue;
    assert.equal(/\b(SpreadsheetApp|DriveApp|Utilities)\b/.test(nd.replace(/\/\/.*$/gm, '')), false, `${tep} gọi API Apps Script`);
  }
});

test('6.5 không có package.json phụ thuộc thư viện ngoài', () => {
  const p = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(p)) return;
  const pj = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.deepEqual(Object.keys(pj.dependencies || {}), []);
});

test('6.5 kết quả tính không phụ thuộc vào việc gọi mạng: toàn bộ chạy được khi chỉ có ba đối tượng giả', () => {
  const mt = taoMoiTruong(tabs());
  const c = nap(mt.globals);
  assert.doesNotThrow(() => c.tinhKyTuMenu());
});

test('5.2 HtmlService chỉ xuất hiện trong gas-giaodien.js (và chỉ createHtmlOutput)', () => {
  for (const [tep, nd] of Object.entries(docNguon())) {
    const khongChuThich = nd.replace(/\/\/.*$/gm, '');
    const coDung = /\bHtmlService\b/.test(khongChuThich);
    assert.equal(coDung, tep === 'sheet/gas-giaodien.js', `${tep}: HtmlService ${coDung ? 'có' : 'không có'} mặt`);
  }
});

test('5.2 quét tĩnh có hiệu lực: thêm tạm một lời gọi cấm vào mã thì bị bắt', () => {
  const cam = ['UrlFetchApp', 'MailApp', 'HtmlService.createTemplate'];
  const doiTuong = nd => cam.filter((t) => nd.includes(t));
  assert.deepEqual(doiTuong('var x = UrlFetchApp.fetch(u); MailApp.sendEmail(a);'), ['UrlFetchApp', 'MailApp']);
  assert.deepEqual(doiTuong(Object.values(docNguon()).join('\n')).filter((t) => t !== 'HtmlService.createTemplate'), []);
});

test('11.1 thao tác ghi Sheet chỉ nằm trong các tệp gas*.js; FileReader chỉ ở trang và chỉ đọc văn bản', () => {
  const thaoTacGhi = [/\.setValues\(/, /\.insertSheet\(/, /\.setNumberFormat\(/, /\.setFontWeight\(/, /\.setColumnWidth\(/, /\.setName\(/, /\.protect\(/, /\.deleteSheet\(/, /\.setActiveSheet\(/];
  for (const [tep, nd] of Object.entries(docNguon())) {
    const khongChuThich = nd.replace(/\/\/.*$/gm, '');
    if (!/^sheet\/gas[\w-]*\.js$/.test(tep)) {
      for (const re of thaoTacGhi) assert.equal(re.test(khongChuThich), false, `${tep} ghi Sheet (${re}) ngoài tệp gas*.js`);
    }
    const coFileReader = /\bFileReader\b/.test(khongChuThich);
    assert.equal(coFileReader, tep === 'sheet/giaodienhtml.js', `${tep}: FileReader ${coFileReader ? 'có' : 'không có'} mặt`);
    for (const cam of ['readAsDataURL', 'readAsArrayBuffer', 'readAsBinaryString']) assert.equal(nd.includes(cam), false, `${tep} chứa ${cam}`);
  }
});

test('11.1 mọi hàm máy chủ trang được gọi đều là hàm toàn cục thật trong bản gộp', () => {
  const c = nap(taoMoiTruong(tabs()).globals);
  for (const ten of c.HAM_MAY_CHU_GIAO_DIEN) assert.equal(typeof c[ten], 'function', ten);
});
