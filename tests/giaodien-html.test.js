'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { FakeDocument, taoGoogleGia, nutCoChu, tatCaChu } = require('./fake-dom');

const c = nap();
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const T = '2026-10-14 08:00:00';
const CHIA_SE_ON = { mucDo: 'on', ma: 'CHIA_SE_RIENG_TU', thongDiep: '' };
const dongCM = (ky, tt, o = {}) => ({ ky, trangThai: tt, thoiDiem: T, tong: 75838000, soDaTinh: 6, soBoQua: 0, tenTab: 'Chot_' + ky, lyDo: '', dong: 2, ...o });

function moHinh(bo = 'bo1', sua, chiMuc = []) {
  const t = tabs(bo); if (sua) sua(t);
  const kq = c.tinhKyTuCacTab(t, T);
  return plain(c.taoMoHinhGiaoDien(kq, { chiaSe: CHIA_SE_ON, tabs: c.tinhTrangTab(t, kq.khuVuc), chiMuc, thang: kq.ky ? kq.ky.thang : null }));
}
const moHinhChuaTinh = () => {
  const t = tabs();
  const kq = c.tinhKyTuCacTab(t, T);
  return plain(c.taoMoHinhChuaTinh({ chiaSe: CHIA_SE_ON, tabs: c.tinhTrangTab(t, kq.khuVuc), chiMuc: [], thang: '2026-09' }));
};
const thieuHaiNguoi = (t) => { t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); };

// Mở trang với DOM giả; moHinhDau là kết quả của giaoDienLayMoHinh (đã trả về).
function mo(moHinhDau) {
  const doc = new FakeDocument();
  const { gg, goi } = taoGoogleGia();
  c.maKhachGiaoDien(doc, gg);
  assert.equal(goi[0].ten, 'giaoDienLayMoHinh', 'trang tự lấy mô hình khi mở');
  goi.shift().thanhCong(moHinhDau);
  return { doc, goi };
}
const chuyenMan = (doc, ten) => { assert.ok(nutCoChu(doc, ten).length >= 1, `không thấy nút ${ten}`); nutCoChu(doc, ten)[0].click(); };

// ---------------------------------------------------------------- 4.2 quét tĩnh trang
test('4.2 trang không có địa chỉ http:// hay https://, không thẻ nhúng tài nguyên ngoài', () => {
  const trang = c.taoTrangGiaoDien();
  assert.equal(/https?:\/\//i.test(trang), false, 'có địa chỉ ngoài');
  for (const cam of ['<link', '<img', '<iframe', '<embed', '<object', ' src=', 'url(', '@import', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'importScripts']) {
    assert.equal(trang.includes(cam), false, `trang chứa "${cam}"`);
  }
  assert.equal((trang.match(/<script/g) || []).length, 1, 'đúng một thẻ script nội tuyến');
  assert.equal(trang.includes('script.run'), true, 'gọi máy chủ qua google.script.run');
  assert.ok(trang.includes(')(document, google);'), 'trang truyền document và google vào hàm');
});

test('4.2 mã khách không dùng cách đưa chuỗi thành mã: innerHTML, outerHTML, document.write, eval, new Function, setTimeout chuỗi', () => {
  const ma = c.maKhachGiaoDien.toString();
  for (const cam of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'Function(', 'setTimeout', 'setInterval', 'window.open', 'location', 'cookie', 'localStorage']) {
    assert.equal(ma.includes(cam), false, `mã khách chứa "${cam}"`);
  }
  const trang = c.taoTrangGiaoDien();
  assert.equal(trang.includes('innerHTML'), false);
});

test('4.2 trang dùng đúng họ phông hệ thống và màu Sapo; chữ theo câu (không viết hoa toàn bộ)', () => {
  const css = c.CSS_GIAO_DIEN;
  assert.ok(css.includes('system-ui'));
  assert.equal(/\bInter\b|googleapis|gstatic|@font-face/i.test(css), false, 'không tải phông ngoài');
  for (const mau of ['#007AFF', '#16D865', '#F0F4F9', '#0F1437']) assert.ok(css.includes(mau), mau);
  assert.equal(css.includes('uppercase'), false, 'không dùng chữ viết hoa toàn bộ');
});

