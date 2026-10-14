// Đọc và kiểm tra cấu hình (spec income-config). Hàm thuần.
//
// Phạm vi chặn của một lỗi (trường `chan`):
//   'toanBo'                  : cấu hình hỏng, không tính gì
//   'nguon:<nguon>:<khuVuc>'  : chỉ chặn một nguồn point ở một khu vực
//   'km:<taiKhoan>'           : chỉ chặn key metrics của một thành viên
//   'tv:<taiKhoan>'           : chặn toàn bộ kết quả của một thành viên

var NGUON_POINT = ['xuatBanChuyenKho', 'baoHanh', 'hoTroSale'];
var KIEU_CHI_SO = ['thapTot', 'caoTot', 'doanhThu'];
var THAM_SO_BAT_BUOC = [
  'donGiaPoint', 'phuCap', 'heSoHoTroSale', 'pointMoiCaBaoHanh',
  'heSoMin', 'tranDoanhThu', 'saiSoDoiSoat'
];
var SAI_SO_TONG_HE_SO = 1e-9;

function chanNguon(nguon, khuVuc) {
  return 'nguon:' + nguon + ':' + chuanHoaKhoa(khuVuc);
}

function laSoHuuHan(v) {
  return typeof v === 'number' && isFinite(v);
}

function kiemTraThamSo(config, loi) {
  var ts = config.thamSo || {};
  for (var i = 0; i < THAM_SO_BAT_BUOC.length; i++) {
    var ten = THAM_SO_BAT_BUOC[i];
    var r = docSo(ts[ten]);
    if (r.trong) {
      loi.push(taoThongBao('loi', 'THIEU_THAM_SO', 'Thiếu tham số bắt buộc: ' + ten, { thamSo: ten }, 'toanBo'));
    } else if (!r.hopLe || r.giaTri < 0) {
      loi.push(taoThongBao('loi', 'THAM_SO_SAI', 'Tham số không hợp lệ (phải là số không âm): ' + ten, { thamSo: ten }, 'toanBo'));
    }
  }
  var hm = docSo(ts.heSoMin);
  if (hm.hopLe && (hm.giaTri <= 0 || hm.giaTri >= 1)) {
    loi.push(taoThongBao('loi', 'THAM_SO_SAI', 'heSoMin phải nằm trong khoảng (0, 1)', { thamSo: 'heSoMin' }, 'toanBo'));
  }
}

function kiemTraBang(config, loi) {
  var bac = config.bac || [];
  var daCo = {};
  if (bac.length === 0) {
    loi.push(taoThongBao('loi', 'THIEU_BANG_BAC', 'Chưa có bảng bậc', {}, 'toanBo'));
  }
  bac.forEach(function (b) {
    var k = String(b.bac);
    if (daCo[k]) loi.push(taoThongBao('loi', 'BAC_TRUNG', 'Bậc bị trùng: ' + k, { bac: b.bac }, 'toanBo'));
    daCo[k] = true;
    if (!laSoHuuHan(b.luongCoDinh) || b.luongCoDinh < 0) {
      loi.push(taoThongBao('loi', 'BAC_LUONG_SAI', 'Lương cố định của bậc ' + k + ' không hợp lệ', { bac: b.bac }, 'toanBo'));
    }
    if (!laSoHuuHan(b.min) || !laSoHuuHan(b.max) || !(b.min < b.max)) {
      loi.push(taoThongBao('loi', 'BAC_MIN_MAX', 'Bậc ' + k + ' phải có Min nhỏ hơn Max', { bac: b.bac }, 'toanBo'));
    }
  });
}

// Bậc thang: các khoảng [tu, den], bắt đầu từ 0, nối liền nhau, khoảng cuối không có cận trên (den = null).
function kiemTraBacThang(config, loi) {
  var bt = (config.bacThangThuong || []).slice().sort(function (a, b) { return a.tu - b.tu; });
  var sai = function (thongDiep, chiTiet) {
    loi.push(taoThongBao('loi', 'BAC_THANG_LOI', thongDiep, chiTiet || {}, 'toanBo'));
  };
  if (bt.length === 0) { sai('Chưa có bậc thang thưởng key metrics'); return; }
  if (bt[0].tu !== 0) sai('Bậc thang phải bắt đầu từ 0, hiện bắt đầu từ ' + bt[0].tu, { tu: bt[0].tu });
  for (var i = 0; i < bt.length; i++) {
    var k = bt[i];
    if (!laSoHuuHan(k.phanTram) || k.phanTram < 0 || k.phanTram > 1) {
      sai('% thưởng không hợp lệ ở khoảng bắt đầu từ ' + k.tu, { tu: k.tu });
    }
    if (i < bt.length - 1) {
      if (k.den === null || k.den === undefined || !(k.den > k.tu)) {
        sai('Khoảng bắt đầu từ ' + k.tu + ' phải có cận trên lớn hơn cận dưới', { tu: k.tu });
      } else if (k.den > bt[i + 1].tu) {
        sai('Hai khoảng chồng lấn quanh ' + bt[i + 1].tu, { tu: k.tu, den: k.den });
      } else if (k.den < bt[i + 1].tu) {
        sai('Có khoảng hở giữa ' + k.den + ' và ' + bt[i + 1].tu, { tu: k.tu, den: k.den });
      }
    } else if (k.den !== null && k.den !== undefined) {
      sai('Khoảng cuối phải không có cận trên (den = null)', { tu: k.tu });
    }
  }
}

