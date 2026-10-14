// Phân tích văn bản CSV/TSV thành bảng hai chiều để nhập báo cáo kiểm kê từ giao diện (spec ui-data-editing). Hàm thuần.
//
// Nhận dấu tab, dấu phẩy hoặc dấu chấm phẩy; có dấu nháy kép (kể cả dòng xuống trong ô); bỏ dấu BOM.
// Ô chỉ gồm chữ số (có thể có một dấu chấm thập phân, không có số 0 đứng đầu) được chuyển thành số; mọi ô khác giữ nguyên là chữ.
// Không đoán định dạng số theo vùng (dấu phân cách nghìn, dấu phẩy thập phân): bộ đọc báo cáo sẽ từ chối chuỗi số.

var GIOI_HAN_VAN_BAN = { soKyTu: 5000000, soDong: 20000, soCot: 60 };
var DAU_NGAN_CACH = ['\t', ';', ','];

function chuyenOSo(chuoi) {
  var t = chuoi.trim();
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(t)) return Number(t);
  return chuoi;
}

// Chọn dấu ngăn cách theo tổng số lần xuất hiện (ngoài dấu nháy) trong 30 dòng không trống đầu tiên; hoà thì ưu tiên dấu tab.
function chonDauNganCach(vanBan) {
  var dem = { '\t': 0, ';': 0, ',': 0 };
  var trongNhay = false, soDong = 0;
  for (var i = 0; i < vanBan.length && soDong < 30; i++) {
    var ch = vanBan.charAt(i);
    if (ch === '"') { trongNhay = !trongNhay; continue; }
    if (trongNhay) continue;
    if (ch === '\n') { soDong++; continue; }
    if (dem[ch] !== undefined) dem[ch]++;
  }
  var tot = '\t';
  DAU_NGAN_CACH.forEach(function (d) { if (dem[d] > dem[tot]) tot = d; });
  return tot;
}

// Trả {bang, loi: [{ma, thongDiep}], soDong, soCot}. bang = null khi không phân tích được.
function phanTichVanBanBang(vanBan, gioiHan) {
  var gh = gioiHan || GIOI_HAN_VAN_BAN;
  var tu = function (ma, thongDiep) { return { bang: null, loi: [{ ma: ma, thongDiep: thongDiep }], soDong: 0, soCot: 0 }; };
  if (typeof vanBan !== 'string') return tu('DU_LIEU_SAI', 'Nội dung gửi lên không phải văn bản.');
  if (vanBan.length > gh.soKyTu) return tu('QUA_LON', 'Nội dung vượt giới hạn ' + gh.soKyTu + ' ký tự.');
  var s = vanBan.charAt(0) === '﻿' ? vanBan.slice(1) : vanBan;
  if (s.trim() === '') return tu('RONG', 'Nội dung trống, không có gì để nhập.');
  var d = chonDauNganCach(s);

  var rows = [], dong = [], o = '', trongNhay = false, daCoNhay = false;
  function chotO() { dong.push(daCoNhay ? o : chuyenOSo(o)); o = ''; daCoNhay = false; }
  function chotDong() { chotO(); rows.push(dong); dong = []; }
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (trongNhay) {
      if (ch === '"') {
        if (s.charAt(i + 1) === '"') { o += '"'; i++; } else trongNhay = false;
      } else o += ch;
      continue;
    }
    if (ch === '"' && o === '') { trongNhay = true; daCoNhay = true; continue; }
    if (ch === d) { chotO(); continue; }
    if (ch === '\r') { if (s.charAt(i + 1) === '\n') i++; chotDong(); }
    else if (ch === '\n') chotDong();
    else o += ch;
    if (rows.length > gh.soDong) return tu('QUA_NHIEU_DONG', 'Có hơn ' + gh.soDong + ' dòng, vượt giới hạn.');
  }
  if (trongNhay) return tu('NHAY_KEP_CHUA_DONG', 'Có dấu nháy kép mở mà không được đóng, nội dung có thể bị cắt.');
  if (o !== '' || dong.length > 0 || daCoNhay) chotDong();
  while (rows.length > 0 && rows[rows.length - 1].every(function (x) { return x === ''; })) rows.pop();
  if (rows.length === 0) return tu('RONG', 'Nội dung không có dòng nào.');
  var soCot = 0;
  rows.forEach(function (r) { if (r.length > soCot) soCot = r.length; });
  if (rows.length > gh.soDong) return tu('QUA_NHIEU_DONG', 'Có hơn ' + gh.soDong + ' dòng, vượt giới hạn.');
  if (soCot > gh.soCot) return tu('QUA_NHIEU_COT', 'Có hơn ' + gh.soCot + ' cột, vượt giới hạn.');
  rows = rows.map(function (r) { var x = r.slice(); while (x.length < soCot) x.push(''); return x; });
  return { bang: rows, loi: [], soDong: rows.length, soCot: soCot };
}
