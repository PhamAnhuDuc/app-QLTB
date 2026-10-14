// Tiện ích dùng chung của lõi tính. Hàm thuần, không gọi API của Apps Script.
// Các tệp trong src/core/ là script thường (không dùng module) để chạy được cả trong
// Apps Script và trong Node (xem tests/load-core.js).

var DONG_TRONG = 'TRONG';

// Chuẩn hoá khoá để so khớp không phân biệt hoa/thường và dấu cách thừa.
function chuanHoaKhoa(s) {
  if (s === null || s === undefined) return '';
  return String(s).normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function cungKhoa(a, b) {
  return chuanHoaKhoa(a) === chuanHoaKhoa(b);
}

// Ô trống: null, undefined hoặc chuỗi chỉ có khoảng trắng. Số 0 KHÔNG phải ô trống.
function laTrong(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

// Đọc số. Trả về {trong: true} nếu ô trống, {hopLe: false} nếu không phải số hữu hạn,
// ngược lại {hopLe: true, giaTri}. Phân biệt trống với 0.
function docSo(v) {
  if (laTrong(v)) return { trong: true, hopLe: false, giaTri: null };
  var n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  if (!isFinite(n)) return { trong: false, hopLe: false, giaTri: null };
  return { trong: false, hopLe: true, giaTri: n };
}

function laSoKhongAm(v) {
  var r = docSo(v);
  return r.hopLe && r.giaTri >= 0;
}

// Làm tròn đến đồng.
function lamTronDong(x) {
  return Math.round(x);
}

// Bỏ nhiễu dấu phẩy động trước khi so sánh ngưỡng (ví dụ 0.7999999999 → 0.8).
function xapXi(x) {
  return Math.round(x * 1e9) / 1e9;
}

function gomTheoKhoa(mang, layKhoa) {
  var kq = {};
  for (var i = 0; i < mang.length; i++) {
    var k = chuanHoaKhoa(layKhoa(mang[i]));
    if (!kq[k]) kq[k] = [];
    kq[k].push(mang[i]);
  }
  return kq;
}

// Tạo bản ghi lỗi hoặc cảnh báo. Không nhận số tiền hay thông tin lương.
function taoThongBao(muc, ma, thongDiep, chiTiet, chan) {
  return { muc: muc, ma: ma, thongDiep: thongDiep, chiTiet: chiTiet || {}, chan: chan || null };
}
