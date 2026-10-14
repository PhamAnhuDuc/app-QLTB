// Các bảng sửa được từ bảng điều khiển và việc kiểm tra trước khi ghi (spec ui-data-editing, phần thuần). Hàm thuần.
//
// Mỗi bảng được mô tả MỘT lần ở đây: tab, tiêu đề chuẩn, kiểu từng cột. Máy chủ dùng mô tả này cho cả đọc bảng để sửa,
// chuyển kiểu giá trị, kiểm tra và ghi. Danh sách này cũng là danh sách tab DUY NHẤT được phép ghi từ giao diện
// (báo cáo kiểm kê chỉ ghi qua chức năng nhập báo cáo; tab kết quả, chỉ mục và bản sao kỳ không bao giờ sửa được).

var GIOI_HAN_BANG = { soDong: 5000, soCot: 20 };

// Kiểu cột: 'chu' | 'so' (chữ số, một dấu thập phân chấm hoặc phẩy) | 'logic' (TRUE/FALSE) | 'chon' (danh sách cố định).
// luaChon: danh sách cố định cho cột 'chon' (theo chỉ số cột).
// goiY: cột lấy danh sách từ bảng khác lúc đọc (khuVuc, taiKhoan, chiSo, loaiViec); danh sách chỉ để chọn nhanh,
//       giá trị lạ vẫn được giữ và kiểm tra bằng bộ kiểm tra cấu hình.
var BANG_SUA_DUOC = {
  thamSo: { nhan: 'Thông số chung', nhom: 'cauHinh', kieuCot: ['chu', 'chu'], coMacDinh: true },
  bac: { nhan: 'Bảng bậc', nhom: 'cauHinh', kieuCot: ['so', 'so', 'so', 'so'], coMacDinh: true },
  bacThang: { nhan: 'Bậc thang thưởng key metrics', nhom: 'cauHinh', kieuCot: ['so', 'so', 'so'], coMacDinh: true },
  chiSo: { nhan: 'Chỉ số key metrics', nhom: 'cauHinh', kieuCot: ['chu', 'chu', 'chon'], luaChon: { 2: ['thấp tốt', 'cao tốt', 'doanh thu'] }, coMacDinh: true },
  nhomThietBi: { nhan: 'Nhóm thiết bị và point quy đổi', nhom: 'cauHinh', kieuCot: ['chu', 'so', 'so'] },
  maHang: { nhan: 'Mã hàng thuộc nhóm', nhom: 'cauHinh', kieuCot: ['chu', 'chu'] },
  viecQuanLyKho: { nhan: 'Việc quản lý kho và hệ số', nhom: 'cauHinh', kieuCot: ['chu', 'so'] },
  heSoChia: { nhan: 'Hệ số chia point', nhom: 'cauHinh', kieuCot: ['chon', 'chu', 'chu', 'so'], luaChon: { 0: ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'] },
    goiY: { 1: 'khuVuc', 2: 'taiKhoan' } },
  khuVuc: { nhan: 'Khu vực và tab báo cáo', nhom: 'cauHinh', kieuCot: ['chu', 'chu'] },
  thanhVien: { nhan: 'Danh sách thành viên', nhom: 'cauHinh', kieuCot: ['chu', 'chu', 'so', 'chu', 'chu', 'logic', 'so'], goiY: { 3: 'khuVuc' } },
  tyTrong: { nhan: 'Tỷ trọng key metrics của thành viên', nhom: 'cauHinh', kieuCot: ['chu', 'chu', 'so'], goiY: { 0: 'taiKhoan', 1: 'chiSo' } },
  baoHanhHoTroSale: { nhan: 'Số ca bảo hành và số đơn hỗ trợ sale', nhom: 'nhapTay', kieuCot: ['chu', 'so', 'so'], goiY: { 0: 'khuVuc' } },
  xacNhanBaoCao: { nhan: 'Xác nhận báo cáo chỉ phủ một phần kỳ', nhom: 'nhapTay', kieuCot: ['chu', 'logic'], goiY: { 0: 'khuVuc' } },
  nhatKyCongViec: { nhan: 'Nhật ký công việc (quản lý kho)', nhom: 'nhapTay', kieuCot: ['chu', 'chu', 'chu', 'so'], goiY: { 0: 'taiKhoan', 1: 'loaiViec' } },
  keyMetrics: { nhan: 'Mục tiêu và kết quả key metrics', nhom: 'nhapTay', kieuCot: ['chu', 'chon', 'chu', 'so', 'so'], luaChon: { 1: ['Nhóm', 'Khu vực', 'Tài khoản'] }, goiY: { 0: 'chiSo' } }
};

function danhSachKhoaBang() { return Object.keys(BANG_SUA_DUOC); }

function bangTheoKhoa(khoa) {
  if (typeof khoa !== 'string' || !Object.prototype.hasOwnProperty.call(BANG_SUA_DUOC, khoa)) return null;
  var b = BANG_SUA_DUOC[khoa];
  return { khoa: khoa, tab: TEN_TAB[khoa], tieuDe: TIEU_DE[khoa].slice(), nhan: b.nhan, nhom: b.nhom, kieuCot: b.kieuCot.slice(),
    luaChon: b.luaChon || {}, goiY: b.goiY || {}, coMacDinh: !!b.coMacDinh };
}

// Tên tab (không phân biệt hoa/thường) có thuộc danh sách tab sửa được hay không.
function laTabSuaDuoc(tenTab) {
  var k = chuanHoaKhoa(tenTab);
  if (k === '') return false;
  return danhSachKhoaBang().some(function (khoa) { return chuanHoaKhoa(TEN_TAB[khoa]) === k; });
}

// ---- Đọc bảng để sửa ---------------------------------------------------------------------------
function giaTriDeHienThi(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && typeof v.getFullYear === 'function') return String(v.getFullYear()) + '-' + chuoiHaiChuSo(v.getMonth() + 1);
  return v;
}

