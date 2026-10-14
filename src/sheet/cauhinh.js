// Cấu hình lưu trong các tab Sheet (spec sheet-config-storage). Hàm thuần.
//
// Mỗi bảng cấu hình ở một tab, cột tìm theo TIÊU ĐỀ (không theo thứ tự cột). Lỗi ĐỌC (thiếu tab, thiếu cột, ô sai kiểu)
// chặn toàn bộ vì cấu hình không dùng được; lỗi QUY TẮC (hệ số chia không bằng 1, tài khoản trùng...) lấy từ kiemTraCauHinh
// của lõi, giữ nguyên phạm vi chặn của lõi, và được gắn thêm tab và dòng.

var TEN_TAB_KET_QUA_MAC_DINH = 'KetQua';
var THAM_SO_CHU = ['tenTabKetQua'];

// ---- Đọc một bảng theo tiêu đề ------------------------------------------------------------
// Trả {dong: [{_dong, 'Tên cột': giá trị}]} hoặc null nếu tab thiếu hay thiếu cột bắt buộc (đã ghi lỗi).
function docBangTheoTieuDe(cacTab, tenTab, cotBatBuoc, cotTuyChon, loi) {
  var bang = cacTab[tenTab];
  if (bang === undefined || bang === null) {
    loi.push(loiNhapLieu('THIEU_TAB', tenTab, null, null, 'Không có tab "' + tenTab + '". Hãy chạy lệnh khởi tạo khung cấu hình hoặc tạo tab này', {}, 'toanBo'));
    loi[loi.length - 1].chan = 'toanBo';
    return null;
  }
  var h = -1;
  for (var r = 0; r < bang.length; r++) { if (!dongTrong(bang[r])) { h = r; break; } }
  var cot = {};
  var tatCa = cotBatBuoc.concat(cotTuyChon || []);
  var tieuDe = h >= 0 ? bang[h] : [];
  tatCa.forEach(function (ten) {
    for (var c = 0; c < tieuDe.length; c++) {
      if (oLaChu(tieuDe[c]) && chuanHoaTieuDe(tieuDe[c]) === chuanHoaTieuDe(ten)) { cot[ten] = c; return; }
    }
  });
  var thieu = cotBatBuoc.filter(function (ten) { return cot[ten] === undefined; });
  if (thieu.length > 0) {
    thieu.forEach(function (ten) {
      var l = loiNhapLieu('THIEU_COT', tenTab, h >= 0 ? h + 1 : null, ten, 'Thiếu cột "' + ten + '" trong tiêu đề');
      l.chan = 'toanBo';
      loi.push(l);
    });
    return null;
  }
  var dong = [];
  for (var i = h + 1; i < bang.length; i++) {
    if (dongTrong(bang[i])) continue;
    var o = { _dong: i + 1 };
    tatCa.forEach(function (ten) { o[ten] = cot[ten] === undefined ? null : layO(bang, i, cot[ten]); });
    dong.push(o);
  }
  return { dong: dong };
}

// ---- Đọc từng kiểu giá trị ô, ghi lỗi có vị trí ---------------------------------------------
function loiDoc(loi, ma, tenTab, soDong, tenCot, thongDiep, chiTiet) {
  var l = loiNhapLieu(ma, tenTab, soDong, tenCot, thongDiep, chiTiet);
  l.chan = 'toanBo';
  loi.push(l);
}

// Số bắt buộc: ô trống hoặc chữ đều là lỗi. Trả số hoặc null.
function docSoBatBuoc(v, tenTab, soDong, tenCot, loi) {
  var s = soThat(v);
  if (s.hopLe) return s.giaTri;
  loiDoc(loi, s.trong ? 'O_TRONG' : 'O_SO_SAI', tenTab, soDong, tenCot,
    s.trong ? 'Ô trống, cần nhập số' : 'Ô phải là số, hiện là văn bản "' + v + '"');
  return null;
}