function kiemTraChiSo(config, loi) {
  var daCo = {};
  (config.chiSo || []).forEach(function (c) {
    var k = chuanHoaKhoa(c.id);
    if (!k) loi.push(taoThongBao('loi', 'CHI_SO_SAI', 'Chỉ số thiếu mã', {}, 'toanBo'));
    if (daCo[k]) loi.push(taoThongBao('loi', 'CHI_SO_TRUNG', 'Chỉ số bị trùng: ' + c.id, { chiSo: c.id }, 'toanBo'));
    daCo[k] = true;
    if (KIEU_CHI_SO.indexOf(c.kieu) < 0) {
      loi.push(taoThongBao('loi', 'CHI_SO_SAI', 'Chỉ số ' + c.id + ' có kiểu không hợp lệ: ' + c.kieu, { chiSo: c.id }, 'toanBo'));
    }
  });
}

function kiemTraQuyDoi(config, loi, canhBao) {
  var nhomDaCo = {};
  (config.nhomThietBi || []).forEach(function (n) {
    var k = chuanHoaKhoa(n.nhom);
    if (!k) loi.push(taoThongBao('loi', 'NHOM_SAI', 'Nhóm thiết bị thiếu tên', {}, 'toanBo'));
    if (nhomDaCo[k]) loi.push(taoThongBao('loi', 'NHOM_TRUNG', 'Nhóm bị trùng: ' + n.nhom, { nhom: n.nhom }, 'toanBo'));
    nhomDaCo[k] = true;
    if (!laSoKhongAm(n.pointXuatBan) || !laSoKhongAm(n.pointChuyenKho)) {
      loi.push(taoThongBao('loi', 'NHOM_POINT_SAI', 'Point của nhóm ' + n.nhom + ' phải là số không âm', { nhom: n.nhom }, 'toanBo'));
    }
  });
  var maDaCo = {};
  (config.maHang || []).forEach(function (m) {
    var k = chuanHoaKhoa(m.ma);
    if (!k) { loi.push(taoThongBao('loi', 'MA_SAI', 'Có dòng quy đổi thiếu mã hàng', {}, 'toanBo')); return; }
    if (maDaCo[k]) loi.push(taoThongBao('loi', 'MA_TRUNG', 'Mã hàng bị trùng: ' + m.ma, { ma: m.ma }, 'toanBo'));
    maDaCo[k] = true;
    if (!nhomDaCo[chuanHoaKhoa(m.nhom)]) {
      canhBao.push(taoThongBao('canhBao', 'MA_NHOM_CHUA_CO_POINT',
        'Mã ' + m.ma + ' thuộc nhóm "' + m.nhom + '" chưa có point', { ma: m.ma, nhom: m.nhom }));
    }
  });
  var viecDaCo = {};
  (config.viecQuanLyKho || []).forEach(function (v) {
    var k = chuanHoaKhoa(v.loai);
    if (viecDaCo[k]) loi.push(taoThongBao('loi', 'VIEC_TRUNG', 'Loại việc bị trùng: ' + v.loai, { loai: v.loai }, 'toanBo'));
    viecDaCo[k] = true;
    if (!laSoKhongAm(v.heSo)) {
      loi.push(taoThongBao('loi', 'VIEC_HE_SO_SAI', 'Hệ số của loại việc ' + v.loai + ' phải là số không âm', { loai: v.loai }, 'toanBo'));
    }
  });
}

