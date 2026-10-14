// Duyệt, chốt và mở lại kỳ (spec period-approval). Lớp Apps Script mỏng: mọi quy tắc nằm ở chot.js và các tệp thuần khác.
// Các hàm thucHien* không bật hộp thoại để cả bảng điều khiển lẫn test dùng chung.
//
// Thứ tự ghi khi chốt: bản sao kỳ TRƯỚC, dòng chỉ mục SAU CÙNG (điểm xác nhận). Nếu lỗi giữa chừng thì chỉ có tab bản sao
// không có dòng chỉ mục (mồ côi); lần chốt sau đổi tên tab đó thành bản cũ thay vì xoá, nên không bao giờ mất dữ liệu.

var DAU_HIEU_TAB_BAN_SAO = 'BẢN SAO KỲ ĐÃ CHỐT';

function docBangTuSheet(ss, ten) {
  var sh = ss.getSheetByName(ten);
  return sh ? sh.getDataRange().getValues() : [];
}

function docChiMucTuSheet(ss) {
  return docChiMuc(docBangTuSheet(ss, TEN_TAB.kyDaChot));
}

// Thêm một dòng vào chỉ mục. Các ô chữ đặt định dạng văn bản trước khi ghi (lý do do người dùng gõ có thể bắt đầu bằng "=").
function ghiDongChiMuc(ss, dong) {
  var sh = layHoacTaoTab(ss, TEN_TAB.kyDaChot);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, TIEU_DE_CHI_MUC.length).setValues([TIEU_DE_CHI_MUC]);
    sh.getRangeList(['A1:H1']).setFontWeight('bold');
    sh.setColumnWidth(1, 90); sh.setColumnWidth(2, 100); sh.setColumnWidth(3, 150); sh.setColumnWidth(4, 160);
    sh.setColumnWidth(5, 120); sh.setColumnWidth(6, 120); sh.setColumnWidth(7, 180); sh.setColumnWidth(8, 300);
    sh.protect().setWarningOnly(true);
  }
  var hang = sh.getLastRow() + 1;
  sh.getRangeList(['A' + hang + ':C' + hang, 'G' + hang + ':H' + hang]).setNumberFormat('@');
  sh.getRangeList(['D' + hang]).setNumberFormat('#,##0');
  sh.getRange(hang, 1, 1, dong.length).setValues([dong.map(function (o) { return typeof o === 'string' ? lamSachChuoi(o) : o; })]);
}

function ghiSuKienNhatKy(ss, ma, thoiDiem) {
  // Chỉ loại sự kiện: không tên, tài khoản, số tiền, lý do hay tên tab.
  themDongNhatKyHeThong(ss, [[thoiDiem, 'thongTin', ma, '', 'sukien']]);
}

function tabLaBanSao(sheet) {
  var o = sheet.getRange(1, 1, 1, 1).getValues()[0][0];
  return typeof o === 'string' && o.indexOf(DAU_HIEU_TAB_BAN_SAO) === 0;
}

function kiemTraChiaSeChoGhi(ss) {
  return danhGiaChiaSe(docThongTinChiaSe(DriveApp, ss.getId()));
}

