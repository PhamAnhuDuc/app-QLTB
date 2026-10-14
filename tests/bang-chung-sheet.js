// Bằng chứng test cho lớp Sheet: với mỗi bộ dữ liệu giả, chạy lệnh "Tính kỳ" trên Sheet giả và lưu
// đầu vào (các tab) và đầu ra (tab Kết quả, Giải thích, Nhật ký hệ thống, thông báo, danh sách tab được ghi).
// Chạy: node tests/bang-chung-sheet.js   (ghi lại tests/evidence/sheet-*.json)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { nap } = require('./load-core');
const { taoMoiTruong } = require('./fake-gas');

const THU_MUC_VAO = path.join(__dirname, 'fixtures', 'sheet');
const THU_MUC_RA = path.join(__dirname, 'evidence');
const BO = [
  { ten: 'bo1', moTa: 'Bình thường: tháng 09/2026, đủ dữ liệu' },
  { ten: 'bo2', moTa: 'Khác kỳ, đơn giá, bậc, hệ số: tháng 10/2026' },
  { ten: 'bo3', moTa: 'Dữ liệu xấu hoặc thiếu trường' }
];

function docTabs(bo) { return JSON.parse(fs.readFileSync(path.join(THU_MUC_VAO, `${bo}.tabs.json`), 'utf8')); }

function chayMotBo(bo) {
  const tabs = docTabs(bo.ten);
  const mt = taoMoiTruong(tabs);
  const c = nap(mt.globals);
  const truoc = mt.ss.chup(Object.keys(tabs));
  mt.nhatKy.length = 0;
  const r = c.tinhKyTuMenu();
  const tabDaGhi = [...new Set(mt.nhatKy.map((n) => n.tab))].sort();
  const tabGhi = (ten) => JSON.parse(JSON.stringify(mt.ss.getSheetByName(ten).data));
  return {
    dauVao: { _ghiChu: 'DỮ LIỆU GIẢ. ' + bo.moTa, cacTab: tabs },
    ketQua: {
      tomTat: JSON.parse(JSON.stringify(r)),
      tabDaGhi,
      tabDauVaoKhongDoi: mt.ss.chup(Object.keys(tabs)) === truoc,
      thongBao: mt.ui.thongBao,
      KetQua: tabGhi(r.tenTabKetQua),
      GiaiThich: tabGhi('GiaiThich'),
      NhatKyHeThong: tabGhi('NhatKyHeThong')
    }
  };
}

function taoBangChung() {
  const ra = {};
  for (const bo of BO) ra[bo.ten] = chayMotBo(bo);
  return ra;
}

function ghi() {
  fs.mkdirSync(THU_MUC_RA, { recursive: true });
  const bc = taoBangChung();
  for (const ten of Object.keys(bc)) {
    fs.writeFileSync(path.join(THU_MUC_RA, `sheet-${ten}-dau-vao.json`), JSON.stringify(bc[ten].dauVao, null, 1) + '\n');
    fs.writeFileSync(path.join(THU_MUC_RA, `sheet-${ten}-ket-qua.json`), JSON.stringify(bc[ten].ketQua, null, 1) + '\n');
  }
  return Object.keys(bc);
}

if (require.main === module) console.log('Đã ghi bằng chứng Sheet cho:', ghi().join(', '));

module.exports = { taoBangChung, BO, THU_MUC_RA };
