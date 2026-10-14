// Các bảng nhập tay của một kỳ và việc lắp chúng thành dữ liệu kỳ cho lõi (spec period-data-entry). Hàm thuần.
//
// Nguyên tắc: ô TRỐNG khác số 0. Giá trị không hợp lệ (chữ, âm, thiếu loại việc...) được chuyển nguyên dạng thô cho
// lõi để lõi chặn đúng người hoặc nguồn bị ảnh hưởng, đồng thời có một lỗi riêng nêu tab, dòng, cột. Thông báo trùng
// của lõi cho cùng dòng sẽ được bỏ ở bước điều phối (chiTiet.nguon, chiSoDong, thay).

function laDoiTuongNgay(v) {
  return v !== null && typeof v === 'object' && typeof v.getFullYear === 'function' && typeof v.getMonth === 'function';
}

function loiChanToanBo(ma, tenTab, soDong, tenCot, thongDiep) {
  var l = loiNhapLieu(ma, tenTab, soDong, tenCot, thongDiep);
  l.chan = 'toanBo';
  return l;
}

// ---- Kỳ: ô tháng ----------------------------------------------------------------------------
function chuoiHaiChuSo(n) { return (n < 10 ? '0' : '') + n; }

// Trả {ky: {thang, tuNgay, denNgay}} hoặc {ky: null, loi}.
function docKy(cacTab) {
  var T = TEN_TAB;
  var loi = [];
  var b = docBangTheoTieuDe(cacTab, T.ky, TIEU_DE.ky, [], loi);
  if (!b) return { ky: null, loi: loi };
  var dong = b.dong.filter(function (d) { return chuanHoaKhoa(d['Mục']) === 'tháng'; })[0];
  if (!dong || laTrong(dong['Giá trị'])) {
    loi.push(loiChanToanBo('KY_THIEU', T.ky, dong ? dong._dong : null, 'Giá trị', 'Chưa chọn tháng của kỳ, hãy nhập dạng năm-tháng (ví dụ 2026-09) vào ô "Giá trị" của dòng "Tháng"'));
    return { ky: null, loi: loi };
  }
  var v = dong['Giá trị'];
  var nam = null, thang = null;
  if (laDoiTuongNgay(v)) { nam = v.getFullYear(); thang = v.getMonth() + 1; }
  else if (oLaChu(v)) {
    var m = /^\s*(\d{4})-(\d{1,2})\s*$/.exec(v);
    if (m) { nam = Number(m[1]); thang = Number(m[2]); }
  }
  if (nam === null || thang < 1 || thang > 12) {
    loi.push(loiChanToanBo('KY_SAI', T.ky, dong._dong, 'Giá trị', 'Tháng "' + v + '" không đúng dạng năm-tháng (ví dụ 2026-09)'));
    return { ky: null, loi: loi };
  }
  return { ky: { thang: nam + '-' + chuoiHaiChuSo(thang), tuNgay: chuoiNgayISO(nam, thang, 1), denNgay: chuoiNgayISO(nam, thang, soNgayTrongThang(nam, thang)) }, loi: loi };
}

