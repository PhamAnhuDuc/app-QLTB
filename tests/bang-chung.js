// Tạo bằng chứng test: với mỗi bộ dữ liệu giả, lưu đầu vào và kết quả tính vào tests/evidence/.
// Chạy: node tests/bang-chung.js     (ghi lại tệp)
// Các test kiểm tra tệp trong tests/evidence/ khớp kết quả hiện tại, nên nếu lõi tính đổi thì phải chạy lại lệnh này.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap, docFixture } = require('./load-core');

const THU_MUC = path.join(__dirname, 'evidence');
const THOI_DIEM_CO_DINH = '2026-10-14T00:00:00.000Z'; // cố định để tệp bằng chứng tái lập được
const BO = [
  { ten: 'bo1', moTa: 'Bình thường: tháng 09/2026, đủ dữ liệu' },
  { ten: 'bo2', moTa: 'Khác kỳ, đơn giá, bậc, hệ số: tháng 10/2026' },
  { ten: 'bo3', moTa: 'Dữ liệu xấu hoặc thiếu trường' }
];

// Chép sang đối tượng thường để ghi JSON ổn định (kết quả sinh trong vùng vm).
const phang = (x) => JSON.parse(JSON.stringify(x));

function tomTatKetQua(kq, log) {
  return {
    nhan: kq.nhan,
    kyDuDuLieu: kq.kyDuDuLieu,
    chanToanBo: kq.chanToanBo,
    soLoi: kq.loi.length,
    soCanhBao: kq.canhBao.length,
    loi: kq.loi.map((l) => ({ ma: l.ma, phamViChan: l.chan, thongDiep: l.thongDiep })),
    canhBao: kq.canhBao.map((l) => ({ muc: l.muc, ma: l.ma, thongDiep: l.thongDiep })),
    thanhVien: kq.thanhVien.map((r) => ({
      taiKhoan: r.taiKhoan, nhom: r.nhom, trangThai: r.trangThai, lyDo: r.lyDo,
      pointTong: r.pointTong, pointVuot: r.pointVuot, diemKM: r.diemKM, phanTramThuong: r.phanTramThuong,
      luongCoDinh: r.luongCoDinh, thuongKM: r.thuongKM, thuongVuotPoint: r.thuongVuotPoint, phuCap: r.phuCap,
      thuNhap: r.thuNhap
    })),
    tongTheoNhom: kq.tong ? kq.tong.theoNhom.map((n) => ({ nhom: n.nhom, ghiChu: n.ghiChu, thuNhap: n.thuNhap })) : null,
    tongTeam: kq.tong ? { ghiChu: kq.tong.team.ghiChu, thuNhap: kq.tong.team.thuNhap } : null,
    doiSoat: kq.doiSoat,
    log
  };
}

function taoBangChung() {
  const c = nap();
  const ra = {};
  for (const bo of BO) {
    const cfg = docFixture(bo.ten, 'config.json');
    const ky = docFixture(bo.ten, 'ky.json');
    const kq = c.tinhKy(cfg, ky);
    ra[bo.ten] = {
      dauVao: { _ghiChu: 'DỮ LIỆU GIẢ. ' + bo.moTa, cauHinh: cfg, duLieuKy: ky },
      ketQua: phang(tomTatKetQua(kq, c.taoLog(kq, THOI_DIEM_CO_DINH)))
    };
  }
  return ra;
}

function ghi() {
  fs.mkdirSync(THU_MUC, { recursive: true });
  const bc = taoBangChung();
  for (const ten of Object.keys(bc)) {
    fs.writeFileSync(path.join(THU_MUC, `${ten}-dau-vao.json`), JSON.stringify(bc[ten].dauVao, null, 2) + '\n');
    fs.writeFileSync(path.join(THU_MUC, `${ten}-ket-qua.json`), JSON.stringify(bc[ten].ketQua, null, 2) + '\n');
  }
  return Object.keys(bc);
}

if (require.main === module) {
  console.log('Đã ghi bằng chứng cho:', ghi().join(', '));
}

module.exports = { taoBangChung, THU_MUC, BO };
