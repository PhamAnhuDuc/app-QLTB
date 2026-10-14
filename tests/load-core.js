// Nạp các tệp trong src/core/ và src/sheet/ vào một vùng chạy chung (giống phạm vi toàn cục của Apps Script)
// để kiểm thử bằng Node mà không cần module hay thư viện ngoài.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Thứ tự nạp lấy từ lệnh gộp mã để chỉ có MỘT nơi định nghĩa.
const { THU_TU } = require('../tools/build-gs');

// Đường dẫn các tệp nguồn theo thứ tự nạp (dùng chung với lệnh gộp mã).
function danhSachTep() {
  const dir = path.join(__dirname, '..', 'src');
  return THU_TU.map((t) => path.join(dir, t)).filter((f) => fs.existsSync(f));
}

function nap(themBienToanCuc) {
  const ctx = vm.createContext(Object.assign({}, themBienToanCuc || {}));
  for (const file of danhSachTep()) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file }); // cho phép nạp dần khi các tệp chưa được viết
  }
  return ctx;
}

function docFixture(...phan) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', ...phan), 'utf8'));
}

module.exports = { nap, docFixture, danhSachTep, THU_TU };
