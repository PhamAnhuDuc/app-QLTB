// Cài đặt lại ĐỘC LẬP công thức của workbook Excel cũ (đọc từ công thức trong các sheet 01, 02, 05)
// để đối chiếu với lõi mới. Cố ý viết khác cấu trúc với src/core/ (vòng lặp thẳng, không dùng chung hàm)
// và cố ý giữ nguyên các hành vi im lặng của workbook cũ:
//   - mã hàng không có trong bảng quy đổi bị bỏ qua (IFNA(...,"") rồi SUM bỏ ô trống)
//   - dữ liệu trống bị coi như 0 hoặc "" thay vì báo thiếu
// Chỉ dùng dữ liệu giả có cùng cấu trúc với workbook cũ.
'use strict';

const khoa = (s) => String(s === null || s === undefined ? '' : s).normalize('NFC').trim().toLowerCase();

// Sheet 02, cột M/N: IF(IFNA(VLOOKUP(loại & nhóm, ...), "") * SL = 0, "", ...) rồi SUM
function quyXuatBanChuyenKhoCu(cfg, dong) {
  let tong = 0;
  for (const d of dong || []) {
    const m = cfg.maHang.find((x) => khoa(x.ma) === khoa(d.ma));
    if (!m) continue; // IFNA → "" → bỏ qua âm thầm
    const n = cfg.nhomThietBi.find((x) => khoa(x.nhom) === khoa(m.nhom));
    if (!n) continue;
    tong += (d.banRa || 0) * n.pointXuatBan + (d.chuyenKho || 0) * n.pointChuyenKho;
  }
  return tong;
}

// Sheet 01: H (thấp tốt), R (cao tốt), W (doanh thu)
function htThapTotCu(kq, min, mt) {
  if (kq === '' || kq === null) return 0;
  if (kq < min) { const x = (kq - min) / (mt - min); return x <= 1 ? x : 1; }
  return 0;
}
function htCaoTotCu(kq, min, mt) {
  if (kq === '' || kq === null) return 0;
  if (kq > min) { const x = (min - kq) / (min - mt); return x <= 1 ? x : 1; }
  return 0;
}
function htDoanhThuCu(kq, mt) {
  const r = kq / mt;
  return r > 1.2 ? 1.2 : r;
}
// Sheet 01: Y
function thuongCu(x) {
  if (x > 1) return 0.35;
  if (x <= 0.7) return 0;
  if (x > 0.7 && x <= 0.8) return 0.15;
  if (x > 0.8 && x <= 0.9) return 0.2;
  return 0.25;
}

function giaTriKm(duLieu, tv, chiSo) {
  for (const cap of [['taiKhoan', tv.taiKhoan], ['khuVuc', tv.khuVuc], ['nhom', tv.nhom]]) {
    const g = duLieu.keyMetrics.find((m) => m.chiSo === chiSo && m.capDo === cap[0] && khoa(m.khoa) === khoa(cap[1]));
    if (g) return g;
  }
  return null;
}

// Trả về {taiKhoan: {point, thuNhap}} theo cách tính của workbook cũ.
function tinhCu(cfg, ky) {
  const ts = cfg.thamSo;
  const quyXb = {};
  for (const kv of Object.keys(ky.kiemKe)) quyXb[khoa(kv)] = quyXuatBanChuyenKhoCu(cfg, ky.kiemKe[kv].dong);
  const quyBh = {}, quyHts = {};
  for (const kv of Object.keys(ky.baoHanh)) quyBh[khoa(kv)] = (ky.baoHanh[kv] || 0) * ts.pointMoiCaBaoHanh;
  for (const kv of Object.keys(ky.hoTroSale)) quyHts[khoa(kv)] = (ky.hoTroSale[kv] || 0) * ts.heSoHoTroSale;

  const kq = {};
  for (const tv of cfg.thanhVien) {
    // Sheet 02: H = quỹ × hệ số (xuất/chuyển kho), J (bảo hành), L (hỗ trợ sale), M = SUMIFS nhật ký
    let point = 0;
    for (const h of cfg.heSoChia) {
      if (khoa(h.taiKhoan) !== khoa(tv.taiKhoan)) continue;
      const kv = khoa(h.khuVuc);
      const quy = h.nguon === 'xuatBanChuyenKho' ? quyXb[kv] : h.nguon === 'baoHanh' ? quyBh[kv] : quyHts[kv];
      point += (quy || 0) * h.heSo;
    }
    for (const d of ky.nhatKy) {
      if (khoa(d.taiKhoan) !== khoa(tv.taiKhoan)) continue;
      const v = cfg.viecQuanLyKho.find((x) => khoa(x.loai) === khoa(d.loai));
      if (v) point += (d.soLuong || 0) * v.heSo;
    }
    // Sheet 01: điểm key metrics
    let diem = 0;
    for (const c of tv.chiSo) {
      const g = giaTriKm(ky, tv, c.chiSo);
      const loai = cfg.chiSo.find((x) => x.id === c.chiSo).kieu;
      let ht = 0;
      if (g) {
        if (loai === 'thapTot') ht = htThapTotCu(g.ketQua, g.mucTieu / ts.heSoMin, g.mucTieu);
        else if (loai === 'caoTot') ht = htCaoTotCu(g.ketQua, g.mucTieu * ts.heSoMin, g.mucTieu);
        else ht = htDoanhThuCu(g.ketQua, g.mucTieu);
      }
      diem += c.tyTrong * ht;
    }
    const bac = cfg.bac.find((b) => b.bac === tv.bac);
    const luong = tv.luongCoDinhGhiDe !== null && tv.luongCoDinhGhiDe !== undefined ? tv.luongCoDinhGhiDe : bac.luongCoDinh;
    const vuot = point <= bac.min ? 0 : point > bac.max ? bac.max - bac.min : point - bac.min;
    const phuCap = tv.mayCaNhan ? ts.phuCap : 0;
    kq[tv.taiKhoan] = {
      point,
      coKeyMetrics: tv.chiSo.length > 0,
      thuNhap: luong + luong * thuongCu(diem) + vuot * ts.donGiaPoint + phuCap
    };
  }
  return kq;
}

module.exports = { tinhCu };
