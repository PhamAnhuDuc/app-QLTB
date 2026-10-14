// Dựng nội dung các tab đầu ra từ kết quả tính (spec sheet-result-output, phần thuần). Hàm thuần.
// Giá trị chưa tính hiện "—", không bao giờ là 0. Mọi chuỗi từ dữ liệu người dùng hoặc báo cáo được vô hiệu hoá
// để Sheet không hiểu thành công thức.

var CHUA_CO = '—';
var TIEU_DE_KET_QUA = ['Nhóm', 'Thành viên', 'Bậc', 'Σ point', 'Min–Max', 'Point vượt', 'Điểm key metrics', '% thưởng KM',
  'Lương cố định', 'Thưởng KM', 'Thưởng vượt point', 'Phụ cấp', 'Thu nhập tạm tính', 'Trạng thái'];

// Chuỗi bắt đầu bằng = + - @ có thể bị Sheet hiểu là công thức hoặc số: thêm dấu nháy đơn đầu chuỗi để thành văn bản.
function lamSachChuoi(v) {
  var s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function lamTron(x, soLe) {
  if (x === null || x === undefined) return CHUA_CO;
  var k = Math.pow(10, soLe);
  return Math.round(x * k) / k;
}

// Tiền: làm tròn 2 chữ số thập phân khi hiển thị để loại nhiễu số thực (ví dụ 3779999.9999999995 → 3780000).
// Thu nhập tạm tính của từng người vốn đã là số nguyên đồng (lõi làm tròn).
function tienHoacCho(x) {
  return x === null || x === undefined ? CHUA_CO : Math.round(x * 100) / 100;
}

function chuoiCot(n) { // 0 → A
  var s = '';
  n = n + 1;
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// Mọi ô kiểu chuỗi được liệt kê theo ký hiệu A1 để lớp Apps Script đặt định dạng văn bản trước khi ghi.
function danhDauOVanBan(giaTri) {
  var ds = [];
  for (var r = 0; r < giaTri.length; r++) {
    for (var c = 0; c < giaTri[r].length; c++) {
      if (typeof giaTri[r][c] === 'string' && giaTri[r][c] !== '') ds.push(chuoiCot(c) + (r + 1));
    }
  }
  return ds;
}

function chuanHoaChieuRong(rows) {
  var rong = 0;
  rows.forEach(function (r) { if (r.length > rong) rong = r.length; });
  return rows.map(function (r) { var x = r.slice(); while (x.length < rong) x.push(''); return x; });
}

function trangThaiChu(r) {
  if (r.trangThai === 'daTinh') return 'Đã tính';
  if (r.trangThai === 'khongTinh') return 'Không tính (chỉ theo dõi point)';
  return 'Chưa tính: ' + r.lyDo.join('; ');
}

function dongThanhVien(r) {
  return [lamSachChuoi(r.nhom), lamSachChuoi(r.ten || r.taiKhoan), r.bac, lamTron(r.pointTong, 4),
    r.min !== null ? r.min + '–' + r.max : CHUA_CO, lamTron(r.pointVuot, 4), lamTron(r.diemKM, 4), tienHoacCho(r.phanTramThuong),
    tienHoacCho(r.luongCoDinh), tienHoacCho(r.thuongKM), tienHoacCho(r.thuongVuotPoint), tienHoacCho(r.phuCap), tienHoacCho(r.thuNhap),
    lamSachChuoi(trangThaiChu(r))];
}

function dongTong(nhan, t) {
  return [lamSachChuoi(nhan), t.ghiChu, '', '', '', tienHoacCho(lamTron(t.pointVuot, 4)), '', '', tienHoacCho(t.luongCoDinh), tienHoacCho(t.thuongKM),
    tienHoacCho(t.thuongVuotPoint), tienHoacCho(t.phuCap), tienHoacCho(t.thuNhap), ''];
}

function phanLoiCanhBao(rows, kq) {
  rows.push([]);
  rows.push(['LỖI (' + kq.loi.length + ')']);
  if (kq.loi.length > 0) rows.push(['Mã', 'Phạm vi chặn', 'Thông điệp']);
  kq.loi.forEach(function (l) { rows.push([lamSachChuoi(l.ma), lamSachChuoi(l.chan || ''), lamSachChuoi(l.thongDiep)]); });
  rows.push([]);
  rows.push(['CẢNH BÁO (' + kq.canhBao.length + ')']);
  if (kq.canhBao.length > 0) rows.push(['Mức', 'Mã', 'Thông điệp']);
  kq.canhBao.forEach(function (l) { rows.push([lamSachChuoi(l.muc), lamSachChuoi(l.ma), lamSachChuoi(l.thongDiep)]); });
}

// ---- Định dạng hiển thị (spec sheet-result-output: Định dạng bảng kết quả) ----------------------------
// Trả về danh sách thao tác để lớp Apps Script áp dụng; KHÔNG đổi giá trị trong ô.
//   soDinhDang: [{format, oSo: [A1...]}]  chỉ gồm các ô có giá trị SỐ (ô "—" và ô chữ không bao giờ bị định dạng như số)
//   dam: [vùng A1]                        các dòng in đậm
//   doRong: [px]                          độ rộng từng cột (theo thứ tự cột)
var DO_RONG_KET_QUA = [200, 180, 50, 80, 90, 90, 100, 90, 110, 110, 120, 100, 130, 290];
var DO_RONG_GIAI_THICH = [180, 110, 700];
var DINH_DANG_TIEN = '#,##0';
var DINH_DANG_POINT = '#,##0.00';
var DINH_DANG_PHAN_TRAM = '0.0%';
var DINH_DANG_PHAN_TRAM_NGUYEN = '0%';

function dungDinhDangKetQua(rows) {
  var nhom = {}; // format -> [A1]
  function them(format, r, c) {
    if (typeof rows[r][c] !== 'number') return;
    (nhom[format] = nhom[format] || []).push(chuoiCot(c) + (r + 1));
  }
  var dam = [];
  var rongNhat = rows.length > 0 ? rows[0].length : 1;
  function hangDam(r) { dam.push('A' + (r + 1) + ':' + chuoiCot(rongNhat - 1) + (r + 1)); }
  var phan = 'dau'; // dau | bang | sauBang | doiSoat
  for (var r = 0; r < rows.length; r++) {
    var d = rows[r];
    var a = typeof d[0] === 'string' ? d[0] : '';
    var b = typeof d[1] === 'string' ? d[1] : '';
    if (r === 0) { hangDam(r); continue; }
    if (a === 'Nhóm' && b === 'Thành viên') { hangDam(r); phan = 'bang'; continue; }
    if (phan === 'bang') {
      if (a.indexOf('Tổng nhóm') === 0 || a === 'Tổng team') {
        hangDam(r);
        them(DINH_DANG_POINT, r, 5);
        for (var c = 8; c <= 12; c++) them(DINH_DANG_TIEN, r, c);
        if (a === 'Tổng team') phan = 'sauBang';
        continue;
      }
      // dòng thành viên
      them(DINH_DANG_POINT, r, 3); them(DINH_DANG_POINT, r, 5);
      them(DINH_DANG_PHAN_TRAM, r, 6); them(DINH_DANG_PHAN_TRAM_NGUYEN, r, 7);
      for (var c2 = 8; c2 <= 12; c2++) them(DINH_DANG_TIEN, r, c2);
      continue;
    }
    if (a.indexOf('LỖI (') === 0 || a.indexOf('CẢNH BÁO (') === 0 || a === 'ĐỐI SOÁT') { hangDam(r); phan = a === 'ĐỐI SOÁT' ? 'doiSoat' : 'sauBang'; continue; }
    if ((a === 'Mã' && b === 'Phạm vi chặn') || (a === 'Mức' && b === 'Mã') || (a === 'Nguồn' && b === 'Khu vực')) { hangDam(r); continue; }
    if (phan === 'doiSoat') { them(DINH_DANG_POINT, r, 2); them(DINH_DANG_POINT, r, 3); them(DINH_DANG_POINT, r, 4); }
  }
  return {
    soDinhDang: Object.keys(nhom).map(function (f) { return { format: f, oSo: nhom[f] }; }),
    dam: dam,
    doRong: DO_RONG_KET_QUA.slice()
  };
}

function dungDinhDangGiaiThich(rows) {
  return { soDinhDang: [], dam: rows.length > 0 ? ['A1:' + chuoiCot(rows[0].length - 1) + '1'] : [], doRong: DO_RONG_GIAI_THICH.slice() };
}

// Dựng mọi tab đầu ra. Trả {ketQua: {giaTri, oVanBan}, giaiThich: {giaTri, oVanBan}, dongNhatKy: [...]}.
function dungKetQuaSheet(kq) {
  var rows = [];
  rows.push([kq.nhan]);
  rows.push(['Kỳ', kq.ky ? kq.ky.thang : CHUA_CO]);
  rows.push(['Trạng thái dữ liệu', kq.chanToanBo ? 'Bị chặn, không tính được' : (kq.kyDuDuLieu ? 'Đủ dữ liệu' : 'Chưa đủ dữ liệu')]);
  rows.push(['Thời điểm tính', kq.thoiDiem || CHUA_CO]);

  var giaiThich = [['Thành viên', 'Bước', 'Nội dung']];
  if (!kq.chanToanBo) {
    rows.push([]);
    rows.push(TIEU_DE_KET_QUA.slice());
    kq.tong.theoNhom.forEach(function (n) {
      kq.thanhVien.filter(function (r) { return cungKhoa(r.nhom, n.nhom); }).forEach(function (r) { rows.push(dongThanhVien(r)); });
      rows.push(dongTong('Tổng nhóm: ' + n.nhom, n));
    });
    rows.push(dongTong('Tổng team', kq.tong.team));
    kq.thanhVien.forEach(function (r) {
      (r.giaiThich || []).forEach(function (b) { giaiThich.push([lamSachChuoi(r.ten || r.taiKhoan), b.buoc, lamSachChuoi(b.noiDung)]); });
    });
  }
  phanLoiCanhBao(rows, kq);
  if (!kq.chanToanBo && kq.doiSoat.length > 0) {
    rows.push([]);
    rows.push(['ĐỐI SOÁT']);
    rows.push(['Nguồn', 'Khu vực', 'Quỹ', 'Đã chia', 'Lệch', 'Kết quả']);
    kq.doiSoat.forEach(function (d) {
      rows.push([lamSachChuoi(d.nguon), lamSachChuoi(d.khuVuc || (d.taiKhoan ? d.taiKhoan : '')), lamTron(d.quy, 4), lamTron(d.daChia, 4), lamTron(d.lech, 4), d.dat ? 'Đạt' : 'Lệch']);
    });
  }

  var kqRows = chuanHoaChieuRong(rows);
  var log = taoLog(kq, kq.thoiDiem || '');
  return {
    ketQua: { giaTri: kqRows, oVanBan: danhDauOVanBan(kqRows), dinhDang: dungDinhDangKetQua(kqRows) },
    giaiThich: { giaTri: chuanHoaChieuRong(giaiThich), oVanBan: danhDauOVanBan(chuanHoaChieuRong(giaiThich)),
      dinhDang: dungDinhDangGiaiThich(chuanHoaChieuRong(giaiThich)) },
    dongNhatKy: log.map(function (d) { return [d.thoiDiem, d.muc, d.ma, d.truong.join('; '), d.phamVi || '']; })
  };
}
var TIEU_DE_NHAT_KY_HE_THONG = ['Thời điểm', 'Mức', 'Loại lỗi', 'Trường liên quan', 'Phạm vi'];
