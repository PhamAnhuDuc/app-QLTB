// Hằng số và tiện ích bảng hai chiều cho lớp Sheet. Hàm thuần, không gọi API Apps Script.
// "Bảng" ở đây là mảng các dòng, mỗi dòng là mảng ô (đúng kiểu getValues() trả về).
// Số dòng báo cho người dùng luôn tính từ 1 (dòng đầu của tab là dòng 1).

// Tên các tab: MỘT nơi duy nhất (spec sheet-config-storage). Tên tab báo cáo kiểm kê của từng khu vực
// nằm trong cấu hình (tab CH_KhuVuc), không nằm ở đây. Tên tab kết quả mặc định, đổi được bằng tham số
// tenTabKetQua trong CH_ThamSo.
var TEN_TAB = {
  thamSo: 'CH_ThamSo',
  bac: 'CH_Bac',
  bacThang: 'CH_BacThang',
  chiSo: 'CH_ChiSo',
  nhomThietBi: 'CH_NhomThietBi',
  maHang: 'CH_MaHang',
  viecQuanLyKho: 'CH_ViecQuanLyKho',
  heSoChia: 'CH_HeSoChia',
  khuVuc: 'CH_KhuVuc',
  thanhVien: 'CH_ThanhVien',
  tyTrong: 'CH_TyTrong',
  ky: 'Ky',
  baoHanhHoTroSale: 'BaoHanh_HoTroSale',
  xacNhanBaoCao: 'XacNhanBaoCao',
  nhatKyCongViec: 'NhatKyCongViec',
  keyMetrics: 'KeyMetrics',
  ketQua: 'KetQua',
  giaiThich: 'GiaiThich',
  nhatKyHeThong: 'NhatKyHeThong',
  kyDaChot: 'KyDaChot'
};

// Tiền tố tên tab bản sao của kỳ đã chốt (Chot_2026-09, Chot_2026-09_cu1...). Các tab này do lệnh duyệt và mở lại ghi.
var TIEN_TO_TAB_CHOT = 'Chot_';

// Các tab chỉ để đọc (không bao giờ bị ghi bởi lệnh Tính kỳ): cấu hình, nhập tay (báo cáo kiểm kê theo khu vực
// được thêm động từ cấu hình).
function danhSachTabDauVao() {
  return [TEN_TAB.thamSo, TEN_TAB.bac, TEN_TAB.bacThang, TEN_TAB.chiSo, TEN_TAB.nhomThietBi, TEN_TAB.maHang,
    TEN_TAB.viecQuanLyKho, TEN_TAB.heSoChia, TEN_TAB.khuVuc, TEN_TAB.thanhVien, TEN_TAB.tyTrong,
    TEN_TAB.ky, TEN_TAB.baoHanhHoTroSale, TEN_TAB.xacNhanBaoCao, TEN_TAB.nhatKyCongViec, TEN_TAB.keyMetrics];
}

// Tab chỉ mục các kỳ đã chốt và các tab bản sao kỳ: chỉ lệnh duyệt và mở lại ghi, và không bao giờ được đọc như dữ liệu đầu vào.
function laTabChot(ten) {
  var k = chuanHoaKhoa(ten);
  return k === chuanHoaKhoa(TEN_TAB.kyDaChot) || k.indexOf(chuanHoaKhoa(TIEN_TO_TAB_CHOT)) === 0;
}

// Tab chỉ do lệnh Tính kỳ ghi.
function danhSachTabDauRa() {
  return [TEN_TAB.ketQua, TEN_TAB.giaiThich, TEN_TAB.nhatKyHeThong];
}

// ---- Tiện ích bảng hai chiều ---------------------------------------------------------------

function layO(bang, dong, cot) {
  if (!bang || !bang[dong]) return null;
  var v = bang[dong][cot];
  return v === undefined ? null : v;
}

function oLaChu(v) {
  return typeof v === 'string';
}

// Chuẩn hoá chữ để so tiêu đề: bỏ phân biệt hoa/thường và khoảng trắng thừa.
function chuanHoaTieuDe(v) {
  return chuanHoaKhoa(v);
}

function dongTrong(dong) {
  if (!dong) return true;
  for (var i = 0; i < dong.length; i++) if (!laTrong(dong[i])) return false;
  return true;
}

// Tìm ô có nội dung (đã chuẩn hoá) bằng `can`, trong các dòng [tuDong, denDong]. Trả {dong, cot} (đếm từ 0) hoặc null.
function timO(bang, can, tuDong, denDong) {
  var k = chuanHoaTieuDe(can);
  var den = Math.min(denDong, (bang || []).length - 1);
  for (var r = Math.max(0, tuDong); r <= den; r++) {
    var d = bang[r] || [];
    for (var c = 0; c < d.length; c++) {
      if (oLaChu(d[c]) && chuanHoaTieuDe(d[c]) === k) return { dong: r, cot: c };
    }
  }
  return null;
}