function kiemTraThanhVien(config, loi) {
  var tvs = config.thanhVien || [];
  var bacCo = {};
  (config.bac || []).forEach(function (b) { bacCo[String(b.bac)] = true; });
  var chiSoCo = {};
  (config.chiSo || []).forEach(function (c) { chiSoCo[chuanHoaKhoa(c.id)] = true; });
  var daCo = {};
  tvs.forEach(function (t) {
    var k = chuanHoaKhoa(t.taiKhoan);
    if (!k) { loi.push(taoThongBao('loi', 'TAI_KHOAN_SAI', 'Có thành viên thiếu tài khoản', {}, 'toanBo')); return; }
    if (daCo[k]) {
      loi.push(taoThongBao('loi', 'TAI_KHOAN_TRUNG', 'Tài khoản bị trùng: ' + t.taiKhoan, { taiKhoan: t.taiKhoan }, 'toanBo'));
    }
    daCo[k] = true;
    if (!bacCo[String(t.bac)]) {
      loi.push(taoThongBao('loi', 'THANH_VIEN_BAC_LA', 'Thành viên ' + t.taiKhoan + ' có bậc chưa có trong bảng bậc', { taiKhoan: t.taiKhoan, bac: t.bac }, 'tv:' + k));
    }
    if (t.luongCoDinhGhiDe !== null && t.luongCoDinhGhiDe !== undefined && !laSoKhongAm(t.luongCoDinhGhiDe)) {
      loi.push(taoThongBao('loi', 'GHI_DE_LUONG_SAI', 'Lương cố định ghi đè của ' + t.taiKhoan + ' không hợp lệ', { taiKhoan: t.taiKhoan }, 'tv:' + k));
    }
    // Tập chỉ số và tỷ trọng
    var cs = t.chiSo || [];
    if (cs.length > 0) {
      var tong = 0, hopLe = true, dau = {};
      cs.forEach(function (c) {
        var ck = chuanHoaKhoa(c.chiSo);
        if (!chiSoCo[ck]) {
          loi.push(taoThongBao('loi', 'CHI_SO_LA', 'Thành viên ' + t.taiKhoan + ' dùng chỉ số không tồn tại: ' + c.chiSo, { taiKhoan: t.taiKhoan, chiSo: c.chiSo }, 'km:' + k));
          hopLe = false;
        }
        if (dau[ck]) {
          loi.push(taoThongBao('loi', 'CHI_SO_LAP', 'Thành viên ' + t.taiKhoan + ' khai báo chỉ số ' + c.chiSo + ' hai lần', { taiKhoan: t.taiKhoan, chiSo: c.chiSo }, 'km:' + k));
          hopLe = false;
        }
        dau[ck] = true;
        if (!laSoHuuHan(c.tyTrong) || c.tyTrong < 0) {
          loi.push(taoThongBao('loi', 'TY_TRONG_SAI', 'Tỷ trọng của ' + t.taiKhoan + ' ở chỉ số ' + c.chiSo + ' không hợp lệ', { taiKhoan: t.taiKhoan, chiSo: c.chiSo }, 'km:' + k));
          hopLe = false;
        } else {
          tong += c.tyTrong;
        }
      });
      if (hopLe && Math.abs(tong - 1) > 1e-9) {
        loi.push(taoThongBao('loi', 'TONG_TY_TRONG',
          'Tổng tỷ trọng của ' + t.taiKhoan + ' là ' + (Math.round(tong * 10000) / 100) + '%, phải bằng 100%',
          { taiKhoan: t.taiKhoan, tong: tong }, 'km:' + k));
      }
    }
  });
}