// Danh sách gợi ý cho các cột lấy từ bảng khác (từ cấu hình đã đọc, kể cả khi cấu hình còn lỗi).
function dungGoiY(cauHinh) {
  function duyNhat(mang) { var da = {}, ra = []; mang.forEach(function (x) { var k = chuanHoaKhoa(x); if (k && !da[k]) { da[k] = true; ra.push(x); } }); return ra; }
  return {
    khuVuc: duyNhat((cauHinh.khuVuc || []).map(function (k) { return k.ma; }).filter(function (x) { return x !== null; })),
    taiKhoan: duyNhat((cauHinh.thanhVien || []).map(function (t) { return t.taiKhoan; }).filter(function (x) { return x !== null; })),
    chiSo: duyNhat((cauHinh.chiSo || []).map(function (c) { return c.id; }).filter(function (x) { return x !== null; })),
    loaiViec: duyNhat((cauHinh.viecQuanLyKho || []).map(function (v) { return v.loai; }).filter(function (x) { return x !== null; }))
  };
}

// bang: bảng hai chiều của tab (undefined nếu tab chưa có). Trả về nội dung để bộ soạn hiển thị.
// Cột được tìm theo tiêu đề; cột thiếu hiện trống. Dòng trống hoàn toàn bị bỏ.
function docBangDeSua(khoa, bang, cacTab) {
  var b = bangTheoKhoa(khoa);
  if (!b) return null;
  var dong = [];
  var coTab = bang !== undefined && bang !== null;
  if (coTab) {
    var h = -1;
    for (var r = 0; r < bang.length; r++) { if (!dongTrong(bang[r])) { h = r; break; } }
    if (h >= 0) {
      var cot = b.tieuDe.map(function (ten) {
        for (var c = 0; c < bang[h].length; c++) if (oLaChu(bang[h][c]) && chuanHoaTieuDe(bang[h][c]) === chuanHoaTieuDe(ten)) return c;
        return -1;
      });
      for (var i = h + 1; i < bang.length; i++) {
        if (dongTrong(bang[i])) continue;
        dong.push(cot.map(function (c) { return c < 0 ? '' : giaTriDeHienThi(layO(bang, i, c)); }));
      }
    }
  }
  var goiY = cacTab ? dungGoiY(docCauHinh(cacTab).cauHinh) : { khuVuc: [], taiKhoan: [], chiSo: [], loaiViec: [] };
  var luaChon = {};
  Object.keys(b.luaChon).forEach(function (c) { luaChon[c] = b.luaChon[c].slice(); });
  Object.keys(b.goiY).forEach(function (c) { luaChon[c] = goiY[b.goiY[c]].slice(); });
  return { khoa: khoa, tab: b.tab, nhan: b.nhan, nhom: b.nhom, tieuDe: b.tieuDe, kieuCot: b.kieuCot, luaChon: luaChon, dong: dong, coTab: coTab, coMacDinh: b.coMacDinh };
}

