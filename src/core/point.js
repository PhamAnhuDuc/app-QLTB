// Tính và chia point (spec point-allocation). Hàm thuần.
//
// Nguồn point: 'xuatBanChuyenKho', 'baoHanh', 'hoTroSale' (có quỹ theo khu vực, chia theo hệ số)
// và 'quanLyKho' (nhật ký công việc cá nhân, không chia).
//
// Thêm một phạm vi chặn so với config.js: 'qk:<taiKhoan>' (chặn nguồn quản lý kho của một người)
// và 'doiSoat' (không chặn ai nhưng làm kỳ không được coi là đủ dữ liệu).

function layTheoKhoa(obj, khoa) {
  if (!obj) return undefined;
  var k = chuanHoaKhoa(khoa);
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    if (chuanHoaKhoa(keys[i]) === k) return obj[keys[i]];
  }
  return undefined;
}

// Ngày dạng 'YYYY-MM-DD' nên so sánh chuỗi là so sánh thời gian.
function baoCaoPhuTronKy(kiemKe, ky) {
  if (!kiemKe || !kiemKe.tuNgay || !kiemKe.denNgay || !ky || !ky.tuNgay || !ky.denNgay) return null;
  return kiemKe.tuNgay <= ky.tuNgay && kiemKe.denNgay >= ky.denNgay;
}

// ---- Quỹ xuất bán / chuyển kho theo khu vực ------------------------------------------------
// Trả về {quy, thieu, chiTiet, loi, canhBao}. quy = null nếu thiếu dữ liệu hoặc có lỗi chặn.
function tinhQuyXuatBanChuyenKho(idx, ky, khuVuc, kiemKe, xacNhanMotPhan) {
  var chan = chanNguon('xuatBanChuyenKho', khuVuc);
  var kq = { quy: null, thieu: false, chiTiet: [], loi: [], canhBao: [] };
  if (!kiemKe || !Array.isArray(kiemKe.dong)) { kq.thieu = true; return kq; }

  var phu = baoCaoPhuTronKy(kiemKe, ky);
  if (phu === null) {
    kq.canhBao.push(taoThongBao('canhBao', 'BAO_CAO_THIEU_NGAY',
      'Báo cáo kiểm kê khu vực ' + khuVuc + ' không ghi khoảng ngày, không kiểm tra được có phủ trọn kỳ',
      { khuVuc: khuVuc }));
  } else if (phu === false) {
    var chiTietNgay = { khuVuc: khuVuc, baoCaoTu: kiemKe.tuNgay, baoCaoDen: kiemKe.denNgay, kyTu: ky.tuNgay, kyDen: ky.denNgay };
    if (xacNhanMotPhan === true) {
      kq.canhBao.push(taoThongBao('canhBao', 'BAO_CAO_CHUA_PHU_KY',
        'Báo cáo kiểm kê khu vực ' + khuVuc + ' (' + kiemKe.tuNgay + ' đến ' + kiemKe.denNgay + ') chưa phủ hết kỳ, chủ sở hữu đã xác nhận vẫn dùng', chiTietNgay));
    } else {
      kq.loi.push(taoThongBao('loi', 'BAO_CAO_CHUA_PHU_KY',
        'Báo cáo kiểm kê khu vực ' + khuVuc + ' (' + kiemKe.tuNgay + ' đến ' + kiemKe.denNgay + ') chưa phủ hết kỳ ' + ky.tuNgay + ' đến ' + ky.denNgay +
        '. Cần chủ sở hữu xác nhận trước khi dùng', chiTietNgay, chan));
    }
  }

  var tong = 0;
  kiemKe.dong.forEach(function (d, i) {
    var ban = docSo(d.banRa), chuyen = docSo(d.chuyenKho);
    var banSo = ban.trong ? 0 : ban.giaTri, chuyenSo = chuyen.trong ? 0 : chuyen.giaTri;
    if ((!ban.trong && (!ban.hopLe || ban.giaTri < 0)) || (!chuyen.trong && (!chuyen.hopLe || chuyen.giaTri < 0))) {
      kq.loi.push(taoThongBao('loi', 'SO_LUONG_SAI',
        'Số lượng không hợp lệ (phải là số không âm) ở dòng ' + (i + 1) + ' của báo cáo khu vực ' + khuVuc + (d.ma ? ', mã ' + d.ma : ''),
        { khuVuc: khuVuc, dong: i + 1, ma: d.ma || null }, chan));
      return;
    }
    if (banSo === 0 && chuyenSo === 0) return; // không phát sinh
    if (laTrong(d.ma)) {
      kq.canhBao.push(taoThongBao('canhBao', 'DONG_THIEU_MA',
        'Dòng ' + (i + 1) + ' của báo cáo khu vực ' + khuVuc + ' có phát sinh (bán ' + banSo + ', chuyển kho ' + chuyenSo + ') nhưng thiếu mã hàng, không tính point',
        { khuVuc: khuVuc, dong: i + 1, banRa: banSo, chuyenKho: chuyenSo }));
      return;
    }
    var m = idx.maHang[chuanHoaKhoa(d.ma)];
    if (!m) {
      kq.loi.push(taoThongBao('loi', 'MA_HANG_LA',
        'Mã ' + d.ma + ' chưa có trong bảng quy đổi (khu vực ' + khuVuc + ', bán ' + banSo + ', chuyển kho ' + chuyenSo + ')',
        { khuVuc: khuVuc, ma: d.ma, banRa: banSo, chuyenKho: chuyenSo }, chan));
      return;
    }
    var nhom = idx.nhom[chuanHoaKhoa(m.nhom)];
    if (!nhom) {
      kq.loi.push(taoThongBao('loi', 'NHOM_CHUA_CO_POINT',
        'Mã ' + d.ma + ' thuộc nhóm "' + m.nhom + '" chưa có point (khu vực ' + khuVuc + ')',
        { khuVuc: khuVuc, ma: d.ma, nhom: m.nhom, banRa: banSo, chuyenKho: chuyenSo }, chan));
      return;
    }
    var point = banSo * nhom.pointXuatBan + chuyenSo * nhom.pointChuyenKho;
    tong += point;
    kq.chiTiet.push({ ma: d.ma, nhom: nhom.nhom, banRa: banSo, chuyenKho: chuyenSo,
      pointXuatBan: nhom.pointXuatBan, pointChuyenKho: nhom.pointChuyenKho, point: xapXi(point) });
  });
  if (kq.loi.length === 0) kq.quy = xapXi(tong);
  return kq;
}

