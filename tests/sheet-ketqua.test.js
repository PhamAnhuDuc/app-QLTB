'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');

const c = nap();
const tabs = (bo = 'bo1') => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const plain = (x) => JSON.parse(JSON.stringify(x));
const TD = '2026-10-14 08:00:00';
const tinh = (t) => c.tinhKyTuCacTab(t, TD);
const dung = (t) => plain(c.dungKetQuaSheet(tinh(t)));
const tatCaO = (b) => b.giaTri.flat();
const timDong = (g, ten) => g.find((d) => d[0] === ten); // g là mảng các dòng
const timDongThanhVien = (b, ten) => b.giaTri.find((d) => d[1] === ten);

// ---------------------------------------------------------------- 5.1 bảng kết quả
test('5.1 nhãn, kỳ, trạng thái và thời điểm nằm ở đầu tab', () => {
  const ra = dung(tabs());
  const g = ra.ketQua.giaTri;
  assert.equal(g[0][0], 'Đề xuất – chờ duyệt');
  assert.deepEqual(g[1].slice(0, 2), ['Kỳ', '2026-09']);
  assert.deepEqual(g[2].slice(0, 2), ['Trạng thái dữ liệu', 'Đủ dữ liệu']);
  assert.deepEqual(g[3].slice(0, 2), ['Thời điểm tính', TD]);
});

test('5.1 bảng thành viên chia theo nhóm, có dòng tổng nhóm và tổng team "cộng của N/M người"', () => {
  const g = dung(tabs()).ketQua.giaTri;
  const tieuDe = g.findIndex((d) => d[0] === 'Nhóm' && d[1] === 'Thành viên');
  assert.ok(tieuDe > 0);
  assert.ok(g.some((d) => d[0] === 'Tổng nhóm: Đảm bảo an toàn thiết bị' && d[1] === 'cộng của 5/5 người'));
  assert.ok(g.some((d) => d[0] === 'Tổng nhóm: Quản lý kho' && d[1] === 'cộng của 1/1 người'));
  const team = timDong(g, 'Tổng team');
  assert.equal(team[1], 'cộng của 6/6 người');
  assert.equal(team[12], 75838000, 'tổng team bộ 1');
});

test('5.1 thu nhập từng người khớp lõi (nhân viên E, ghi đè lương, 16.043.000đ)', () => {
  const g = dung(tabs()).ketQua.giaTri;
  const e = timDongThanhVien({ giaTri: g }, 'Nhân viên E');
  assert.equal(e[12], 16043000);
  assert.equal(e[8], 10800000);
  assert.equal(e[13], 'Đã tính');
  const d = timDongThanhVien({ giaTri: g }, 'Nhân viên D (chủ sở hữu)');
  assert.equal(d[12], '—');
  assert.equal(d[13], 'Không tính (chỉ theo dõi point)');
});

test('5.1 người chưa đủ dữ liệu: ô thu nhập hiện "—", cột trạng thái có lý do, không có số 0', () => {
  const t = tabs();
  t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN'));
  const g = dung(t).ketQua.giaTri;
  const a = timDongThanhVien({ giaTri: g }, 'Nhân viên A');
  assert.equal(a[12], '—');
  assert.equal(a[9], '—');
  assert.ok(a[13].startsWith('Chưa tính:') && a[13].includes('Key metrics'));
  assert.equal(a[5], 30, 'thưởng vượt point của người đó vẫn tính được');
  assert.equal(a.includes(0), false, 'không có số 0 nào thay cho dữ liệu thiếu');
  const team = timDong(g, 'Tổng team');
  assert.equal(team[1], 'cộng của 4/6 người', 'cả hai thành viên khu vực HN đều dùng chỉ số bảo hành HN');
});

test('5.1 không ai tính được thì tổng team hiện "—", không phải 0', () => {
  const g = dung(tabs('bo3')).ketQua.giaTri;
  const team = timDong(g, 'Tổng team');
  assert.equal(team[12], '—');
  assert.equal(team[1], 'cộng của 0/6 người');
});

// ---------------------------------------------------------------- 5.2 lỗi, cảnh báo, đối soát, chặn toàn bộ
test('5.2 bộ 1: không có lỗi, có cảnh báo và bảng đối soát đều "Đạt"', () => {
  const g = dung(tabs()).ketQua.giaTri;
  assert.ok(g.some((d) => d[0] === 'LỖI (0)'));
  assert.ok(g.some((d) => String(d[0]).startsWith('CẢNH BÁO (')));
  const dsIdx = g.findIndex((d) => d[0] === 'ĐỐI SOÁT');
  assert.ok(dsIdx > 0);
  const dong = g.slice(dsIdx + 2).filter((d) => d[0] !== '');
  assert.ok(dong.length >= 7);
  assert.ok(dong.every((d) => d[5] === 'Đạt'));
});

