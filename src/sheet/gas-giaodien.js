// Máy chủ của bảng điều khiển (spec control-panel-ui). Lớp Apps Script mỏng: chỉ gọi SpreadsheetApp, HtmlService, DriveApp, Utilities.
//
// Chỉ các hàm trong HAM_MAY_CHU_GIAO_DIEN (giaodien.js) được trang gọi. Chúng trả về đối tượng thuần chỉ chứa những gì cần hiển thị
// (xem taoMoHinhGiaoDien) và KHÔNG sửa dữ liệu nhập hay cấu hình. Duyệt và mở lại dùng đúng các hàm thucHienDuyet, thucHienMoLai.

var TIEU_DE_HOP_THOAI = 'Tính point và thu nhập tạm tính';
var RONG_HOP_THOAI = 1100;
var CAO_HOP_THOAI = 720;

// Mở bảng điều khiển bằng hộp thoại không chặn Sheet. Chỉ chạy khi chủ sở hữu chọn menu.
function moBangDieuKhien() {
  var html = HtmlService.createHtmlOutput(taoTrangGiaoDien()).setWidth(RONG_HOP_THOAI).setHeight(CAO_HOP_THOAI);
  SpreadsheetApp.getUi().showModelessDialog(html, TIEU_DE_HOP_THOAI);
}

// Thông tin nền cho mô hình: chia sẻ, tình trạng tab, lịch sử, kỳ. Chỉ ĐỌC.
function giaoDienThongTinNen(ss) {
  var cacTab = docCacTabDauVao(ss);
  var cauHinh = docCauHinh(cacTab).cauHinh;
  var ky = docKy(cacTab);
  var tenKq = typeof cauHinh.thamSo.tenTabKetQua === 'string' && cauHinh.thamSo.tenTabKetQua !== '' ? cauHinh.thamSo.tenTabKetQua : TEN_TAB.ketQua;
  var shKq = ss.getSheetByName(tenKq);
  return {
    daGhiKetQua: !!shKq && shKq.getLastRow() > 0,
    chiaSe: danhGiaChiaSe(docThongTinChiaSe(DriveApp, ss.getId())),
    tabs: tinhTrangTab(cacTab, cauHinh.khuVuc),
    chiMuc: docChiMucTuSheet(ss),
    thang: ky.ky ? ky.ky.thang : null,
    khuVuc: cauHinh.khuVuc
  };
}

// Tính lại để lấy mô hình, KHÔNG ghi gì vào Sheet.
function giaoDienMoHinhDaTinh(ss) {
  var kq = tinhKyTuCacTab(docCacTabDauVao(ss), thoiDiemHienTai(ss));
  return taoMoHinhGiaoDien(kq, giaoDienThongTinNen(ss));
}

// Dữ liệu trả cho trang phải là đối tượng thuần (không hàm, không giá trị undefined).
function giaoDienThuan(x) {
  return JSON.parse(JSON.stringify(x));
}

function giaoDienLayMoHinh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienThuan(taoMoHinhChuaTinh(giaoDienThongTinNen(ss)));
}

function giaoDienTinh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = thucHienTinh(ss);
  if (!r.daGhi) return { ok: false, thongDiep: r.thongDiep };
  return giaoDienThuan({ ok: true, moHinh: taoMoHinhGiaoDien(r.kq, giaoDienThongTinNen(ss)) });
}

function giaoDienDuyet(xacNhan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ds = Array.isArray(xacNhan) ? xacNhan.filter(function (t) { return typeof t === 'string'; }) : [];
  var r = thucHienDuyet(ss, ds);
  var ra = { daChot: r.daChot, lyDo: r.lyDo || [], ky: r.ky || null, tong: r.tong === undefined ? null : r.tong,
    soDaTinh: r.soDaTinh === undefined ? null : r.soDaTinh, soBoQua: r.soBoQua === undefined ? null : r.soBoQua, moHinh: giaoDienMoHinhDaTinh(ss) };
  return giaoDienThuan(ra);
}

function giaoDienMoLai(thang, lyDo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = thucHienMoLai(ss, thang, lyDo);
  return giaoDienThuan({ daMoLai: r.daMoLai, lyDo: r.lyDo || null, thongDiep: r.thongDiep || null, ky: r.ky || null, tenTabCu: r.tenTabCu || null,
    moHinh: giaoDienMoHinhDaTinh(ss) });
}

function giaoDienLichSu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienThuan(moHinhLichSu(docChiMucTuSheet(ss)));
}

// Chuyển Sheet sang một tab. CHỈ nhận tên tab thuộc danh sách của ứng dụng; mọi tên khác bị từ chối.
function giaoDienMoTab(ten) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabHienCo = ss.getSheets().map(function (s) { return s.getName(); });
  var khuVuc = docCauHinh(docCacTabDauVao(ss)).cauHinh.khuVuc;
  if (!tenTabDuocMo(ten, khuVuc, tabHienCo)) return { daMo: false, thongDiep: 'Tab này không nằm trong danh sách được phép mở.' };
  var sh = ss.getSheets().filter(function (s) { return chuanHoaKhoa(s.getName()) === chuanHoaKhoa(ten); })[0];
  if (!sh) return { daMo: false, thongDiep: 'Không thấy tab "' + String(ten).trim() + '".' };
  ss.setActiveSheet(sh);
  return { daMo: true };
}
