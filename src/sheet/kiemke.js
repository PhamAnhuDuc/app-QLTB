// Đọc báo cáo kiểm kê nhập-xuất-tồn được DÁN vào một tab (spec kiem-ke-report-import). Hàm thuần.
//
// Nhận diện bảng theo TÊN cột, không theo vị trí. Chỉ giữ mã hàng, tên hàng, số bán ra, số chuyển kho
// (không mang theo giá bán, giá vốn, giá trị tồn).

var COT_MA_HANG = 'Mã hàng';
var COT_TEN_HANG = 'Tên hàng';
var COT_BAN_RA = 'SL bán ra trong kỳ';
var COT_CHUYEN_KHO = 'SL chuyển kho';
var SO_DONG_DAU_QUET = 20; // chỉ tìm tiêu đề và dòng ngày trong phần đầu của tab

var SO_NGAY_TRONG_THANG = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function laNamNhuan(nam) {
  return (nam % 4 === 0 && nam % 100 !== 0) || nam % 400 === 0;
}

function soNgayTrongThang(nam, thang) {
  return thang === 2 && laNamNhuan(nam) ? 29 : SO_NGAY_TRONG_THANG[thang - 1];
}

function ngayHopLe(nam, thang, ngay) {
  return thang >= 1 && thang <= 12 && ngay >= 1 && ngay <= soNgayTrongThang(nam, thang);
}

function chuoiNgayISO(nam, thang, ngay) {
  function hai(n) { return (n < 10 ? '0' : '') + n; }
  return nam + '-' + hai(thang) + '-' + hai(ngay);
}

// Tìm dòng "Từ ngày: dd/mm/yyyy đến ngày: dd/mm/yyyy" ở phần đầu tab.
// Trả {tuNgay, denNgay} (dạng yyyy-mm-dd), hoặc {khongHopLe: true}, hoặc null nếu không có dòng ngày.
function docKhoangNgay(bang) {
  var mau = /từ ngày\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*đến ngày\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/;
  for (var r = 0; r < Math.min(SO_DONG_DAU_QUET, (bang || []).length); r++) {
    var d = bang[r] || [];
    for (var c = 0; c < d.length; c++) {
      if (!oLaChu(d[c])) continue;
      var m = mau.exec(chuanHoaKhoa(d[c]));
      if (!m) continue;
      var n = m.slice(1).map(Number);
      if (!ngayHopLe(n[2], n[1], n[0]) || !ngayHopLe(n[5], n[4], n[3])) return { khongHopLe: true };
      return { tuNgay: chuoiNgayISO(n[2], n[1], n[0]), denNgay: chuoiNgayISO(n[5], n[4], n[3]) };
    }
  }
  return null;
}