// ---- Duyệt và chốt ----------------------------------------------------------------------------
// xacNhan: danh sách tài khoản chủ sở hữu xác nhận bỏ qua. Luôn tính lại từ các tab, không dùng tab kết quả đang hiển thị.
// Trả {daChot, ...}. Khi bị từ chối: {daChot:false, lyDo:[{ma, thongDiep}], canXacNhan, thieuXacNhan}.
function thucHienDuyet(ss, xacNhan) {
  var chiaSe = kiemTraChiaSeChoGhi(ss);
  if (chiaSe.mucDo === 'chan') {
    return { daChot: false, lyDo: [{ ma: chiaSe.ma, thongDiep: chiaSe.thongDiep }], canXacNhan: [], thieuXacNhan: [] };
  }
  var thoiDiem = thoiDiemHienTai(ss);
  var kq = tinhKyTuCacTab(docCacTabDauVao(ss), thoiDiem);
  var chiMuc = docChiMucTuSheet(ss);
  var tt = kq.ky ? trangThaiHieuLuc(chiMuc, kq.ky.thang) : null;
  var dk = danhGiaDieuKienDuyet(kq, tt, xacNhan);
  if (!dk.duocPhep) {
    var lyDo = dk.lyDo.slice();
    if (dk.thieuXacNhan.length > 0) {
      lyDo.push({ ma: 'THIEU_XAC_NHAN', thongDiep: 'Cần xác nhận bỏ qua từng người chưa tính được trước khi chốt. Còn thiếu: ' + dk.thieuXacNhan.join(', ') });
    }
    return { daChot: false, lyDo: lyDo, canXacNhan: dk.canXacNhan, thieuXacNhan: dk.thieuXacNhan };
  }
  var loiTen = kiemTraTenTabKetQua(kq.tenTabKetQua, kq.khuVuc);
  if (loiTen !== null) {
    return { daChot: false, lyDo: [{ ma: 'TEN_TAB_KET_QUA_TRUNG', thongDiep: loiTen }], canXacNhan: [], thieuXacNhan: [] };
  }

  var ky = kq.ky.thang;
  var tenChot = tenTabChot(ky);
  var tonTai = ss.getSheetByName(tenChot);
  if (tonTai) {
    if (tabLaBanSao(tonTai)) {
      // Bản chốt dở dang từ lần trước (có tab nhưng chỉ mục không coi là Đã chốt): giữ lại dưới tên bản cũ, không xoá
      tonTai.setName(tenTabChotCu(ky, soThuTuTabCu(ss.getSheets().map(function (s) { return s.getName(); }), ky)));
    } else {
      return { daChot: false, lyDo: [{ ma: 'TEN_TAB_CHOT_BI_CHIEM',
        thongDiep: 'Đã có một tab tên "' + tenChot + '" không phải bản sao kỳ của ứng dụng. Hãy đổi tên tab đó rồi chốt lại.' }], canXacNhan: [], thieuXacNhan: [] };
    }
  }

  // Ghi: kết quả đang hiển thị = kết quả được chốt; rồi bản sao; rồi (sau cùng) dòng chỉ mục
  var ra = ghiKetQuaRaSheet(ss, kq);
  var boQua = dk.canXacNhan.map(function (x) { return x.taiKhoan; });
  var ban = dungBanChot(kq, thoiDiem, boQua);
  var tab = dungTabChot(ban, ra.ketQua.giaTri);
  var sh = ss.insertSheet(tenChot);
  ghiBang(sh, { giaTri: tab.giaTri, oVanBan: tab.oVanBan });
  sh.protect().setWarningOnly(true);
  ghiDongChiMuc(ss, dungDongChiMuc({ ky: ky, trangThai: TRANG_THAI_DA_CHOT, thoiDiem: thoiDiem, tong: ban.tong.thuNhap,
    soDaTinh: ban.tong.soDaTinh, soBoQua: boQua.length, tenTab: tenChot, lyDo: '' }));
  ghiSuKienNhatKy(ss, 'KY_DA_CHOT', thoiDiem);
  return { daChot: true, ky: ky, tenTab: tenChot, tong: ban.tong.thuNhap, soDaTinh: ban.tong.soDaTinh, tongSo: ban.tong.tongSo, soBoQua: boQua.length, boQua: boQua };
}

