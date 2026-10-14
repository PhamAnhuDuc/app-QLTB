'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');
const { taoBangChung, THU_MUC, BO } = require('./bang-chung');

const c = nap();
const maLoi = (kq) => [...kq.loi].map((l) => l.ma);
const tvMap = (kq) => Object.fromEntries([...kq.thanhVien].map((r) => [r.taiKhoan, r]));

// ---------------------------------------------------------------- 6.1 gom lỗi, lỗi chỉ chặn phần phụ thuộc
test('6.1 bộ 3: gom đủ các lỗi chặn từ mọi bước trong một lần tính', () => {
  const kq = c.tinhKy(docFixture('bo3', 'config.json'), docFixture('bo3', 'ky.json'));
  const ma = maLoi(kq);
  for (const can of ['TONG_TY_TRONG', 'TONG_HE_SO', 'MA_HANG_LA', 'BAO_CAO_CHUA_PHU_KY', 'SO_LUONG_SAI', 'TAI_KHOAN_LA', 'LOAI_VIEC_LA', 'MUC_TIEU_SAI']) {
    assert.ok(ma.includes(can), `thiếu lỗi ${can}`);
  }
  assert.equal(kq.chanToanBo, false);
  assert.equal(kq.kyDuDuLieu, false);
});

test('6.1 bộ 3: lỗi mã hàng lạ ở Hà Nội không chặn TP.HCM (chặn riêng vì lý do khác)', () => {
  const kq = c.tinhKy(docFixture('bo3', 'config.json'), docFixture('bo3', 'ky.json'));
  const maLa = [...kq.loi].find((l) => l.ma === 'MA_HANG_LA');
  assert.equal(maLa.chan, 'nguon:xuatBanChuyenKho:hn');
  // TP.HCM chỉ bị chặn vì báo cáo chưa phủ kỳ; xác nhận thì quỹ tính được dù Hà Nội vẫn lỗi
  const ky = docFixture('bo3', 'ky.json');
  ky.xacNhanBaoCaoMotPhan = { HCM: true };
  const kq2 = c.tinhKy(docFixture('bo3', 'config.json'), ky);
  assert.equal(kq2.quy.xuatBanChuyenKho.hn.quy, null);
  assert.ok(kq2.quy.xuatBanChuyenKho.hcm.quy > 0, 'quỹ TP.HCM tính được');
});

test('6.1 bộ 3: người không bị lỗi nào chặn vẫn được tính trọn vẹn khi dữ liệu đủ', () => {
  const ky = docFixture('bo3', 'ky.json');
  ky.keyMetrics.find((m) => m.chiSo === 'tyLeHaiLong' && m.capDo === 'nhom').ketQua = 0.846; // bù dữ liệu trống
  ky.xacNhanBaoCaoMotPhan = { HCM: true };
  ky.baoHanh.HN = 300;
  ky.hoTroSale.HCM = 600;
  const cfg = docFixture('bo3', 'config.json');
  cfg.heSoChia.find((h) => h.nguon === 'baoHanh' && h.khuVuc === 'HCM' && h.taiKhoan === 'nvf6').heSo = 0.8;
  const b2 = cfg.thanhVien.find((t) => t.taiKhoan === 'nvb2');
  b2.chiSo[1].tyTrong = 0.35;
  b2.chiSo[2].tyTrong = 0.25;
  ky.kiemKe.HN.dong = ky.kiemKe.HN.dong.filter((d) => d.ma !== 'ABC-999' && !(d.ma === null && d.banRa > 0));
  const kq = c.tinhKy(cfg, ky);
  const t = tvMap(kq);
  assert.equal(t.nva1.trangThai, 'daTinh');
  assert.equal(t.nve5.trangThai, 'daTinh');
  // nvc3 vẫn bị chặn: loại việc lạ và mục tiêu doanh thu bằng 0
  assert.equal(t.nvc3.trangThai, 'chuaTinh');
});

test('6.1 không bao giờ bịa số: mọi người thiếu dữ liệu có thu nhập null, không phải 0', () => {
  const kq = c.tinhKy(docFixture('bo3', 'config.json'), docFixture('bo3', 'ky.json'));
  for (const r of kq.thanhVien) {
    if (r.trangThai !== 'daTinh') assert.equal(r.thuNhap, null, r.taiKhoan);
  }
  assert.equal(kq.tong.team.thuNhap, null, 'không ai tính được thì tổng không phải 0');
  assert.equal(kq.tong.team.ghiChu, 'cộng của 0/6 người');
});

test('6.1 đối soát không báo lệch giả khi một người bị chặn bởi dòng nhật ký lỗi', () => {
  const kq = c.tinhKy(docFixture('bo3', 'config.json'), docFixture('bo3', 'ky.json'));
  assert.ok([...kq.doiSoat].every((d) => d.dat));
});

test('6.1 lỗi cấu hình toàn bộ thì không tính gì và nói rõ', () => {
  const cfg = docFixture('bo1', 'config.json');
  cfg.thamSo.donGiaPoint = null;
  const kq = c.tinhKy(cfg, docFixture('bo1', 'ky.json'));
  assert.equal(kq.chanToanBo, true);
  assert.equal(kq.thanhVien.length, 0);
  assert.equal(kq.tong, null);
  assert.deepEqual(maLoi(kq), ['THIEU_THAM_SO']);
  assert.equal(kq.nhan, 'Đề xuất – chờ duyệt');
});

