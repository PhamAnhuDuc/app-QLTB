'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { taoBangChung, THU_MUC_RA } = require('./bang-chung-sua');

const bc = taoBangChung();
const b = bc['sua-bo1'];
const buoc = (i) => b.cacBuoc[i];

test('11.3 bằng chứng sửa dữ liệu đã được lưu và khớp kết quả hiện tại (chạy node tests/bang-chung-sua.js nếu lệch)', () => {
  const tep = path.join(THU_MUC_RA, 'sua-bo1.json');
  assert.ok(fs.existsSync(tep));
  assert.deepEqual(JSON.parse(fs.readFileSync(tep, 'utf8')), JSON.parse(JSON.stringify(b)));
});

test('11.3 sửa đơn giá chỉ ghi tab thông số và nhật ký; số tổng đổi và tab kết quả chưa được ghi', () => {
  assert.equal(buoc(0).ketQua.daLuu, true);
  assert.deepEqual(buoc(0).tabDuocGhi, ['CH_ThamSo', 'NhatKyHeThong']);
  assert.notEqual(buoc(0).tongTeam, 75838000);
  assert.equal(buoc(0).kyTuDo, true);
});

test('11.3 các thao tác bị từ chối không ghi gì và nêu đúng mã lỗi', () => {
  assert.deepEqual([buoc(1).ketQua.lyDo, buoc(1).soThaoTacGhi], [['O_SO_SAI'], 0]);
  assert.deepEqual([buoc(2).ketQua.lyDo, buoc(2).soThaoTacGhi], [['TONG_HE_SO'], 0]);
  assert.deepEqual([buoc(4).ketQua.lyDo, buoc(4).soThaoTacGhi], [['THIEU_COT'], 0]);
  assert.deepEqual(buoc(5).ketQua.lyDo, ['KHU_VUC_LA']);
  assert.deepEqual(buoc(7).ketQua.lyDo, ['KY_SAI']);
  assert.deepEqual(buoc(9).ketQua.lyDo, ['KHONG_CO_MAC_DINH']);
});

test('11.3 nhập báo cáo hợp lệ chỉ ghi tab của khu vực; kỳ đã chốt khoá bảng nhập tay nhưng cho sửa cấu hình kèm cảnh báo', () => {
  assert.deepEqual(buoc(3).tabDuocGhi, ['KiemKe_HN', 'NhatKyHeThong']);
  assert.deepEqual(buoc(11).ketQua.lyDo, ['KY_DA_CHOT']);
  assert.equal(buoc(12).ketQua.daLuu, true);
  assert.ok(buoc(12).ketQua.canhBao.includes('KY_DA_CHOT_SUA_CAU_HINH'));
});

test('11.3 nhật ký hệ thống chỉ có mã sự kiện, không lộ nội dung; không ô nào trở thành công thức', () => {
  assert.equal(b.cuoi.nhatKyHeThongKhongLoNoiDung, true);
  assert.deepEqual(b.cuoi.oCongThucTrongTabSua, [0, 0, 0, 0]);
  assert.equal(b.cuoi.tenDauBangLuuThanhChu, true);
  for (const ma of ['SUA_BANG_CAU_HINH', 'NHAP_BAO_CAO', 'DAT_KY', 'KHOI_PHUC_MAC_DINH', 'KY_DA_CHOT']) assert.ok(b.cuoi.nhatKyHeThongCacMa.includes(ma), ma);
});