// ---- Bảo hành và hỗ trợ sale theo khu vực -------------------------------------------------------
// maKhuVuc: danh sách khu vực của cấu hình. Ô trống → không có khoá (thiếu); số 0 → 0.
function docBaoHanhHoTroSale(cacTab, maKhuVuc) {
  var T = TEN_TAB;
  var loi = [], baoHanh = {}, hoTroSale = {};
  var b = docBangTheoTieuDe(cacTab, T.baoHanhHoTroSale, TIEU_DE.baoHanhHoTroSale, [], loi);
  if (!b) return { baoHanh: baoHanh, hoTroSale: hoTroSale, loi: loi.map(function (l) { l.chan = 'nhapLieu'; return l; }) };
  var daCo = {};
  b.dong.forEach(function (d) {
    var kv = laTrong(d['Khu vực']) ? null : String(d['Khu vực']).trim();
    if (kv === null) { loi.push(loiNhapLieu('KHU_VUC_TRONG', T.baoHanhHoTroSale, d._dong, 'Khu vực', 'Dòng có số liệu nhưng thiếu khu vực')); return; }
    var chuan = (maKhuVuc || []).filter(function (m) { return cungKhoa(m, kv); })[0];
    if (!chuan) {
      loi.push(loiNhapLieu('KHU_VUC_LA', T.baoHanhHoTroSale, d._dong, 'Khu vực', 'Khu vực "' + kv + '" không có trong cấu hình (tab ' + T.khuVuc + ')'));
      return;
    }
    if (daCo[chuanHoaKhoa(chuan)]) {
      loi.push(loiNhapLieu('KHU_VUC_TRUNG', T.baoHanhHoTroSale, d._dong, 'Khu vực', 'Khu vực "' + chuan + '" đã khai báo ở dòng ' + daCo[chuanHoaKhoa(chuan)]));
      return;
    }
    daCo[chuanHoaKhoa(chuan)] = d._dong;
    [['Số ca bảo hành', baoHanh, 'baoHanh'], ['Số đơn hỗ trợ sale', hoTroSale, 'hoTroSale']].forEach(function (x) {
      var raw = d[x[0]];
      if (laTrong(raw)) return; // chưa có số liệu
      var s = soThat(raw);
      if (!s.hopLe || s.giaTri < 0) {
        loi.push(loiNhapLieu('SO_LUONG_SAI', T.baoHanhHoTroSale, d._dong, x[0],
          s.hopLe ? 'Số không được âm' : 'Ô phải là số, hiện là văn bản "' + raw + '"', { nguon: x[2], khuVuc: chuan, thay: ['SO_LUONG_SAI'] }));
      }
      x[1][chuan] = s.hopLe ? s.giaTri : raw; // giữ nguyên giá trị thô để lõi chặn nguồn đó
    });
  });
  return { baoHanh: baoHanh, hoTroSale: hoTroSale, loi: loi };
}

// ---- Nhật ký công việc --------------------------------------------------------------------------
// Trả {nhatKy, viTri: [số dòng của từng phần tử], loi}. Dòng trống hoàn toàn bị bỏ.
function docNhatKyCongViec(cacTab) {
  var T = TEN_TAB;
  var loi = [], nhatKy = [], viTriDong = [];
  var b = docBangTheoTieuDe(cacTab, T.nhatKyCongViec, TIEU_DE.nhatKyCongViec, [], loi);
  if (!b) return { nhatKy: nhatKy, viTri: viTriDong, loi: loi.map(function (l) { l.chan = 'nhapLieu'; return l; }) };
  b.dong.forEach(function (d) {
    var tk = laTrong(d['Tài khoản']) ? '' : String(d['Tài khoản']).trim();
    var loai = laTrong(d['Loại việc']) ? '' : String(d['Loại việc']).trim();
    var raw = d['Số lượng'];
    var s = soThat(raw);
    var chiSo = nhatKy.length;
    var thieu = [];
    if (tk === '') thieu.push('Tài khoản');
    if (loai === '') thieu.push('Loại việc');
    thieu.forEach(function (cot) {
      loi.push(loiNhapLieu('NHAT_KY_THIEU', T.nhatKyCongViec, d._dong, cot, 'Dòng nhật ký thiếu "' + cot + '", dòng này không được bỏ qua âm thầm',
        { nguon: 'nhatKy', chiSoDong: chiSo, thay: cot === 'Tài khoản' ? ['TAI_KHOAN_LA'] : ['LOAI_VIEC_LA'] }));
    });
    if (s.trong) {
      loi.push(loiNhapLieu('NHAT_KY_THIEU', T.nhatKyCongViec, d._dong, 'Số lượng', 'Dòng nhật ký thiếu "Số lượng" (nhập 0 nếu không phát sinh)',
        { nguon: 'nhatKy', chiSoDong: chiSo, thay: ['SO_LUONG_SAI'] }));
    } else if (!s.hopLe || s.giaTri < 0) {
      loi.push(loiNhapLieu('SO_LUONG_SAI', T.nhatKyCongViec, d._dong, 'Số lượng',
        s.hopLe ? 'Số lượng không được âm' : 'Ô phải là số, hiện là văn bản "' + raw + '"', { nguon: 'nhatKy', chiSoDong: chiSo, thay: ['SO_LUONG_SAI'] }));
    }
    // Mô tả chỉ để người đọc: không đi vào dữ liệu kỳ, kết quả hay log.
    nhatKy.push({ taiKhoan: tk, loai: loai, soLuong: s.trong ? null : (s.hopLe ? s.giaTri : raw) });
    viTriDong.push(d._dong);
  });
  return { nhatKy: nhatKy, viTri: viTriDong, loi: loi };
}

