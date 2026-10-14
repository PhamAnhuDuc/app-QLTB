// Điều phối một lần tính kỳ: cấu hình → point → key metrics → thu nhập → tổng hợp.
// Hàm thuần: nhận cấu hình và dữ liệu kỳ, trả về kết quả, lỗi và cảnh báo; không đọc/ghi Sheet,
// không gửi gì đi đâu và không tự quyết điều gì (kết quả luôn là đề xuất chờ duyệt).

var TEN_NGUON_POINT = {
  xuatBanChuyenKho: 'Xuất bán / chuyển kho',
  baoHanh: 'Bảo hành',
  hoTroSale: 'Hỗ trợ sale',
  quanLyKho: 'Quản lý kho (nhật ký công việc)'
};

// Giải thích từng bước để chủ sở hữu tự kiểm lại bằng tay.
function giaiThichThanhVien(r, thamSo) {
  var buoc = [];
  if (r.point) {
    Object.keys(r.point.nguon).forEach(function (n) {
      var ng = r.point.nguon[n];
      if (!ng.apDung) return;
      buoc.push({ buoc: 'point', nguon: n,
        noiDung: TEN_NGUON_POINT[n] + ': ' + (ng.point === null ? 'chưa có số liệu' : ng.point + ' point'), chiTiet: ng.chiTiet });
    });
  }
  buoc.push({ buoc: 'pointTong', noiDung: 'Point tổng: ' + (r.pointTong === null ? 'chưa đủ' : r.pointTong) });
  buoc.push({ buoc: 'minMax', noiDung: 'Min–Max của bậc ' + r.bac + ': ' + r.min + '–' + r.max });
  if (r.pointVuot !== null) {
    buoc.push({ buoc: 'pointVuot', noiDung: 'Point vượt = min(point, Max) − Min, không âm = ' + r.pointVuot });
    buoc.push({ buoc: 'thuongVuot', noiDung: 'Thưởng vượt point = ' + r.pointVuot + ' × ' + thamSo.donGiaPoint + ' = ' + r.thuongVuotPoint });
  }
  if (r.keyMetrics) {
    r.keyMetrics.chiTiet.forEach(function (d) {
      buoc.push({ buoc: 'chiSo', chiSo: d.chiSo,
        noiDung: d.phanTramHT === null
          ? d.chiSo + ': chưa có số liệu'
          : d.chiSo + ': mục tiêu ' + d.mucTieu + ', kết quả ' + d.ketQua + ', %HT ' + (Math.round(d.phanTramHT * 10000) / 100) + '%, tỷ trọng ' + (d.tyTrong * 100) + '%' });
    });
  }
  if (r.diemKM !== null) {
    buoc.push({ buoc: 'diemKM', noiDung: 'Điểm key metrics = Σ tỷ trọng × %HT = ' + (Math.round(r.diemKM * 10000) / 100) + '% → thưởng ' + (r.phanTramThuong * 100) + '%' });
    buoc.push({ buoc: 'thuongKM', noiDung: 'Thưởng key metrics = lương cố định ' + r.luongCoDinh + ' × ' + (r.phanTramThuong * 100) + '% = ' + r.thuongKM });
  }
  if (r.phuCap !== null) buoc.push({ buoc: 'phuCap', noiDung: 'Phụ cấp: ' + r.phuCap });
  if (r.thuNhap !== null) {
    buoc.push({ buoc: 'thuNhap', noiDung: 'Thu nhập = lương cố định + thưởng key metrics + thưởng vượt point + phụ cấp = ' + r.thuNhap });
  } else {
    buoc.push({ buoc: 'thuNhap', noiDung: r.trangThai === 'khongTinh' ? 'Không tính thu nhập' : 'Chưa tính: ' + r.lyDo.join('; ') });
  }
  return buoc;
}

function tinhKy(config, duLieuKy) {
  var kt = kiemTraCauHinh(config);
  var ketQua = {
    nhan: NHAN_DE_XUAT, chanToanBo: false, kyDuDuLieu: false,
    thanhVien: [], tong: null, quy: null, doiSoat: [], loi: kt.loi.slice(), canhBao: kt.canhBao.slice()
  };
  if (coLoiToanBo(kt)) { ketQua.chanToanBo = true; return ketQua; }

  var idx = dungChiMuc(config);
  var pt = tinhPoint(config, idx, duLieuKy, kt.loi);
  ketQua.quy = pt.quy;
  ketQua.doiSoat = pt.doiSoat;
  ketQua.loi.push.apply(ketQua.loi, pt.loi);
  ketQua.canhBao.push.apply(ketQua.canhBao, pt.canhBao);

  config.thanhVien.forEach(function (tv) {
    var tk = chuanHoaKhoa(tv.taiKhoan);
    var km = tinhKeyMetricsThanhVien(config, idx, tv, duLieuKy.keyMetrics, kt.loi);
    var thuNhap = tinhThuNhapThanhVien(config, idx, tv, pt.thanhVien[tk], km, kt.loi);
    thuNhap.point = pt.thanhVien[tk];
    thuNhap.keyMetrics = km;
    thuNhap.giaiThich = giaiThichThanhVien(thuNhap, config.thamSo);
    ketQua.loi.push.apply(ketQua.loi, km.loi);
    ketQua.canhBao.push.apply(ketQua.canhBao, thuNhap.canhBao);
    ketQua.thanhVien.push(thuNhap);
  });

  ketQua.tong = tongHopThuNhap(ketQua.thanhVien);
  var doiSoatDat = ketQua.doiSoat.every(function (d) { return d.dat; });
  var tatCaDaTinh = ketQua.thanhVien.every(function (r) { return r.trangThai !== 'chuaTinh'; });
  ketQua.kyDuDuLieu = ketQua.loi.length === 0 && doiSoatDat && tatCaDaTinh;
  return ketQua;
}
