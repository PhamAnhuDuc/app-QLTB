// Chấm key metrics (spec key-metrics-scoring). Hàm thuần.
//
// Quy tắc %HT (đúng như file đang dùng để tính lương):
//   Min = mục tiêu × heSoMin (chỉ số cao tốt)  hoặc  mục tiêu / heSoMin (chỉ số thấp tốt)
//   %HT = nội suy tuyến tính từ 0% tại Min đến 100% tại mục tiêu; tệ hơn hoặc bằng Min thì 0%; trần 100%.
//   Hoàn thành doanh thu: KQ / mục tiêu, trần tranDoanhThu (mặc định 120%), không có Min.

function minChiSo(kieu, mucTieu, heSoMin) {
  if (kieu === 'thapTot') return mucTieu / heSoMin;
  if (kieu === 'caoTot') return mucTieu * heSoMin;
  return null;
}

// So sánh có dung sai để biên (KQ đúng bằng Min hoặc mục tiêu) không bị lệch bởi sai số dấu phẩy động,
// ví dụ 21 / 0,7 không đúng bằng 30 trong số thực.
function xapXiBang(a, b) {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}

// Trả về %HT (số thập phân, 1 = 100%). Giả định mucTieu > 0 và ketQua >= 0 đã được kiểm tra.
function tinhPhanTramHoanThanh(kieu, mucTieu, ketQua, thamSo) {
  if (kieu === 'doanhThu') {
    return Math.min(ketQua / mucTieu, thamSo.tranDoanhThu);
  }
  var min = minChiSo(kieu, mucTieu, thamSo.heSoMin);
  var ht;
  if (kieu === 'thapTot') {
    if (ketQua <= mucTieu || xapXiBang(ketQua, mucTieu)) return 1;
    if (ketQua >= min || xapXiBang(ketQua, min)) return 0;
    ht = (min - ketQua) / (min - mucTieu);
  } else {
    if (ketQua >= mucTieu || xapXiBang(ketQua, mucTieu)) return 1;
    if (ketQua <= min || xapXiBang(ketQua, min)) return 0;
    ht = (ketQua - min) / (mucTieu - min);
  }
  return Math.max(0, Math.min(1, ht));
}

// % thưởng theo bậc thang: khoảng đóng ở cận trên, mở ở cận dưới (khoảng đầu gồm cả 0).
function phanTramThuongTheoDiem(bacThang, diem) {
  var x = xapXi(diem);
  for (var i = 0; i < bacThang.length; i++) {
    var k = bacThang[i];
    var tren = k.den === null || k.den === undefined ? true : x <= k.den;
    var duoi = i === 0 ? x >= k.tu : x > k.tu;
    if (duoi && tren) return k.phanTram;
  }
  return null; // chỉ xảy ra khi x âm hoặc bậc thang hỏng
}

// Tìm mục tiêu và kết quả của một chỉ số cho thành viên: ưu tiên tài khoản, rồi khu vực, rồi nhóm.
// Một dòng coi là có nếu mục tiêu hoặc kết quả không trống.
function timGiaTriChiSo(danhSach, thanhVien, chiSoId) {
  var uuTien = [
    { capDo: 'taiKhoan', khoa: thanhVien.taiKhoan },
    { capDo: 'khuVuc', khoa: thanhVien.khuVuc },
    { capDo: 'nhom', khoa: thanhVien.nhom }
  ];
  for (var i = 0; i < uuTien.length; i++) {
    for (var j = 0; j < (danhSach || []).length; j++) {
      var d = danhSach[j];
      if (cungKhoa(d.chiSo, chiSoId) && d.capDo === uuTien[i].capDo && cungKhoa(d.khoa, uuTien[i].khoa) &&
          (!laTrong(d.mucTieu) || !laTrong(d.ketQua))) {
        return d;
      }
    }
  }
  return null;
}

// Trạng thái: 'du' | 'thieu' | 'khongApDung' | 'biChan'
function tinhKeyMetricsThanhVien(config, idx, thanhVien, danhSachGiaTri, loiCauHinh) {
  var tk = chuanHoaKhoa(thanhVien.taiKhoan);
  var kq = { trangThai: 'du', diem: null, phanTramThuong: null, chiTiet: [], thieuChiSo: [], loi: [] };
  var cs = thanhVien.chiSo || [];
  if (cs.length === 0) { kq.trangThai = 'khongApDung'; return kq; }
  if (biChan(loiCauHinh, 'km:' + tk)) { kq.trangThai = 'biChan'; return kq; }

  var chan = 'km:' + tk;
  var tong = 0;
  cs.forEach(function (c) {
    var dn = idx.chiSo[chuanHoaKhoa(c.chiSo)];
    var gt = timGiaTriChiSo(danhSachGiaTri, thanhVien, c.chiSo);
    var dong = { chiSo: c.chiSo, tyTrong: c.tyTrong, mucTieu: null, ketQua: null, min: null, phanTramHT: null };
    kq.chiTiet.push(dong);
    if (!gt || laTrong(gt.mucTieu) || laTrong(gt.ketQua)) { kq.thieuChiSo.push(c.chiSo); return; }
    var mt = docSo(gt.mucTieu), ketQua = docSo(gt.ketQua);
    var hong = false;
    if (!mt.hopLe || mt.giaTri <= 0) {
      kq.loi.push(taoThongBao('loi', 'MUC_TIEU_SAI',
        'Mục tiêu của chỉ số ' + c.chiSo + ' (thành viên ' + thanhVien.taiKhoan + ') phải lớn hơn 0',
        { chiSo: c.chiSo, taiKhoan: thanhVien.taiKhoan }, chan));
      hong = true;
    }
    if (!ketQua.hopLe || ketQua.giaTri < 0) {
      kq.loi.push(taoThongBao('loi', 'KET_QUA_SAI',
        'Kết quả của chỉ số ' + c.chiSo + ' (thành viên ' + thanhVien.taiKhoan + ') phải là số không âm',
        { chiSo: c.chiSo, taiKhoan: thanhVien.taiKhoan }, chan));
      hong = true;
    }
    if (hong) return;
    dong.mucTieu = mt.giaTri; dong.ketQua = ketQua.giaTri;
    dong.min = minChiSo(dn.kieu, mt.giaTri, config.thamSo.heSoMin);
    dong.phanTramHT = tinhPhanTramHoanThanh(dn.kieu, mt.giaTri, ketQua.giaTri, config.thamSo);
    tong += c.tyTrong * dong.phanTramHT;
  });

  if (kq.loi.length > 0) { kq.trangThai = 'biChan'; return kq; }
  if (kq.thieuChiSo.length > 0) { kq.trangThai = 'thieu'; return kq; }
  kq.diem = xapXi(tong);
  kq.phanTramThuong = phanTramThuongTheoDiem(idx.bacThang, kq.diem);
  return kq;
}