test('5.2 đối soát lệch ghi nguồn, khu vực, quỹ, đã chia và độ lệch', () => {
  const t = tabs();
  const r = tinh(t);
  r.doiSoat.push({ nguon: 'baoHanh', khuVuc: 'HN', quy: 300, daChia: 290, lech: -10, dat: false });
  const g = plain(c.dungKetQuaSheet(r)).ketQua.giaTri;
  const d = g.find((x) => x[0] === 'baoHanh' && x[5] === 'Lệch');
  assert.deepEqual(d.slice(0, 6), ['baoHanh', 'HN', 300, 290, -10, 'Lệch']);
});

test('5.2 bộ 3: danh sách lỗi có mã, phạm vi chặn và thông điệp kèm tab, dòng', () => {
  const g = dung(tabs('bo3')).ketQua.giaTri;
  const idx = g.findIndex((d) => String(d[0]).startsWith('LỖI ('));
  const dong = g.slice(idx + 2).filter((d) => d[0] !== '' && !String(d[0]).startsWith('CẢNH BÁO'));
  const maHang = dong.find((d) => d[0] === 'MA_HANG_LA');
  assert.ok(maHang);
  assert.equal(maHang[1], 'nguon:xuatBanChuyenKho:hn');
  assert.ok(maHang[2].includes('tab KiemKe_HN') && maHang[2].includes('ABC-999'));
});

test('5.2 chặn toàn bộ do lỗi cấu hình: chỉ ghi nhãn, trạng thái và lỗi, không có bảng thành viên', () => {
  const t = tabs();
  delete t.CH_Bac;
  const g = dung(t).ketQua.giaTri;
  assert.equal(g[0][0], 'Đề xuất – chờ duyệt');
  assert.equal(g[2][1], 'Bị chặn, không tính được');
  assert.equal(g.some((d) => d[0] === 'Nhóm' && d[1] === 'Thành viên'), false);
  assert.equal(g.some((d) => d[0] === 'Tổng team'), false);
  assert.ok(g.some((d) => d[0] === 'THIEU_TAB'));
  assert.equal(dung(t).giaiThich.giaTri.length, 1, 'chỉ có dòng tiêu đề');
});

test('5.2 kỳ chưa chọn tháng: bị chặn và nêu lỗi', () => {
  const t = tabs(); t.Ky[1][1] = '';
  const r = tinh(t);
  assert.equal(r.chanToanBo, true);
  assert.ok([...r.loi].some((l) => l.ma === 'KY_THIEU'));
});

// ---------------------------------------------------------------- 5.3 giải thích
test('5.3 giải thích: mỗi thành viên có các bước tính theo đúng thứ tự', () => {
  const gt = dung(tabs()).giaiThich.giaTri;
  assert.deepEqual(gt[0], ['Thành viên', 'Bước', 'Nội dung']);
  const cuaE = gt.filter((d) => d[0] === 'Nhân viên E').map((d) => d[1]);
  const thuTu = ['point', 'point', 'point', 'point', 'pointTong', 'minMax', 'pointVuot', 'thuongVuot', 'chiSo', 'chiSo', 'chiSo', 'diemKM', 'thuongKM', 'phuCap', 'thuNhap'];
  assert.deepEqual(cuaE, thuTu);
  const cuoi = gt.filter((d) => d[0] === 'Nhân viên E').pop();
  assert.ok(cuoi[2].includes('16043000'));
});

test('5.3 người chưa tính có lý do thay vì số', () => {
  const t = tabs();
  t.KeyMetrics = t.KeyMetrics.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN'));
  const gt = dung(t).giaiThich.giaTri.filter((d) => d[0] === 'Nhân viên A');
  assert.ok(gt.at(-1)[2].startsWith('Chưa tính'));
});

// ---------------------------------------------------------------- 5.4 chống công thức
test('5.4 chuỗi bắt đầu bằng = + - @ được vô hiệu hoá bằng dấu nháy đơn; chuỗi thường không đổi', () => {
  for (const [vao, ra] of [['=HYPERLINK("x")', "'=HYPERLINK(\"x\")"], ['+1', "'+1"], ['-cmd', "'-cmd"], ['@sum', "'@sum"], ['Hà Nội', 'Hà Nội'], ['a=b', 'a=b'], ['', '']]) {
    assert.equal(c.lamSachChuoi(vao), ra);
  }
});

