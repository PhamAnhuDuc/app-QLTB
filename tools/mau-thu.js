// Sinh mã "bản thử": một hàm nạp bộ dữ liệu GIẢ bo1 vào Sheet bằng một cú bấm menu, để thử nghiệm không phải dán từng tab.
// Không nằm trong src/ nên KHÔNG có trong bản dùng thật (dist/Code.gs). Chỉ ghi vào Sheet nếu các tab mẫu chưa có dữ liệu,
// để không bao giờ đè lên dữ liệu của bạn.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function maNguonThu() {
  const tabs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'fixtures', 'sheet', 'bo1.tabs.json'), 'utf8'));
  return `
// ===== BẢN THỬ: nạp dữ liệu mẫu GIẢ (không có trong bản dùng thật) =====
var DU_LIEU_MAU_THU = ${JSON.stringify(tabs)};

// Nạp bộ dữ liệu giả vào Sheet THỬ. Từ chối nếu bất kỳ tab mẫu nào đã có dữ liệu (không bao giờ ghi đè).
function napDuLieuMauThu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ten = Object.keys(DU_LIEU_MAU_THU);
  var coDuLieu = ten.filter(function (t) { var sh = ss.getSheetByName(t); return sh && sh.getLastRow() > 0; });
  if (coDuLieu.length > 0) {
    thongBaoChoNguoiDung('Không nạp dữ liệu mẫu vì các tab sau đã có dữ liệu: ' + coDuLieu.join(', ') +
      '.\\nHãy dùng một Sheet MỚI hoàn toàn trống để thử (để không đè lên dữ liệu của bạn).');
    return { daNap: false, lyDo: 'TAB_DA_CO_DU_LIEU', tab: coDuLieu };
  }
  ten.forEach(function (t) {
    var bang = DU_LIEU_MAU_THU[t];
    var sh = layHoacTaoTab(ss, t);
    var rong = Math.max.apply(null, bang.map(function (d) { return d.length; }));
    var giaTri = bang.map(function (d) { var x = d.slice(); while (x.length < rong) x.push(''); return x; });
    if (t === TEN_TAB.ky) sh.getRange(2, 2, 1, 1).setNumberFormat('@'); // giữ "2026-09" là chữ, không thành ngày
    sh.getRange(1, 1, giaTri.length, rong).setValues(giaTri);
  });
  thongBaoChoNguoiDung('Đã nạp dữ liệu mẫu GIẢ vào ' + ten.length + ' tab.\\nBây giờ chọn Tính point → Tính kỳ.\\nKết quả đúng: tổng team 75.838.000, đủ dữ liệu.');
  return { daNap: true, soTab: ten.length };
}
`;
}

module.exports = { maNguonThu };
