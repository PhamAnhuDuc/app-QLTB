// Bản chốt kỳ và chỉ mục các kỳ đã chốt (spec period-approval, phần thuần). Hàm thuần, không gọi API Apps Script.
//
// Bản chốt là một tab `Chot_<kỳ>`: siêu dữ liệu, bảng kết quả đã duyệt để đọc bằng mắt, và JSON toàn bộ cấu hình cùng dữ liệu
// kỳ đã dùng (chia đoạn để không vượt giới hạn 50.000 ký tự mỗi ô), kèm dấu vân tay để phát hiện sửa tay.
// Chỉ mục `KyDaChot` là nhật ký sự kiện: mỗi lần chốt hoặc mở lại thêm một dòng, không bao giờ sửa dòng cũ.

var TRANG_THAI_DA_CHOT = 'Đã chốt';
var TRANG_THAI_DA_MO_LAI = 'Đã mở lại';
var DO_DAI_DOAN = 40000;
var TIEN_TO_DOAN = '~'; // đứng đầu mỗi đoạn để không bao giờ bắt đầu bằng = + - @ (Sheet sẽ hiểu thành công thức)
var PHIEN_BAN_BAN_CHOT = 1;
var TIEU_DE_CHI_MUC = ['Kỳ', 'Trạng thái', 'Thời điểm', 'Tổng thu nhập đã duyệt', 'Số người đã tính', 'Số người bỏ qua', 'Tab bản sao', 'Lý do'];

