// Mô hình hiển thị cho bảng điều khiển (spec control-panel-ui). Hàm thuần, không gọi API Apps Script.
// Mô hình CHỈ chứa những gì cần hiển thị: không bảng thô của các tab, không giá bán, giá trị tồn, mã hàng báo cáo hay nội dung nhật ký công việc.

// Danh sách cố định các hàm máy chủ mà trang được phép gọi.
var HAM_MAY_CHU_GIAO_DIEN = ['giaoDienLayMoHinh', 'giaoDienTinh', 'giaoDienDuyet', 'giaoDienMoLai', 'giaoDienLichSu', 'giaoDienMoTab',
  'giaoDienDocBang', 'giaoDienLuuBang', 'giaoDienKhoiPhucMacDinh', 'giaoDienDatKy', 'giaoDienNhapBaoCao'];

var NHAN_NGUON_HIEN_THI = { xuatBanChuyenKho: 'Xuất bán / chuyển kho', baoHanh: 'Bảo hành', hoTroSale: 'Hỗ trợ sale', quanLyKho: 'Quản lý kho' };
var THU_TU_NGUON = ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale', 'quanLyKho'];
var GIOI_HAN_DONG_QUY = 500;

// Số theo kiểu Việt Nam: dấu chấm ngăn nghìn, dấu phẩy thập phân, bỏ số 0 thừa ở cuối.
function chuoiSoVi(x, soLe) {
  if (typeof x !== 'number' || !isFinite(x)) return '';
  var t = lamTronLuu(x, soLe === undefined ? 2 : soLe);
  var am = t < 0;
  var phan = Math.abs(t).toFixed(soLe === undefined ? 2 : soLe).split('.');
  var nguyen = phan[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  var le = phan[1] ? phan[1].replace(/0+$/, '') : '';
  return (am ? '-' : '') + nguyen + (le ? ',' + le : '');
}
function chuoiPhanTram(x) { return typeof x === 'number' ? chuoiSoVi(x * 100, 1) + '%' : ''; }

var NHOM_TAB = { cauHinh: 'Cấu hình', nhapTay: 'Nhập tay mỗi kỳ', baoCao: 'Báo cáo kiểm kê' };

function trangThaiChuaTinhChu(r) {
  if (r.trangThai === 'daTinh') return 'Đã tính';
  if (r.trangThai === 'khongTinh') return 'Không tính (chỉ theo dõi point)';
  return 'Chưa tính: ' + r.lyDo.join('; ');
}

// Danh sách tab đầu vào kèm nhóm, để màn Dữ liệu hiển thị và để kiểm tra tên tab được phép mở.
function khoaBangCuaTab(ten) {
  var k = chuanHoaKhoa(ten);
  var ds = danhSachKhoaBang().filter(function (khoa) { return chuanHoaKhoa(TEN_TAB[khoa]) === k; });
  return ds.length > 0 ? ds[0] : null;
}

function danhSachTabChoGiaoDien(khuVuc) {
  var T = TEN_TAB;
  var ra = [];
  [T.thamSo, T.bac, T.bacThang, T.chiSo, T.nhomThietBi, T.maHang, T.viecQuanLyKho, T.heSoChia, T.khuVuc, T.thanhVien, T.tyTrong]
    .forEach(function (t) { ra.push({ ten: t, nhom: NHOM_TAB.cauHinh, khoa: khoaBangCuaTab(t) }); });
  [T.ky, T.baoHanhHoTroSale, T.xacNhanBaoCao, T.nhatKyCongViec, T.keyMetrics]
    .forEach(function (t) { ra.push({ ten: t, nhom: NHOM_TAB.nhapTay, khoa: khoaBangCuaTab(t) }); });
  (khuVuc || []).forEach(function (k) { if (k.tabBaoCao) ra.push({ ten: k.tabBaoCao, nhom: NHOM_TAB.baoCao, khoa: null }); });
  return ra;
}

// Tình trạng từng tab đầu vào. cacTab: {tên tab: bảng hai chiều} (chỉ để đếm dòng, không đưa nội dung vào mô hình).
// "Có dữ liệu" nghĩa là ngoài dòng tiêu đề còn ít nhất một dòng không trống.
function tinhTrangTab(cacTab, khuVuc) {
  return danhSachTabChoGiaoDien(khuVuc).map(function (t) {
    var bang = cacTab[t.ten];
    if (bang === undefined || bang === null) return { ten: t.ten, nhom: t.nhom, khoa: t.khoa, trangThai: 'thieu', soDong: 0 };
    var soDong = 0;
    for (var i = 1; i < bang.length; i++) if (!dongTrong(bang[i])) soDong++;
    return { ten: t.ten, nhom: t.nhom, khoa: t.khoa, trangThai: soDong > 0 ? 'coDuLieu' : 'trong', soDong: soDong };
  });
}

// Tên tab được phép mở từ giao diện: tab của ứng dụng (đầu vào, đầu ra, chỉ mục) và tab báo cáo khai báo trong cấu hình,
// cùng các tab bản sao kỳ đang tồn tại. Mọi tên khác bị từ chối.
function tenTabDuocMo(ten, khuVuc, tabHienCo) {
  if (typeof ten !== 'string' || ten === '') return false;
  var k = chuanHoaKhoa(ten);
  var duoc = danhSachTabChoGiaoDien(khuVuc).map(function (t) { return t.ten; })
    .concat(danhSachTabDauRa(), [TEN_TAB.kyDaChot]);
  for (var i = 0; i < duoc.length; i++) if (chuanHoaKhoa(duoc[i]) === k) return true;
  if (laTabChot(ten)) {
    for (var j = 0; j < (tabHienCo || []).length; j++) if (chuanHoaKhoa(tabHienCo[j]) === k) return true;
  }
  return false;
}

// Lịch sử các kỳ đã chốt cho giao diện, kèm cờ "có thể mở lại" (chỉ ở dòng mới nhất của kỳ khi hiệu lực là Đã chốt).
function moHinhLichSu(chiMuc) {
  var ra = chiMuc.map(function (s) {
    var hieuLuc = trangThaiHieuLuc(chiMuc, s.ky);
    return { ky: s.ky, trangThai: s.trangThai, thoiDiem: s.thoiDiem, tong: s.tong, soDaTinh: s.soDaTinh, soBoQua: s.soBoQua, tenTab: s.tenTab, lyDo: s.lyDo,
      hieuLuc: hieuLuc, coTheMoLai: false };
  });
  var daThay = {};
  for (var i = ra.length - 1; i >= 0; i--) {
    var k = chuanHoaKhoa(ra[i].ky);
    if (!daThay[k]) { daThay[k] = true; ra[i].coTheMoLai = ra[i].trangThai === TRANG_THAI_DA_CHOT; }
  }
  return ra;
}

// Các tháng để chọn: 6 tháng trước đến 6 tháng sau tháng hiện tại của kỳ (dạng năm-tháng); rỗng khi chưa có kỳ hợp lệ.
function danhSachKyGoiY(thang) {
  var m = typeof thang === 'string' ? /^(\d{4})-(\d{2})$/.exec(thang) : null;
  if (!m) return [];
  var nam = Number(m[1]), th = Number(m[2]), ra = [];
  for (var d = -6; d <= 6; d++) {
    var tong = nam * 12 + (th - 1) + d;
    ra.push(Math.floor(tong / 12) + '-' + chuoiHaiChuSo((tong % 12) + 1));
  }
  return ra;
}

function tenChiSoTheoId(cauHinh, id) {
  var ds = (cauHinh && cauHinh.chiSo) || [];
  for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i];
  return null;
}

