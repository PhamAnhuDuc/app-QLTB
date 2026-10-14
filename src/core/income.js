// Tính thu nhập tạm tính (spec income-calculation). Hàm thuần.
//
//   thu nhập = lương cố định áp dụng + thưởng key metrics + thưởng vượt point + phụ cấp
//   Không có khoản phạt hay trừ nào. Kết quả luôn là ĐỀ XUẤT chờ chủ sở hữu duyệt.

var NHAN_DE_XUAT = 'Đề xuất – chờ duyệt';

// Point vượt: 0 nếu không lớn hơn Min, Max − Min nếu vượt Max, còn lại point − Min.
function tinhPointVuot(point, min, max) {
  if (point <= min) return 0;
  if (point > max) return max - min;
  return point - min;
}

// pointKq: phần của thành viên trong kết quả tinhPoint ({tong, trangThai, nguon, thieuNguon})
// kmKq: kết quả tinhKeyMetricsThanhVien
// trangThai: 'daTinh' | 'chuaTinh' | 'khongTinh'
function tinhThuNhapThanhVien(config, idx, thanhVien, pointKq, kmKq, loiCauHinh) {
  var tk = chuanHoaKhoa(thanhVien.taiKhoan);
  var ts = config.thamSo;
  var bac = idx.bac[String(thanhVien.bac)];
  var kq = {
    taiKhoan: thanhVien.taiKhoan, ten: thanhVien.ten, bac: thanhVien.bac, nhom: thanhVien.nhom, khuVuc: thanhVien.khuVuc,
    trangThai: 'chuaTinh', lyDo: [], canhBao: [],
    luongCoDinh: null, luongChuan: bac ? bac.luongCoDinh : null, luongGhiDe: false, min: bac ? bac.min : null, max: bac ? bac.max : null,
    pointTong: null, pointVuot: null, thuongVuotPoint: null,
    diemKM: null, phanTramThuong: null, thuongKM: null, phuCap: null,
    thuNhapChuaLamTron: null, thuNhap: null, nhan: NHAN_DE_XUAT
  };

  if (biChan(loiCauHinh, 'tv:' + tk) || !bac) {
    kq.lyDo.push('Cấu hình của thành viên có lỗi, xem danh sách lỗi');
    return kq;
  }

  var coGhiDe = thanhVien.luongCoDinhGhiDe !== null && thanhVien.luongCoDinhGhiDe !== undefined;
  kq.luongCoDinh = coGhiDe ? thanhVien.luongCoDinhGhiDe : bac.luongCoDinh;
  kq.luongGhiDe = coGhiDe && thanhVien.luongCoDinhGhiDe !== bac.luongCoDinh;
  if (kq.luongGhiDe) {
    kq.canhBao.push(taoThongBao('canhBao', 'GHI_DE_LUONG',
      'Lương cố định của ' + thanhVien.taiKhoan + ' đã ghi đè khác giá trị chuẩn của bậc ' + thanhVien.bac,
      { taiKhoan: thanhVien.taiKhoan, giaTriGhiDe: thanhVien.luongCoDinhGhiDe, giaTriChuan: bac.luongCoDinh }));
  }

  // Thành phần phụ thuộc point: hiện khi point đã đủ.
  var coPoint = pointKq && pointKq.trangThai === 'du' && pointKq.tong !== null;
  if (coPoint) {
    kq.pointTong = pointKq.tong;
    kq.pointVuot = xapXi(tinhPointVuot(pointKq.tong, bac.min, bac.max));
    kq.thuongVuotPoint = kq.pointVuot * ts.donGiaPoint;
    if (pointKq.tong > bac.max) {
      kq.canhBao.push(taoThongBao('canhBao', 'POINT_CAT_TRAN',
        thanhVien.taiKhoan + ' có point ' + pointKq.tong + ' vượt Max ' + bac.max + ' của bậc ' + thanhVien.bac + ', phần vượt chỉ tính đến Max',
        { taiKhoan: thanhVien.taiKhoan, point: pointKq.tong, max: bac.max }));
    } else if (pointKq.tong < bac.min) {
      kq.canhBao.push(taoThongBao('thongTin', 'POINT_DUOI_MIN',
        thanhVien.taiKhoan + ' có point ' + pointKq.tong + ' thấp hơn Min ' + bac.min + ', chỉ là thông tin, không trừ vào thu nhập',
        { taiKhoan: thanhVien.taiKhoan, point: pointKq.tong, min: bac.min }));
    }
  }

  if (kmKq.trangThai === 'khongApDung') {
    kq.trangThai = 'khongTinh';
    kq.lyDo.push('Theo dõi point: không có chỉ số key metrics, không tính thu nhập');
    return kq;
  }
  var coKM = kmKq.trangThai === 'du';
  if (coKM) {
    kq.diemKM = kmKq.diem;
    kq.phanTramThuong = kmKq.phanTramThuong;
    kq.thuongKM = kq.luongCoDinh * kmKq.phanTramThuong;
  }
  kq.phuCap = thanhVien.mayCaNhan ? ts.phuCap : 0;

  if (!coPoint) kq.lyDo.push('Point: ' + (pointKq && pointKq.trangThai === 'thieu' ? 'thiếu' : 'chưa có'));
  if (!coKM) kq.lyDo.push('Key metrics: ' + (kmKq.trangThai === 'thieu' ? 'thiếu' : 'bị chặn do lỗi'));
  if (!coPoint || !coKM) return kq;

  kq.thuNhapChuaLamTron = kq.luongCoDinh + kq.thuongKM + kq.thuongVuotPoint + kq.phuCap;
  kq.thuNhap = lamTronDong(kq.thuNhapChuaLamTron);
  kq.trangThai = 'daTinh';
  return kq;
}

