// Bằng chứng test cho sửa cấu hình và dữ liệu nhập từ bảng điều khiển qua Sheet giả (dữ liệu GIẢ). Lưu vào tests/evidence/sua-bo1.json.
// Chạy: node tests/bang-chung-sua.js   (ghi lại tệp)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');

const THU_MUC_RA = path.join(__dirname, 'evidence');
const docTabs = (bo) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const phang = (x) => JSON.parse(JSON.stringify(x));
const BAO_CAO = 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\tSL chuyển kho\nSP-001\tThiết bị giả\t5\t2';

// Tóm tắt kết quả một thao tác ghi mà KHÔNG chép nội dung bảng.
const tomTat = (r) => phang({ daLuu: r.daLuu, lyDo: (r.lyDo || []).map((l) => l.ma), canhBao: (r.canhBao || []).map((l) => l.ma), coMoHinh: !!r.moHinh });
const tongTeam = (r) => (r.moHinh && r.moHinh.tong ? r.moHinh.tong.thuNhap : null);
const tabGhi = (mt) => [...new Set(mt.nhatKy.filter((n) => n.tab && /setValues|clear|insertSheet/.test(n.thaoTac)).map((n) => n.tab))].sort();

function kichBanBo1() {
  const mt = taoMoiTruong(docTabs('bo1'));
  const c = nap(mt.globals);
  const cacBuoc = [];
  const ghi = (ten, kq, them) => cacBuoc.push(Object.assign({ buoc: ten, ketQua: tomTat(kq) }, them || {}));

  const bt = phang(c.giaoDienDocBang('thamSo').bang.dong);
  bt[0][1] = 60000;
  mt.nhatKy.length = 0;
  const r1 = c.giaoDienLuuBang('thamSo', bt);
  ghi('1. Sửa donGiaPoint 50.000 → 60.000 (số liệu đã tính lại, chưa ghi ra KetQua)', r1, { tongTeam: tongTeam(r1), tabDuocGhi: tabGhi(mt), kyTuDo: mt.ss.getSheetByName('KetQua') === null });

  const sai = phang(c.giaoDienDocBang('bac').bang.dong);
  sai[0][1] = 'năm mươi nghìn';
  mt.nhatKy.length = 0;
  const r2 = c.giaoDienLuuBang('bac', sai);
  ghi('2. Ô số chứa chữ: bị từ chối, không ghi gì', r2, { soThaoTacGhi: mt.nhatKy.length });

  const hs = phang(c.giaoDienDocBang('heSoChia').bang.dong);
  hs.find((d) => d[0] === 'baoHanh')[3] = 0.01;
  mt.nhatKy.length = 0;
  const r3 = c.giaoDienLuuBang('heSoChia', hs);
  ghi('3. Hệ số chia bảo hành lệch tổng: bị từ chối', r3, { soThaoTacGhi: mt.nhatKy.length });

  mt.nhatKy.length = 0;
  const r4 = c.giaoDienNhapBaoCao('HN', BAO_CAO);
  ghi('4. Nhập báo cáo khu vực HN (dán văn bản)', r4, { tabDuocGhi: tabGhi(mt) });
  mt.nhatKy.length = 0;
  const r5 = c.giaoDienNhapBaoCao('HN', 'Mã hàng\tTên hàng\tSL bán ra trong kỳ\nSP-001\tA\t5');
  ghi('5. Báo cáo thiếu cột SL chuyển kho: bị từ chối', r5, { soThaoTacGhi: mt.nhatKy.length });
  const r6 = c.giaoDienNhapBaoCao('XX', BAO_CAO);
  ghi('6. Khu vực không có trong cấu hình: bị từ chối', r6);

  ghi('7. Đặt kỳ 2026-10', c.giaoDienDatKy('2026-10'));
  ghi('8. Đặt kỳ sai "2026-13"', c.giaoDienDatKy('2026-13'));
  ghi('9. Khôi phục mặc định bảng bậc', c.giaoDienKhoiPhucMacDinh('bac'));
  ghi('10. Khôi phục mặc định bảng thành viên: bị từ chối', c.giaoDienKhoiPhucMacDinh('thanhVien'));
  c.giaoDienDatKy('2026-09');
  c.giaoDienTinh();
  const d = c.giaoDienDuyet(['nva1', 'nvb2', 'nvc3', 'nve5', 'nvf6', 'nvg7']);
  ghi('11. Duyệt kỳ (đã sửa dữ liệu ở các bước trên)', { daLuu: d.daChot, lyDo: [] });
  const r12 = c.giaoDienLuuBang('nhatKyCongViec', phang(c.giaoDienDocBang('nhatKyCongViec').bang.dong));
  ghi('12. Kỳ đã chốt: bảng nhập tay bị từ chối', r12);
  const r13 = c.giaoDienLuuBang('bac', phang(c.giaoDienDocBang('bac').bang.dong));
  ghi('13. Kỳ đã chốt: bảng cấu hình vẫn lưu được kèm cảnh báo', r13);

  const tv = phang(c.giaoDienDocBang('thanhVien').bang.dong);
  tv[0][1] = '=1+1';
  ghi('14. Tên thành viên bắt đầu bằng "=": lưu thành chữ, không thành công thức', c.giaoDienLuuBang('thanhVien', tv));
  return {
    cacBuoc,
    cuoi: {
      nhatKyHeThongCacMa: mt.ss.getSheetByName('NhatKyHeThong').data.slice(1).map((d) => d[2]),
      nhatKyHeThongKhongLoNoiDung: !JSON.stringify(mt.ss.getSheetByName('NhatKyHeThong').data).match(/60000|năm mươi|Thiết bị giả|nva1|Nhân viên|=1\+1/),
      oCongThucTrongTabSua: ['CH_ThamSo', 'CH_Bac', 'CH_ThanhVien', 'KiemKe_HN'].map((t) => mt.ss.getSheetByName(t).congThuc.length),
      tenDauBangLuuThanhChu: mt.ss.getSheetByName('CH_ThanhVien').data[1][1] === '=1+1'
    }
  };
}

function taoBangChung() { return { 'sua-bo1': kichBanBo1() }; }

function ghi() {
  fs.mkdirSync(THU_MUC_RA, { recursive: true });
  const bc = taoBangChung();
  for (const ten of Object.keys(bc)) fs.writeFileSync(path.join(THU_MUC_RA, `${ten}.json`), JSON.stringify(bc[ten], null, 1) + '\n');
  return Object.keys(bc);
}

if (require.main === module) console.log('Đã ghi bằng chứng sửa dữ liệu cho:', ghi().join(', '));

module.exports = { taoBangChung, THU_MUC_RA };
