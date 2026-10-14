'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { taoBangChung, THU_MUC_RA } = require('./bang-chung-chot');

const bc = taoBangChung();

test('6.2 bằng chứng chốt kỳ đã được lưu và khớp kết quả hiện tại (chạy node tests/bang-chung-chot.js nếu lệch)', () => {
  for (const ten of Object.keys(bc)) {
    const tep = path.join(THU_MUC_RA, `${ten}.json`);
    assert.ok(fs.existsSync(tep), `thiếu ${ten}.json`);
    assert.deepEqual(JSON.parse(fs.readFileSync(tep, 'utf8')), JSON.parse(JSON.stringify(bc[ten])), `${ten}.json lệch`);
  }
});

test('6.2 bộ 1: chốt, cảnh báo khi tính lại, từ chối chốt lại, mở lại, chốt lại', () => {
  const b = bc['chot-bo1'];
  const buoc = (i) => b.cacBuoc[i].ketQua;
  assert.equal(buoc(0).daChot, true);
  assert.equal(buoc(0).tong, 75838000);
  assert.ok(buoc(1).canhBaoKyDaChot[0].includes('KHÁC bản chốt ở 2 người'));
  assert.deepEqual(buoc(2).lyDo, ['KY_DA_CHOT', 'THIEU_XAC_NHAN'], 'cả hai lý do cùng hiện: đã chốt, và hai người mới thiếu dữ liệu');
  assert.equal(buoc(3).daMoLai, true);
  assert.equal(buoc(4).daChot, true);
  assert.equal(buoc(4).tong, 49838000);
  assert.equal(buoc(4).soBoQua, 2);
});

test('6.2 bộ 1: trạng thái cuối có ba dòng chỉ mục, bản hiện hành và bản cũ, cả hai được bảo vệ cảnh báo', () => {
  const cuoi = bc['chot-bo1'].cuoi;
  assert.deepEqual(cuoi.kyDaChot.slice(1).map((d) => d[1]), ['Đã chốt', 'Đã mở lại', 'Đã chốt']);
  assert.deepEqual(cuoi.kyDaChot.slice(1).map((d) => d[2]), ['2026-10-14 08:00:00', '2026-10-14 10:00:00', '2026-10-14 11:00:00']);
  assert.ok(cuoi.danhSachTab.includes('Chot_2026-09') && cuoi.danhSachTab.includes('Chot_2026-09_cu1'));
  assert.equal(cuoi.banChotHienHanh.baoVeCanhBao, true);
  assert.equal(cuoi.banChotCu.baoVeCanhBao, true);
  assert.equal(cuoi.banChotCu.dongDau[4][1], 75838000, 'bản cũ giữ tổng đã duyệt lần đầu');
  assert.equal(cuoi.banChotHienHanh.dongDau[4][1], 49838000, 'bản mới giữ tổng sau khi bỏ qua hai người');
});

test('6.2 bộ 1: nhật ký hệ thống chỉ có loại sự kiện chốt và mở lại, không lộ tên, tài khoản, số tiền, lý do', () => {
  const nd = JSON.stringify(bc['chot-bo1'].cuoi.nhatKyHeThong);
  assert.ok(nd.includes('KY_DA_CHOT') && nd.includes('KY_MO_LAI'));
  for (const cam of ['nva1', 'nvb2', 'Nhân viên', '49838000', '75838000', 'lý do giả', 'Chot_2026']) assert.equal(nd.includes(cam), false, cam);
});

test('6.2 bộ 3: bị từ chối, không có thao tác ghi và không tạo tab nào', () => {
  const b = bc['chot-bo3'];
  assert.equal(b.ketQua.daChot, false);
  assert.ok(b.ketQua.lyDo.includes('KHONG_AI_TINH_DUOC'));
  assert.equal(b.soThaoTacGhi, 0);
  assert.deepEqual(b.tabTruoc, b.tabSau);
});
