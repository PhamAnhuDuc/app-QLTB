// Điều phối một lần "Tính kỳ" từ các tab Sheet: đọc cấu hình, đọc dữ liệu kỳ, gọi lõi, gộp lỗi. Hàm thuần.
// Nhận {tên tab: bảng hai chiều} và trả kết quả đủ để ketqua.js dựng nội dung các tab đầu ra.

// Gắn tab và dòng Sheet vào lỗi của lõi liên quan tới báo cáo kiểm kê và nhật ký công việc.
function ganViTriLoiCuaLoi(dsLoi, viTri, duLieuKy, khuVuc) {
  var tabCuaKhuVuc = {};
  (khuVuc || []).forEach(function (k) { tabCuaKhuVuc[chuanHoaKhoa(k.ma)] = k.tabBaoCao; });
  dsLoi.forEach(function (l) {
    var ct = l.chiTiet || {};
    var tab = null, dongs = [];
    if (ct.khuVuc && tabCuaKhuVuc[chuanHoaKhoa(ct.khuVuc)] && ['MA_HANG_LA', 'NHOM_CHUA_CO_POINT', 'SO_LUONG_SAI', 'DONG_THIEU_MA'].indexOf(l.ma) >= 0 &&
        (ct.ma !== undefined || ct.dong !== undefined) && ct.nguon === undefined) {
      var kvKey = Object.keys(viTri.kiemKe || {}).filter(function (k) { return cungKhoa(k, ct.khuVuc); })[0];
      var rows = kvKey ? viTri.kiemKe[kvKey] : [];
      tab = tabCuaKhuVuc[chuanHoaKhoa(ct.khuVuc)];
      if (ct.dong !== undefined) { if (rows[ct.dong - 1] !== undefined) dongs = [rows[ct.dong - 1]]; }
      else if (ct.ma !== undefined) {
        var bc = duLieuKy && duLieuKy.kiemKe ? duLieuKy.kiemKe[kvKey] : null;
        if (bc) bc.dong.forEach(function (d, i) { if (d.ma !== null && cungKhoa(d.ma, ct.ma) && rows[i] !== undefined) dongs.push(rows[i]); });
      }
    } else if (['LOAI_VIEC_LA', 'TAI_KHOAN_LA', 'SO_LUONG_SAI'].indexOf(l.ma) >= 0 && ct.dong !== undefined && ct.taiKhoan !== undefined) {
      tab = TEN_TAB.nhatKyCongViec;
      if ((viTri.nhatKy || [])[ct.dong - 1] !== undefined) dongs = [viTri.nhatKy[ct.dong - 1]];
    }
    if (tab === null && (l.ma === 'BAO_CAO_CHUA_PHU_KY' || l.ma === 'BAO_CAO_THIEU_NGAY') && ct.khuVuc && tabCuaKhuVuc[chuanHoaKhoa(ct.khuVuc)]) {
      tab = tabCuaKhuVuc[chuanHoaKhoa(ct.khuVuc)]; // không có dòng cụ thể: lỗi của cả báo cáo
    }
    if (tab === null && (l.ma === 'MUC_TIEU_SAI' || l.ma === 'KET_QUA_SAI')) tab = TEN_TAB.keyMetrics;
    if (tab === null) return;
    l.chiTiet.tab = tab;
    if (dongs.length > 0) l.chiTiet.dong = dongs;
    l.thongDiep = '[tab ' + tab + gomDong(dongs) + '] ' + l.thongDiep;
  });
}