// Số tuỳ chọn: ô trống → null (không phải lỗi), chữ → lỗi.
function docSoTuyChon(v, tenTab, soDong, tenCot, loi) {
  var s = soThat(v);
  if (s.trong) return null;
  if (s.hopLe) return s.giaTri;
  loiDoc(loi, 'O_SO_SAI', tenTab, soDong, tenCot, 'Ô phải là số, hiện là văn bản "' + v + '"');
  return null;
}

function docChuBatBuoc(v, tenTab, soDong, tenCot, loi) {
  if (laTrong(v)) { loiDoc(loi, 'O_TRONG', tenTab, soDong, tenCot, 'Ô trống, cần nhập'); return null; }
  return String(v).trim();
}

function docLogic(v, tenTab, soDong, tenCot, loi) {
  if (v === true || v === false) return v;
  if (oLaChu(v)) {
    var k = chuanHoaKhoa(v);
    if (k === 'true') return true;
    if (k === 'false') return false;
  }
  loiDoc(loi, 'O_LOGIC_SAI', tenTab, soDong, tenCot, 'Ô phải là TRUE hoặc FALSE' + (laTrong(v) ? ' (đang trống)' : ', hiện là "' + v + '"'));
  return null;
}

function docNhan(v, bangNhan, tenTab, soDong, tenCot, loi, goiY) {
  if (laTrong(v)) { loiDoc(loi, 'O_TRONG', tenTab, soDong, tenCot, 'Ô trống, cần chọn: ' + goiY); return null; }
  var k = chuanHoaKhoa(v);
  if (bangNhan[k] !== undefined) return bangNhan[k];
  loiDoc(loi, 'O_NHAN_SAI', tenTab, soDong, tenCot, 'Giá trị "' + v + '" không hợp lệ, cần: ' + goiY);
  return null;
}

function themViTri(bang, khoa, soDong) {
  var k = chuanHoaKhoa(khoa);
  if (!bang[k]) bang[k] = [];
  bang[k].push(soDong);
}