test('4.2 danh sách hàm máy chủ ở trang khớp danh sách của máy chủ', () => {
  const ma = c.maKhachGiaoDien.toString();
  const m = /var HAM_GOI_DUOC = \[([^\]]*)\]/.exec(ma);
  const ds = m[1].split(',').map((x) => x.trim().replace(/'/g, ''));
  assert.deepEqual(ds, [...c.HAM_MAY_CHU_GIAO_DIEN]);
});

test('4.2 trang là một chuỗi cố định: không lắp dữ liệu nào vào trang', () => {
  assert.equal(c.taoTrangGiaoDien(), c.taoTrangGiaoDien());
  assert.equal(c.taoTrangGiaoDien().length > 5000, true);
});

// ---------------------------------------------------------------- 4.3 hiển thị
test('4.3 tổng quan bộ 1: tổng, số người, từng thành viên đúng chữ', () => {
  const { doc } = mo(moHinh());
  const chu = tatCaChu(doc);
  assert.ok(chu.includes('Tính point và thu nhập tạm tính - Team QL&PTTB'));
  assert.ok(chu.includes('Kỳ 2026-09'));
  assert.ok(chu.includes('Đề xuất – chờ duyệt'));
  assert.ok(chu.includes('75.838.000đ'));
  assert.ok(chu.includes('6/6 người'));
  assert.ok(chu.includes('Nhân viên E') && chu.includes('16.043.000đ'));
  assert.ok(chu.includes('Đủ dữ liệu'));
});

test('4.3 tên chứa thẻ HTML hiển thị như chữ, không tạo phần tử ảnh và không dùng innerHTML', () => {
  const m = moHinh();
  m.thanhVien[0].ten = '<img src=x onerror=alert(1)>';
  m.loi = [{ ma: 'X', chan: '', thongDiep: '<script>alert(2)</script>' }];
  const { doc } = mo(m);
  assert.ok(tatCaChu(doc).includes('<img src=x onerror=alert(1)>'));
  chuyenMan(doc, 'Kết quả');
  assert.ok(tatCaChu(doc).includes('<script>alert(2)</script>'));
  assert.equal(doc.goc.tim((n) => ['img', 'script', 'iframe', 'a'].includes(n.tag)).length, 0, 'không có phần tử ảnh, script, iframe hay liên kết nào');
  assert.equal(tatCaChu(doc).includes('Lỗi xử lý'), false, 'không có lỗi do dùng thuộc tính bị cấm');
});

test('4.3 ô chưa tính hiện "—" và không hiện 0đ', () => {
  const { doc } = mo(moHinh('bo1', thieuHaiNguoi));
  const hangA = doc.goc.tim((n) => n.tag === 'tr' && n.textContent.includes('Nhân viên A'))[0];
  assert.ok(hangA.textContent.includes('—'));
  assert.equal(hangA.textContent.includes('0đ'), false);
  assert.ok(hangA.textContent.includes('Point: đủ'));
  assert.ok(hangA.textContent.includes('Key metrics: thiếu'));
  assert.ok(tatCaChu(doc).includes('Chưa đủ dữ liệu'));
});

test('4.3 người chỉ theo dõi point hiện chip key metrics không áp dụng', () => {
  const { doc } = mo(moHinh());
  const hangD = doc.goc.tim((n) => n.tag === 'tr' && n.textContent.includes('Nhân viên D'))[0];
  assert.ok(hangD.textContent.includes('Key metrics: không áp dụng'));
  assert.ok(hangD.textContent.includes('Point: đủ'));
  chuyenMan(doc, 'Kết quả');
  assert.ok(tatCaChu(doc).includes('Không tính (chỉ theo dõi point)'));
});

test('4.3 màn Kết quả: bảng, tổng nhóm, tổng team, lỗi, cảnh báo, đối soát; định dạng tiền và phần trăm', () => {
  const { doc } = mo(moHinh());
  chuyenMan(doc, 'Kết quả');
  const chu = tatCaChu(doc);
  for (const can of ['Tổng nhóm: Đảm bảo an toàn thiết bị', 'cộng của 5/5 người', 'Tổng team', '75.838.000đ', 'Lỗi (0)', 'Cảnh báo (8)', 'Đối soát', 'Đạt', '35%', '101,0%', '9.800.000đ', '16.043.000đ']) {
    assert.ok(chu.includes(can), `thiếu "${can}"`);
  }
  assert.ok(chu.includes('Không có lỗi.'));
});

test('10.1 màn Tổng quan gộp tình trạng tab: theo nhóm, có số dòng; không còn mục Dữ liệu', () => {
  const { doc } = mo(moHinh());
  const chu = tatCaChu(doc);
  for (const can of ['Cấu hình', 'Nhập tay mỗi kỳ', 'Báo cáo kiểm kê', 'CH_ThanhVien', 'Có dữ liệu (7 dòng)', 'KiemKe_HN', 'Trống']) assert.ok(chu.includes(can), `thiếu "${can}"`);
  assert.equal(nutCoChu(doc, 'Dữ liệu').length, 0);
});

test('10.1 thanh điều hướng có đúng bảy mục theo thứ tự prototype', () => {
  const { doc } = mo(moHinh());
  const muc = doc.goc.tim((n) => n.tag === 'button' && n.className.includes('nut-dieu-huong')).map((n) => n.textContent);
  assert.deepEqual(muc, ['Tổng quan', 'Nhập point', 'Nhập key metrics', 'Kết quả', 'Duyệt và lưu', 'Lịch sử', 'Cấu hình']);
});

test('4.3 trạng thái rỗng: chưa tính thì màn Kết quả và Duyệt có nút "Tính kỳ"', () => {
  const { doc } = mo(moHinhChuaTinh());
  assert.ok(tatCaChu(doc).includes('Chưa có kết quả cho kỳ này'));
  assert.ok(nutCoChu(doc, 'Tính kỳ').length >= 1);
  chuyenMan(doc, 'Kết quả');
  assert.ok(tatCaChu(doc).includes('Chưa có kết quả.'));
  assert.ok(nutCoChu(doc, 'Tính kỳ').length >= 1);
  chuyenMan(doc, 'Duyệt và lưu');
  assert.ok(tatCaChu(doc).includes('Chưa có kết quả để duyệt'));
});

test('4.3 màn Lịch sử rỗng', () => {
  const { doc } = mo(moHinh());
  chuyenMan(doc, 'Lịch sử');
  assert.ok(tatCaChu(doc).includes('Chưa có kỳ nào được chốt.'));
});

test('4.3 màn Lịch sử có kỳ đã chốt: tổng, số người, lý do', () => {
  const m = moHinh('bo1', null, [dongCM('2026-08', 'Đã chốt'), dongCM('2026-08', 'Đã mở lại', { lyDo: 'sửa doanh thu' })]);
  const { doc } = mo(m);
  chuyenMan(doc, 'Lịch sử');
  const chu = tatCaChu(doc);
  assert.ok(chu.includes('2026-08') && chu.includes('75.838.000đ') && chu.includes('sửa doanh thu'));
});

test('4.3 cảnh báo chia sẻ rộng hiện ngay ở đầu trang', () => {
  const m = moHinh();
  m.chiaSe = { mucDo: 'chan', ma: 'CHIA_SE_RONG', thongDiep: 'Sheet đang chia sẻ rộng, hãy đặt Bị hạn chế.' };
  const { doc } = mo(m);
  assert.ok(tatCaChu(doc).includes('Sheet đang chia sẻ rộng'));
});

test('4.3 kỳ đã chốt: chip trạng thái là Đã chốt', () => {
  const { doc } = mo(moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt')]));
  assert.equal(doc.goc.tim((n) => n.tag === 'span' && n.textContent === 'Đã chốt').length >= 1, true);
});

// ---------------------------------------------------------------- 4.4 hành vi
test('4.4 chuyển màn: bấm một mục điều hướng thì màn tương ứng hiện, màn khác ẩn', () => {
  const { doc } = mo(moHinh());
  assert.ok(tatCaChu(doc).includes('Thành viên trong kỳ'));
  chuyenMan(doc, 'Lịch sử');
  assert.ok(tatCaChu(doc).includes('Lịch sử các kỳ đã chốt'));
  assert.equal(tatCaChu(doc).includes('Thành viên trong kỳ'), false);
  chuyenMan(doc, 'Tổng quan');
  assert.ok(tatCaChu(doc).includes('Thành viên trong kỳ'));
  const dangChon = doc.goc.tim((n) => n.tag === 'button' && n.className.includes('dang-chon'));
  assert.equal(dangChon.length, 1);
  assert.equal(dangChon[0].textContent, 'Tổng quan');
});

test('4.4 đang chạy thì các nút hành động bị vô hiệu cho đến khi xong', () => {
  const { doc, goi } = mo(moHinh());
  chuyenMan(doc, 'Kết quả');
  const nutTinh = nutCoChu(doc, 'Tính lại')[0];
  assert.equal(nutTinh.disabled, false);
  nutTinh.click();
  assert.equal(goi.length, 1);
  assert.equal(goi[0].ten, 'giaoDienTinh');
  assert.ok(tatCaChu(doc).includes('Đang xử lý'));
  assert.equal(nutCoChu(doc, 'Tính lại')[0].disabled, true, 'nút bị vô hiệu khi đang chạy');
  nutCoChu(doc, 'Tính lại')[0].click();
  assert.equal(goi.length, 1, 'bấm khi đang chạy không gọi thêm máy chủ');
  goi[0].thanhCong({ ok: true, moHinh: moHinh() });
  assert.equal(nutCoChu(doc, 'Tính lại')[0].disabled, false);
  assert.ok(tatCaChu(doc).includes('Đã tính xong'));
});

test('4.4 máy chủ từ chối tính: hiện thông điệp tiếng Việt', () => {
  const { doc, goi } = mo(moHinhChuaTinh());
  nutCoChu(doc, 'Tính kỳ')[0].click();
  goi[0].thanhCong({ ok: false, thongDiep: 'Không tính được.\n\nSheet đang chia sẻ rộng.' });
  assert.ok(tatCaChu(doc).includes('Sheet đang chia sẻ rộng.'));
});

test('4.4 lỗi máy chủ (ngoại lệ) hiện bằng tiếng Việt và mở khoá nút', () => {
  const { doc, goi } = mo(moHinhChuaTinh());
  nutCoChu(doc, 'Tính kỳ')[0].click();
  goi[0].thatBai(new Error('Exception: không có quyền'));
  assert.ok(tatCaChu(doc).includes('Có lỗi khi chạy: Exception: không có quyền'));
  assert.equal(nutCoChu(doc, 'Tính kỳ')[0].disabled, false);
});

test('4.4 duyệt khi mọi người đã tính: nút bật ngay, có hộp xác nhận trước khi gọi máy chủ', () => {
  const { doc, goi } = mo(moHinh());
  chuyenMan(doc, 'Duyệt và lưu');
  const nutDuyet = nutCoChu(doc, 'Xác nhận duyệt')[0];
  assert.equal(nutDuyet.disabled, false);
  assert.ok(tatCaChu(doc).includes('Mọi thành viên đã tính được'));
  nutDuyet.click();
  assert.equal(goi.length, 0, 'chưa gọi máy chủ trước khi xác nhận');
  assert.ok(tatCaChu(doc).includes('Duyệt và chốt kỳ 2026-09?'));
  nutCoChu(doc, 'Hủy')[0].click();
  assert.equal(goi.length, 0);
  assert.equal(tatCaChu(doc).includes('Duyệt và chốt kỳ 2026-09?'), false, 'hộp xác nhận đóng khi hủy');
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.equal(goi.length, 1);
  assert.equal(goi[0].ten, 'giaoDienDuyet');
  assert.deepEqual(plain(goi[0].tham), [[]]);
});

test('4.4 còn người chưa tính: nút duyệt chỉ bật khi tick đủ từng người, và gửi đúng danh sách', () => {
  const { doc, goi } = mo(moHinh('bo1', thieuHaiNguoi));
  chuyenMan(doc, 'Duyệt và lưu');
  const o = () => doc.goc.tim((n) => n.tag === 'input' && n.attrs.type === 'checkbox');
  assert.equal(o().length, 2);
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);
  assert.ok(tatCaChu(doc).includes('Còn 2 người chưa được xác nhận bỏ qua'));
  o()[0].checked = true; o()[0].phat('change');
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);
  assert.ok(tatCaChu(doc).includes('Còn 1 người chưa được xác nhận bỏ qua'));
  o()[1].checked = true; o()[1].phat('change');
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, false);
  assert.ok(tatCaChu(doc).includes('Sẵn sàng duyệt'));
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.equal(goi[0].ten, 'giaoDienDuyet');
  assert.deepEqual(plain(goi[0].tham[0]), ['nva1', 'nvb2']);
});

