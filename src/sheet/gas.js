// Lớp Apps Script MỎNG: chỉ gọi SpreadsheetApp, DriveApp, Utilities. Mọi quy tắc nằm ở các tệp thuần khác.
//
// Nguyên tắc (spec sheet-result-output):
//   - Chỉ chạy khi chủ sở hữu chọn lệnh trong menu; không tự chạy khi mở Sheet, khi dữ liệu đổi hay theo lịch.
//   - Tính kỳ chỉ GHI vào tab kết quả, giải thích, nhật ký hệ thống; không bao giờ sửa tab đầu vào.
//     Chỉ lệnh duyệt và mở lại kỳ (gas-chot.js) mới ghi thêm chỉ mục và tab bản sao kỳ.
//   - Không gọi mạng, không gửi thư, không ghi sang tệp khác.

var TEN_MENU = 'Tính point';
var LENH_BANG_DIEU_KHIEN = 'moBangDieuKhien';
var LENH_TINH_KY = 'tinhKyTuMenu';
var LENH_KHOI_TAO = 'khoiTaoKhungCauHinh';

// Chỉ thêm menu. Tuyệt đối không tính hay ghi gì ở đây.
function onOpen() {
  var menu = SpreadsheetApp.getUi().createMenu(TEN_MENU)
    .addItem('Bảng điều khiển', LENH_BANG_DIEU_KHIEN)
    .addItem('Tính kỳ', LENH_TINH_KY)
    .addItem('Khởi tạo khung cấu hình', LENH_KHOI_TAO);
  // Chỉ có trong "bản thử" (dist/Code-thu.gs). Bản dùng thật không định nghĩa hàm này nên không có mục này.
  if (typeof napDuLieuMauThu === 'function') menu.addItem('Nạp dữ liệu mẫu GIẢ (chỉ để thử)', 'napDuLieuMauThu');
  menu.addToUi();
}

function thongBaoChoNguoiDung(noiDung) {
  SpreadsheetApp.getUi().alert(noiDung);
}

function thoiDiemHienTai(ss) {
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

// Đọc mọi tab đầu vào thành {tên tab: bảng hai chiều}. Không đọc các tab đầu ra.
function docCacTabDauVao(ss) {
  var ra = {};
  var tabRa = danhSachTabDauRa().map(chuanHoaKhoa);
  ss.getSheets().forEach(function (sh) {
    var ten = sh.getName();
    if (tabRa.indexOf(chuanHoaKhoa(ten)) >= 0 || laTabChot(ten)) return;
    ra[ten] = sh.getDataRange().getValues();
  });
  return ra;
}

function layHoacTaoTab(ss, ten) {
  return ss.getSheetByName(ten) || ss.insertSheet(ten);
}

// Ghi một vùng giá trị vào tab sau khi đặt định dạng văn bản cho các ô chuỗi (để không bị hiểu thành công thức).
function ghiBang(sheet, vung) {
  sheet.clear();
  var giaTri = vung.giaTri;
  if (giaTri.length === 0 || giaTri[0].length === 0) return;
  if (vung.oVanBan && vung.oVanBan.length > 0) sheet.getRangeList(vung.oVanBan).setNumberFormat('@');
  sheet.getRange(1, 1, giaTri.length, giaTri[0].length).setValues(giaTri);
  if (vung.dinhDang) apDinhDang(sheet, vung.dinhDang);
}

// Áp định dạng hiển thị (không đổi giá trị): số có dấu phân cách, phần trăm, in đậm, độ rộng cột.
function apDinhDang(sheet, dd) {
  dd.soDinhDang.forEach(function (g) { if (g.oSo.length > 0) sheet.getRangeList(g.oSo).setNumberFormat(g.format); });
  if (dd.dam.length > 0) sheet.getRangeList(dd.dam).setFontWeight('bold');
  dd.doRong.forEach(function (px, i) { sheet.setColumnWidth(i + 1, px); });
}

function themDongNhatKyHeThong(ss, dongMoi) {
  var sh = layHoacTaoTab(ss, TEN_TAB.nhatKyHeThong);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, TIEU_DE_NHAT_KY_HE_THONG.length).setValues([TIEU_DE_NHAT_KY_HE_THONG]);
  }
  if (dongMoi.length === 0) return;
  sh.getRange(sh.getLastRow() + 1, 1, dongMoi.length, dongMoi[0].length).setValues(dongMoi);
}

