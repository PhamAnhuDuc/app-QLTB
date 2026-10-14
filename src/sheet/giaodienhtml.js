// Trang HTML của bảng điều khiển (spec control-panel-ui). Hàm thuần: chỉ trả về chuỗi, không gọi API Apps Script.
//
// An toàn:
//   - Mã chạy trên trình duyệt (maKhachGiaoDien) chỉ dựng giao diện bằng createElement và textContent. TUYỆT ĐỐI không dùng
//     innerHTML hay các cách đưa chuỗi dữ liệu thành mã HTML, nên tên, thông điệp lỗi, lý do... chứa thẻ hay mã đều chỉ hiện như chữ.
//   - Không tải gì từ bên ngoài (phông, kiểu, mã, ảnh) và không gọi mạng; mọi kiểu và mã nằm trong chính trang.
//   - Chỉ gọi các hàm máy chủ trong danh sách cố định HAM_GOI_DUOC (khớp HAM_MAY_CHU_GIAO_DIEN ở giaodien.js).
//
// maKhachGiaoDien nhận document và google từ bên ngoài để kiểm thử được bằng DOM giả trong Node; trong trang nó được gọi
// như (function)(document, google). Hàm được nhúng vào trang bằng toString nên phải tự đủ, không dùng biến toàn cục của mã máy chủ.

var CSS_GIAO_DIEN =
  ':root{--xanh:#007AFF;--xanh-dam:#0F1437;--xanh-nhat:#F0F4F9;--luc:#16D865;--vang:#FFAE06;--do:#C0392B;--vien:#D5DCE6;--chu-phu:#5B6478}' +
  '*{box-sizing:border-box}' +
  'body{margin:0;background:#F0F4F9;color:#0F1437;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:14px;line-height:1.45}' +
  '#goc{padding:16px 20px}' +
  '.dau{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px}' +
  '.dau h1{font-size:18px;margin:0;font-weight:600}' +
  '.chip{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;background:#E3E8F0;color:#0F1437;margin:1px 4px 1px 0}' +
  '.chip-xanh{background:#D8F8E5;color:#0A6B35}.chip-vang{background:#FFF1CC;color:#7A5200}.chip-do{background:#FBE0DC;color:#8E2A1F}.chip-duong{background:#DCEBFF;color:#004FA4}' +
  '.an{display:none}' +
  '.dieu-huong{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}' +
  '.nut{border:1px solid #007AFF;background:#fff;color:#007AFF;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer}' +
  '.nut:disabled{opacity:.45;cursor:not-allowed}' +
  '.nut-chinh{background:#007AFF;color:#fff}.nut-nho{padding:3px 10px;font-size:12px}' +
  '.nut-dieu-huong{border-color:#D5DCE6;color:#0F1437}.nut-dieu-huong.dang-chon{background:#007AFF;border-color:#007AFF;color:#fff}' +
  '.nut-chu{border:0;background:none;color:#007AFF;padding:0;font-size:inherit;cursor:pointer;text-align:left}' +
  '.the{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px}' +
  '.the h2{font-size:15px;margin:0 0 8px;font-weight:600}.the h3{font-size:13px;margin:10px 0 4px;font-weight:600}' +
  '.hang-tren{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}.hang-tren h2{margin:0}' +
  '.luoi{display:flex;gap:12px;flex-wrap:wrap}.o-so{flex:1 1 180px}' +
  '.o-so .nhan{color:#5B6478;font-size:12px}.o-so .so{font-size:20px;font-weight:600}' +
  'table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #E3E8F0;vertical-align:top}' +
  'th{font-weight:600;color:#5B6478;font-size:12px}td.so,th.so{text-align:right;white-space:nowrap}' +
  'tr.tong td{font-weight:600;background:#F7F9FC}' +
  '.thong-bao{padding:8px 12px;border-radius:8px;margin-bottom:10px}' +
  '.thong-bao-loi{background:#FBE0DC;color:#8E2A1F}.thong-bao-ok{background:#D8F8E5;color:#0A6B35}.thong-bao-canh{background:#FFF1CC;color:#7A5200}' +
  '.rong{text-align:center;color:#5B6478;padding:28px 10px}.rong p{margin:0 0 12px}' +
  '.phu{color:#5B6478;font-size:12px}' +
  '.lop-phu{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(15,20,55,.45);display:flex;align-items:center;justify-content:center;z-index:10}' +
  '.lop-tren{z-index:20}' +
  '.hop{background:#fff;border-radius:12px;padding:18px 20px;width:420px;max-width:92%;max-height:92%;overflow:auto}.hop h2{margin:0 0 8px;font-size:16px}' +
  '.hop-rong{width:680px}' +
  '.hop .hang-nut{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}' +
  '.hop textarea{width:100%;min-height:70px;font:inherit;padding:6px;border:1px solid #D5DCE6;border-radius:8px}' +
  '.hop .vung-dan{min-height:180px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}' +
  '.xac-nhan{display:flex;gap:8px;align-items:flex-start;padding:4px 0}' +
  '.chon-ky{font:inherit;padding:4px 8px;border:1px solid #D5DCE6;border-radius:8px;background:#fff}' +
  '.thanh{background:#E3E8F0;border-radius:999px;height:8px;width:140px;overflow:hidden}.thanh-day{background:#16D865;height:8px}.thanh-day.thap{background:#FFAE06}' +
  '.o-thanh{display:flex;align-items:center;gap:8px}' +
  '.bo-soan td input,.bo-soan td select{font:inherit;width:100%;min-width:70px;padding:3px 6px;border:1px solid #D5DCE6;border-radius:6px;background:#fff}' +
  '.bo-soan td.nho{width:1%;white-space:nowrap}' +
  '.chon-bang{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}' +
  '.ds-buoc{margin:6px 0 0;padding-left:20px}.ds-buoc li{margin:3px 0}';