test('4.4 có điều kiện chặn (đã chốt, đối soát lệch...): nút duyệt bị vô hiệu và nêu lý do', () => {
  const { doc } = mo(moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt')]));
  chuyenMan(doc, 'Duyệt và lưu');
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true);
  assert.ok(tatCaChu(doc).includes('đã được chốt'));
  assert.ok(tatCaChu(doc).includes('Không thể duyệt'));
});

test('4.4 duyệt thành công: hiện thông báo, cập nhật mô hình và xoá các tick', () => {
  const { doc, goi } = mo(moHinh());
  chuyenMan(doc, 'Duyệt và lưu');
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  goi[0].thanhCong({ daChot: true, ky: '2026-09', tong: 75838000, soDaTinh: 6, soBoQua: 0, moHinh: moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt')]) });
  assert.ok(tatCaChu(doc).includes('Đã chốt kỳ 2026-09. Tổng đã duyệt 75.838.000đ (6 người đã tính, 0 người bỏ qua).'));
  assert.equal(nutCoChu(doc, 'Xác nhận duyệt')[0].disabled, true, 'sau khi chốt không duyệt lại được');
});

test('4.4 duyệt bị máy chủ từ chối: hiện lý do, không báo thành công', () => {
  const { doc, goi } = mo(moHinh());
  chuyenMan(doc, 'Duyệt và lưu');
  nutCoChu(doc, 'Xác nhận duyệt')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  goi[0].thanhCong({ daChot: false, lyDo: [{ ma: 'DOI_SOAT_LECH', thongDiep: 'Đối soát lệch ở nguồn baoHanh.' }], moHinh: moHinh() });
  assert.ok(tatCaChu(doc).includes('Không chốt được. Đối soát lệch ở nguồn baoHanh.'));
  assert.equal(tatCaChu(doc).includes('Đã chốt kỳ'), false);
});

test('4.4 mở lại kỳ: nút chỉ có ở dòng được phép, có hộp nhập lý do, gửi đúng kỳ và lý do', () => {
  const m = moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt')]);
  const { doc, goi } = mo(m);
  chuyenMan(doc, 'Lịch sử');
  assert.equal(nutCoChu(doc, 'Mở lại kỳ').length, 1);
  nutCoChu(doc, 'Mở lại kỳ')[0].click();
  assert.equal(goi.length, 0);
  assert.ok(tatCaChu(doc).includes('Mở lại kỳ 2026-09?'));
  const o = doc.goc.tim((n) => n.tag === 'textarea')[0];
  o.value = 'sửa doanh thu nhóm'; o.phat('input');
  nutCoChu(doc, 'Đồng ý')[0].click();
  assert.equal(goi[0].ten, 'giaoDienMoLai');
  assert.deepEqual(plain(goi[0].tham), ['2026-09', 'sửa doanh thu nhóm']);
  goi[0].thanhCong({ daMoLai: true, ky: '2026-09', tenTabCu: 'Chot_2026-09_cu1', moHinh: moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt'), dongCM('2026-09', 'Đã mở lại')]) });
  assert.ok(tatCaChu(doc).includes('Đã mở lại kỳ 2026-09. Bản chốt cũ được giữ ở tab Chot_2026-09_cu1.'));
  assert.equal(nutCoChu(doc, 'Mở lại kỳ').length, 0, 'sau khi mở lại không còn nút');
});

test('4.4 mở lại bị từ chối (thiếu lý do) hiện thông điệp của máy chủ', () => {
  const { doc, goi } = mo(moHinh('bo1', null, [dongCM('2026-09', 'Đã chốt')]));
  chuyenMan(doc, 'Lịch sử');
  nutCoChu(doc, 'Mở lại kỳ')[0].click();
  nutCoChu(doc, 'Đồng ý')[0].click();
  goi[0].thanhCong({ daMoLai: false, lyDo: 'THIEU_LY_DO', thongDiep: 'Cần nhập lý do khi mở lại kỳ.', moHinh: null });
  assert.ok(tatCaChu(doc).includes('Cần nhập lý do khi mở lại kỳ.'));
});

test('4.4 mở tab: gọi đúng hàm với đúng tên tab; tab thiếu thì nút bị vô hiệu', () => {
  const t = tabs(); delete t.CH_ChiSo;
  const m = plain(c.taoMoHinhGiaoDien(c.tinhKyTuCacTab(t, T), { chiaSe: CHIA_SE_ON, tabs: c.tinhTrangTab(t, [{ ma: 'HN', tabBaoCao: 'KiemKe_HN' }]), chiMuc: [], thang: '2026-09' }));
  const { doc, goi } = mo(m);
  const hangThieu = doc.goc.tim((n) => n.tag === 'tr' && n.textContent.startsWith('CH_ChiSo'))[0];
  assert.equal(hangThieu.tim((n) => n.tag === 'button')[0].disabled, true);
  const hang = doc.goc.tim((n) => n.tag === 'tr' && n.textContent.startsWith('CH_Bac'))[0];
  hang.tim((n) => n.tag === 'button')[0].click();
  assert.equal(goi[0].ten, 'giaoDienMoTab');
  assert.deepEqual(plain(goi[0].tham), ['CH_Bac']);
  goi[0].thanhCong({ daMo: false, thongDiep: 'Không mở được tab.' });
  assert.ok(tatCaChu(doc).includes('Không mở được tab.'));
});

test('4.4 mọi lời gọi máy chủ qua các kịch bản đều thuộc danh sách cố định', () => {
  const cho = new Set(c.HAM_MAY_CHU_GIAO_DIEN);
  const { doc, goi } = mo(moHinh('bo1', thieuHaiNguoi));
  const ten = [];
  chuyenMan(doc, 'Kết quả'); nutCoChu(doc, 'Tính lại')[0].click(); ten.push(goi.shift().ten);
  assert.ok(ten.every((t) => cho.has(t)));
});

test('4.4 tick xác nhận và điều hướng giữa các màn chỉ xem không gọi máy chủ', () => {
  const { doc, goi } = mo(moHinh('bo1', thieuHaiNguoi));
  for (const m of ['Kết quả', 'Duyệt và lưu', 'Lịch sử', 'Tổng quan']) chuyenMan(doc, m);
  assert.equal(goi.length, 0);
});

test('10.1 vào màn có bộ soạn chỉ gọi đọc bảng, không gọi ghi', () => {
  const { doc, goi } = mo(moHinh());
  for (const m of ['Nhập point', 'Nhập key metrics', 'Cấu hình']) chuyenMan(doc, m);
  assert.ok(goi.length >= 1);
  assert.ok(goi.every((x) => x.ten === 'giaoDienDocBang'), goi.map((x) => x.ten).join());
});