// ---- Chuyển giá trị từ giao diện theo kiểu cột -------------------------------------------------
// Không đoán: chuỗi không đúng kiểu được GIỮ THÔ để bộ kiểm tra báo lỗi nêu đúng ô.
function chuyenGiaTri(kieu, v) {
  if (v === null || v === undefined) return '';
  if (kieu === 'so') {
    if (typeof v === 'number') return v;
    var s = String(v).trim();
    if (s === '') return '';
    if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
    return s; // ví dụ "6.000.000" không được đoán thành số
  }
  if (kieu === 'logic') {
    if (v === true || v === false) return v;
    var t = String(v).trim();
    var k = t.toUpperCase();
    return k === 'TRUE' ? true : k === 'FALSE' ? false : t;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  return String(v).trim();
}

// Với bảng thông số, ô "Giá trị" là số với các tham số số và là chữ với tham số chữ (tên tab kết quả).
function chuyenGiaTriTheoBang(khoa, chiSoCot, v) {
  var b = bangTheoKhoa(khoa);
  if (khoa === 'thamSo' && chiSoCot === 1) {
    var s = v === null || v === undefined ? '' : String(v).trim();
    if (typeof v === 'number') return v;
    return /^-?\d+([.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : s;
  }
  return chuyenGiaTri(b.kieuCot[chiSoCot], v);
}

// dongUI: mảng các dòng (mảng ô) từ giao diện. Trả {bang (có dòng tiêu đề), dong, loi}. Dòng trống hoàn toàn bị bỏ.
function dungBangMoi(khoa, dongUI) {
  var b = bangTheoKhoa(khoa);
  var loi = [];
  if (!b) return { bang: null, dong: [], loi: [{ ma: 'BANG_KHONG_HOP_LE', thongDiep: 'Bảng không nằm trong danh sách được sửa.' }] };
  if (!Array.isArray(dongUI)) return { bang: null, dong: [], loi: [{ ma: 'DU_LIEU_SAI', thongDiep: 'Dữ liệu gửi lên không phải danh sách dòng.' }] };
  if (dongUI.length > GIOI_HAN_BANG.soDong) {
    return { bang: null, dong: [], loi: [{ ma: 'QUA_NHIEU_DONG', thongDiep: 'Bảng có hơn ' + GIOI_HAN_BANG.soDong + ' dòng, vượt giới hạn.' }] };
  }
  var dong = [];
  dongUI.forEach(function (d) {
    if (!Array.isArray(d)) { loi.push({ ma: 'DU_LIEU_SAI', thongDiep: 'Có dòng gửi lên không phải danh sách ô.' }); return; }
    if (d.length > GIOI_HAN_BANG.soCot) { loi.push({ ma: 'QUA_NHIEU_COT', thongDiep: 'Một dòng có hơn ' + GIOI_HAN_BANG.soCot + ' cột.' }); return; }
    var x = b.tieuDe.map(function (_, c) { return chuyenGiaTriTheoBang(khoa, c, d[c]); });
    if (x.every(function (o) { return o === ''; })) return;
    dong.push(x);
  });
  if (loi.length > 0) return { bang: null, dong: [], loi: loi };
  return { bang: [b.tieuDe.slice()].concat(dong), dong: dong, loi: [] };
}

// ---- Kiểm tra trước khi ghi ---------------------------------------------------------------------
// Dựng bản thử của các tab với bảng mới, chạy bộ đọc và kiểm tra hiện có. Chỉ chặn lỗi thuộc CHÍNH bảng đang lưu;
// lỗi thuộc bảng khác được trả về như cảnh báo (cảnh báo của phép tính, như point vượt trần, không đưa vào đây). Trả {chan: [{ma, thongDiep, dong, cot}], canhBao: [{ma, thongDiep}]}.
function kiemTraBangMoi(cacTab, khoa, bangMoi, thoiDiem) {
  var b = bangTheoKhoa(khoa);
  var thu = {};
  Object.keys(cacTab).forEach(function (k) { thu[k] = cacTab[k]; });
  // dùng đúng tên tab đang có (không phân biệt hoa/thường) nếu đã tồn tại
  var tenCo = Object.keys(cacTab).filter(function (k) { return chuanHoaKhoa(k) === chuanHoaKhoa(b.tab); })[0];
  thu[tenCo || b.tab] = bangMoi;
  var kq = tinhKyTuCacTab(thu, thoiDiem || '');
  var k = chuanHoaKhoa(b.tab);
  var chan = [], canhBao = [];
  function cuaBang(l) { return l.chiTiet && typeof l.chiTiet.tab === 'string' && chuanHoaKhoa(l.chiTiet.tab) === k; }
  kq.loi.forEach(function (l) {
    var m = { ma: l.ma, thongDiep: l.thongDiep, dong: l.chiTiet && l.chiTiet.dong !== undefined ? l.chiTiet.dong : null, cot: l.chiTiet && l.chiTiet.cot ? l.chiTiet.cot : null };
    if (cuaBang(l)) chan.push(m); else canhBao.push({ ma: l.ma, thongDiep: l.thongDiep });
  });
  return { chan: chan, canhBao: canhBao };
}

// Danh sách ô (A1) trong phần dữ liệu có kiểu chuỗi, để đặt định dạng văn bản trước khi ghi
// (chuỗi bắt đầu bằng = + - @ không bị Sheet hiểu thành công thức hay số).
function oCanVanBanCuaBang(bang) {
  var ds = [];
  for (var r = 0; r < bang.length; r++) {
    for (var c = 0; c < bang[r].length; c++) {
      if (typeof bang[r][c] === 'string' && bang[r][c] !== '') ds.push(chuoiCot(c) + (r + 1));
    }
  }
  return ds;
}

// Bảng mặc định (chỉ các bảng có mặc định): dạng bảng hai chiều đã có tiêu đề.
function bangMacDinh(khoa) {
  var b = bangTheoKhoa(khoa);
  if (!b || !b.coMacDinh) return null;
  return khungMacDinh()[b.tab];
}