// ---- Đọc toàn bộ cấu hình -----------------------------------------------------------------
// Trả {cauHinh, viTri, loi, canhBao, docDuoc}. docDuoc = false khi có lỗi đọc (cấu hình không dùng được).
function docCauHinh(cacTab) {
  var loi = [], canhBao = [];
  var viTri = { thamSo: {}, bac: {}, bacThang: {}, chiSo: {}, nhom: {}, maHang: {}, viec: {}, heSo: {}, khuVuc: {}, thanhVien: {}, tyTrong: {} };
  var T = TEN_TAB, H = TIEU_DE;
  var cauHinh = { thamSo: {}, bac: [], bacThangThuong: [], chiSo: [], nhomThietBi: [], maHang: [], viecQuanLyKho: [], heSoChia: [], khuVuc: [], thanhVien: [] };

  // Tham số
  var b = docBangTheoTieuDe(cacTab, T.thamSo, H.thamSo, [], loi);
  if (b) b.dong.forEach(function (d) {
    var ten = laTrong(d['Tham số']) ? null : String(d['Tham số']).trim();
    if (ten === null) return;
    themViTri(viTri.thamSo, ten, d._dong);
    if (THAM_SO_CHU.indexOf(ten) >= 0) { cauHinh.thamSo[ten] = laTrong(d['Giá trị']) ? null : String(d['Giá trị']).trim(); return; }
    if (THAM_SO_BAT_BUOC.indexOf(ten) < 0) {
      canhBao.push(loiNhapLieu('THAM_SO_LA', T.thamSo, d._dong, 'Tham số', 'Tham số "' + ten + '" không được hệ thống dùng, bỏ qua'));
      canhBao[canhBao.length - 1].muc = 'canhBao'; canhBao[canhBao.length - 1].chan = null;
      return;
    }
    var s = soThat(d['Giá trị']);
    if (s.hopLe) cauHinh.thamSo[ten] = s.giaTri;
    else if (!s.trong) loiDoc(loi, 'O_SO_SAI', T.thamSo, d._dong, 'Giá trị', 'Tham số ' + ten + ' phải là số, hiện là văn bản "' + d['Giá trị'] + '"', { thamSo: ten });
    // ô trống: để thiếu, lõi báo THIEU_THAM_SO
  });

  // Bậc
  b = docBangTheoTieuDe(cacTab, T.bac, H.bac, [], loi);
  if (b) b.dong.forEach(function (d) {
    var bac = docSoBatBuoc(d['Bậc'], T.bac, d._dong, 'Bậc', loi);
    var luong = docSoBatBuoc(d['Lương cố định'], T.bac, d._dong, 'Lương cố định', loi);
    var min = docSoBatBuoc(d['Min'], T.bac, d._dong, 'Min', loi);
    var max = docSoBatBuoc(d['Max'], T.bac, d._dong, 'Max', loi);
    if (bac !== null) themViTri(viTri.bac, String(bac), d._dong);
    cauHinh.bac.push({ bac: bac, luongCoDinh: luong, min: min, max: max });
  });

  // Bậc thang thưởng
  b = docBangTheoTieuDe(cacTab, T.bacThang, H.bacThang, [], loi);
  if (b) b.dong.forEach(function (d) {
    var tu = docSoBatBuoc(d['Từ'], T.bacThang, d._dong, 'Từ', loi);
    var den = docSoTuyChon(d['Đến'], T.bacThang, d._dong, 'Đến', loi);
    var pt = docSoBatBuoc(d['% thưởng'], T.bacThang, d._dong, '% thưởng', loi);
    if (tu !== null) themViTri(viTri.bacThang, String(tu), d._dong);
    cauHinh.bacThangThuong.push({ tu: tu, den: den, phanTram: pt });
  });

  // Chỉ số key metrics
  b = docBangTheoTieuDe(cacTab, T.chiSo, H.chiSo, [], loi);
  if (b) b.dong.forEach(function (d) {
    var id = docChuBatBuoc(d['Mã chỉ số'], T.chiSo, d._dong, 'Mã chỉ số', loi);
    var kieu = docNhan(d['Kiểu'], NHAN_KIEU_CHI_SO, T.chiSo, d._dong, 'Kiểu', loi, 'thấp tốt, cao tốt hoặc doanh thu');
    if (id !== null) themViTri(viTri.chiSo, id, d._dong);
    cauHinh.chiSo.push({ id: id, ten: laTrong(d['Tên']) ? '' : String(d['Tên']).trim(), kieu: kieu });
  });

  // Nhóm thiết bị và point
  b = docBangTheoTieuDe(cacTab, T.nhomThietBi, H.nhomThietBi, [], loi);
  if (b) b.dong.forEach(function (d) {
    var nhom = docChuBatBuoc(d['Nhóm'], T.nhomThietBi, d._dong, 'Nhóm', loi);
    var xb = docSoBatBuoc(d['Point xuất bán'], T.nhomThietBi, d._dong, 'Point xuất bán', loi);
    var ck = docSoBatBuoc(d['Point chuyển kho'], T.nhomThietBi, d._dong, 'Point chuyển kho', loi);
    if (nhom !== null) themViTri(viTri.nhom, nhom, d._dong);
    cauHinh.nhomThietBi.push({ nhom: nhom, pointXuatBan: xb, pointChuyenKho: ck });
  });

  // Mã hàng → nhóm
  b = docBangTheoTieuDe(cacTab, T.maHang, H.maHang, [], loi);
  if (b) b.dong.forEach(function (d) {
    var ma = docChuBatBuoc(d['Mã hàng'], T.maHang, d._dong, 'Mã hàng', loi);
    var nhom = docChuBatBuoc(d['Nhóm'], T.maHang, d._dong, 'Nhóm', loi);
    if (ma !== null) themViTri(viTri.maHang, ma, d._dong);
    cauHinh.maHang.push({ ma: ma, nhom: nhom });
  });

  // Việc quản lý kho
  b = docBangTheoTieuDe(cacTab, T.viecQuanLyKho, H.viecQuanLyKho, [], loi);
  if (b) b.dong.forEach(function (d) {
    var loai = docChuBatBuoc(d['Loại việc'], T.viecQuanLyKho, d._dong, 'Loại việc', loi);
    var heSo = docSoBatBuoc(d['Hệ số'], T.viecQuanLyKho, d._dong, 'Hệ số', loi);
    if (loai !== null) themViTri(viTri.viec, loai, d._dong);
    cauHinh.viecQuanLyKho.push({ loai: loai, heSo: heSo });
  });

  // Hệ số chia
  b = docBangTheoTieuDe(cacTab, T.heSoChia, H.heSoChia, [], loi);
  if (b) b.dong.forEach(function (d) {
    var nguon = docNhan(d['Nguồn'], NHAN_NGUON, T.heSoChia, d._dong, 'Nguồn', loi, 'xuatBanChuyenKho, baoHanh hoặc hoTroSale');
    var kv = docChuBatBuoc(d['Khu vực'], T.heSoChia, d._dong, 'Khu vực', loi);
    var tk = docChuBatBuoc(d['Tài khoản'], T.heSoChia, d._dong, 'Tài khoản', loi);
    var heSo = docSoBatBuoc(d['Hệ số'], T.heSoChia, d._dong, 'Hệ số', loi);
    if (nguon !== null && kv !== null) themViTri(viTri.heSo, nguon + '|' + kv, d._dong);
    cauHinh.heSoChia.push({ nguon: nguon, khuVuc: kv, taiKhoan: tk, heSo: heSo });
  });

  // Khu vực → tab báo cáo
  b = docBangTheoTieuDe(cacTab, T.khuVuc, H.khuVuc, [], loi);
  if (b) b.dong.forEach(function (d) {
    var ma = docChuBatBuoc(d['Khu vực'], T.khuVuc, d._dong, 'Khu vực', loi);
    var tab = docChuBatBuoc(d['Tab báo cáo'], T.khuVuc, d._dong, 'Tab báo cáo', loi);
    if (ma !== null) themViTri(viTri.khuVuc, ma, d._dong);
    cauHinh.khuVuc.push({ ma: ma, tabBaoCao: tab });
  });

  // Thành viên
  b = docBangTheoTieuDe(cacTab, T.thanhVien, H.thanhVien, [], loi);
  if (b) b.dong.forEach(function (d) {
    var tk = docChuBatBuoc(d['Tài khoản'], T.thanhVien, d._dong, 'Tài khoản', loi);
    var bac = docSoBatBuoc(d['Bậc'], T.thanhVien, d._dong, 'Bậc', loi);
    var kv = docChuBatBuoc(d['Khu vực'], T.thanhVien, d._dong, 'Khu vực', loi);
    var nhom = docChuBatBuoc(d['Nhóm'], T.thanhVien, d._dong, 'Nhóm', loi);
    var may = docLogic(d['Máy tính cá nhân'], T.thanhVien, d._dong, 'Máy tính cá nhân', loi);
    var ghiDe = docSoTuyChon(d['Ghi đè lương cố định'], T.thanhVien, d._dong, 'Ghi đè lương cố định', loi);
    if (tk !== null) themViTri(viTri.thanhVien, tk, d._dong);
    cauHinh.thanhVien.push({ taiKhoan: tk, ten: laTrong(d['Tên']) ? '' : String(d['Tên']).trim(), bac: bac, khuVuc: kv, nhom: nhom,
      mayCaNhan: may === true, luongCoDinhGhiDe: ghiDe, chiSo: [] });
  });

  // Tỷ trọng key metrics của thành viên (dạng dài) gắn vào thành viên
  b = docBangTheoTieuDe(cacTab, T.tyTrong, H.tyTrong, [], loi);
  if (b) b.dong.forEach(function (d) {
    var tk = docChuBatBuoc(d['Tài khoản'], T.tyTrong, d._dong, 'Tài khoản', loi);
    var cs = docChuBatBuoc(d['Chỉ số'], T.tyTrong, d._dong, 'Chỉ số', loi);
    var ty = docSoBatBuoc(d['Tỷ trọng'], T.tyTrong, d._dong, 'Tỷ trọng', loi);
    if (tk === null || cs === null) return;
    themViTri(viTri.tyTrong, tk, d._dong);
    var tv = cauHinh.thanhVien.filter(function (m) { return cungKhoa(m.taiKhoan, tk); })[0];
    if (!tv) {
      loiDoc(loi, 'TY_TRONG_TAI_KHOAN_LA', T.tyTrong, d._dong, 'Tài khoản', 'Tài khoản "' + tk + '" không có trong tab ' + T.thanhVien, { taiKhoan: tk });
      return;
    }
    tv.chiSo.push({ chiSo: cs, tyTrong: ty });
  });

  // Tên tab kết quả mặc định
  if (laTrong(cauHinh.thamSo.tenTabKetQua)) cauHinh.thamSo.tenTabKetQua = TEN_TAB_KET_QUA_MAC_DINH;

  return { cauHinh: cauHinh, viTri: viTri, loi: loi, canhBao: canhBao, docDuoc: loi.length === 0 };
}