function moHinhNguonCuaNguoi(r) {
  var ra = [];
  THU_TU_NGUON.forEach(function (khoa) {
    var n = r.point && r.point.nguon ? r.point.nguon[khoa] : null;
    if (!n) return;
    ra.push({ khoa: khoa, nhan: NHAN_NGUON_HIEN_THI[khoa], apDung: !!n.apDung, trangThai: n.trangThai || null, point: lamTronLuu(n.point, 4),
      chiTiet: (n.chiTiet || []).map(function (d) {
        return d.loai !== undefined
          ? { loai: d.loai, heSo: d.heSo, soLuong: d.soLuong, point: lamTronLuu(d.point, 4) }
          : { khuVuc: String(d.khuVuc || '').toUpperCase(), quy: lamTronLuu(d.quy, 4), heSo: d.heSo, point: lamTronLuu(d.point, 4) };
      }) });
  });
  return ra;
}

function moHinhKeyMetricsCuaNguoi(r, cauHinh) {
  var km = r.keyMetrics;
  if (!km) return null;
  return { trangThai: km.trangThai, diem: lamTronLuu(km.diem, 6), phanTramThuong: km.phanTramThuong, thieuChiSo: (km.thieuChiSo || []).slice(),
    chiTiet: (km.chiTiet || []).map(function (c) {
      var cs = tenChiSoTheoId(cauHinh, c.chiSo);
      return { chiSo: c.chiSo, ten: cs && cs.ten ? cs.ten : c.chiSo, kieu: cs ? cs.kieu : null, tyTrong: c.tyTrong, mucTieu: c.mucTieu, ketQua: c.ketQua,
        min: c.min === undefined || c.min === null ? null : lamTronLuu(c.min, 6), phanTramHT: c.phanTramHT === undefined ? null : lamTronLuu(c.phanTramHT, 6) };
    }) };
}