// Đọc một tab báo cáo.
// Trả về {baoCao, viTriDong, loi, canhBao}.
//   baoCao: {tuNgay, denNgay, dong: [{ma, ten, banRa, chuyenKho}]} hoặc null nếu không đọc được (coi như chưa có báo cáo)
//   viTriDong[i]: số dòng trong Sheet (đếm từ 1) của baoCao.dong[i]
// Giá trị số không hợp lệ (chữ, âm) được GIỮ NGUYÊN dạng thô trong dong để lõi chặn đúng khu vực, và có lỗi riêng
// nêu tab, dòng, cột (chiTiet.nguon = 'kiemKe' để lớp điều phối loại bỏ thông báo trùng của lõi).
function docBaoCaoKiemKe(bang, tenTab) {
  var kq = { baoCao: null, viTriDong: [], loi: [], canhBao: [] };
  if (!bang || bang.length === 0 || bang.every(dongTrong)) {
    kq.loi.push(loiNhapLieu('BAO_CAO_TRONG', tenTab, null, null, 'Báo cáo kiểm kê trống, không có dữ liệu để đọc'));
    return kq;
  }

  // 1. Dòng tiêu đề: tìm "Mã hàng" ở phần đầu
  var oMa = timO(bang, COT_MA_HANG, 0, SO_DONG_DAU_QUET - 1);
  if (!oMa) {
    kq.loi.push(loiNhapLieu('BAO_CAO_KHONG_NHAN_RA', tenTab, null, COT_MA_HANG,
      'Không tìm thấy cột "' + COT_MA_HANG + '" trong ' + SO_DONG_DAU_QUET + ' dòng đầu, không nhận ra đây là báo cáo kiểm kê'));
    return kq;
  }
  // 2. Hai cột số lượng: ở dòng tiêu đề hoặc dòng kế tiếp (tiêu đề hai tầng)
  var oBan = timO(bang, COT_BAN_RA, oMa.dong, oMa.dong + 1);
  var oChuyen = timO(bang, COT_CHUYEN_KHO, oMa.dong, oMa.dong + 1);
  if (!oBan) kq.loi.push(loiNhapLieu('THIEU_COT', tenTab, null, COT_BAN_RA, 'Thiếu cột "' + COT_BAN_RA + '"'));
  if (!oChuyen) kq.loi.push(loiNhapLieu('THIEU_COT', tenTab, null, COT_CHUYEN_KHO, 'Thiếu cột "' + COT_CHUYEN_KHO + '"'));
  if (!oBan || !oChuyen) return kq;
  var oTen = timO(bang, COT_TEN_HANG, oMa.dong, oMa.dong + 1);
  var cotMa = oMa.cot, cotBan = oBan.cot, cotChuyen = oChuyen.cot, cotTen = oTen ? oTen.cot : -1;
  var dongCuoiTieuDe = Math.max(oMa.dong, oBan.dong, oChuyen.dong);

  // 3. Khoảng ngày
  var ngay = docKhoangNgay(bang);
  var tuNgay = null, denNgay = null;
  if (ngay && ngay.khongHopLe) {
    kq.canhBao.push(taoThongBao('canhBao', 'BAO_CAO_NGAY_SAI',
      '[' + viTri(tenTab, null, null) + '] Dòng khoảng ngày của báo cáo ghi một ngày không tồn tại, bỏ qua khoảng ngày', { tab: tenTab }));
  } else if (ngay) {
    tuNgay = ngay.tuNgay; denNgay = ngay.denNgay;
  }

  // 4. Các dòng sau tiêu đề
  var dong = [], viTriDong = [], soDongChanBang = null;
  var mauChanBang = /tổng số dòng\s*:?\s*(\d+)/;
  for (var r = dongCuoiTieuDe + 1; r < bang.length; r++) {
    var d = bang[r];
    if (dongTrong(d)) continue;
    var chanBang = null;
    for (var c = 0; c < d.length && chanBang === null; c++) {
      if (oLaChu(d[c])) { var m = mauChanBang.exec(chuanHoaKhoa(d[c])); if (m) chanBang = Number(m[1]); }
    }
    if (chanBang !== null) { soDongChanBang = chanBang; break; }
    var oDau = null;
    for (var c2 = 0; c2 < d.length; c2++) { if (!laTrong(d[c2])) { oDau = d[c2]; break; } }
    if (oLaChu(oDau) && chuanHoaKhoa(oDau).indexOf('tổng') === 0) continue; // dòng "Tổng": không tin giá trị trong đó

    var ma = laTrong(d[cotMa]) ? null : String(d[cotMa]).trim();
    var ten = cotTen >= 0 && !laTrong(d[cotTen]) ? String(d[cotTen]).trim() : '';
    if (ma === null && ten === '') continue; // không phải dòng sản phẩm

    var gia = [{ cot: cotBan, ten: COT_BAN_RA }, { cot: cotChuyen, ten: COT_CHUYEN_KHO }].map(function (o) {
      var raw = d[o.cot];
      var s = soThat(raw);
      if (s.trong) return 0;
      if (s.hopLe && s.giaTri >= 0) return s.giaTri;
      kq.loi.push(loiNhapLieu('SO_LUONG_SAI', tenTab, r + 1, o.ten,
        s.hopLe ? 'Số lượng không được âm' : 'Ô số lượng phải là số, hiện là văn bản "' + raw + '"',
        { nguon: 'kiemKe', chiSoDong: dong.length }));
      return raw; // giữ nguyên để lõi chặn đúng khu vực
    });
    dong.push({ ma: ma, ten: ten, banRa: gia[0], chuyenKho: gia[1] });
    viTriDong.push(r + 1);
  }

  if (dong.length === 0) {
    kq.loi.push(loiNhapLieu('BAO_CAO_TRONG', tenTab, null, null, 'Báo cáo không có dòng sản phẩm nào'));
    return kq;
  }
  if (soDongChanBang !== null && soDongChanBang !== dong.length) {
    kq.canhBao.push(taoThongBao('canhBao', 'BAO_CAO_SO_DONG_LECH',
      '[' + viTri(tenTab, null, null) + '] Chân bảng ghi ' + soDongChanBang + ' dòng nhưng chỉ đọc được ' + dong.length + ' dòng' +
      (soDongChanBang > dong.length ? ' (thiếu ' + (soDongChanBang - dong.length) + ' dòng, có thể dán thiếu)' : ''),
      { tab: tenTab, chanBang: soDongChanBang, daDoc: dong.length, khongDuDuLieu: true }));
  }
  kq.baoCao = { tuNgay: tuNgay, denNgay: denNgay, dong: dong };
  kq.viTriDong = viTriDong;
  return kq;
}

// Đọc báo cáo của mọi khu vực trong cấu hình. khuVuc: [{ma, tabBaoCao}]; cacTab: {tenTab: bảng}.
// Trả về {kiemKe: {maKhuVuc: baoCao}, viTri: {maKhuVuc: [số dòng]}, loi, canhBao}. Khu vực không đọc được thì vắng mặt trong kiemKe.
function docMoiBaoCao(cacTab, khuVuc) {
  var kq = { kiemKe: {}, viTri: {}, loi: [], canhBao: [] };
  (khuVuc || []).forEach(function (k) {
    var bang = cacTab[k.tabBaoCao];
    if (bang === undefined || bang === null) {
      kq.loi.push(loiNhapLieu('THIEU_TAB_BAO_CAO', k.tabBaoCao, null, null,
        'Không có tab báo cáo kiểm kê "' + k.tabBaoCao + '" của khu vực ' + k.ma + ', hãy tạo tab và dán báo cáo vào'));
      return;
    }
    var r = docBaoCaoKiemKe(bang, k.tabBaoCao);
    r.loi.forEach(function (l) { l.chiTiet.khuVuc = k.ma; });
    r.canhBao.forEach(function (l) { l.chiTiet.khuVuc = k.ma; });
    kq.loi.push.apply(kq.loi, r.loi);
    kq.canhBao.push.apply(kq.canhBao, r.canhBao);
    if (r.baoCao) { kq.kiemKe[k.ma] = r.baoCao; kq.viTri[k.ma] = r.viTriDong; }
  });
  return kq;
}