// ---- Gắn tab và dòng vào lỗi quy tắc của lõi ------------------------------------------------
function dongTheoKhoa(bang, khoa) {
  return bang[chuanHoaKhoa(khoa)] || [];
}

function gomDong(dongs) {
  return dongs.length === 0 ? '' : ', dòng ' + dongs.join(', ');
}

function ganViTriLoiLoi(dsLoi, viTri) {
  var T = TEN_TAB;
  dsLoi.forEach(function (l) {
    var ct = l.chiTiet || {};
    var tab = null, dongs = [];
    switch (l.ma) {
      case 'THIEU_THAM_SO': case 'THAM_SO_SAI':
        tab = T.thamSo; dongs = dongTheoKhoa(viTri.thamSo, ct.thamSo); break;
      case 'BAC_MIN_MAX': case 'BAC_LUONG_SAI': case 'BAC_TRUNG': case 'THIEU_BANG_BAC':
        tab = T.bac; dongs = dongTheoKhoa(viTri.bac, String(ct.bac)); break;
      case 'BAC_THANG_LOI':
        tab = T.bacThang; dongs = ct.tu !== undefined ? dongTheoKhoa(viTri.bacThang, String(ct.tu)) : []; break;
      case 'CHI_SO_TRUNG': tab = T.chiSo; dongs = dongTheoKhoa(viTri.chiSo, ct.chiSo); break;
      case 'NHOM_TRUNG': case 'NHOM_POINT_SAI': tab = T.nhomThietBi; dongs = dongTheoKhoa(viTri.nhom, ct.nhom); break;
      case 'MA_TRUNG': tab = T.maHang; dongs = dongTheoKhoa(viTri.maHang, ct.ma); break;
      case 'MA_NHOM_CHUA_CO_POINT': tab = T.maHang; dongs = dongTheoKhoa(viTri.maHang, ct.ma); break;
      case 'VIEC_TRUNG': case 'VIEC_HE_SO_SAI': tab = T.viecQuanLyKho; dongs = dongTheoKhoa(viTri.viec, ct.loai); break;
      case 'TAI_KHOAN_TRUNG': case 'THANH_VIEN_BAC_LA': case 'GHI_DE_LUONG_SAI':
        tab = T.thanhVien; dongs = dongTheoKhoa(viTri.thanhVien, ct.taiKhoan); break;
      case 'TONG_TY_TRONG': case 'CHI_SO_LA': case 'CHI_SO_LAP': case 'TY_TRONG_SAI':
        tab = T.tyTrong; dongs = dongTheoKhoa(viTri.tyTrong, ct.taiKhoan); break;
      case 'TONG_HE_SO': case 'HE_SO_TRUNG': case 'HE_SO_SAI': case 'HE_SO_TAI_KHOAN_LA':
        tab = T.heSoChia; dongs = ct.nguon ? dongTheoKhoa(viTri.heSo, ct.nguon + '|' + ct.khuVuc) : []; break;
      default: return;
    }
    if (tab === null) return;
    l.chiTiet.tab = tab;
    if (dongs.length > 0) l.chiTiet.dong = dongs;
    l.thongDiep = '[tab ' + tab + gomDong(dongs) + '] ' + l.thongDiep;
  });
}