// Ghi kết quả ra ba tab đầu ra (chỉ các tab này). Dùng chung cho Tính kỳ và Duyệt.
function ghiKetQuaRaSheet(ss, kq) {
  var ra = dungKetQuaSheet(kq);
  ghiBang(layHoacTaoTab(ss, kq.tenTabKetQua), ra.ketQua);
  ghiBang(layHoacTaoTab(ss, TEN_TAB.giaiThich), ra.giaiThich);
  themDongNhatKyHeThong(ss, ra.dongNhatKy);
  return ra;
}

// Thực hiện Tính kỳ KHÔNG bật hộp thoại (dùng cho cả menu và bảng điều khiển).
// Trả {daGhi:false, lyDo, thongDiep} khi bị từ chối, hoặc {daGhi:true, kq, tenTabKetQua, chanToanBo, kyDuDuLieu}.
function thucHienTinh(ss) {
  // 1. Kiểm tra chia sẻ TRƯỚC khi đọc hay ghi bất cứ thứ gì
  var chiaSe = danhGiaChiaSe(docThongTinChiaSe(DriveApp, ss.getId()));
  if (chiaSe.mucDo === 'chan') {
    return { daGhi: false, lyDo: chiaSe.ma, thongDiep: 'Không tính được.\n\n' + chiaSe.thongDiep };
  }

  // 2. Đọc và tính (hàm thuần)
  var kq = tinhKyTuCacTab(docCacTabDauVao(ss), thoiDiemHienTai(ss));
  if (chiaSe.mucDo === 'canhBao') {
    kq.canhBao.push(taoThongBao('canhBao', chiaSe.ma, chiaSe.thongDiep, {}));
  }
  themCanhBaoKyDaChot(ss, kq); // nếu kỳ đã chốt: cảnh báo và so với bản chốt (không đổi gì ở bản chốt)

  // 3. Tên tab kết quả không được trùng tab đầu vào
  var loiTen = kiemTraTenTabKetQua(kq.tenTabKetQua, kq.khuVuc);
  if (loiTen !== null) {
    return { daGhi: false, lyDo: 'TEN_TAB_KET_QUA_TRUNG', thongDiep: 'Không ghi kết quả.\n\n' + loiTen };
  }

  // 4. Ghi: chỉ các tab đầu ra
  ghiKetQuaRaSheet(ss, kq);
  return { daGhi: true, kq: kq, tenTabKetQua: kq.tenTabKetQua, chanToanBo: kq.chanToanBo, kyDuDuLieu: kq.kyDuDuLieu };
}

// Lệnh "Tính kỳ" trong menu. Trả về một tóm tắt (để test) và hiện thông báo cho chủ sở hữu.
function tinhKyTuMenu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var r = thucHienTinh(ss);
  if (!r.daGhi) {
    thongBaoChoNguoiDung(r.thongDiep);
    return { daGhi: false, lyDo: r.lyDo };
  }
  var tomTat = r.chanToanBo ? 'Không tính được, xem lỗi trong tab ' + r.tenTabKetQua + '.'
    : 'Đã tính xong (' + (r.kyDuDuLieu ? 'đủ dữ liệu' : 'CHƯA đủ dữ liệu') + '). Xem tab ' + r.tenTabKetQua + '. Kết quả là đề xuất chờ bạn duyệt.';
  thongBaoChoNguoiDung(tomTat);
  return { daGhi: true, tenTabKetQua: r.tenTabKetQua, chanToanBo: r.chanToanBo, kyDuDuLieu: r.kyDuDuLieu };
}

// Lệnh "Khởi tạo khung cấu hình": chỉ tạo tab còn thiếu, không ghi đè hay xoá tab nào đã có.
function khoiTaoKhungCauHinh() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var daCo = ss.getSheets().map(function (s) { return s.getName(); });
  var khung = laKhungCanTao(daCo);
  var tao = Object.keys(khung.tabCanTao);
  tao.forEach(function (ten) {
    var bang = khung.tabCanTao[ten];
    var sh = ss.insertSheet(ten);
    sh.getRange(1, 1, bang.length, bang[0].length).setValues(bang);
  });
  thongBaoChoNguoiDung('Đã tạo ' + tao.length + ' tab còn thiếu' + (tao.length ? ': ' + tao.join(', ') : '') +
    '. Giữ nguyên ' + khung.tabDaCo.length + ' tab đã có.');
  return { daTao: tao, giuNguyen: khung.tabDaCo };
}