// ---- Quỹ bảo hành và hỗ trợ sale -----------------------------------------------------------
function tinhQuyTheoSo(nguon, khuVuc, giaTri, heSo, tenDonVi) {
  var kq = { quy: null, thieu: false, loi: [], canhBao: [] };
  var r = docSo(giaTri);
  if (r.trong) { kq.thieu = true; return kq; }
  if (!r.hopLe || r.giaTri < 0) {
    kq.loi.push(taoThongBao('loi', 'SO_LUONG_SAI',
      'Số ' + tenDonVi + ' của khu vực ' + khuVuc + ' phải là số không âm',
      { nguon: nguon, khuVuc: khuVuc }, chanNguon(nguon, khuVuc)));
    return kq;
  }
  kq.quy = xapXi(r.giaTri * heSo);
  kq.soLuong = r.giaTri;
  return kq;
}

function tinhQuyBaoHanh(config, khuVuc, soCa) {
  return tinhQuyTheoSo('baoHanh', khuVuc, soCa, config.thamSo.pointMoiCaBaoHanh, 'ca bảo hành');
}

function tinhQuyHoTroSale(config, khuVuc, soDon) {
  return tinhQuyTheoSo('hoTroSale', khuVuc, soDon, config.thamSo.heSoHoTroSale, 'đơn hỗ trợ sale');
}

