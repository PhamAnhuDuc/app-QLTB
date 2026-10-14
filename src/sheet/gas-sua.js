// Ghi dữ liệu từ bảng điều khiển (spec ui-data-editing). Lớp Apps Script mỏng: quy tắc nằm ở bang.js, nhapbang.js, kiemke.js.
//
// Mọi hàm thucHien* nhận `ss`, không bật hộp thoại, và trả đối tượng thuần {daLuu, lyDo, canhBao}. Thứ tự luôn là:
// chặn chia sẻ rộng → chặn kỳ đã chốt (bảng nhập tay) → kiểm tra bản thử → mới ghi. Bị từ chối thì KHÔNG ghi gì.
// Nhật ký hệ thống chỉ nhận loại sự kiện, không nhận nội dung bảng, tên, tài khoản hay số tiền.

function tuChoiGhi(ma, thongDiep, them) {
  var r = { daLuu: false, lyDo: [{ ma: ma, thongDiep: thongDiep }], canhBao: [] };
  if (them) Object.keys(them).forEach(function (k) { r[k] = them[k]; });
  return r;
}

// Cổng chung cho mọi thao tác ghi. Trả {ok, tuChoi, canhBao, thang, daChot}.
// nhapTayCuaKy: true nếu thao tác ghi dữ liệu nhập của kỳ (bị chặn khi kỳ Đã chốt).
function congGhi(ss, nhapTayCuaKy) {
  var chiaSe = kiemTraChiaSeChoGhi(ss);
  if (chiaSe.mucDo === 'chan') return { ok: false, tuChoi: tuChoiGhi(chiaSe.ma, chiaSe.thongDiep), canhBao: [] };
  var canhBao = chiaSe.mucDo === 'canhBao' ? [{ ma: chiaSe.ma, thongDiep: chiaSe.thongDiep }] : [];
  var ky = docKy(docCacTabDauVao(ss)).ky;
  var daChot = !!ky && trangThaiHieuLuc(docChiMucTuSheet(ss), ky.thang) === TRANG_THAI_DA_CHOT;
  if (daChot && nhapTayCuaKy) {
    return { ok: false, canhBao: canhBao, thang: ky.thang, daChot: true,
      tuChoi: tuChoiGhi('KY_DA_CHOT', 'Kỳ ' + ky.thang + ' đang ở trạng thái Đã chốt nên không sửa được dữ liệu nhập. Hãy dùng "Mở lại kỳ" (có lý do) trước khi sửa.') };
  }
  if (daChot) {
    canhBao.push({ ma: 'KY_DA_CHOT_SUA_CAU_HINH', thongDiep: 'Kỳ ' + ky.thang + ' đã chốt: bản chốt giữ nguyên số cũ, cấu hình mới chỉ ảnh hưởng khi tính lại hoặc kỳ sau.' });
  }
  return { ok: true, canhBao: canhBao, thang: ky ? ky.thang : null, daChot: daChot };
}

function tenTabDangCo(ss, tenChuan) {
  var k = chuanHoaKhoa(tenChuan);
  var sh = ss.getSheets().filter(function (s) { return chuanHoaKhoa(s.getName()) === k; })[0];
  return sh ? sh.getName() : tenChuan;
}

// Thay toàn bộ nội dung một tab bằng `bang` (có dòng tiêu đề). Ô chữ đặt định dạng văn bản trước khi ghi.
function ghiTabThuan(ss, ten, bang) {
  var sh = layHoacTaoTab(ss, tenTabDangCo(ss, ten));
  ghiBang(sh, { giaTri: bang, oVanBan: oCanVanBanCuaBang(bang), dinhDang: null });
}

function thoiDiemVaNhatKy(ss, ma) { ghiSuKienNhatKy(ss, ma, thoiDiemHienTai(ss)); }

// ---- Đọc một bảng để sửa ----------------------------------------------------------------------
function thucHienDocBang(ss, khoa) {
  var cacTab = docCacTabDauVao(ss);
  var b = bangTheoKhoa(khoa);
  if (!b) return { ok: false, lyDo: [{ ma: 'BANG_KHONG_HOP_LE', thongDiep: 'Bảng không nằm trong danh sách được sửa.' }] };
  var ten = Object.keys(cacTab).filter(function (k) { return chuanHoaKhoa(k) === chuanHoaKhoa(b.tab); })[0];
  var r = docBangDeSua(khoa, ten === undefined ? undefined : cacTab[ten], cacTab);
  var cong = congGhi(ss, b.nhom === 'nhapTay');
  r.khoaGhi = cong.ok ? null : cong.tuChoi.lyDo[0];
  return { ok: true, bang: r };
}

// ---- Lưu một bảng -----------------------------------------------------------------------------
function thucHienLuuBang(ss, khoa, dongUI) {
  var b = bangTheoKhoa(khoa);
  if (!b || !laTabSuaDuoc(b.tab)) return tuChoiGhi('BANG_KHONG_HOP_LE', 'Bảng không nằm trong danh sách được sửa.');
  var cong = congGhi(ss, b.nhom === 'nhapTay');
  if (!cong.ok) return cong.tuChoi;
  var m = dungBangMoi(khoa, dongUI);
  if (m.loi.length > 0) return tuChoiGhi(m.loi[0].ma, m.loi[0].thongDiep);
  var cacTab = docCacTabDauVao(ss);
  var kt = kiemTraBangMoi(cacTab, khoa, m.bang, thoiDiemHienTai(ss));
  if (kt.chan.length > 0) {
    return { daLuu: false, lyDo: kt.chan, canhBao: cong.canhBao.concat(kt.canhBao) };
  }
  ghiTabThuan(ss, b.tab, m.bang);
  thoiDiemVaNhatKy(ss, b.nhom === 'nhapTay' ? 'SUA_BANG_NHAP_TAY' : 'SUA_BANG_CAU_HINH');
  return { daLuu: true, lyDo: [], canhBao: cong.canhBao.concat(kt.canhBao) };
}