// ---- Key metrics --------------------------------------------------------------------------------
// idsChiSo: các mã chỉ số của cấu hình (để cảnh báo dòng dùng chỉ số không có trong cấu hình).
function docKeyMetrics(cacTab, idsChiSo) {
  var T = TEN_TAB;
  var loi = [], canhBao = [];
  var b = docBangTheoTieuDe(cacTab, T.keyMetrics, TIEU_DE.keyMetrics, [], loi);
  if (!b) return { keyMetrics: [], loi: loi.map(function (l) { l.chan = 'nhapLieu'; return l; }), canhBao: canhBao };
  var ung = [];
  b.dong.forEach(function (d) {
    var cs = laTrong(d['Chỉ số']) ? null : String(d['Chỉ số']).trim();
    var khoa = laTrong(d['Khoá']) ? null : String(d['Khoá']).trim();
    var ok = true;
    if (cs === null) { loi.push(loiNhapLieu('O_TRONG', T.keyMetrics, d._dong, 'Chỉ số', 'Thiếu chỉ số')); ok = false; }
    if (khoa === null) { loi.push(loiNhapLieu('O_TRONG', T.keyMetrics, d._dong, 'Khoá', 'Thiếu khoá (tên nhóm, khu vực hoặc tài khoản)')); ok = false; }
    var cap = null;
    if (laTrong(d['Cấp độ']) || NHAN_CAP_DO[chuanHoaKhoa(d['Cấp độ'])] === undefined) {
      loi.push(loiNhapLieu('CAP_DO_SAI', T.keyMetrics, d._dong, 'Cấp độ',
        'Cấp độ "' + (laTrong(d['Cấp độ']) ? '' : d['Cấp độ']) + '" không hợp lệ, chỉ nhận: Nhóm, Khu vực, Tài khoản'));
      ok = false;
    } else cap = NHAN_CAP_DO[chuanHoaKhoa(d['Cấp độ'])];
    if (!ok) return;
    if (idsChiSo && !idsChiSo.some(function (i) { return cungKhoa(i, cs); })) {
      var w = loiNhapLieu('CHI_SO_LA', T.keyMetrics, d._dong, 'Chỉ số', 'Chỉ số "' + cs + '" không có trong cấu hình, dòng này bị bỏ qua');
      w.muc = 'canhBao'; w.chan = null;
      canhBao.push(w);
      return;
    }
    var dong = { chiSo: cs, capDo: cap, khoa: khoa, mucTieu: null, ketQua: null, _dong: d._dong };
    [['Mục tiêu', 'mucTieu'], ['Kết quả', 'ketQua']].forEach(function (x) {
      var raw = d[x[0]];
      if (laTrong(raw)) return;
      var s = soThat(raw);
      if (!s.hopLe) loi.push(loiNhapLieu('O_SO_SAI', T.keyMetrics, d._dong, x[0], 'Ô phải là số, hiện là văn bản "' + raw + '"'));
      dong[x[1]] = s.hopLe ? s.giaTri : raw; // giữ nguyên để lõi chặn người liên quan
    });
    ung.push(dong);
  });
  // Khai báo trùng (cùng chỉ số, cấp độ, khoá): không chọn bừa, bỏ cả hai để người liên quan thành "thiếu".
  var nhom = gomTheoKhoa(ung, function (x) { return x.chiSo + '|' + x.capDo + '|' + x.khoa; });
  var giu = [];
  Object.keys(nhom).forEach(function (k) {
    var ds = nhom[k];
    if (ds.length === 1) { giu.push(ds[0]); return; }
    loi.push(loiNhapLieu('KEY_METRICS_TRUNG', T.keyMetrics, null, null,
      'Chỉ số "' + ds[0].chiSo + '" ở cấp ' + ds[0].capDo + ' khoá "' + ds[0].khoa + '" được khai báo ở các dòng ' + ds.map(function (x) { return x._dong; }).join(', ') +
      ', không chọn bừa nên bỏ cả hai', { dong: ds.map(function (x) { return x._dong; }) }));
  });
  giu.sort(function (a, b2) { return a._dong - b2._dong; });
  return { keyMetrics: giu.map(function (g) { return { chiSo: g.chiSo, capDo: g.capDo, khoa: g.khoa, mucTieu: g.mucTieu, ketQua: g.ketQua }; }), loi: loi, canhBao: canhBao };
}