// Các bước giải thích cách tính (chuỗi hiển thị); chỉ dùng số liệu có trong kết quả, không đoán.
function cacBuocGiaiThich(r) {
  var b = [];
  if (r.trangThai !== 'daTinh') {
    b.push(r.trangThai === 'khongTinh' ? 'Thành viên này chỉ theo dõi point, không tính thu nhập.' : 'Chưa tính được: ' + (r.lyDo || []).join('; '));
  }
  THU_TU_NGUON.forEach(function (khoa) {
    var n = r.point && r.point.nguon ? r.point.nguon[khoa] : null;
    if (!n || !n.apDung) return;
    (n.chiTiet || []).forEach(function (d) {
      if (d.loai !== undefined) b.push(NHAN_NGUON_HIEN_THI[khoa] + ' — ' + d.loai + ': ' + chuoiSoVi(d.soLuong, 2) + ' × hệ số ' + chuoiSoVi(d.heSo, 4) + ' = ' + chuoiSoVi(d.point, 2) + ' point');
      else b.push(NHAN_NGUON_HIEN_THI[khoa] + ' khu vực ' + String(d.khuVuc || '').toUpperCase() + ': quỹ ' + chuoiSoVi(d.quy, 2) + ' × hệ số ' + chuoiSoVi(d.heSo, 4) + ' = ' + chuoiSoVi(d.point, 2) + ' point');
    });
  });
  if (r.trangThai !== 'daTinh') return b;
  b.push('Tổng point = ' + chuoiSoVi(r.pointTong, 2) + ' (Min ' + chuoiSoVi(r.min, 2) + ', Max ' + chuoiSoVi(r.max, 2) + ').');
  b.push('Phần vượt Min tính đến Max: ' + chuoiSoVi(r.pointVuot, 2) + ' point × đơn giá = ' + chuoiSoVi(r.thuongVuotPoint, 0) + ' đ.');
  b.push('Điểm key metrics = ' + chuoiSoVi(r.diemKM, 4) + ' → thưởng ' + chuoiPhanTram(r.phanTramThuong) + ' × lương cố định ' + chuoiSoVi(r.luongCoDinh, 0) + ' đ = ' + chuoiSoVi(r.thuongKM, 0) + ' đ.');
  b.push(r.phuCap > 0 ? 'Phụ cấp máy tính cá nhân: ' + chuoiSoVi(r.phuCap, 0) + ' đ.' : 'Không có phụ cấp.');
  b.push('Thu nhập tạm tính = ' + chuoiSoVi(r.luongCoDinh, 0) + ' + ' + chuoiSoVi(r.thuongKM, 0) + ' + ' + chuoiSoVi(r.thuongVuotPoint, 0) + ' + ' + chuoiSoVi(r.phuCap, 0) + ' = ' + chuoiSoVi(r.thuNhap, 0) + ' đ (làm tròn theo cấu hình).');
  return b;
}