// ---- Dấu vân tay và chia đoạn ---------------------------------------------------------------
// FNV-1a 32 bit trên các đơn vị UTF-16. Chỉ để phát hiện sửa tay hoặc hỏng dữ liệu, KHÔNG phải bảo mật chống kẻ tấn công.
function dauVanTay(chuoi) {
  var h = 0x811c9dc5;
  for (var i = 0; i < chuoi.length; i++) {
    h ^= chuoi.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  var hex = h.toString(16);
  while (hex.length < 8) hex = '0' + hex;
  return hex;
}

function chiaDoan(chuoi, doDai) {
  var n = doDai || DO_DAI_DOAN;
  var ra = [];
  for (var i = 0; i < chuoi.length; i += n) ra.push(chuoi.slice(i, i + n));
  return ra.length > 0 ? ra : [''];
}

function ghepDoan(mang) {
  return mang.join('');
}

// ---- Nội dung bản chốt ----------------------------------------------------------------------
// kq: kết quả của tinhKyTuCacTab (đã có cauHinh và duLieuKy). xacNhanBoQua: tài khoản các người được xác nhận bỏ qua.
// Chỉ giữ các trường cần để tái lập kết quả: không giá bán, giá trị tồn hay mô tả nhật ký (các phần đó không vào dữ liệu kỳ).
// Làm tròn khi lưu để bản chốt không mang nhiễu số thực (ví dụ 3779999.9999999995 → 3780000). null giữ nguyên.
function lamTronLuu(x, soLe) {
  if (x === null || x === undefined) return null;
  var k = Math.pow(10, soLe);
  return Math.round(x * k) / k;
}

function dungBanChot(kq, thoiDiem, xacNhanBoQua) {
  var thanhVien = kq.thanhVien.map(function (r) {
    return { taiKhoan: r.taiKhoan, ten: r.ten, nhom: r.nhom, trangThai: r.trangThai, pointTong: lamTronLuu(r.pointTong, 4),
      diemKM: lamTronLuu(r.diemKM, 6), phanTramThuong: r.phanTramThuong, luongCoDinh: lamTronLuu(r.luongCoDinh, 2),
      thuongKM: lamTronLuu(r.thuongKM, 2), thuongVuotPoint: lamTronLuu(r.thuongVuotPoint, 2), phuCap: lamTronLuu(r.phuCap, 2),
      thuNhap: r.thuNhap };
  });
  var boQua = (xacNhanBoQua || []).slice();
  return {
    phienBan: PHIEN_BAN_BAN_CHOT,
    ky: kq.ky.thang,
    thoiDiem: thoiDiem,
    cauHinh: JSON.parse(JSON.stringify(kq.cauHinh)),
    duLieuKy: JSON.parse(JSON.stringify(kq.duLieuKy)),
    xacNhanBoQua: boQua,
    thanhVien: thanhVien,
    tong: { thuNhap: kq.tong.team.thuNhap, soDaTinh: kq.tong.team.soDaTinh, tongSo: kq.tong.team.tongSo }
  };
}

function tenTabChot(ky) { return TIEN_TO_TAB_CHOT + ky; }
function tenTabChotCu(ky, n) { return TIEN_TO_TAB_CHOT + ky + '_cu' + n; }

// Số thứ tự tiếp theo cho tab bản chốt cũ của kỳ (Chot_<kỳ>_cu1, _cu2...), dựa trên tên tab hiện có.
function soThuTuTabCu(danhSachTen, ky) {
  var tienTo = chuanHoaKhoa(TIEN_TO_TAB_CHOT + ky + '_cu');
  var lon = 0;
  (danhSachTen || []).forEach(function (t) {
    var k = chuanHoaKhoa(t);
    if (k.indexOf(tienTo) === 0) { var n = Number(k.slice(tienTo.length)); if (isFinite(n) && n > lon) lon = n; }
  });
  return lon + 1;
}

// ---- Tab bản sao dạng bảng hai chiều ---------------------------------------------------------
// bangKetQua: giaTri của tab kết quả (mảng hai chiều) để đọc bằng mắt. Trả {giaTri, oVanBan, soDoan, dauVanTay}.
function dungTabChot(banChot, bangKetQua) {
  var json = JSON.stringify(banChot);
  var doan = chiaDoan(json, DO_DAI_DOAN);
  var vt = dauVanTay(json);
  var rows = [
    ['BẢN SAO KỲ ĐÃ CHỐT – chỉ để tra cứu, không sửa tay'],
    ['Kỳ', banChot.ky],
    ['Thời điểm chốt', banChot.thoiDiem],
    ['Người bị bỏ qua khi chốt', banChot.xacNhanBoQua.length > 0 ? banChot.xacNhanBoQua.join('; ') : '—'],
    ['Tổng thu nhập đã duyệt', banChot.tong.thuNhap === null ? '—' : banChot.tong.thuNhap],
    ['Số người đã tính / tổng', banChot.tong.soDaTinh + '/' + banChot.tong.tongSo],
    ['Dấu vân tay dữ liệu', vt],
    ['Số đoạn dữ liệu', doan.length],
    [],
    ['KẾT QUẢ ĐÃ DUYỆT']
  ];
  (bangKetQua || []).forEach(function (d) { rows.push(d.slice()); });
  rows.push([]);
  rows.push(['DỮ LIỆU ĐÃ DÙNG (JSON, không sửa tay)']);
  doan.forEach(function (d) { rows.push([TIEN_TO_DOAN + d]); });
  var rong = 0;
  rows.forEach(function (r) { if (r.length > rong) rong = r.length; });
  rows = rows.map(function (r) { var x = r.slice(); while (x.length < rong) x.push(''); return x; });
  return { giaTri: rows, oVanBan: danhDauOVanBan(rows), soDoan: doan.length, dauVanTay: vt };
}

// Đọc bản sao từ bảng hai chiều. Trả {banChot, hopLe, loi}. hopLe=false khi dấu vân tay không khớp hoặc dữ liệu hỏng.
function docTabChot(bang) {
  var kq = { banChot: null, hopLe: false, loi: [] };
  function timGiaTri(nhan) {
    for (var r = 0; r < (bang || []).length; r++) if (bang[r] && chuanHoaKhoa(bang[r][0]) === chuanHoaKhoa(nhan)) return { r: r, v: bang[r][1] };
    return null;
  }
  var vt = timGiaTri('Dấu vân tay dữ liệu'), sd = timGiaTri('Số đoạn dữ liệu');
  var dau = null;
  for (var i = 0; i < (bang || []).length; i++) {
    if (bang[i] && typeof bang[i][0] === 'string' && bang[i][0].indexOf('DỮ LIỆU ĐÃ DÙNG') === 0) { dau = i; break; }
  }
  if (!vt || !sd || dau === null) { kq.loi.push('Tab không đúng cấu trúc bản chốt'); return kq; }
  var soDoan = Number(sd.v), doan = [];
  for (var j = 1; j <= soDoan; j++) {
    var o = bang[dau + j] ? bang[dau + j][0] : null;
    if (typeof o !== 'string' || o.indexOf(TIEN_TO_DOAN) !== 0) { kq.loi.push('Thiếu hoặc hỏng đoạn dữ liệu số ' + j); return kq; }
    doan.push(o.slice(TIEN_TO_DOAN.length));
  }
  var json = ghepDoan(doan);
  if (dauVanTay(json) !== String(vt.v)) kq.loi.push('Bản chốt đã bị sửa: dấu vân tay không khớp');
  try { kq.banChot = JSON.parse(json); } catch (e) { kq.loi.push('Dữ liệu bản chốt không đọc được'); return kq; }
  kq.hopLe = kq.loi.length === 0;
  return kq;
}

// ---- Chỉ mục các kỳ đã chốt -----------------------------------------------------------------
function dungDongChiMuc(sk) {
  // sk: {ky, trangThai, thoiDiem, tong, soDaTinh, soBoQua, tenTab, lyDo}
  return [sk.ky, sk.trangThai, sk.thoiDiem, sk.tong === null || sk.tong === undefined ? '' : sk.tong, sk.soDaTinh, sk.soBoQua, sk.tenTab, sk.lyDo || ''];
}

function docChiMuc(bang) {
  var ds = [];
  var cacDong = bang || [];
  for (var r = 0; r < cacDong.length; r++) {
    var d = cacDong[r];
    if (!d || dongTrong(d) || chuanHoaKhoa(d[0]) === chuanHoaKhoa(TIEU_DE_CHI_MUC[0])) continue;
    ds.push({ ky: String(d[0]).trim(), trangThai: String(d[1]).trim(), thoiDiem: d[2], tong: d[3] === '' ? null : d[3], soDaTinh: d[4], soBoQua: d[5],
      tenTab: d[6], lyDo: d[7] === undefined ? '' : d[7], dong: r + 1 });
  }
  return ds;
}

// Trạng thái hiệu lực của một kỳ: trạng thái của dòng mới nhất, hoặc null nếu kỳ chưa từng chốt.
function trangThaiHieuLuc(chiMuc, ky) {
  var tt = null;
  chiMuc.forEach(function (s) { if (chuanHoaKhoa(s.ky) === chuanHoaKhoa(ky)) tt = s.trangThai; });
  return tt;
}

function dongChotMoiNhat(chiMuc, ky) {
  var dong = null;
  chiMuc.forEach(function (s) { if (chuanHoaKhoa(s.ky) === chuanHoaKhoa(ky) && s.trangThai === TRANG_THAI_DA_CHOT) dong = s; });
  return dong;
}

// ---- Điều kiện duyệt ------------------------------------------------------------------------
// kq: kết quả của tinhKyTuCacTab; trangThaiKy: trạng thái hiệu lực của kỳ; xacNhan: tài khoản đã được xác nhận bỏ qua.
// Trả {duocPhep, lyDo: [{ma, thongDiep}], canXacNhan: [{taiKhoan, ten, lyDo}], thieuXacNhan: [taiKhoan]}.
function danhGiaDieuKienDuyet(kq, trangThaiKy, xacNhan) {
  var lyDo = [];
  if (kq.chanToanBo) {
    lyDo.push({ ma: 'CHAN_TOAN_BO', thongDiep: 'Cấu hình hoặc kỳ đang có lỗi chặn toàn bộ, chưa tính được. Hãy sửa lỗi rồi thử lại.' });
  }
  var canXacNhan = [];
  if (!kq.chanToanBo) {
    kq.doiSoat.filter(function (d) { return !d.dat; }).forEach(function (d) {
      lyDo.push({ ma: 'DOI_SOAT_LECH', thongDiep: 'Đối soát lệch ở nguồn ' + d.nguon + (d.khuVuc ? ' khu vực ' + d.khuVuc : '') + ' (lệch ' + d.lech + ')' });
    });
    kq.loi.filter(function (l) { return l.chan === 'doiSoat'; }).forEach(function (l) {
      lyDo.push({ ma: 'DU_LIEU_CHUA_KHOP', thongDiep: l.thongDiep });
    });
    if (kq.tong.team.soDaTinh === 0) {
      lyDo.push({ ma: 'KHONG_AI_TINH_DUOC', thongDiep: 'Không có thành viên nào tính được nên không có kết quả để chốt.' });
    }
    kq.thanhVien.filter(function (r) { return r.trangThai === 'chuaTinh'; }).forEach(function (r) {
      canXacNhan.push({ taiKhoan: r.taiKhoan, ten: r.ten || r.taiKhoan, lyDo: r.lyDo.join('; ') });
    });
  }
  if (trangThaiKy === TRANG_THAI_DA_CHOT) {
    lyDo.push({ ma: 'KY_DA_CHOT', thongDiep: 'Kỳ ' + (kq.ky ? kq.ky.thang : '') + ' đã được chốt. Muốn chốt lại hãy dùng "Mở lại kỳ" (cần lý do).' });
  }
  var daXacNhan = {};
  (xacNhan || []).forEach(function (t) { daXacNhan[chuanHoaKhoa(t)] = true; });
  var thieu = canXacNhan.filter(function (x) { return !daXacNhan[chuanHoaKhoa(x.taiKhoan)]; }).map(function (x) { return x.taiKhoan; });
  return { duocPhep: lyDo.length === 0 && thieu.length === 0, lyDo: lyDo, canXacNhan: canXacNhan, thieuXacNhan: thieu };
}

// ---- So sánh tính lại với bản chốt ---------------------------------------------------------
// Trả {giong, tongKhac, khac: [{taiKhoan, cu, moi}]}. Thu nhập null nghĩa là chưa tính.
function soSanhVoiBanChot(kq, banChot) {
  var cu = {}, moi = {};
  banChot.thanhVien.forEach(function (r) { cu[chuanHoaKhoa(r.taiKhoan)] = { tk: r.taiKhoan, v: r.trangThai === 'daTinh' ? r.thuNhap : null }; });
  kq.thanhVien.forEach(function (r) { moi[chuanHoaKhoa(r.taiKhoan)] = { tk: r.taiKhoan, v: r.trangThai === 'daTinh' ? r.thuNhap : null }; });
  var khac = [];
  var tatCa = {};
  Object.keys(cu).concat(Object.keys(moi)).forEach(function (k) { tatCa[k] = true; });
  Object.keys(tatCa).forEach(function (k) {
    var a = cu[k] ? cu[k].v : undefined, b = moi[k] ? moi[k].v : undefined;
    if (a !== b) khac.push({ taiKhoan: (cu[k] || moi[k]).tk, cu: a === undefined ? null : a, moi: b === undefined ? null : b });
  });
  return { giong: khac.length === 0, tongKhac: khac.length, khac: khac };
}

// ---- Tab mồ côi: có tên Chot_<kỳ> nhưng chỉ mục không coi kỳ đó là đang Đã chốt (chốt dở dang) ----
function timTabMoCoi(danhSachTen, chiMuc) {
  var ra = [];
  (danhSachTen || []).forEach(function (t) {
    var k = chuanHoaKhoa(t);
    var tt = chuanHoaKhoa(TIEN_TO_TAB_CHOT);
    if (k.indexOf(tt) !== 0) return;
    var phanSau = t.slice(TIEN_TO_TAB_CHOT.length);
    if (/_cu\d+$/i.test(phanSau)) return; // bản chốt cũ do mở lại, giữ nguyên
    if (trangThaiHieuLuc(chiMuc, phanSau) !== TRANG_THAI_DA_CHOT) ra.push(t);
  });
  return ra;
}