// ---- Khôi phục mặc định -------------------------------------------------------------------------
function thucHienKhoiPhucMacDinh(ss, khoa) {
  var b = bangTheoKhoa(khoa);
  if (!b || !b.coMacDinh) return tuChoiGhi('KHONG_CO_MAC_DINH', 'Bảng này không có giá trị mặc định để khôi phục.');
  var cong = congGhi(ss, false);
  if (!cong.ok) return cong.tuChoi;
  var mac = bangMacDinh(khoa);
  ghiTabThuan(ss, b.tab, mac);
  thoiDiemVaNhatKy(ss, 'KHOI_PHUC_MAC_DINH');
  return { daLuu: true, lyDo: [], canhBao: cong.canhBao };
}

// ---- Đặt kỳ ---------------------------------------------------------------------------------------
function thucHienDatKy(ss, thang) {
  var m = typeof thang === 'string' ? /^\s*(\d{4})-(\d{1,2})\s*$/.exec(thang) : null;
  var nam = m ? Number(m[1]) : 0, th = m ? Number(m[2]) : 0;
  if (!m || nam < 2000 || nam > 2100 || th < 1 || th > 12) {
    return tuChoiGhi('KY_SAI', 'Tháng phải đúng dạng năm-tháng (ví dụ 2026-10) và là tháng có thật.');
  }
  var cong = congGhi(ss, false);
  if (!cong.ok) return cong.tuChoi;
  var chuoi = nam + '-' + chuoiHaiChuSo(th);
  var ten = tenTabDangCo(ss, TEN_TAB.ky);
  var sh = layHoacTaoTab(ss, ten);
  var bang = sh.getDataRange().getValues();
  var dong = -1;
  for (var i = 0; i < bang.length; i++) {
    if (typeof bang[i][0] === 'string' && chuanHoaKhoa(bang[i][0]) === 'tháng') { dong = i; break; }
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 2).setValues([TIEU_DE.ky.slice()]);
  }
  var hang = dong >= 0 ? dong + 1 : Math.max(sh.getLastRow(), 1) + 1;
  sh.getRangeList(['A' + hang + ':B' + hang]).setNumberFormat('@');
  sh.getRange(hang, 1, 1, 2).setValues([['Tháng', chuoi]]);
  thoiDiemVaNhatKy(ss, 'DAT_KY');
  return { daLuu: true, lyDo: [], canhBao: cong.canhBao, thang: chuoi };
}

// ---- Nhập báo cáo kiểm kê -----------------------------------------------------------------------
function thucHienNhapBaoCao(ss, maKhuVuc, vanBan) {
  var cong = congGhi(ss, true);
  if (!cong.ok) return cong.tuChoi;
  var cacTab = docCacTabDauVao(ss);
  var kvs = docCauHinh(cacTab).cauHinh.khuVuc || [];
  var k = typeof maKhuVuc === 'string' ? chuanHoaKhoa(maKhuVuc) : '';
  var kv = kvs.filter(function (x) { return x.ma !== null && chuanHoaKhoa(x.ma) === k; })[0];
  if (!kv || !kv.tabBaoCao) return tuChoiGhi('KHU_VUC_LA', 'Khu vực "' + String(maKhuVuc) + '" không có trong cấu hình, nên không biết ghi vào tab nào.');
  var p = phanTichVanBanBang(vanBan);
  if (p.loi.length > 0) return tuChoiGhi(p.loi[0].ma, p.loi[0].thongDiep);
  var r = docBaoCaoKiemKe(p.bang, kv.tabBaoCao);
  if (r.loi.length > 0) {
    return { daLuu: false, lyDo: r.loi.map(function (l) { return { ma: l.ma, thongDiep: l.thongDiep, dong: l.chiTiet && l.chiTiet.dong !== undefined ? l.chiTiet.dong : null }; }), canhBao: cong.canhBao };
  }
  ghiTabThuan(ss, kv.tabBaoCao, p.bang);
  thoiDiemVaNhatKy(ss, 'NHAP_BAO_CAO');
  return { daLuu: true, lyDo: [], canhBao: cong.canhBao.concat(r.canhBao.map(function (l) { return { ma: l.ma, thongDiep: l.thongDiep }; })),
    soDong: p.soDong, khuVuc: kv.ma };
}

// ---- Hàm máy chủ cho trang (chỉ các tên này được trang gọi, xem HAM_MAY_CHU_GIAO_DIEN) ------------
// Khi ghi thành công, trả kèm mô hình tính lại từ dữ liệu mới (CHỈ ĐỌC, không ghi tab kết quả) để trang hiển thị số mới.
function giaoDienSauGhi(ss, r) {
  if (r.daLuu) r.moHinh = giaoDienMoHinhDaTinh(ss);
  return giaoDienThuan(r);
}
function giaoDienDocBang(khoa) {
  return giaoDienThuan(thucHienDocBang(SpreadsheetApp.getActiveSpreadsheet(), khoa));
}
function giaoDienLuuBang(khoa, dong) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienSauGhi(ss, thucHienLuuBang(ss, khoa, dong));
}
function giaoDienKhoiPhucMacDinh(khoa) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienSauGhi(ss, thucHienKhoiPhucMacDinh(ss, khoa));
}
function giaoDienDatKy(thang) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienSauGhi(ss, thucHienDatKy(ss, thang));
}
function giaoDienNhapBaoCao(maKhuVuc, vanBan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return giaoDienSauGhi(ss, thucHienNhapBaoCao(ss, maKhuVuc, vanBan));
}