// Đọc cấu hình và kiểm tra. Trả {cauHinh, loi, canhBao, chanToanBo}.
function docVaKiemTraCauHinh(cacTab) {
  var d = docCauHinh(cacTab);
  var kq = { cauHinh: d.cauHinh, viTri: d.viTri, loi: d.loi.slice(), canhBao: d.canhBao.slice(), chanToanBo: false };
  if (!d.docDuoc) { kq.chanToanBo = true; return kq; }
  var kt = kiemTraCauHinh(d.cauHinh);
  ganViTriLoiLoi(kt.loi, d.viTri);
  ganViTriLoiLoi(kt.canhBao, d.viTri);
  kq.loi.push.apply(kq.loi, kt.loi);
  kq.canhBao.push.apply(kq.canhBao, kt.canhBao);
  kq.loiQuyTac = kt.loi;
  kq.canhBaoQuyTac = kt.canhBao;
  kq.chanToanBo = coLoiToanBo(kt);
  return kq;
}

// ---- Khung cấu hình mặc định (spec: không ghi đè tab đã có, không có thành viên) -----------------
function khungMacDinh() {
  var T = TEN_TAB, H = TIEU_DE, k = {};
  k[T.thamSo] = [H.thamSo.slice(),
    ['donGiaPoint', 50000], ['phuCap', 200000], ['heSoHoTroSale', 0.17], ['pointMoiCaBaoHanh', 1],
    ['heSoMin', 0.7], ['tranDoanhThu', 1.2], ['saiSoDoiSoat', 0.01], ['tenTabKetQua', TEN_TAB_KET_QUA_MAC_DINH]];
  k[T.bac] = [H.bac.slice(), [1, 6000000, 120, 150], [2, 7500000, 150, 200], [3, 8500000, 200, 250], [4, 10000000, 250, 300], [5, 12000000, 300, 350]];
  k[T.bacThang] = [H.bacThang.slice(), [0, 0.7, 0], [0.7, 0.8, 0.15], [0.8, 0.9, 0.2], [0.9, 1, 0.25], [1, '', 0.35]];
  k[T.chiSo] = [H.chiSo.slice(), ['vongQuayHTK', 'Thời gian vòng quay HTK', 'thấp tốt'], ['tyLeBaoHanh', 'Tỷ lệ bảo hành', 'thấp tốt'],
    ['tyLeHaiLong', 'Tỷ lệ hài lòng thiết bị', 'cao tốt'], ['doanhThu', 'Hoàn thành doanh thu', 'doanh thu']];
  [['nhomThietBi'], ['maHang'], ['viecQuanLyKho'], ['heSoChia'], ['khuVuc'], ['thanhVien'], ['tyTrong']].forEach(function (x) {
    k[T[x[0]]] = [H[x[0]].slice()];
  });
  // Các bảng nhập tay của kỳ (chỉ có tiêu đề) để chủ sở hữu biết cần nhập gì
  k[T.ky] = [H.ky.slice(), ['Tháng', '']];
  ['baoHanhHoTroSale', 'xacNhanBaoCao', 'nhatKyCongViec', 'keyMetrics'].forEach(function (x) { k[T[x]] = [H[x].slice()]; });
  return k;
}

// Trả {tabCanTao: {tên: bảng}, tabDaCo: [tên]} cho các tab còn thiếu; không bao giờ đụng tới tab đã có.
function laKhungCanTao(tabDaCo) {
  var khung = khungMacDinh();
  var co = {};
  (tabDaCo || []).forEach(function (t) { co[chuanHoaKhoa(t)] = true; });
  var can = {}, giuNguyen = [];
  Object.keys(khung).forEach(function (ten) {
    if (co[chuanHoaKhoa(ten)]) giuNguyen.push(ten); else can[ten] = khung[ten];
  });
  return { tabCanTao: can, tabDaCo: giuNguyen };
}