// ---- Quản lý kho: nhật ký công việc cá nhân ------------------------------------------------
// Trả về {theoNguoi: {tk: {point, soDong, chiTiet}}, biChan: {tk: true}, tongHopLe, loi, canhBao}
function tinhNhatKy(idx, nhatKy) {
  var kq = { theoNguoi: {}, biChan: {}, tongHopLe: 0, loi: [], canhBao: [] };
  (nhatKy || []).forEach(function (d, i) {
    var tk = chuanHoaKhoa(d.taiKhoan);
    var coNguoi = !!idx.thanhVien[tk];
    if (!coNguoi) {
      kq.loi.push(taoThongBao('loi', 'TAI_KHOAN_LA',
        'Dòng ' + (i + 1) + ' của nhật ký công việc dùng tài khoản không có trong danh sách: ' + d.taiKhoan,
        { dong: i + 1, taiKhoan: d.taiKhoan }, 'doiSoat'));
      return;
    }
    var chan = 'qk:' + tk;
    var viec = idx.viec[chuanHoaKhoa(d.loai)];
    var sl = docSo(d.soLuong);
    var hong = false;
    if (!viec) {
      kq.loi.push(taoThongBao('loi', 'LOAI_VIEC_LA',
        'Dòng ' + (i + 1) + ' của nhật ký (tài khoản ' + d.taiKhoan + '): loại việc "' + d.loai + '" chưa có hệ số trong bảng quy đổi',
        { dong: i + 1, taiKhoan: d.taiKhoan, loai: d.loai }, chan));
      hong = true;
    }
    if (!sl.hopLe || sl.giaTri < 0) {
      kq.loi.push(taoThongBao('loi', 'SO_LUONG_SAI',
        'Dòng ' + (i + 1) + ' của nhật ký (tài khoản ' + d.taiKhoan + '): số lượng phải là số không âm',
        { dong: i + 1, taiKhoan: d.taiKhoan }, chan));
      hong = true;
    }
    if (hong) { kq.biChan[tk] = true; return; }
    if (!kq.theoNguoi[tk]) kq.theoNguoi[tk] = { point: 0, soDong: 0, chiTiet: [] };
    var p = sl.giaTri * viec.heSo;
    kq.theoNguoi[tk].point += p;
    kq.theoNguoi[tk].soDong += 1;
    kq.theoNguoi[tk].chiTiet.push({ loai: viec.loai, heSo: viec.heSo, soLuong: sl.giaTri, point: xapXi(p) });
    kq.tongHopLe += p;
  });
  // Người bị chặn vì có dòng lỗi: bỏ phần dòng hợp lệ của họ ra khỏi tổng để đối soát không lệch giả.
  Object.keys(kq.biChan).forEach(function (tk) {
    if (kq.theoNguoi[tk]) { kq.tongHopLe -= kq.theoNguoi[tk].point; delete kq.theoNguoi[tk]; }
  });
  Object.keys(kq.theoNguoi).forEach(function (tk) { kq.theoNguoi[tk].point = xapXi(kq.theoNguoi[tk].point); });
  kq.tongHopLe = xapXi(kq.tongHopLe);
  return kq;
}