// ---- Xác nhận báo cáo chỉ phủ một phần kỳ --------------------------------------------------------
function docXacNhanBaoCao(cacTab, maKhuVuc) {
  var T = TEN_TAB;
  var loi = [], xacNhan = {};
  var b = docBangTheoTieuDe(cacTab, T.xacNhanBaoCao, TIEU_DE.xacNhanBaoCao, [], loi);
  if (!b) return { xacNhan: xacNhan, loi: loi.map(function (l) { l.chan = 'nhapLieu'; return l; }) };
  b.dong.forEach(function (d) {
    var kv = laTrong(d['Khu vực']) ? null : String(d['Khu vực']).trim();
    if (kv === null) return;
    var chuan = (maKhuVuc || []).filter(function (m) { return cungKhoa(m, kv); })[0];
    if (!chuan) { loi.push(loiNhapLieu('KHU_VUC_LA', T.xacNhanBaoCao, d._dong, 'Khu vực', 'Khu vực "' + kv + '" không có trong cấu hình')); return; }
    var v = d['Xác nhận'];
    var dung = v === true || (oLaChu(v) && chuanHoaKhoa(v) === 'true');
    var sai = v === false || (oLaChu(v) && chuanHoaKhoa(v) === 'false');
    if (!dung && !sai) { loi.push(loiNhapLieu('O_LOGIC_SAI', T.xacNhanBaoCao, d._dong, 'Xác nhận', 'Ô phải là TRUE hoặc FALSE')); return; }
    if (dung) xacNhan[chuan] = true;
  });
  return { xacNhan: xacNhan, loi: loi };
}

// ---- Lắp thành dữ liệu kỳ cho lõi --------------------------------------------------------------
// Trả {duLieuKy, viTri, loi, canhBao}. duLieuKy = null khi chưa xác định được kỳ (lỗi chặn toàn bộ).
function lapDuLieuKy(cacTab, cauHinh) {
  var maKv = (cauHinh.khuVuc || []).map(function (k) { return k.ma; });
  var ids = (cauHinh.chiSo || []).map(function (c) { return c.id; });
  var loi = [], canhBao = [];
  var ky = docKy(cacTab);
  loi.push.apply(loi, ky.loi);
  var bc = docMoiBaoCao(cacTab, cauHinh.khuVuc);
  var bh = docBaoHanhHoTroSale(cacTab, maKv);
  var nk = docNhatKyCongViec(cacTab);
  var km = docKeyMetrics(cacTab, ids);
  var xn = docXacNhanBaoCao(cacTab, maKv);
  [bc, bh, nk, km, xn].forEach(function (x) { loi.push.apply(loi, x.loi); if (x.canhBao) canhBao.push.apply(canhBao, x.canhBao); });
  return {
    duLieuKy: ky.ky ? { ky: ky.ky, kiemKe: bc.kiemKe, baoHanh: bh.baoHanh, hoTroSale: bh.hoTroSale, nhatKy: nk.nhatKy,
      keyMetrics: km.keyMetrics, xacNhanBaoCaoMotPhan: xn.xacNhan } : null,
    viTri: { kiemKe: bc.viTri, nhatKy: nk.viTri },
    loi: loi,
    canhBao: canhBao
  };
}
