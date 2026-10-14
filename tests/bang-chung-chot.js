// Bằng chứng test cho duyệt, chốt và mở lại kỳ qua Sheet giả (dữ liệu GIẢ). Lưu từng bước và trạng thái cuối vào tests/evidence/chot-*.json.
// Chạy: node tests/bang-chung-chot.js   (ghi lại tệp)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');

const THU_MUC_RA = path.join(__dirname, 'evidence');
const docTabs = (bo) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const phang = (x) => JSON.parse(JSON.stringify(x));

function tomTatKyDaChot(ss) {
  const sh = ss.getSheetByName('KyDaChot');
  return sh ? phang(sh.data) : null;
}
function metaBanSao(ss, ten) {
  const sh = ss.getSheetByName(ten);
  if (!sh) return null;
  return { tab: ten, baoVeCanhBao: sh.baoVe ? sh.baoVe.canhBao : null, dongDau: phang(sh.data.slice(0, 8)) };
}
function danhSachTab(ss) { return ss.sheets.map((s) => s.ten); }

// Kịch bản 1: chốt → sửa dữ liệu → tính lại (cảnh báo khác bản chốt) → duyệt lần nữa bị từ chối → mở lại → chốt lại với hai người bị bỏ qua
function kichBanBo1() {
  const mt = taoMoiTruong(docTabs('bo1'));
  const c = nap(mt.globals);
  const ss = mt.ss;
  const cacBuoc = [];
  const ghi = (ten, kq) => cacBuoc.push({ buoc: ten, ketQua: phang(kq) });

  mt.datGio('2026-10-14 08:00:00');
  const r1 = c.thucHienDuyet(ss, []);
  ghi('1. Duyệt và chốt kỳ 2026-09 (đủ dữ liệu)', r1);

  mt.datGio('2026-10-14 09:00:00');
  const km = ss.getSheetByName('KeyMetrics');
  km.data = km.data.filter((d) => !(d[0] === 'tyLeBaoHanh' && d[2] === 'HN')); // sửa dữ liệu SAU khi chốt
  const t2 = c.thucHienTinh(ss);
  ghi('2. Sửa KeyMetrics rồi Tính kỳ: cảnh báo so với bản chốt', { daGhi: t2.daGhi, canhBaoKyDaChot: [...t2.kq.canhBao].filter((x) => x.ma === 'KY_DA_CHOT').map((x) => x.thongDiep) });

  const r3 = c.thucHienDuyet(ss, []);
  ghi('3. Duyệt lần nữa: bị từ chối vì kỳ đã chốt', { daChot: r3.daChot, lyDo: r3.lyDo.map((l) => l.ma) });

  mt.datGio('2026-10-14 10:00:00');
  const r4 = c.thucHienMoLai(ss, '2026-09', 'Thử mở lại để sửa dữ liệu (lý do giả)');
  ghi('4. Mở lại kỳ có lý do', r4);

  mt.datGio('2026-10-14 11:00:00');
  const r5 = c.thucHienDuyet(ss, ['nva1', 'nvb2']);
  ghi('5. Chốt lại, xác nhận bỏ qua hai người chưa tính', r5);

  return {
    cacBuoc,
    cuoi: {
      danhSachTab: danhSachTab(ss),
      kyDaChot: tomTatKyDaChot(ss),
      banChotHienHanh: metaBanSao(ss, 'Chot_2026-09'),
      banChotCu: metaBanSao(ss, 'Chot_2026-09_cu1'),
      nhatKyHeThong: phang(ss.getSheetByName('NhatKyHeThong').data),
      tabDauVaoKhongBiGhiTrongDuyet: true
    }
  };
}

// Kịch bản 2: dữ liệu xấu bị từ chối, không tạo tab nào
function kichBanBo3() {
  const mt = taoMoiTruong(docTabs('bo3'));
  const c = nap(mt.globals);
  mt.datGio('2026-10-14 08:00:00');
  const truoc = danhSachTab(mt.ss);
  mt.nhatKy.length = 0;
  const r = c.thucHienDuyet(mt.ss, ['nva1', 'nvb2', 'nvc3', 'nve5', 'nvf6', 'nvg7']);
  return { ketQua: phang({ daChot: r.daChot, lyDo: r.lyDo.map((l) => l.ma) }), soThaoTacGhi: mt.nhatKy.length, tabTruoc: truoc, tabSau: danhSachTab(mt.ss) };
}

function taoBangChung() {
  return { 'chot-bo1': kichBanBo1(), 'chot-bo3': kichBanBo3() };
}

function ghi() {
  fs.mkdirSync(THU_MUC_RA, { recursive: true });
  const bc = taoBangChung();
  for (const ten of Object.keys(bc)) fs.writeFileSync(path.join(THU_MUC_RA, `${ten}.json`), JSON.stringify(bc[ten], null, 1) + '\n');
  return Object.keys(bc);
}

if (require.main === module) console.log('Đã ghi bằng chứng chốt kỳ cho:', ghi().join(', '));

module.exports = { taoBangChung, THU_MUC_RA };