function kiemTraHeSoChia(config, loi) {
  var tvCo = {};
  (config.thanhVien || []).forEach(function (t) { tvCo[chuanHoaKhoa(t.taiKhoan)] = true; });
  var nhom = {}, daCo = {};
  (config.heSoChia || []).forEach(function (h) {
    var nguonHopLe = NGUON_POINT.indexOf(h.nguon) >= 0;
    var kv = chuanHoaKhoa(h.khuVuc);
    if (!nguonHopLe || !kv) {
      loi.push(taoThongBao('loi', 'HE_SO_SAI', 'Dòng hệ số chia có nguồn hoặc khu vực không hợp lệ', { nguon: h.nguon, khuVuc: h.khuVuc }, 'toanBo'));
      return;
    }
    var chan = chanNguon(h.nguon, h.khuVuc);
    var tk = chuanHoaKhoa(h.taiKhoan);
    if (!tvCo[tk]) {
      loi.push(taoThongBao('loi', 'HE_SO_TAI_KHOAN_LA', 'Hệ số chia tham chiếu tài khoản không có trong danh sách: ' + h.taiKhoan,
        { nguon: h.nguon, khuVuc: h.khuVuc, taiKhoan: h.taiKhoan }, chan));
    }
    if (!laSoHuuHan(h.heSo) || h.heSo < 0 || h.heSo > 1) {
      loi.push(taoThongBao('loi', 'HE_SO_SAI', 'Hệ số chia của ' + h.taiKhoan + ' phải nằm trong [0, 1]',
        { nguon: h.nguon, khuVuc: h.khuVuc, taiKhoan: h.taiKhoan }, chan));
      return;
    }
    var kk = chan + ':' + tk;
    if (daCo[kk]) {
      loi.push(taoThongBao('loi', 'HE_SO_TRUNG', 'Hệ số chia bị khai báo hai lần cho ' + h.taiKhoan,
        { nguon: h.nguon, khuVuc: h.khuVuc, taiKhoan: h.taiKhoan }, chan));
    }
    daCo[kk] = true;
    nhom[chan] = (nhom[chan] || 0) + h.heSo;
  });
  Object.keys(nhom).forEach(function (chan) {
    if (Math.abs(nhom[chan] - 1) > SAI_SO_TONG_HE_SO) {
      var p = chan.split(':');
      loi.push(taoThongBao('loi', 'TONG_HE_SO',
        'Tổng hệ số chia của nguồn ' + p[1] + ' ở khu vực ' + p[2] + ' là ' + (Math.round(nhom[chan] * 10000) / 10000) + ', phải bằng 1',
        { nguon: p[1], khuVuc: p[2], tong: nhom[chan] }, chan));
    }
  });
}

// Trả về {loi, canhBao}. Mỗi phần tử có `chan` cho biết phạm vi bị chặn.
function kiemTraCauHinh(config) {
  var loi = [], canhBao = [];
  if (!config || typeof config !== 'object') {
    return { loi: [taoThongBao('loi', 'THIEU_CAU_HINH', 'Không có cấu hình', {}, 'toanBo')], canhBao: [] };
  }
  kiemTraThamSo(config, loi);
  kiemTraBang(config, loi);
  kiemTraBacThang(config, loi);
  kiemTraChiSo(config, loi);
  kiemTraQuyDoi(config, loi, canhBao);
  kiemTraThanhVien(config, loi);
  kiemTraHeSoChia(config, loi);
  return { loi: loi, canhBao: canhBao };
}

function coLoiToanBo(ketQuaKiemTra) {
  return ketQuaKiemTra.loi.some(function (l) { return l.chan === 'toanBo'; });
}

function biChan(loi, chan) {
  return loi.some(function (l) { return l.chan === chan; });
}

// Dựng chỉ mục tra cứu nhanh, khoá đã chuẩn hoá. Chỉ gọi khi cấu hình không có lỗi toàn bộ.
function dungChiMuc(config) {
  var idx = { bac: {}, nhom: {}, maHang: {}, viec: {}, chiSo: {}, heSo: {}, thanhVien: {}, thuTuThanhVien: [] };
  config.bac.forEach(function (b) { idx.bac[String(b.bac)] = b; });
  config.nhomThietBi.forEach(function (n) { idx.nhom[chuanHoaKhoa(n.nhom)] = n; });
  config.maHang.forEach(function (m) { idx.maHang[chuanHoaKhoa(m.ma)] = m; });
  config.viecQuanLyKho.forEach(function (v) { idx.viec[chuanHoaKhoa(v.loai)] = v; });
  config.chiSo.forEach(function (c) { idx.chiSo[chuanHoaKhoa(c.id)] = c; });
  config.thanhVien.forEach(function (t) {
    idx.thanhVien[chuanHoaKhoa(t.taiKhoan)] = t;
    idx.thuTuThanhVien.push(chuanHoaKhoa(t.taiKhoan));
  });
  (config.heSoChia || []).forEach(function (h) {
    var chan = chanNguon(h.nguon, h.khuVuc);
    if (!idx.heSo[chan]) idx.heSo[chan] = {};
    idx.heSo[chan][chuanHoaKhoa(h.taiKhoan)] = h.heSo;
  });
  idx.bacThang = config.bacThangThuong.slice().sort(function (a, b) { return a.tu - b.tu; });
  return idx;
}

// Người có hệ số ở nguồn và khu vực này hay không (nguồn áp dụng cho người đó).
function coHeSo(idx, nguon, khuVuc, taiKhoan) {
  var m = idx.heSo[chanNguon(nguon, khuVuc)];
  return !!m && Object.prototype.hasOwnProperty.call(m, chuanHoaKhoa(taiKhoan));
}