// Tổng theo nhóm và toàn team, chỉ gồm người đã tính. Mẫu số là số người có thể có thu nhập
// (đã tính + chưa tính); người "không tính" (chỉ theo dõi point) không nằm trong cả hai.
function tongHopThuNhap(danhSach) {
  function rong() {
    return { soDaTinh: 0, tongSo: 0, thuNhap: 0, luongCoDinh: 0, thuongKM: 0, thuongVuotPoint: 0, phuCap: 0, pointVuot: 0 };
  }
  function cong(t, r) {
    if (r.trangThai === 'khongTinh') return;
    t.tongSo += 1;
    if (r.trangThai !== 'daTinh') return;
    t.soDaTinh += 1;
    t.thuNhap += r.thuNhap; // tổng của các thu nhập đã làm tròn
    t.luongCoDinh += r.luongCoDinh;
    t.thuongKM += r.thuongKM;
    t.thuongVuotPoint += r.thuongVuotPoint;
    t.phuCap += r.phuCap;
    t.pointVuot += r.pointVuot;
  }
  var theoNhom = {}, thuTuNhom = [], team = rong();
  danhSach.forEach(function (r) {
    var k = chuanHoaKhoa(r.nhom);
    if (!theoNhom[k]) { theoNhom[k] = rong(); theoNhom[k].nhom = r.nhom; thuTuNhom.push(k); }
    cong(theoNhom[k], r);
    cong(team, r);
  });
  // Không ai được tính thì các cột tiền là null (không hiện 0 đồng như thể đã tính).
  function chuaCoAi(t) {
    if (t.soDaTinh > 0) return;
    ['thuNhap', 'luongCoDinh', 'thuongKM', 'thuongVuotPoint', 'phuCap', 'pointVuot'].forEach(function (k) { t[k] = null; });
  }
  function nhan(t) { chuaCoAi(t); return 'cộng của ' + t.soDaTinh + '/' + t.tongSo + ' người'; }
  team.ghiChu = nhan(team);
  return { theoNhom: thuTuNhom.map(function (k) { theoNhom[k].ghiChu = nhan(theoNhom[k]); return theoNhom[k]; }), team: team };
}