// Quỹ point theo nguồn và khu vực, cùng các dòng hàng (mã hàng, nhóm, số lượng, point) cho màn Nhập point.
// Không có giá bán, giá trị tồn hay mô tả nhật ký.
function moHinhQuy(kq) {
  var tenKv = {};
  (kq.khuVuc || []).forEach(function (k) { tenKv[chuanHoaKhoa(k.ma)] = k.ma; });
  var ra = { xuatBanChuyenKho: [], baoHanh: [], hoTroSale: [], quanLyKho: kq.quy && kq.quy.quanLyKho ? { tong: lamTronLuu(kq.quy.quanLyKho.tong, 4) } : null };
  ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'].forEach(function (nguon) {
    var q = kq.quy ? kq.quy[nguon] : null;
    if (!q) return;
    Object.keys(q).forEach(function (kv) {
      var x = q[kv];
      var m = { khuVuc: tenKv[kv] || String(kv).toUpperCase(), quy: lamTronLuu(x.quy, 4), thieu: !!x.thieu, soLuong: x.soLuong === undefined ? null : x.soLuong };
      if (nguon === 'xuatBanChuyenKho') {
        var ds = x.chiTiet || [];
        m.tongDong = ds.length;
        m.dong = ds.slice(0, GIOI_HAN_DONG_QUY).map(function (d) {
          return { ma: d.ma, nhom: d.nhom, pointXuatBan: lamTronLuu(d.pointXuatBan, 4), pointChuyenKho: lamTronLuu(d.pointChuyenKho, 4), banRa: d.banRa, chuyenKho: d.chuyenKho, point: lamTronLuu(d.point, 4) };
        });
      }
      ra[nguon].push(m);
    });
  });
  return ra;
}

// Mô hình khi chưa tính: chỉ có thông tin nền (chia sẻ, tình trạng tab, lịch sử).
// thongTin: {chiaSe: kết quả danhGiaChiaSe, tabs: tinhTrangTab(...), chiMuc, thang}
function taoMoHinhChuaTinh(thongTin) {
  return {
    daTinh: false, nhan: NHAN_DE_XUAT, thang: thongTin.thang || null,
    chiaSe: { mucDo: thongTin.chiaSe.mucDo, ma: thongTin.chiaSe.ma, thongDiep: thongTin.chiaSe.thongDiep },
    tabs: thongTin.tabs, lichSu: moHinhLichSu(thongTin.chiMuc), daGhiKetQua: !!thongTin.daGhiKetQua,
    bang: danhSachKhoaBang().map(function (k) { var b = bangTheoKhoa(k); return { khoa: k, nhan: b.nhan, nhom: b.nhom, coMacDinh: b.coMacDinh }; }),
    kyGoiY: danhSachKyGoiY(thongTin.thang),
    khuVuc: (thongTin.khuVuc || []).map(function (k) {
      var tab = (thongTin.tabs || []).filter(function (t) { return t.ten === k.tabBaoCao; })[0];
      return { ma: k.ma, coBaoCao: !!tab && tab.trangThai === 'coDuLieu' };
    }),
    trangThaiKy: thongTin.thang ? trangThaiHieuLuc(thongTin.chiMuc, thongTin.thang) : null
  };
}