test('6.1 báo cáo xác nhận một phần kỳ thì thành cảnh báo, không còn là lỗi', () => {
  const ky = docFixture('bo1', 'ky.json');
  ky.kiemKe.HN.denNgay = '2026-09-14';
  const chua = c.tinhKy(docFixture('bo1', 'config.json'), ky);
  assert.ok(maLoi(chua).includes('BAO_CAO_CHUA_PHU_KY'));
  assert.equal(chua.kyDuDuLieu, false);
  ky.xacNhanBaoCaoMotPhan = { HN: true };
  const roi = c.tinhKy(docFixture('bo1', 'config.json'), ky);
  assert.equal(maLoi(roi).includes('BAO_CAO_CHUA_PHU_KY'), false);
  assert.ok([...roi.canhBao].some((x) => x.ma === 'BAO_CAO_CHUA_PHU_KY'));
  assert.equal(roi.kyDuDuLieu, true);
});

// ---------------------------------------------------------------- 6.2 log không chứa dữ liệu nhạy cảm
test('6.2 log chỉ gồm loại lỗi, trường liên quan, phạm vi và thời điểm', () => {
  const kq = c.tinhKy(docFixture('bo3', 'config.json'), docFixture('bo3', 'ky.json'));
  const log = c.taoLog(kq, '2026-10-14T00:00:00.000Z');
  assert.ok(log.length > 0);
  for (const d of log) {
    assert.deepEqual(Object.keys(d).sort(), ['ma', 'muc', 'phamVi', 'thoiDiem', 'truong']);
    assert.equal(d.thoiDiem, '2026-10-14T00:00:00.000Z');
  }
});

test('6.2 log không chứa tên, tài khoản, số tiền hay mã hàng', () => {
  const cfg = docFixture('bo3', 'config.json');
  const ky = docFixture('bo3', 'ky.json');
  const kq = c.tinhKy(cfg, ky);
  const noiDung = JSON.stringify(c.taoLog(kq, '2026-10-14T00:00:00.000Z'));
  // tên và tài khoản của mọi thành viên
  for (const t of cfg.thanhVien) {
    assert.equal(noiDung.includes(t.taiKhoan), false, `log lộ tài khoản ${t.taiKhoan}`);
    assert.equal(noiDung.includes(t.ten), false, `log lộ tên ${t.ten}`);
  }
  assert.equal(noiDung.includes('khongco'), false, 'tài khoản lạ trong nhật ký cũng không được ghi');
  assert.equal(noiDung.includes('ABC-999'), false, 'mã hàng không cần ghi');
  assert.equal(noiDung.includes('Việc lạ'), false, 'nội dung nhật ký không được ghi');
  // số tiền: lương cố định và phụ cấp
  for (const b of cfg.bac) assert.equal(noiDung.includes(String(b.luongCoDinh)), false);
  assert.equal(noiDung.includes(String(cfg.thamSo.phuCap)), false);
  // không có số lớn nào ngoài thời điểm
  const khongThoiDiem = noiDung.replace(/"thoiDiem":"[^"]*"/g, '');
  assert.equal(/\d{4,}/.test(khongThoiDiem), false, 'log không chứa số có từ 4 chữ số trở lên');
});

test('6.2 log của kỳ sạch (bộ 1) không có dòng lỗi, kể cả khi có thu nhập', () => {
  const kq = c.tinhKy(docFixture('bo1', 'config.json'), docFixture('bo1', 'ky.json'));
  const log = c.taoLog(kq, 't');
  assert.equal(log.filter((d) => d.muc === 'loi').length, 0);
  const noiDung = JSON.stringify(log);
  assert.equal(noiDung.includes('16043000'), false);
  assert.equal(noiDung.includes('75838000'), false);
});

test('6.2 log ghi tên trường (tham số, chỉ số) chứ không ghi giá trị', () => {
  const cfg = docFixture('bo1', 'config.json');
  cfg.thamSo.donGiaPoint = null;
  const kq = c.tinhKy(cfg, docFixture('bo1', 'ky.json'));
  const log = [...c.taoLog(kq, 't')];
  assert.deepEqual([...log[0].truong], ['thamSo=donGiaPoint']);
  assert.equal(log[0].phamVi, 'toanBo');
});

// ---------------------------------------------------------------- 6.3 bằng chứng ba bộ
test('6.3 bằng chứng ba bộ dữ liệu đã được lưu và khớp kết quả hiện tại', () => {
  const bc = taoBangChung();
  for (const bo of BO) {
    for (const hau of ['dau-vao', 'ket-qua']) {
      const tep = path.join(THU_MUC, `${bo.ten}-${hau}.json`);
      assert.ok(fs.existsSync(tep), `thiếu ${tep}; chạy node tests/bang-chung.js`);
      const daLuu = JSON.parse(fs.readFileSync(tep, 'utf8'));
      const hienTai = hau === 'dau-vao' ? bc[bo.ten].dauVao : bc[bo.ten].ketQua;
      assert.deepEqual(daLuu, hienTai, `${bo.ten}-${hau} lệch so với kết quả hiện tại; chạy lại node tests/bang-chung.js`);
    }
  }
});

test('6.3 bằng chứng: bộ 1 đạt đủ dữ liệu, bộ 3 báo lỗi rõ và không bịa số', () => {
  const bc = taoBangChung();
  assert.equal(bc.bo1.ketQua.kyDuDuLieu, true);
  assert.equal(bc.bo1.ketQua.tongTeam.thuNhap, 75838000);
  assert.equal(bc.bo2.ketQua.soLoi, 0);
  assert.equal(bc.bo3.ketQua.kyDuDuLieu, false);
  assert.ok(bc.bo3.ketQua.soLoi >= 8);
  assert.ok(bc.bo3.ketQua.thanhVien.every((r) => r.trangThai === 'daTinh' || r.thuNhap === null));
});