// Số thật: chỉ nhận kiểu số. Chuỗi, kể cả "123", KHÔNG được đoán thành số (spec kiem-ke-report-import).
// Trả {trong} khi ô trống, {hopLe: false} khi không phải số, {hopLe: true, giaTri} khi là số.
function soThat(v) {
  if (laTrong(v)) return { trong: true, hopLe: false, giaTri: null };
  if (typeof v === 'number' && isFinite(v)) return { trong: false, hopLe: true, giaTri: v };
  return { trong: false, hopLe: false, giaTri: null };
}

// Mô tả vị trí cho thông báo.
function viTri(tenTab, soDong, tenCot) {
  var s = 'tab ' + tenTab;
  if (soDong !== null && soDong !== undefined) s += ', dòng ' + soDong;
  if (tenCot) s += ', cột "' + tenCot + '"';
  return s;
}

// Lỗi nhập liệu do lớp Sheet phát hiện (khác lỗi của lõi). chan = 'nhapLieu': không chặn người nào ở lõi
// nhưng làm kỳ không được coi là đủ dữ liệu.
function loiNhapLieu(ma, tenTab, soDong, tenCot, thongDiep, chiTiet) {
  var ct = chiTiet || {};
  ct.tab = tenTab;
  if (soDong !== null && soDong !== undefined) ct.dong = soDong;
  if (tenCot) ct.cot = tenCot;
  return taoThongBao('loi', ma, '[' + viTri(tenTab, soDong, tenCot) + '] ' + thongDiep, ct, 'nhapLieu');
}

// Tiêu đề cột chuẩn của từng bảng. Cột được tìm theo TIÊU ĐỀ (không theo thứ tự cột), nên đổi thứ tự cột không sao,
// nhưng đổi tên tiêu đề thì bị báo thiếu cột.
var TIEU_DE = {
  thamSo: ['Tham số', 'Giá trị'],
  bac: ['Bậc', 'Lương cố định', 'Min', 'Max'],
  bacThang: ['Từ', 'Đến', '% thưởng'],
  chiSo: ['Mã chỉ số', 'Tên', 'Kiểu'],
  nhomThietBi: ['Nhóm', 'Point xuất bán', 'Point chuyển kho'],
  maHang: ['Mã hàng', 'Nhóm'],
  viecQuanLyKho: ['Loại việc', 'Hệ số'],
  heSoChia: ['Nguồn', 'Khu vực', 'Tài khoản', 'Hệ số'],
  khuVuc: ['Khu vực', 'Tab báo cáo'],
  thanhVien: ['Tài khoản', 'Tên', 'Bậc', 'Khu vực', 'Nhóm', 'Máy tính cá nhân', 'Ghi đè lương cố định'],
  tyTrong: ['Tài khoản', 'Chỉ số', 'Tỷ trọng'],
  ky: ['Mục', 'Giá trị'],
  baoHanhHoTroSale: ['Khu vực', 'Số ca bảo hành', 'Số đơn hỗ trợ sale'],
  xacNhanBaoCao: ['Khu vực', 'Xác nhận'],
  nhatKyCongViec: ['Tài khoản', 'Loại việc', 'Mô tả', 'Số lượng'],
  keyMetrics: ['Chỉ số', 'Cấp độ', 'Khoá', 'Mục tiêu', 'Kết quả']
};

// Nhãn tiếng Việt cho các giá trị liệt kê (người dùng gõ nhãn, lõi dùng mã).
var NHAN_NGUON = { 'xuatbanchuyenkho': 'xuatBanChuyenKho', 'xuất bán/chuyển kho': 'xuatBanChuyenKho', 'xuất bán / chuyển kho': 'xuatBanChuyenKho',
  'baohanh': 'baoHanh', 'bảo hành': 'baoHanh', 'hotrosale': 'hoTroSale', 'hỗ trợ sale': 'hoTroSale' };
var NHAN_KIEU_CHI_SO = { 'thaptot': 'thapTot', 'thấp tốt': 'thapTot', 'caotot': 'caoTot', 'cao tốt': 'caoTot',
  'doanhthu': 'doanhThu', 'doanh thu': 'doanhThu' };
var NHAN_CAP_DO = { 'nhóm': 'nhom', 'nhom': 'nhom', 'khu vực': 'khuVuc', 'khuvuc': 'khuVuc', 'tài khoản': 'taiKhoan', 'taikhoan': 'taiKhoan' };