// ---- Chia quỹ, cộng nguồn, đối soát --------------------------------------------------------
// duLieuKy: {ky, kiemKe, baoHanh, hoTroSale, nhatKy, pointQuanLyKhoNhapTay?, xacNhanBaoCaoMotPhan?}
// loiCauHinh: danh sách lỗi từ kiemTraCauHinh (để biết nguồn nào bị chặn bởi cấu hình)
function tinhPoint(config, idx, duLieuKy, loiCauHinh) {
  var loi = [], canhBao = [], doiSoat = [];
  var ts = config.thamSo;
  var quy = { xuatBanChuyenKho: {}, baoHanh: {}, hoTroSale: {}, quanLyKho: null };

  // Tập khu vực cần tính cho từng nguồn: có hệ số hoặc có dữ liệu. Trả về [{kv: khoá viết thường, ten: tên gốc}].
  function tapKhuVuc(nguon, nguonDuLieu) {
    var set = {};
    (config.heSoChia || []).forEach(function (h) {
      if (h.nguon === nguon) set[chuanHoaKhoa(h.khuVuc)] = String(h.khuVuc).trim();
    });
    Object.keys(nguonDuLieu || {}).forEach(function (k) { set[chuanHoaKhoa(k)] = set[chuanHoaKhoa(k)] || String(k).trim(); });
    return Object.keys(set).map(function (kv) { return { kv: kv, ten: set[kv] }; });
  }

  // Quỹ xuất bán / chuyển kho
  tapKhuVuc('xuatBanChuyenKho', duLieuKy.kiemKe).forEach(function (k) {
    var r = tinhQuyXuatBanChuyenKho(idx, duLieuKy.ky, k.ten, layTheoKhoa(duLieuKy.kiemKe, k.ten),
      layTheoKhoa(duLieuKy.xacNhanBaoCaoMotPhan, k.ten));
    quy.xuatBanChuyenKho[k.kv] = r;
    loi.push.apply(loi, r.loi); canhBao.push.apply(canhBao, r.canhBao);
  });
  tapKhuVuc('baoHanh', duLieuKy.baoHanh).forEach(function (k) {
    var r = tinhQuyBaoHanh(config, k.ten, layTheoKhoa(duLieuKy.baoHanh, k.ten));
    quy.baoHanh[k.kv] = r;
    loi.push.apply(loi, r.loi);
  });
  tapKhuVuc('hoTroSale', duLieuKy.hoTroSale).forEach(function (k) {
    var r = tinhQuyHoTroSale(config, k.ten, layTheoKhoa(duLieuKy.hoTroSale, k.ten));
    quy.hoTroSale[k.kv] = r;
    loi.push.apply(loi, r.loi);
  });

  // Nhật ký quản lý kho
  var nk = tinhNhatKy(idx, duLieuKy.nhatKy);
  loi.push.apply(loi, nk.loi);
  quy.quanLyKho = { tong: nk.tongHopLe };

  // Chia theo hệ số
  var thanhVien = {};
  idx.thuTuThanhVien.forEach(function (tk) {
    var tv = idx.thanhVien[tk];
    var nguon = {};
    var thieu = [];
    ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'].forEach(function (n) {
      // Người có thể có hệ số ở nhiều khu vực; cộng phần từ mỗi khu vực họ có hệ số.
      var apDung = false, daChan = false, thieuSo = false, tong = 0, chiTiet = [];
      Object.keys(idx.heSo).forEach(function (chan) {
        var p = chan.split(':');
        if (p[1] !== n || !Object.prototype.hasOwnProperty.call(idx.heSo[chan], tk)) return;
        apDung = true;
        var heSo = idx.heSo[chan][tk];
        var q = quy[n][p[2]];
        if (biChan(loiCauHinh, chan) || !q || q.quy === null) {
          if (biChan(loiCauHinh, chan) || (q && q.loi.length > 0)) daChan = true; else thieuSo = true;
          return;
        }
        var diem = q.quy * heSo;
        tong += diem;
        chiTiet.push({ khuVuc: p[2], quy: q.quy, heSo: heSo, point: xapXi(diem) });
      });
      var ok = apDung && !daChan && !thieuSo;
      nguon[n] = { apDung: apDung, point: ok ? xapXi(tong) : null, chiTiet: chiTiet,
        trangThai: !apDung ? 'khongApDung' : ok ? 'du' : (daChan ? 'biChan' : 'thieu') };
      if (apDung && !ok) thieu.push(n);
    });
    // Quản lý kho: áp dụng cho mọi thành viên
    var nguoi = nk.theoNguoi[tk];
    if (nk.biChan[tk]) {
      nguon.quanLyKho = { apDung: true, point: null, chiTiet: [], trangThai: 'biChan' };
      thieu.push('quanLyKho');
    } else if (nguoi) {
      nguon.quanLyKho = { apDung: true, point: nguoi.point, chiTiet: nguoi.chiTiet, trangThai: 'du' };
    } else {
      nguon.quanLyKho = { apDung: true, point: null, chiTiet: [], trangThai: 'thieu' };
      thieu.push('quanLyKho');
    }
    var tong = null;
    if (thieu.length === 0) {
      tong = 0;
      Object.keys(nguon).forEach(function (n) { if (nguon[n].point !== null) tong += nguon[n].point; });
      tong = xapXi(tong);
    }
    thanhVien[tk] = { nguon: nguon, tong: tong, trangThai: thieu.length === 0 ? 'du' : 'thieu', thieuNguon: thieu };
  });

  // Đối soát: tổng đã chia phải bằng quỹ (sai số cấu hình)
  var saiSo = ts.saiSoDoiSoat;
  ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'].forEach(function (n) {
    Object.keys(quy[n]).forEach(function (kv) {
      var q = quy[n][kv];
      var chan = chanNguon(n, kv);
      if (q.quy === null || biChan(loiCauHinh, chan)) return;
      var daChia = 0;
      idx.thuTuThanhVien.forEach(function (tk) {
        var ct = thanhVien[tk].nguon[n].chiTiet.filter(function (c) { return c.khuVuc === kv; });
        ct.forEach(function (c) { daChia += c.point; });
      });
      var lech = xapXi(daChia - q.quy);
      var dat = Math.abs(lech) <= saiSo;
      doiSoat.push({ nguon: n, khuVuc: kv, quy: q.quy, daChia: xapXi(daChia), lech: lech, dat: dat });
      if (!dat) {
        loi.push(taoThongBao('loi', 'DOI_SOAT_LECH',
          'Đối soát lệch: nguồn ' + n + ' khu vực ' + kv + ' quỹ ' + q.quy + ', đã chia ' + xapXi(daChia) + ' (lệch ' + lech + ')',
          { nguon: n, khuVuc: kv, quy: q.quy, daChia: xapXi(daChia), lech: lech }, 'doiSoat'));
      }
    });
  });
  // Quản lý kho: tổng point các thành viên phải bằng tổng nhật ký hợp lệ
  var tongQk = 0;
  idx.thuTuThanhVien.forEach(function (tk) {
    var p = thanhVien[tk].nguon.quanLyKho.point;
    if (p !== null) tongQk += p;
  });
  var lechQk = xapXi(tongQk - nk.tongHopLe);
  doiSoat.push({ nguon: 'quanLyKho', khuVuc: null, quy: nk.tongHopLe, daChia: xapXi(tongQk), lech: lechQk,
    dat: Math.abs(lechQk) <= saiSo });
  // Giá trị nhập tay chênh với tổng nhật ký của người đó
  var nhapTay = duLieuKy.pointQuanLyKhoNhapTay || {};
  Object.keys(nhapTay).forEach(function (tkRaw) {
    var tk = chuanHoaKhoa(tkRaw);
    var theoNhatKy = nk.theoNguoi[tk] ? nk.theoNguoi[tk].point : 0;
    var r = docSo(nhapTay[tkRaw]);
    if (!r.hopLe) return;
    var lech = xapXi(r.giaTri - theoNhatKy);
    if (Math.abs(lech) > saiSo) {
      doiSoat.push({ nguon: 'quanLyKho', khuVuc: null, taiKhoan: tkRaw, quy: theoNhatKy, daChia: r.giaTri, lech: lech, dat: false });
      loi.push(taoThongBao('loi', 'DOI_SOAT_LECH',
        'Point quản lý kho nhập tay của ' + tkRaw + ' (' + r.giaTri + ') lệch ' + lech + ' so với tổng nhật ký (' + theoNhatKy + '). Kết quả dùng tổng nhật ký',
        { nguon: 'quanLyKho', taiKhoan: tkRaw, nhapTay: r.giaTri, theoNhatKy: theoNhatKy, lech: lech }, 'doiSoat'));
    }
  });

  // Quỹ có phát sinh nhưng không ai có hệ số: point bị mất, báo lệch
  ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'].forEach(function (n) {
    Object.keys(quy[n]).forEach(function (kv) {
      var q = quy[n][kv];
      if (q.quy === null || q.quy === 0) return;
      if (!idx.heSo[chanNguon(n, kv)]) {
        loi.push(taoThongBao('loi', 'CHUA_CO_HE_SO',
          'Khu vực ' + kv + ' có quỹ ' + q.quy + ' ở nguồn ' + n + ' nhưng chưa có hệ số chia cho ai',
          { nguon: n, khuVuc: kv, quy: q.quy }, 'doiSoat'));
        doiSoat.push({ nguon: n, khuVuc: kv, quy: q.quy, daChia: 0, lech: xapXi(-q.quy), dat: false });
      }
    });
  });

  return { quy: quy, thanhVien: thanhVien, doiSoat: doiSoat, loi: loi, canhBao: canhBao };
}