// ---- Mở lại kỳ ---------------------------------------------------------------------------------
// Trả {daMoLai, ...}. Không xoá bản chốt cũ: đổi tên thành Chot_<kỳ>_cu<n>.
function thucHienMoLai(ss, thang, lyDo) {
  var tu = function (ma, thongDiep) { return { daMoLai: false, lyDo: ma, thongDiep: thongDiep }; };
  if (typeof thang !== 'string' || !/^\d{4}-\d{2}$/.test(thang)) return tu('KY_SAI', 'Kỳ không đúng dạng năm-tháng (ví dụ 2026-09).');
  var ly = typeof lyDo === 'string' ? lyDo.trim() : '';
  if (ly === '') return tu('THIEU_LY_DO', 'Cần nhập lý do khi mở lại kỳ.');
  var chiaSe = kiemTraChiaSeChoGhi(ss);
  if (chiaSe.mucDo === 'chan') return tu(chiaSe.ma, chiaSe.thongDiep);

  var chiMuc = docChiMucTuSheet(ss);
  var tt = trangThaiHieuLuc(chiMuc, thang);
  if (tt === null) return tu('KY_CHUA_CHOT', 'Kỳ ' + thang + ' chưa từng được chốt nên không có gì để mở lại.');
  if (tt !== TRANG_THAI_DA_CHOT) return tu('KY_DANG_MO', 'Kỳ ' + thang + ' đã được mở lại rồi, có thể chốt lại.');
  var sh = ss.getSheetByName(tenTabChot(thang));
  if (!sh) return tu('THIEU_TAB_BAN_CHOT', 'Không thấy tab bản chốt ' + tenTabChot(thang) + ', không thể mở lại an toàn.');

  var thoiDiem = thoiDiemHienTai(ss);
  var tenCu = tenTabChotCu(thang, soThuTuTabCu(ss.getSheets().map(function (s) { return s.getName(); }), thang));
  sh.setName(tenCu);
  var cuoi = dongChotMoiNhat(chiMuc, thang);
  ghiDongChiMuc(ss, dungDongChiMuc({ ky: thang, trangThai: TRANG_THAI_DA_MO_LAI, thoiDiem: thoiDiem, tong: cuoi ? cuoi.tong : null,
    soDaTinh: cuoi ? cuoi.soDaTinh : '', soBoQua: cuoi ? cuoi.soBoQua : '', tenTab: tenCu, lyDo: ly }));
  ghiSuKienNhatKy(ss, 'KY_MO_LAI', thoiDiem);
  return { daMoLai: true, ky: thang, tenTabCu: tenCu };
}

// ---- Tính kỳ trên kỳ đã chốt -------------------------------------------------------------------
// Chỉ THÊM cảnh báo vào kết quả; không bao giờ đổi bản chốt hay chỉ mục.
function themCanhBaoKyDaChot(ss, kq) {
  if (!kq.ky) return;
  var chiMuc = docChiMucTuSheet(ss);
  if (trangThaiHieuLuc(chiMuc, kq.ky.thang) !== TRANG_THAI_DA_CHOT) return;
  var dong = dongChotMoiNhat(chiMuc, kq.ky.thang);
  var luc = dong ? dong.thoiDiem : '';
  var canhBao = function (ma, thongDiep) { kq.canhBao.push(taoThongBao('canhBao', ma, thongDiep, {})); };
  var sh = ss.getSheetByName(tenTabChot(kq.ky.thang));
  if (!sh) { canhBao('BAN_CHOT_THIEU_TAB', 'Kỳ ' + kq.ky.thang + ' đã chốt nhưng không thấy tab bản chốt ' + tenTabChot(kq.ky.thang) + '.'); return; }
  var doc = docTabChot(sh.getDataRange().getValues());
  if (!doc.banChot) { canhBao('BAN_CHOT_HONG', 'Kỳ ' + kq.ky.thang + ' đã chốt nhưng tab bản chốt bị hỏng: ' + doc.loi.join('; ')); return; }
  if (!doc.hopLe) canhBao('BAN_CHOT_BI_SUA', 'Bản chốt kỳ ' + kq.ky.thang + ' đã bị sửa tay (' + doc.loi.join('; ') + '), không còn đáng tin.');
  if (kq.chanToanBo) {
    canhBao('KY_DA_CHOT', 'Kỳ ' + kq.ky.thang + ' đã chốt lúc ' + luc + '. Hiện không tính lại được để so sánh vì còn lỗi chặn toàn bộ.');
    return;
  }
  var so = soSanhVoiBanChot(kq, doc.banChot);
  canhBao('KY_DA_CHOT', 'Kỳ ' + kq.ky.thang + ' đã chốt lúc ' + luc + '. Kết quả tính lại ' + (so.giong ? 'GIỐNG bản chốt.'
    : 'KHÁC bản chốt ở ' + so.tongKhac + ' người: ' + so.khac.map(function (x) { return x.taiKhoan; }).join(', ') + '. Bản chốt không đổi; muốn chốt lại hãy dùng "Mở lại kỳ".'));
}