test('5.4 mã hàng "=HYPERLINK(...)" trong thông điệp lỗi không thành công thức trong tab kết quả', () => {
  const t = tabs();
  t.KiemKe_HN.splice(t.KiemKe_HN.length - 1, 0, [99, '=HYPERLINK("http://x")', 'Mã độc', 1, 1, 1, 5, 0, 0, 1]); // trước dòng chân bảng
  const ra = dung(t);
  const o = tatCaO(ra.ketQua).filter((x) => typeof x === 'string' && x.includes('HYPERLINK'));
  assert.ok(o.length >= 1);
  assert.equal(o.some((x) => /^[=+\-@]/.test(x)), false, 'không ô nào bắt đầu bằng ký tự công thức');
});

test('5.4 tên thành viên bắt đầu bằng dấu bằng cũng được vô hiệu hoá', () => {
  const t = tabs();
  t.CH_ThanhVien[1][1] = '=1+1';
  const g = dung(t).ketQua.giaTri;
  assert.ok(g.some((d) => d[1] === "'=1+1"));
});

test('5.4 các ô văn bản được liệt kê theo ký hiệu A1 để đặt định dạng văn bản trước khi ghi', () => {
  const ra = dung(tabs());
  assert.ok(ra.ketQua.oVanBan.includes('A1'));
  assert.ok(ra.ketQua.oVanBan.every((a) => /^[A-Z]+\d+$/.test(a)));
  assert.equal(c.chuoiCot(0), 'A');
  assert.equal(c.chuoiCot(25), 'Z');
  assert.equal(c.chuoiCot(26), 'AA');
  // ô số không bị đánh dấu văn bản
  const g = ra.ketQua.giaTri;
  const d = timDongThanhVien({ giaTri: g }, 'Nhân viên E');
  const hang = g.indexOf(d) + 1;
  assert.equal(ra.ketQua.oVanBan.includes('M' + hang), false, 'cột thu nhập là số');
});

// ---------------------------------------------------------------- 5.5 nhật ký hệ thống
test('5.5 nhật ký lỗi mã hàng lạ ghi loại lỗi và phạm vi, không ghi mã hàng', () => {
  const dong = dung(tabs('bo3')).dongNhatKy;
  const r = dong.find((d) => d[2] === 'MA_HANG_LA');
  assert.ok(r);
  assert.equal(r[0], TD);
  assert.equal(r[1], 'loi');
  assert.equal(r[4], 'nguon');
  const noiDung = JSON.stringify(dong);
  assert.equal(noiDung.includes('ABC-999'), false);
  assert.equal(noiDung.includes('KiemKe_HN'), false, 'tên tab cũng không cần ghi');
});

test('5.5 nhật ký không chứa tên, tài khoản, số tiền hay nội dung nhật ký công việc', () => {
  const t = tabs('bo3');
  const noiDung = JSON.stringify(dung(t).dongNhatKy);
  for (const m of t.CH_ThanhVien.slice(1)) {
    assert.equal(noiDung.includes(m[0]), false, `lộ tài khoản ${m[0]}`);
    assert.equal(noiDung.includes(m[1]), false, `lộ tên ${m[1]}`);
  }
  assert.equal(noiDung.includes('khongco'), false);
  assert.equal(noiDung.includes('Việc lạ'), false);
  assert.equal(/\d{4,}/.test(noiDung.replace(/"\d{4}-\d{2}-\d{2} [\d:]+"/g, '')), false, 'không có số có từ 4 chữ số trở lên ngoài thời điểm');
});

test('5.5 tính thành công: nhật ký không chứa số tiền nào của kết quả', () => {
  const dong = dung(tabs()).dongNhatKy;
  const noiDung = JSON.stringify(dong);
  for (const so of ['16043000', '75838000', '9800000', '10800000']) assert.equal(noiDung.includes(so), false);
  assert.equal(dong.filter((d) => d[1] === 'loi').length, 0);
});

test('5.5 tiêu đề nhật ký hệ thống', () => {
  assert.deepEqual([...c.TIEU_DE_NHAT_KY_HE_THONG], ['Thời điểm', 'Mức', 'Loại lỗi', 'Trường liên quan', 'Phạm vi']);
});