// Mô hình sau khi tính. kq: kết quả của tinhKyTuCacTab.
function taoMoHinhGiaoDien(kq, thongTin) {
  var m = taoMoHinhChuaTinh(thongTin);
  var thang = kq.ky ? kq.ky.thang : m.thang;
  m.daTinh = true;
  m.thang = thang;
  m.trangThaiKy = thang ? trangThaiHieuLuc(thongTin.chiMuc, thang) : null;
  m.thoiDiem = kq.thoiDiem;
  m.trangThaiDuLieu = kq.chanToanBo ? 'chan' : (kq.kyDuDuLieu ? 'du' : 'chua');
  // Làm tròn khi đưa vào mô hình để trang không nhận nhiễu số thực (ví dụ 3779999.9999999995).
  m.thanhVien = kq.thanhVien.map(function (r) {
    return { taiKhoan: r.taiKhoan, ten: r.ten || r.taiKhoan, nhom: r.nhom, bac: r.bac, pointTong: lamTronLuu(r.pointTong, 4), min: r.min, max: r.max,
      pointVuot: lamTronLuu(r.pointVuot, 4), diemKM: lamTronLuu(r.diemKM, 6), phanTramThuong: r.phanTramThuong,
      luongCoDinh: lamTronLuu(r.luongCoDinh, 2), thuongKM: lamTronLuu(r.thuongKM, 2), thuongVuotPoint: lamTronLuu(r.thuongVuotPoint, 2),
      phuCap: lamTronLuu(r.phuCap, 2), thuNhap: r.thuNhap, trangThai: r.trangThai, trangThaiChu: trangThaiChuaTinhChu(r),
      khuVuc: r.khuVuc || '', luongCoDinhGhiDe: !!r.luongGhiDe,
      chipPoint: { trangThai: r.point ? r.point.trangThai : null, thieu: r.point && r.point.thieuNguon ? r.point.thieuNguon.slice() : [] },
      chipKM: { trangThai: r.keyMetrics ? r.keyMetrics.trangThai : null, thieu: r.keyMetrics && r.keyMetrics.thieuChiSo ? r.keyMetrics.thieuChiSo.slice() : [] },
      nguon: moHinhNguonCuaNguoi(r), keyMetrics: moHinhKeyMetricsCuaNguoi(r, kq.cauHinh), giaiThich: cacBuocGiaiThich(r) };
  });
  m.quy = moHinhQuy(kq);
  m.khuVuc = (kq.khuVuc || []).map(function (k) {
    return { ma: k.ma, coBaoCao: !!(kq.duLieuKy && kq.duLieuKy.kiemKe && kq.duLieuKy.kiemKe[k.ma]) };
  });
  function tong(t, nhan) {
    return { nhan: nhan, ghiChu: t.ghiChu, thuNhap: lamTronLuu(t.thuNhap, 2), luongCoDinh: lamTronLuu(t.luongCoDinh, 2), thuongKM: lamTronLuu(t.thuongKM, 2),
      thuongVuotPoint: lamTronLuu(t.thuongVuotPoint, 2), phuCap: lamTronLuu(t.phuCap, 2), soDaTinh: t.soDaTinh, tongSo: t.tongSo };
  }
  m.nhom = kq.tong ? kq.tong.theoNhom.map(function (n) { return tong(n, n.nhom); }) : [];
  m.tong = kq.tong ? tong(kq.tong.team, 'Tổng team') : null;
  m.loi = kq.loi.map(function (l) { return { ma: l.ma, chan: l.chan || '', thongDiep: l.thongDiep }; });
  m.canhBao = kq.canhBao.map(function (l) { return { muc: l.muc, ma: l.ma, thongDiep: l.thongDiep }; });
  m.doiSoat = kq.doiSoat.map(function (d) {
    return { nguon: d.nguon, khuVuc: d.khuVuc || '', quy: lamTronLuu(d.quy, 4), daChia: lamTronLuu(d.daChia, 4), lech: lamTronLuu(d.lech, 4), dat: d.dat };
  });
  var dk = danhGiaDieuKienDuyet(kq, m.trangThaiKy, []);
  m.duyet = { lyDoChan: dk.lyDo, canXacNhan: dk.canXacNhan };
  return m;
}