// Loại bỏ thông báo của lõi mà lỗi nhập liệu có vị trí chính xác hơn đã thay thế.
function boThongBaoTrung(dsLoiLoi, dsNhapLieu) {
  var thay = dsNhapLieu.filter(function (a) { return a.chiTiet && a.chiTiet.thay; });
  return dsLoiLoi.filter(function (l) {
    var ct = l.chiTiet || {};
    return !thay.some(function (a) {
      var at = a.chiTiet;
      if (at.thay.indexOf(l.ma) < 0) return false;
      if (at.nguon === 'kiemKe') return ct.khuVuc !== undefined && cungKhoa(ct.khuVuc, at.khuVuc) && ct.dong === at.chiSoDong + 1;
      if (at.nguon === 'nhatKy') return ct.dong === at.chiSoDong + 1 && ct.taiKhoan !== undefined;
      if (at.nguon === 'baoHanh' || at.nguon === 'hoTroSale') return ct.nguon === at.nguon && cungKhoa(ct.khuVuc, at.khuVuc);
      return false;
    });
  });
}

// Lỗi của lớp Sheet không ghi cờ nào khác: kỳ chỉ được coi là đủ dữ liệu khi không có lỗi nhập liệu nào
// và không có cảnh báo đánh dấu "không đủ dữ liệu" (ví dụ dán thiếu dòng).
function tinhKyTuCacTab(cacTab, thoiDiem) {
  var kt = docVaKiemTraCauHinh(cacTab);
  var ketQua = {
    nhan: NHAN_DE_XUAT, thoiDiem: thoiDiem || null, chanToanBo: false, kyDuDuLieu: false, ky: null,
    thanhVien: [], tong: null, quy: null, doiSoat: [], loi: kt.loi.slice(), canhBao: kt.canhBao.slice(),
    tenTabKetQua: (kt.cauHinh.thamSo && kt.cauHinh.thamSo.tenTabKetQua) || TEN_TAB_KET_QUA_MAC_DINH,
    khuVuc: kt.cauHinh.khuVuc,
    cauHinh: kt.cauHinh, duLieuKy: null // duLieuKy chỉ có khi xác định được kỳ; dùng để lưu bản chốt
  };
  if (kt.chanToanBo) { ketQua.chanToanBo = true; return ketQua; }

  var d = lapDuLieuKy(cacTab, kt.cauHinh);
  ketQua.canhBao.push.apply(ketQua.canhBao, d.canhBao);
  if (!d.duLieuKy) {
    ketQua.chanToanBo = true;
    ketQua.loi.push.apply(ketQua.loi, d.loi);
    return ketQua;
  }
  var kq = tinhKy(kt.cauHinh, d.duLieuKy);
  ketQua.ky = d.duLieuKy.ky;
  ketQua.duLieuKy = d.duLieuKy;

  // Phần kq.loi/kq.canhBao đầu tiên là kết quả kiểm tra cấu hình của lõi (đã có bản gắn vị trí trong kt).
  var loiLoi = kq.loi.slice(kt.loiQuyTac.length);
  var canhBaoLoi = kq.canhBao.slice(kt.canhBaoQuyTac.length);
  loiLoi = boThongBaoTrung(loiLoi, d.loi);
  ganViTriLoiCuaLoi(loiLoi, d.viTri, d.duLieuKy, kt.cauHinh.khuVuc);
  ganViTriLoiCuaLoi(canhBaoLoi, d.viTri, d.duLieuKy, kt.cauHinh.khuVuc);

  ketQua.loi.push.apply(ketQua.loi, d.loi);
  ketQua.loi.push.apply(ketQua.loi, loiLoi);
  ketQua.canhBao.push.apply(ketQua.canhBao, canhBaoLoi);
  ketQua.thanhVien = kq.thanhVien;
  ketQua.tong = kq.tong;
  ketQua.quy = kq.quy;
  ketQua.doiSoat = kq.doiSoat;
  var coCanhBaoKhongDu = ketQua.canhBao.some(function (w) { return w.chiTiet && w.chiTiet.khongDuDuLieu; });
  ketQua.kyDuDuLieu = ketQua.loi.length === 0 && !coCanhBaoKhongDu && kq.doiSoat.every(function (x) { return x.dat; }) &&
    kq.thanhVien.every(function (r) { return r.trangThai !== 'chuaTinh'; });
  return ketQua;
}