function maKhachGiaoDien(doc, gg) {
  // Danh sách cố định các hàm máy chủ được gọi. Mọi tên khác bị từ chối ngay ở trang.
  var HAM_GOI_DUOC = ['giaoDienLayMoHinh', 'giaoDienTinh', 'giaoDienDuyet', 'giaoDienMoLai', 'giaoDienLichSu', 'giaoDienMoTab', 'giaoDienDocBang', 'giaoDienLuuBang', 'giaoDienKhoiPhucMacDinh', 'giaoDienDatKy', 'giaoDienNhapBaoCao'];
  var MAN = [['tongquan', 'Tổng quan'], ['nhappoint', 'Nhập point'], ['nhapkm', 'Nhập key metrics'], ['ketqua', 'Kết quả'], ['duyet', 'Duyệt và lưu'], ['lichsu', 'Lịch sử'], ['cauhinh', 'Cấu hình']];
  var BANG_CAU_HINH = ['thamSo', 'bac', 'bacThang', 'chiSo', 'nhomThietBi', 'maHang', 'viecQuanLyKho', 'heSoChia', 'khuVuc', 'thanhVien'];
  var NHAN_BANG_NGAN = { thamSo: 'Thông số', bac: 'Bậc', bacThang: 'Bậc thang thưởng', chiSo: 'Chỉ số', nhomThietBi: 'Nhóm thiết bị', maHang: 'Mã hàng', viecQuanLyKho: 'Việc quản lý kho',
    heSoChia: 'Hệ số chia', khuVuc: 'Khu vực', thanhVien: 'Thành viên' };
  var GIOI_HAN_TEP = 5000000;

  var tt = { man: 'tongquan', moHinh: null, dangChay: false, dangTai: true, loi: null, ok: null, xacNhan: {}, hop: null, lyDoMoLai: '',
    bang: {}, bangCauHinh: 'thamSo', tvMo: null, nhap: null, khopTab: false };
  var hangDoi = [], canTai = [];
  var goc = doc.getElementById('goc');

  // ---- dựng phần tử: CHỈ createElement và textContent ----
  function h(the, lop, noiDung) {
    var e = doc.createElement(the);
    if (lop) e.className = lop;
    if (noiDung !== undefined && noiDung !== null) e.textContent = String(noiDung);
    return e;
  }
  function them(cha) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) cha.appendChild(arguments[i]);
    return cha;
  }
  function nut(nhan, lop, khiBam, tatNut) {
    var b = h('button', 'nut ' + (lop || ''), nhan);
    b.setAttribute('type', 'button');
    if (tatNut) { b.disabled = true; b.setAttribute('disabled', 'disabled'); }
    else b.addEventListener('click', khiBam);
    return b;
  }
  // Nút có thể bật tắt sau khi dựng (bộ soạn bảng): luôn gắn xử lý, trình duyệt không phát click khi nút bị vô hiệu.
  function nutDong(nhan, lop, khiBam) {
    var b = h('button', 'nut ' + (lop || ''), nhan);
    b.setAttribute('type', 'button');
    b.addEventListener('click', khiBam);
    return b;
  }
  function sao(x) { return JSON.parse(JSON.stringify(x)); }

  // ---- định dạng hiển thị ----
  function nhomNghin(n) {
    var s = String(Math.abs(Math.round(n)));
    var ra = '';
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) ra += '.';
      ra += s.charAt(i);
    }
    return (n < 0 ? '-' : '') + ra;
  }
  function tien(n) { return n === null || n === undefined ? '—' : nhomNghin(n) + 'đ'; }
  function phanTram(x, soLe) { return x === null || x === undefined ? '—' : (x * 100).toFixed(soLe).replace('.', ',') + '%'; }
  function so(x) { return x === null || x === undefined ? '—' : String(Math.round(x * 100) / 100).replace('.', ','); }
  function so4(x) { return x === null || x === undefined ? '—' : String(Math.round(x * 10000) / 10000).replace('.', ','); }
  function chuoiO(v) { return v === null || v === undefined ? '' : v === true ? 'TRUE' : v === false ? 'FALSE' : String(v); }

  // ---- gọi máy chủ (một yêu cầu tại một thời điểm; yêu cầu đến sau xếp hàng) ----
  function goiMayChu(ten, thamSo, khiXong, giuThongBao) {
    if (HAM_GOI_DUOC.indexOf(ten) < 0) throw new Error('Hàm máy chủ không được phép: ' + ten);
    if (tt.dangChay) { hangDoi.push([ten, thamSo, khiXong, giuThongBao]); return; }
    batDauGoi(ten, thamSo, khiXong, giuThongBao);
  }
  function batDauGoi(ten, thamSo, khiXong, giuThongBao) {
    tt.dangChay = true;
    if (!giuThongBao) { tt.loi = null; tt.ok = null; }
    ve();
    var chay = gg.script.run
      .withSuccessHandler(function (kq) { ketThucGoi(function () { khiXong(kq); }); })
      .withFailureHandler(function (e) { ketThucGoi(function () { tt.loi = 'Có lỗi khi chạy: ' + (e && e.message ? e.message : String(e)); }); });
    chay[ten].apply(chay, thamSo);
  }
  function ketThucGoi(xuLy) {
    tt.dangChay = false; tt.dangTai = false;
    try { xuLy(); } catch (e) { tt.loi = 'Lỗi xử lý kết quả: ' + e.message; }
    var tiep = hangDoi.shift();
    if (tiep) batDauGoi(tiep[0], tiep[1], tiep[2], tiep[3]); else ve();
  }
  function capNhatMoHinh(m, khopTab) { if (m) { tt.moHinh = m; if (khopTab !== undefined) tt.khopTab = khopTab; } }
  function lyDoThanhChuoi(ds) { return (ds || []).map(function (l) { return l.thongDiep; }).join(' '); }

  // ---- thành phần dùng chung ----
  function thongBao() {
    var cha = h('div');
    if (tt.loi) them(cha, h('div', 'thong-bao thong-bao-loi', tt.loi));
    if (tt.ok) them(cha, h('div', 'thong-bao thong-bao-ok', tt.ok));
    var m = tt.moHinh;
    if (m && m.chiaSe && m.chiaSe.mucDo !== 'on' && m.chiaSe.thongDiep) {
      them(cha, h('div', 'thong-bao ' + (m.chiaSe.mucDo === 'chan' ? 'thong-bao-loi' : 'thong-bao-canh'), m.chiaSe.thongDiep));
    }
    return cha;
  }
  function chayTinh(thongDiepOk) {
    goiMayChu('giaoDienTinh', [], function (r) {
      if (!r.ok) { tt.loi = r.thongDiep; return; }
      capNhatMoHinh(r.moHinh, true);
      if (r.moHinh.trangThaiDuLieu === 'chan') tt.loi = 'Không tính được, xem lỗi ở màn Kết quả.';
      else tt.ok = thongDiepOk || 'Đã tính xong. Kết quả là đề xuất chờ bạn duyệt.';
    });
  }
  function trangRong(lyDo, nhanNut, khiBam) {
    var d = h('div', 'rong');
    them(d, h('p', '', lyDo));
    if (nhanNut) them(d, nut(nhanNut, 'nut-chinh', khiBam, tt.dangChay));
    return d;
  }
  function nutTinh(nhan) { return nut(nhan || 'Tính kỳ', 'nut-chinh', function () { chayTinh(); }, tt.dangChay); }
  function theTomTat(nhan, giaTri) {
    var o = h('div', 'o-so');
    them(o, h('div', 'nhan', nhan), h('div', 'so', giaTri));
    return o;
  }
  function bang(tieuDe, hang) {
    var t = h('table'), dau = h('tr');
    tieuDe.forEach(function (x) { them(dau, h('th', x.so ? 'so' : '', x.ten)); });
    them(t, dau);
    hang.forEach(function (r) { them(t, r); });
    return t;
  }
  function dongBang(cacO, lop) {
    var tr = h('tr', lop || '');
    cacO.forEach(function (o) { them(tr, h('td', o.so ? 'so' : '', o.v)); });
    return tr;
  }
  function chipTrangThai(tien_to, trangThai) {
    var nhan = trangThai === 'du' ? 'đủ' : trangThai === 'thieu' ? 'thiếu' : trangThai === 'khongApDung' ? 'không áp dụng' : trangThai ? 'bị chặn' : 'chưa rõ';
    var lop = trangThai === 'du' ? 'chip-xanh' : trangThai === 'thieu' ? 'chip-vang' : trangThai === 'khongApDung' || !trangThai ? '' : 'chip-do';
    return h('span', 'chip ' + lop, tien_to + ': ' + nhan);
  }
  function thanhTienDo(phanTramHT) {
    var o = h('div', 'o-thanh'), thanh = h('div', 'thanh'), day = h('div', 'thanh-day' + (phanTramHT < 1 ? ' thap' : ''));
    var rong = Math.max(0, Math.min(100, Math.round(phanTramHT * 100)));
    day.setAttribute('style', 'width:' + rong + '%');
    them(thanh, day);
    return them(o, thanh, h('span', '', phanTram(phanTramHT, 1)));
  }

  // ---- bộ soạn bảng dùng chung ----
  function taiBang(khoa) {
    var b = tt.bang[khoa];
    if (!b) { b = tt.bang[khoa] = { khoa: khoa, trangThai: 'cho', nhan: khoa, dong: [], goc: [], loi: [], canhBao: [], khoaGhi: null }; canTai.push(khoa); }
    return b;
  }
  function khoiDongTai() {
    while (canTai.length > 0) {
      var khoa = canTai.shift(), b = tt.bang[khoa];
      if (!b || b.trangThai !== 'cho') continue;
      b.trangThai = 'dang';
      (function (b2) {
        goiMayChu('giaoDienDocBang', [b2.khoa], function (r) {
          if (!r.ok) { b2.trangThai = 'loi'; b2.loiTai = lyDoThanhChuoi(r.lyDo); return; }
          var x = r.bang;
          b2.trangThai = 'san'; b2.nhan = x.nhan; b2.nhom = x.nhom; b2.tieuDe = x.tieuDe; b2.kieuCot = x.kieuCot; b2.luaChon = x.luaChon || {};
          b2.coMacDinh = !!x.coMacDinh; b2.khoaGhi = x.khoaGhi || null;
          b2.goc = x.dong.map(function (d) { return d.map(chuoiO); }); b2.dong = sao(b2.goc);
        }, true);
      })(b);
    }
  }
  function biThayDoi(b) { return JSON.stringify(b.dong) !== JSON.stringify(b.goc); }

  function oNhap(b, i, j, cha) {
    var kieu = b.kieuCot[j], ds = b.luaChon[String(j)] || b.luaChon[j];
    var gt = b.dong[i][j], o;
    if (kieu === 'chon' || kieu === 'logic') {
      var cacGiaTri = kieu === 'logic' ? ['', 'TRUE', 'FALSE'] : [''].concat(ds || []);
      if (cacGiaTri.indexOf(gt) < 0) cacGiaTri.push(gt);
      o = h('select');
      cacGiaTri.forEach(function (v) { var op = h('option', '', v === '' ? '(trống)' : v); op.value = v; op.setAttribute('value', v); them(o, op); });
      o.value = gt;
    } else {
      o = h('input');
      o.setAttribute('type', 'text');
      o.value = gt;
      if (ds && ds.length > 0) {
        var id = 'ds-' + b.khoa + '-' + j;
        o.setAttribute('list', id);
        var dl = h('datalist');
        dl.setAttribute('id', id);
        ds.forEach(function (v) { var op = h('option'); op.value = v; op.setAttribute('value', v); them(dl, op); });
        them(cha, dl);
      }
    }
    o.setAttribute('aria-label', b.tieuDe[j]);
    var khiDoi = function () { b.dong[i][j] = o.value; if (b.capNhat) b.capNhat(); };
    o.addEventListener('input', khiDoi);
    o.addEventListener('change', khiDoi);
    return o;
  }

  function veBoSoan(khoa, tuyChon) {
    var b = taiBang(khoa), the = h('div', 'the bo-soan');
    if (b.trangThai === 'cho' || b.trangThai === 'dang') { them(the, h('div', 'phu', 'Đang tải bảng…')); return the; }
    if (b.trangThai === 'loi') { them(the, h('h2', '', khoa), h('div', 'thong-bao thong-bao-loi', b.loiTai)); return the; }
    var dau = h('div', 'hang-tren'), chip = h('span', 'chip chip-vang an', '');
    them(dau, h('h2', '', (tuyChon && tuyChon.tieuDe) || b.nhan), chip);
    var nutLuu = nutDong('Lưu', 'nut-chinh', function () { if (!nutLuu.disabled) luuBang(b); });
    var nutHuy = nutDong('Hủy thay đổi', '', function () { if (nutHuy.disabled) return; b.dong = sao(b.goc); b.loi = []; b.canhBao = []; ve(); });
    var nutThem = nutDong('Thêm dòng', 'nut-nho', function () {
      if (nutThem.disabled) return;
      b.dong.push(b.tieuDe.map(function () { return ''; })); ve();
    });
    b.capNhat = function () {
      var d = biThayDoi(b);
      chip.textContent = d ? 'Có thay đổi chưa lưu' : '';
      chip.className = d ? 'chip chip-vang' : 'chip chip-vang an';
      nutLuu.disabled = tt.dangChay || !!b.khoaGhi || !d;
      nutHuy.disabled = tt.dangChay || !d;
      nutThem.disabled = tt.dangChay || !!b.khoaGhi;
    };
    them(dau, nutThem, nutLuu, nutHuy);
    if (tuyChon && tuyChon.macDinh && b.coMacDinh) {
      them(dau, nut('Khôi phục mặc định', 'nut-nho', function () { khoiPhucMacDinh(b); }, tt.dangChay || !!b.khoaGhi));
    }
    them(the, dau);
    if (b.khoaGhi) them(the, h('div', 'thong-bao thong-bao-canh', b.khoaGhi.thongDiep));
    (b.loi || []).forEach(function (l) { them(the, h('div', 'thong-bao thong-bao-loi', l.thongDiep)); });
    (b.canhBao || []).forEach(function (l) { them(the, h('div', 'thong-bao thong-bao-canh', l.thongDiep)); });
    var hang = b.dong.map(function (d, i) {
      var tr = h('tr');
      d.forEach(function (_, j) { var td = h('td'); them(td, oNhap(b, i, j, td)); them(tr, td); });
      var oXoa = h('td', 'nho');
      them(oXoa, nut('Xoá', 'nut-nho', function () { b.dong.splice(i, 1); ve(); }, tt.dangChay || !!b.khoaGhi));
      return them(tr, oXoa);
    });
    if (hang.length === 0) them(the, h('div', 'phu', 'Bảng chưa có dòng nào. Bấm "Thêm dòng" để nhập.'));
    else them(the, bang(b.tieuDe.map(function (t) { return { ten: t }; }).concat([{ ten: '' }]), hang));
    b.capNhat();
    return the;
  }

  function luuBang(b) {
    tt.hop = { tieuDe: 'Lưu bảng "' + b.nhan + '"?',
      noiDung: 'Nội dung tab của bảng này sẽ được thay bằng bảng đang soạn. Nếu lưu nhầm, dùng Lịch sử phiên bản của Google Sheets để khôi phục.',
      khiDongY: function () {
        goiMayChu('giaoDienLuuBang', [b.khoa, sao(b.dong)], function (r) {
          b.canhBao = r.canhBao || [];
          if (r.daLuu) {
            b.dong = b.dong.filter(function (d) { return d.some(function (o) { return o !== ''; }); }); // máy chủ bỏ dòng trống hoàn toàn
            b.goc = sao(b.dong); b.loi = []; capNhatMoHinh(r.moHinh, false); tt.ok = 'Đã lưu bảng "' + b.nhan + '".'; }
          else { b.loi = r.lyDo || []; tt.loi = 'Không lưu được bảng "' + b.nhan + '". Xem lỗi ngay trên bảng; nội dung bạn đang soạn vẫn được giữ.'; }
        });
      } };
    ve();
  }
  function khoiPhucMacDinh(b) {
    tt.hop = { tieuDe: 'Khôi phục mặc định bảng "' + b.nhan + '"?',
      noiDung: 'Toàn bộ nội dung bảng này sẽ bị thay bằng giá trị mặc định. Các bảng khác không đổi.',
      khiDongY: function () {
        goiMayChu('giaoDienKhoiPhucMacDinh', [b.khoa], function (r) {
          if (r.daLuu) { delete tt.bang[b.khoa]; capNhatMoHinh(r.moHinh, false); tt.ok = 'Đã khôi phục mặc định bảng "' + b.nhan + '".'; }
          else { b.loi = r.lyDo || []; tt.loi = lyDoThanhChuoi(r.lyDo); }
        });
      } };
    ve();
  }

  // ---- ô chọn kỳ ----
  function oChonKy(m) {
    if (!m || !m.kyGoiY || m.kyGoiY.length === 0) return null;
    var sel = h('select', 'chon-ky');
    sel.setAttribute('aria-label', 'Chọn kỳ');
    m.kyGoiY.forEach(function (k) { var op = h('option', '', k); op.value = k; op.setAttribute('value', k); them(sel, op); });
    sel.value = m.thang || '';
    if (tt.dangChay) { sel.disabled = true; sel.setAttribute('disabled', 'disabled'); }
    sel.addEventListener('change', function () {
      var moi = sel.value;
      if (!moi || moi === m.thang) return;
      goiMayChu('giaoDienDatKy', [moi], function (r) {
        if (r.daLuu) { tt.bang = {}; tt.xacNhan = {}; tt.tvMo = null; capNhatMoHinh(r.moHinh, false); tt.ok = 'Đã chọn kỳ ' + r.thang + '.'; }
        else tt.loi = lyDoThanhChuoi(r.lyDo);
      });
    });
    return sel;
  }

  // ---- màn 1: tổng quan ----
  function nhanTrangThaiTab(t) {
    if (t.trangThai === 'coDuLieu') return 'Có dữ liệu (' + t.soDong + ' dòng)';
    if (t.trangThai === 'trong') return 'Trống';
    return 'Thiếu tab';
  }
  function veTinhTrangTab(m) {
    var cha = h('div');
    var nhoms = [];
    m.tabs.forEach(function (t) { if (nhoms.indexOf(t.nhom) < 0) nhoms.push(t.nhom); });
    nhoms.forEach(function (ten) {
      var the = h('div', 'the');
      them(the, h('h2', '', 'Tình trạng tab: ' + ten));
      var hang = m.tabs.filter(function (t) { return t.nhom === ten; }).map(function (t) {
        var tr = h('tr');
        var chip = h('span', 'chip ' + (t.trangThai === 'coDuLieu' ? 'chip-xanh' : t.trangThai === 'trong' ? 'chip-vang' : 'chip-do'), nhanTrangThaiTab(t));
        var oTen = h('td', '', t.ten), oTT = h('td'), oNut = h('td');
        them(oTT, chip);
        them(oNut, nut('Mở tab', 'nut-nho', function () {
          goiMayChu('giaoDienMoTab', [t.ten], function (r) { if (!r.daMo) tt.loi = r.thongDiep; });
        }, tt.dangChay || t.trangThai === 'thieu'));
        return them(tr, oTen, oTT, oNut);
      });
      them(the, bang([{ ten: 'Tab' }, { ten: 'Tình trạng' }, { ten: '' }], hang));
      them(cha, the);
    });
    return cha;
  }
  function veTongQuan() {
    var m = tt.moHinh, cha = h('div');
    var the = h('div', 'the');
    them(the, h('h2', '', 'Tổng quan kỳ' + (m && m.thang ? ' ' + m.thang : '')));
    if (!m) return them(cha, them(the, h('div', 'phu', 'Đang tải…')));
    if (!m.daTinh) {
      them(the, trangRong('Chưa có kết quả cho kỳ này. Bấm "Tính kỳ" để đọc dữ liệu và tính.', 'Tính kỳ', function () { chayTinh(); }));
      them(cha, the);
      return them(cha, veTinhTrangTab(m));
    }
    var l = h('div', 'luoi');
    them(l, theTomTat('Tổng thu nhập tạm tính', m.tong ? tien(m.tong.thuNhap) : '—'), theTomTat('Số người đã tính', m.tong ? m.tong.ghiChu.replace('cộng của ', '') : '—'),
      theTomTat('Trạng thái dữ liệu', m.trangThaiDuLieu === 'du' ? 'Đủ dữ liệu' : m.trangThaiDuLieu === 'chan' ? 'Bị chặn' : 'Chưa đủ dữ liệu'),
      theTomTat('Cảnh báo', String(m.canhBao.length)));
    them(the, l);
    them(cha, the);
    var tv = h('div', 'the');
    them(tv, h('h2', '', 'Thành viên trong kỳ'));
    them(tv, bang([{ ten: 'Thành viên' }, { ten: 'Nhóm' }, { ten: 'Bậc' }, { ten: 'Tình trạng dữ liệu' }, { ten: 'Thu nhập tạm tính', so: true }],
      m.thanhVien.map(function (r) {
        var tr = h('tr'), oChip = h('td');
        them(oChip, chipTrangThai('Point', r.chipPoint.trangThai), chipTrangThai('Key metrics', r.chipKM.trangThai));
        return them(tr, h('td', '', r.ten), h('td', '', r.nhom), h('td', '', r.bac), oChip, h('td', 'so', tien(r.thuNhap)));
      })));
    them(cha, tv);
    return them(cha, veTinhTrangTab(m));
  }

  // ---- màn 2: nhập point ----
  function chiaChoNguoi(m, nguon, kv) {
    var ra = [];
    m.thanhVien.forEach(function (r) {
      (r.nguon || []).forEach(function (n) {
        if (n.khoa !== nguon) return;
        n.chiTiet.forEach(function (d) { if (d.khuVuc === kv) ra.push({ ten: r.ten, heSo: d.heSo, point: d.point }); });
      });
    });
    return ra;
  }
  function bangChia(m, nguon, kv) {
    var ds = chiaChoNguoi(m, nguon, kv);
    if (ds.length === 0) return h('div', 'phu', 'Chưa có ai được chia ở khu vực này.');
    var tongHe = 0, tongPoint = 0;
    var hang = ds.map(function (d) { tongHe += d.heSo; tongPoint += d.point; return dongBang([{ v: d.ten }, { v: so4(d.heSo), so: true }, { v: so(d.point), so: true }]); });
    hang.push(dongBang([{ v: 'Tổng' }, { v: so4(Math.round(tongHe * 10000) / 10000), so: true }, { v: so(Math.round(tongPoint * 100) / 100), so: true }], 'tong'));
    return bang([{ ten: 'Nhân viên' }, { ten: 'Hệ số chia', so: true }, { ten: 'Point nhận', so: true }], hang);
  }
  function timQuy(m, nguon, kv) {
    var ds = m.quy ? m.quy[nguon] || [] : [];
    for (var i = 0; i < ds.length; i++) if (ds[i].khuVuc === kv) return ds[i];
    return null;
  }
  function moNhapBaoCao(kv) { tt.nhap = { khuVuc: kv, vanBan: '', tenTep: '', loi: [], canhBao: [] }; ve(); }
  function veXuatBan(m) {
    var cha = h('div');
    m.khuVuc.forEach(function (kv) {
      var the = h('div', 'the'), dau = h('div', 'hang-tren');
      them(dau, h('h2', '', 'Xuất bán và chuyển kho: khu vực ' + kv.ma));
      them(dau, nut(kv.coBaoCao ? 'Nhập lại báo cáo' : 'Nhập báo cáo', 'nut-nho', function () { moNhapBaoCao(kv.ma); }, tt.dangChay));
      them(the, dau);
      var q = m.daTinh ? timQuy(m, 'xuatBanChuyenKho', kv.ma) : null;
      if (!kv.coBaoCao) {
        them(the, h('div', 'rong', 'Chưa có báo cáo kiểm kê đọc được của khu vực ' + kv.ma + '. Dán hoặc chọn tệp báo cáo để nhập.'));
      } else if (!m.daTinh || !q) {
        them(the, h('div', 'phu', 'Đã có báo cáo. Bấm "Tính kỳ" để xem phân rã point.'));
      } else {
        them(the, h('div', '', 'Quỹ point của khu vực: ' + so(q.quy)));
        var hang = (q.dong || []).map(function (d) {
          return dongBang([{ v: d.ma }, { v: d.nhom }, { v: so4(d.pointXuatBan), so: true }, { v: so4(d.pointChuyenKho), so: true }, { v: d.banRa, so: true }, { v: d.chuyenKho, so: true }, { v: so(d.point), so: true }]);
        });
        them(the, bang([{ ten: 'Mã hàng' }, { ten: 'Nhóm thiết bị' }, { ten: 'Point/bán', so: true }, { ten: 'Point/chuyển', so: true }, { ten: 'SL bán ra', so: true },
          { ten: 'SL chuyển kho', so: true }, { ten: 'Point', so: true }], hang));
        if (q.tongDong > (q.dong || []).length) them(the, h('div', 'phu', 'Chỉ hiển thị ' + q.dong.length + ' trên ' + q.tongDong + ' dòng; phần còn lại vẫn được tính.'));
        them(the, h('h3', '', 'Chia cho nhân viên'), bangChia(m, 'xuatBanChuyenKho', kv.ma));
      }
      them(cha, the);
    });
    return cha;
  }
  function veBaoHanhHoTro(m) {
    var cha = h('div');
    m.khuVuc.forEach(function (kv) {
      var the = h('div', 'the');
      them(the, h('h2', '', 'Bảo hành và hỗ trợ sale: khu vực ' + kv.ma));
      [['baoHanh', 'Bảo hành', 'ca'], ['hoTroSale', 'Hỗ trợ sale', 'đơn']].forEach(function (x) {
        var q = m.daTinh ? timQuy(m, x[0], kv.ma) : null;
        them(the, h('h3', '', x[1]));
        if (!q) { them(the, h('div', 'phu', m.daTinh ? 'Chưa có số liệu của khu vực này, nhập ở bảng bên dưới.' : 'Bấm "Tính kỳ" để xem quỹ và phần chia.')); return; }
        if (q.thieu) { them(the, h('div', 'thong-bao thong-bao-canh', 'Thiếu số liệu ' + x[1].toLowerCase() + ' của khu vực ' + kv.ma + ', nhập ở bảng bên dưới.')); return; }
        them(the, h('div', '', 'Số ' + x[2] + ': ' + so(q.soLuong) + ' · Quỹ point: ' + so(q.quy)), bangChia(m, x[0], kv.ma));
      });
      them(cha, the);
    });
    return cha;
  }
  function veQuanLyKho(m) {
    var the = h('div', 'the');
    them(the, h('h2', '', 'Quản lý kho'));
    if (!m.daTinh) { them(the, h('div', 'phu', 'Bấm "Tính kỳ" để xem point từng dòng việc.')); return the; }
    var hang = [];
    m.thanhVien.forEach(function (r) {
      (r.nguon || []).forEach(function (n) {
        if (n.khoa !== 'quanLyKho' || !n.apDung) return;
        n.chiTiet.forEach(function (d) { hang.push(dongBang([{ v: r.ten }, { v: d.loai }, { v: so4(d.heSo), so: true }, { v: so(d.soLuong), so: true }, { v: so(d.point), so: true }])); });
        hang.push(dongBang([{ v: 'Tổng của ' + r.ten }, { v: '' }, { v: '' }, { v: '' }, { v: so(n.point), so: true }], 'tong'));
      });
    });
    if (hang.length === 0) them(the, h('div', 'phu', 'Không có thành viên nào tính point quản lý kho.'));
    else them(the, bang([{ ten: 'Nhân viên' }, { ten: 'Loại việc' }, { ten: 'Hệ số', so: true }, { ten: 'Số lượng', so: true }, { ten: 'Point', so: true }], hang));
    return the;
  }
  function veNhapPoint() {
    var m = tt.moHinh, cha = h('div');
    if (!m) return them(cha, h('div', 'the', 'Đang tải…'));
    them(cha, veXuatBan(m), veBaoHanhHoTro(m), veBoSoan('baoHanhHoTroSale', { tieuDe: 'Nhập số ca bảo hành và số đơn hỗ trợ sale' }),
      veQuanLyKho(m), veBoSoan('nhatKyCongViec', { tieuDe: 'Nhập nhật ký công việc (quản lý kho)' }), veBoSoan('xacNhanBaoCao', { tieuDe: 'Xác nhận báo cáo chỉ phủ một phần kỳ' }));
    return cha;
  }

  // ---- hộp nhập báo cáo ----
  function veHopNhap() {
    var n = tt.nhap;
    if (!n) return null;
    var lop = h('div', 'lop-phu'), hop = h('div', 'hop hop-rong');
    them(hop, h('h2', '', 'Nhập báo cáo kiểm kê: khu vực ' + n.khuVuc));
    them(hop, h('p', 'phu', 'Dán nội dung báo cáo (từ Excel hoặc CSV) vào ô dưới, hoặc chọn tệp CSV/TSV (mã hóa UTF-8). Tệp được đọc ngay trên máy bạn, không gửi đi đâu khác. Giới hạn 20.000 dòng, 60 cột. Nội dung chỉ thay tab báo cáo của khu vực này.'));
    var vung = h('textarea', 'vung-dan');
    vung.setAttribute('placeholder', 'Dán báo cáo kiểm kê tại đây');
    vung.value = n.vanBan;
    var nutNhap = null;
    vung.addEventListener('input', function () { n.vanBan = vung.value; if (nutNhap) nutNhap.disabled = tt.dangChay || n.vanBan.trim() === ''; });
    them(hop, vung);
    var tep = h('input');
    tep.setAttribute('type', 'file');
    tep.setAttribute('accept', '.csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain');
    tep.addEventListener('change', function () {
      var f = tep.files && tep.files[0];
      if (!f) return;
      if (f.size > GIOI_HAN_TEP) { n.loi = [{ thongDiep: 'Tệp lớn hơn 5 MB, vượt giới hạn. Hãy chia nhỏ báo cáo.' }]; ve(); return; }
      if (typeof FileReader === 'undefined') { n.loi = [{ thongDiep: 'Trình duyệt không hỗ trợ đọc tệp, hãy dán nội dung vào ô.' }]; ve(); return; }
      var rd = new FileReader();
      rd.onload = function () { n.vanBan = String(rd.result); n.tenTep = f.name; n.loi = []; ve(); };
      rd.onerror = function () { n.loi = [{ thongDiep: 'Không đọc được tệp, hãy thử lại hoặc dán nội dung vào ô.' }]; ve(); };
      rd.readAsText(f);
    });
    them(hop, tep);
    if (n.tenTep) them(hop, h('div', 'phu', 'Đã đọc tệp: ' + n.tenTep));
    (n.loi || []).forEach(function (l) { them(hop, h('div', 'thong-bao thong-bao-loi', l.thongDiep)); });
    (n.canhBao || []).forEach(function (l) { them(hop, h('div', 'thong-bao thong-bao-canh', l.thongDiep)); });
    var hangNut = h('div', 'hang-nut');
    nutNhap = nutDong('Nhập báo cáo', 'nut-chinh', function () {
      if (nutNhap.disabled) return;
      tt.hop = { tieuDe: 'Nhập báo cáo khu vực ' + n.khuVuc + '?',
        noiDung: 'Tab báo cáo kiểm kê của khu vực này sẽ được thay bằng nội dung vừa dán. Nếu có lỗi, hệ thống không ghi gì.',
        khiDongY: function () {
          goiMayChu('giaoDienNhapBaoCao', [n.khuVuc, n.vanBan], function (r) {
            n.canhBao = r.canhBao || [];
            if (r.daLuu) { tt.nhap = null; capNhatMoHinh(r.moHinh, false); tt.ok = 'Đã nhập báo cáo khu vực ' + r.khuVuc + ' (' + r.soDong + ' dòng).'; }
            else { n.loi = r.lyDo || []; }
          });
        } };
      ve();
    });
    nutNhap.disabled = tt.dangChay || n.vanBan.trim() === '';
    them(hangNut, nut('Đóng', '', function () { tt.nhap = null; ve(); }, false), nutNhap);
    them(hop, hangNut);
    return them(lop, hop);
  }

  // ---- màn 3: nhập key metrics ----
  function veTheKeyMetrics(r) {
    var the = h('div', 'the'), dau = h('div', 'hang-tren');
    them(dau, h('h2', '', r.ten), chipTrangThai('Key metrics', r.chipKM.trangThai));
    them(the, dau);
    var km = r.keyMetrics;
    if (!km || r.chipKM.trangThai === 'khongApDung') { them(the, h('div', 'phu', 'Thành viên này không có chỉ số key metrics, chỉ theo dõi point.')); return the; }
    if (km.trangThai !== 'du') {
      var thieu = (km.thieuChiSo || []).map(function (id) {
        var c = km.chiTiet.filter(function (x) { return x.chiSo === id; })[0];
        return c ? c.ten : id;
      });
      them(the, h('div', 'thong-bao thong-bao-canh', 'Key metrics: thiếu' + (thieu.length ? ' mục tiêu hoặc kết quả của: ' + thieu.join(', ') : '') + '. Nhập đủ ở bảng bên dưới để tính.'));
      return the;
    }
    var hang = km.chiTiet.map(function (c) {
      var tr = h('tr'), oTen = h('td'), oThanh = h('td');
      them(oTen, h('span', '', c.ten));
      if (c.kieu === 'thapTot') them(oTen, h('span', 'chip', 'càng thấp càng tốt'));
      var dinhDang = c.kieu === 'doanhThu' ? tien : so4;
      them(oThanh, c.phanTramHT === null ? h('span', 'phu', '—') : thanhTienDo(c.phanTramHT));
      return them(tr, oTen, h('td', 'so', phanTram(c.tyTrong, 0)), h('td', 'so', dinhDang(c.mucTieu)), h('td', 'so', dinhDang(c.ketQua)), oThanh);
    });
    them(the, bang([{ ten: 'Chỉ số' }, { ten: 'Tỷ trọng', so: true }, { ten: 'Mục tiêu', so: true }, { ten: 'Kết quả', so: true }, { ten: '%HT' }], hang));
    them(the, h('div', '', 'Σ điểm key metrics: ' + so4(km.diem) + ' · % thưởng: ' + phanTram(km.phanTramThuong, 0)));
    return the;
  }
  function veNhapKM() {
    var m = tt.moHinh, cha = h('div');
    if (!m) return them(cha, h('div', 'the', 'Đang tải…'));
    var gt = h('div', 'the');
    them(gt, h('h2', '', 'Key metrics từng người'));
    them(gt, h('div', 'phu', 'Chỉ số có ghi "càng thấp càng tốt" (ví dụ vòng quay hàng tồn kho, tỷ lệ bảo hành): kết quả thấp hơn mục tiêu là tốt. Mục tiêu và kết quả hiển thị đúng đơn vị bạn đã nhập vào bảng.'));
    if (!m.daTinh) them(gt, trangRong('Chưa có kết quả. Bấm "Tính kỳ" để xem điểm key metrics từng người.', 'Tính kỳ', function () { chayTinh(); }));
    them(cha, gt);
    if (m.daTinh) m.thanhVien.forEach(function (r) { them(cha, veTheKeyMetrics(r)); });
    them(cha, veBoSoan('keyMetrics', { tieuDe: 'Nhập mục tiêu và kết quả key metrics' }), veBoSoan('tyTrong', { tieuDe: 'Tỷ trọng key metrics của từng thành viên' }));
    return cha;
  }

  // ---- màn 4: kết quả ----
  function veCachTinh(m) {
    var r = m.thanhVien.filter(function (x) { return x.taiKhoan === tt.tvMo; })[0];
    if (!r) return null;
    var the = h('div', 'the'), dau = h('div', 'hang-tren');
    them(dau, h('h2', '', 'Cách tính: ' + r.ten), nut('Đóng', 'nut-nho', function () { tt.tvMo = null; ve(); }, false));
    them(the, dau);
    var ol = h('ol', 'ds-buoc');
    r.giaiThich.forEach(function (b) { them(ol, h('li', '', b)); });
    return them(the, ol);
  }
  function veKetQua() {
    var m = tt.moHinh, cha = h('div');
    if (!m || !m.daTinh) {
      var the0 = h('div', 'the');
      them(the0, h('h2', '', 'Kết quả tính'));
      them(the0, trangRong('Chưa có kết quả. Bấm "Tính kỳ" để tính và ghi kết quả.', 'Tính kỳ', function () { chayTinh('Đã tính xong.'); }));
      return them(cha, the0);
    }
    var dau = h('div', 'the');
    var tieu = h('h2', '', 'Kết quả tính ');
    them(tieu, h('span', 'chip ' + (m.trangThaiKy === 'Đã chốt' ? 'chip-xanh' : 'chip-vang'), m.trangThaiKy === 'Đã chốt' ? 'Đã chốt' : m.nhan));
    them(dau, tieu);
    if (!tt.khopTab) them(dau, h('div', 'thong-bao thong-bao-canh', 'Số liệu này được tính để xem, chưa ghi ra tab kết quả. Bấm "Tính kỳ" để ghi.'));
    them(dau, nutTinh('Tính lại'));
    them(cha, dau);

    var cb = h('div', 'the');
    them(cb, h('h2', '', 'Cảnh báo (' + m.canhBao.length + ')'));
    if (m.canhBao.length === 0) them(cb, h('div', 'phu', 'Không có cảnh báo.'));
    m.canhBao.forEach(function (l) { them(cb, h('div', 'thong-bao thong-bao-canh', l.thongDiep)); });
    them(cha, cb);
    var loi = h('div', 'the');
    them(loi, h('h2', '', 'Lỗi (' + m.loi.length + ')'));
    if (m.loi.length === 0) them(loi, h('div', 'phu', 'Không có lỗi.'));
    m.loi.forEach(function (l) { them(loi, h('div', 'thong-bao thong-bao-loi', l.thongDiep)); });
    them(cha, loi);
    them(cha, veCachTinh(m));

    if (m.thanhVien.length > 0) {
      var kt = h('div', 'the');
      them(kt, h('div', 'phu', 'Bấm vào tên một thành viên để xem cách tính.'));
      var hang = [];
      function dongNguoi(r) {
        var tr = h('tr'), oTen = h('td');
        them(oTen, nut(r.ten, 'nut-chu', function () { tt.tvMo = tt.tvMo === r.taiKhoan ? null : r.taiKhoan; ve(); }, false));
        var cacO = [{ v: r.bac }, { v: so(r.pointTong), so: true }, { v: r.min === null ? '—' : r.min + '–' + r.max }, { v: so(r.pointVuot), so: true },
          { v: phanTram(r.diemKM, 1), so: true }, { v: phanTram(r.phanTramThuong, 0), so: true }, { v: tien(r.luongCoDinh), so: true }, { v: tien(r.thuongKM), so: true },
          { v: tien(r.thuongVuotPoint), so: true }, { v: tien(r.phuCap), so: true }, { v: tien(r.thuNhap), so: true }, { v: r.trangThaiChu }];
        them(tr, oTen);
        cacO.forEach(function (o) { them(tr, h('td', o.so ? 'so' : '', o.v)); });
        return tr;
      }
      m.nhom.forEach(function (n) {
        m.thanhVien.filter(function (r) { return r.nhom === n.nhan; }).forEach(function (r) { hang.push(dongNguoi(r)); });
        hang.push(dongBang([{ v: 'Tổng nhóm: ' + n.nhan }, { v: n.ghiChu }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: tien(n.luongCoDinh), so: true },
          { v: tien(n.thuongKM), so: true }, { v: tien(n.thuongVuotPoint), so: true }, { v: tien(n.phuCap), so: true }, { v: tien(n.thuNhap), so: true }, { v: '' }], 'tong'));
      });
      if (m.tong) {
        hang.push(dongBang([{ v: 'Tổng team' }, { v: m.tong.ghiChu }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: '' }, { v: tien(m.tong.luongCoDinh), so: true },
          { v: tien(m.tong.thuongKM), so: true }, { v: tien(m.tong.thuongVuotPoint), so: true }, { v: tien(m.tong.phuCap), so: true }, { v: tien(m.tong.thuNhap), so: true }, { v: '' }], 'tong'));
      }
      them(kt, bang([{ ten: 'Thành viên' }, { ten: 'Bậc' }, { ten: 'Σ point', so: true }, { ten: 'Min–Max' }, { ten: 'Point vượt', so: true }, { ten: 'Điểm KM', so: true },
        { ten: '% thưởng', so: true }, { ten: 'Lương cố định', so: true }, { ten: 'Thưởng KM', so: true }, { ten: 'Thưởng vượt', so: true }, { ten: 'Phụ cấp', so: true },
        { ten: 'Thu nhập', so: true }, { ten: 'Trạng thái' }], hang));
      them(cha, kt);
    }
    if (m.doiSoat.length > 0) {
      var ds = h('div', 'the');
      them(ds, h('h2', '', 'Đối soát'));
      them(ds, bang([{ ten: 'Nguồn' }, { ten: 'Khu vực' }, { ten: 'Quỹ', so: true }, { ten: 'Đã chia', so: true }, { ten: 'Lệch', so: true }, { ten: 'Kết quả' }],
        m.doiSoat.map(function (d) { return dongBang([{ v: d.nguon }, { v: d.khuVuc }, { v: so(d.quy), so: true }, { v: so(d.daChia), so: true }, { v: so(d.lech), so: true }, { v: d.dat ? 'Đạt' : 'Lệch' }]); })));
      them(cha, ds);
    }
    return cha;
  }

  // ---- hộp xác nhận (tự dựng, không dùng hộp thoại của trình duyệt) ----
  function veHop() {
    if (!tt.hop) return null;
    var lop = h('div', 'lop-phu lop-tren'), hop = h('div', 'hop');
    them(hop, h('h2', '', tt.hop.tieuDe), h('p', '', tt.hop.noiDung));
    var o = null;
    if (tt.hop.canLyDo) {
      o = h('textarea');
      o.setAttribute('placeholder', 'Lý do mở lại kỳ');
      o.value = tt.lyDoMoLai;
      o.addEventListener('input', function () { tt.lyDoMoLai = o.value; });
      them(hop, o);
    }
    var hangNut = h('div', 'hang-nut');
    them(hangNut, nut('Hủy', '', function () { tt.hop = null; ve(); }, false), nut('Đồng ý', 'nut-chinh', function () {
      var hanhDong = tt.hop.khiDongY; tt.hop = null; hanhDong();
    }, false));
    them(hop, hangNut);
    return them(lop, hop);
  }

  // ---- màn 5: duyệt và lưu ----
  function veDuyet() {
    var m = tt.moHinh, cha = h('div');
    var the = h('div', 'the');
    them(the, h('h2', '', 'Duyệt và lưu kỳ'));
    if (!m || !m.daTinh) {
      them(the, trangRong('Chưa có kết quả để duyệt. Hãy tính kỳ trước.', 'Tính kỳ', function () { chayTinh('Đã tính xong. Xem lại rồi duyệt.'); }));
      return them(cha, the);
    }
    var l = h('div', 'luoi');
    them(l, theTomTat('Tổng thu nhập sẽ chốt', m.tong ? tien(m.tong.thuNhap) : '—'), theTomTat('Số người đã tính', m.tong ? m.tong.ghiChu.replace('cộng của ', '') : '—'),
      theTomTat('Số cảnh báo', String(m.canhBao.length)), theTomTat('Trạng thái kỳ', m.trangThaiKy === 'Đã chốt' ? 'Đã chốt' : m.trangThaiKy === 'Đã mở lại' ? 'Đã mở lại' : 'Chưa chốt'));
    them(the, l);
    them(cha, the);

    var dk = h('div', 'the');
    them(dk, h('h2', '', 'Điều kiện để duyệt'));
    var chan = m.duyet.lyDoChan.length > 0;
    if (chan) m.duyet.lyDoChan.forEach(function (x) { them(dk, h('div', 'thong-bao thong-bao-loi', x.thongDiep)); });
    var can = m.duyet.canXacNhan;
    var chuaXacNhan = can.filter(function (x) { return !tt.xacNhan[x.taiKhoan]; });
    if (can.length > 0) {
      them(dk, h('div', '', 'Những người sau chưa tính được. Tick từng người để xác nhận bỏ qua khi chốt:'));
      can.forEach(function (x) {
        var d = h('div', 'xac-nhan'), o = h('input');
        o.setAttribute('type', 'checkbox');
        o.checked = !!tt.xacNhan[x.taiKhoan];
        o.addEventListener('change', function () { tt.xacNhan[x.taiKhoan] = o.checked; ve(); });
        them(d, o, h('span', '', x.ten + ' (' + x.taiKhoan + '): ' + x.lyDo));
        them(dk, d);
      });
    }
    if (!chan && can.length === 0) them(dk, h('div', 'phu', 'Mọi thành viên đã tính được. Không cần xác nhận ai.'));
    var tatDuyet = tt.dangChay || chan || chuaXacNhan.length > 0;
    var ghiChu = h('div', 'phu', chan ? 'Không thể duyệt: xem điều kiện ở trên.' : chuaXacNhan.length > 0 ? 'Còn ' + chuaXacNhan.length + ' người chưa được xác nhận bỏ qua.' : 'Sẵn sàng duyệt.');
    them(dk, h('div', '', ' '), nut('Xác nhận duyệt', 'nut-chinh', function () {
      tt.hop = { tieuDe: 'Duyệt và chốt kỳ ' + m.thang + '?',
        noiDung: 'Hệ thống sẽ tính lại từ dữ liệu hiện tại, lưu bản sao kỳ và chốt. Sau khi chốt không sửa được; muốn đổi phải mở lại kỳ kèm lý do.',
        khiDongY: function () {
          var danhSach = can.filter(function (x) { return tt.xacNhan[x.taiKhoan]; }).map(function (x) { return x.taiKhoan; });
          goiMayChu('giaoDienDuyet', [danhSach], function (r) {
            capNhatMoHinh(r.moHinh, r.daChot ? true : undefined);
            if (r.daChot) { tt.ok = 'Đã chốt kỳ ' + r.ky + '. Tổng đã duyệt ' + tien(r.tong) + ' (' + r.soDaTinh + ' người đã tính, ' + r.soBoQua + ' người bỏ qua).'; tt.xacNhan = {}; }
            else tt.loi = 'Không chốt được. ' + lyDoThanhChuoi(r.lyDo);
          });
        } };
      ve();
    }, tatDuyet), ghiChu);
    them(cha, dk);
    return cha;
  }

  // ---- màn 6: lịch sử ----
  function veLichSu() {
    var m = tt.moHinh, cha = h('div'), the = h('div', 'the');
    them(the, h('h2', '', 'Lịch sử các kỳ đã chốt'));
    if (!m || m.lichSu.length === 0) {
      them(the, h('div', 'rong', 'Chưa có kỳ nào được chốt.'));
      return them(cha, the);
    }
    var hang = m.lichSu.map(function (s) {
      var tr = h('tr'), oNut = h('td');
      if (s.coTheMoLai) {
        them(oNut, nut('Mở lại kỳ', 'nut-nho', function () {
          tt.lyDoMoLai = '';
          tt.hop = { tieuDe: 'Mở lại kỳ ' + s.ky + '?', noiDung: 'Bản chốt cũ được giữ lại (đổi tên). Cần nhập lý do; việc này được ghi vào lịch sử.', canLyDo: true,
            khiDongY: function () {
              goiMayChu('giaoDienMoLai', [s.ky, tt.lyDoMoLai], function (r) {
                capNhatMoHinh(r.moHinh);
                if (r.daMoLai) tt.ok = 'Đã mở lại kỳ ' + r.ky + '. Bản chốt cũ được giữ ở tab ' + r.tenTabCu + '.';
                else tt.loi = r.thongDiep;
              });
            } };
          ve();
        }, tt.dangChay));
      }
      return them(tr, h('td', '', s.ky), h('td', '', s.trangThai), h('td', '', s.thoiDiem), h('td', 'so', tien(s.tong)), h('td', 'so', s.soDaTinh), h('td', 'so', s.soBoQua),
        h('td', '', s.lyDo), oNut);
    });
    them(the, bang([{ ten: 'Kỳ' }, { ten: 'Trạng thái' }, { ten: 'Thời điểm' }, { ten: 'Tổng đã duyệt', so: true }, { ten: 'Đã tính', so: true }, { ten: 'Bỏ qua', so: true },
      { ten: 'Lý do' }, { ten: '' }], hang));
    return them(cha, the);
  }

  // ---- màn 7: cấu hình ----
  function veCauHinh() {
    var cha = h('div'), the = h('div', 'the');
    them(the, h('h2', '', 'Cấu hình'));
    them(the, h('div', 'phu', 'Chọn một bảng để xem và sửa. Sửa cấu hình không làm đổi bản chốt của kỳ đã chốt.'));
    var ds = h('div', 'chon-bang');
    BANG_CAU_HINH.forEach(function (k) {
      them(ds, nut(NHAN_BANG_NGAN[k], 'nut-dieu-huong' + (tt.bangCauHinh === k ? ' dang-chon' : ''), function () { tt.bangCauHinh = k; ve(); }, false));
    });
    them(the, ds);
    them(cha, the, veBoSoan(tt.bangCauHinh, { macDinh: true }));
    return cha;
  }

  // ---- khung chung ----
  function ve() {
    goc.textContent = '';
    var m = tt.moHinh;
    var dau = h('div', 'dau'), tieu = h('h1', '', 'Tính point và thu nhập tạm tính - Team QL&PTTB');
    var cum = h('div');
    var chonKy = oChonKy(m);
    them(cum, h('span', 'chip chip-duong', m && m.thang ? 'Kỳ ' + m.thang : 'Chưa chọn kỳ'), chonKy,
      h('span', 'chip ' + (m && m.trangThaiKy === 'Đã chốt' ? 'chip-xanh' : 'chip-vang'), m && m.trangThaiKy === 'Đã chốt' ? 'Đã chốt' : 'Đề xuất – chờ duyệt'));
    them(dau, tieu, cum);
    them(goc, dau);
    var dh = h('div', 'dieu-huong');
    MAN.forEach(function (x) {
      var b = nut(x[1], 'nut-dieu-huong' + (tt.man === x[0] ? ' dang-chon' : ''), function () { tt.man = x[0]; tt.loi = null; tt.ok = null; ve(); }, false);
      them(dh, b);
    });
    them(goc, dh);
    if (tt.dangTai || tt.dangChay) them(goc, h('div', 'thong-bao thong-bao-canh', tt.dangTai ? 'Đang tải…' : 'Đang xử lý, vui lòng chờ…'));
    them(goc, thongBao());
    var noiDung = tt.man === 'nhappoint' ? veNhapPoint() : tt.man === 'nhapkm' ? veNhapKM() : tt.man === 'ketqua' ? veKetQua() : tt.man === 'duyet' ? veDuyet()
      : tt.man === 'lichsu' ? veLichSu() : tt.man === 'cauhinh' ? veCauHinh() : veTongQuan();
    them(goc, noiDung);
    them(goc, veHopNhap());
    them(goc, veHop());
    khoiDongTai();
  }

  ve();
  goiMayChu('giaoDienLayMoHinh', [], function (m) { capNhatMoHinh(m, false); });
  return { tt: tt, ve: ve };
}

// Trang HTML hoàn chỉnh. Mã khách được nhúng nguyên văn bằng toString, không lắp ghép chuỗi dữ liệu nào vào trang.
function taoTrangGiaoDien() {
  return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Tính point</title><style>' + CSS_GIAO_DIEN + '</style></head>' +
    '<body><div id="goc"></div><script>(' + maKhachGiaoDien.toString() + ')(document, google);</script></body></html>';
}
