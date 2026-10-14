// Gộp mã nguồn thành MỘT tệp Apps Script để chủ sở hữu dán vào trình soạn thảo, kèm manifest khai báo quyền tường minh.
// Không dùng clasp hay công cụ ngoài. Chạy: node tools/build-gs.js   →  dist/Code.gs và dist/appsscript.json
// dist/ nằm trong .gitignore (chứa mã, không chứa dữ liệu).
'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Thứ tự nối quan trọng: tệp sau dùng hàm của tệp trước. Đây là nguồn thứ tự DUY NHẤT (tests/load-core.js cũng dùng).
const THU_TU = [
  'core/util.js', 'core/config.js', 'core/point.js', 'core/keymetrics.js', 'core/income.js', 'core/log.js', 'core/engine.js',
  'sheet/hang.js', 'sheet/kiemke.js', 'sheet/cauhinh.js', 'sheet/nhaptay.js', 'sheet/ketqua.js', 'sheet/dieuphoi.js', 'sheet/chot.js', 'sheet/bang.js', 'sheet/nhapbang.js', 'sheet/giaodien.js', 'sheet/giaodienhtml.js', 'sheet/chiase.js', 'sheet/gas.js', 'sheet/gas-chot.js', 'sheet/gas-giaodien.js', 'sheet/gas-sua.js'
];

// Quyền tối thiểu:
//  - spreadsheets.currentonly: chỉ Sheet đang mở, không đụng các Sheet khác
//  - script.container.ui: menu và hộp thoại thông báo trong Sheet
//  - drive: chỉ để ĐỌC mức chia sẻ của chính tệp này (DriveApp.getFileById). Không có quyền mạng, thư hay lịch.
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.currentonly',
  'https://www.googleapis.com/auth/script.container.ui',
  'https://www.googleapis.com/auth/drive'
];

const { maNguonThu } = require('./mau-thu');
// Phương án thu hẹp quyền Drive: chỉ đọc. CHƯA được kiểm chứng trên Sheet thật (xem HUONG-DAN-THU-NGHIEM.md mục G).
// Nếu getSharingAccess không chạy được với quyền này thì lệnh từ chối an toàn (không đọc được mức chia sẻ thì chặn), khi đó dùng manifest mặc định.
const OAUTH_SCOPES_DRIVE_READONLY = OAUTH_SCOPES.map((s) => (s === 'https://www.googleapis.com/auth/drive' ? 'https://www.googleapis.com/auth/drive.readonly' : s));

const THU_MUC_GOC = path.join(__dirname, '..');

function manifest() {
  return { timeZone: 'Asia/Ho_Chi_Minh', dependencies: {}, exceptionLogging: 'STACKDRIVER', runtimeVersion: 'V8', oauthScopes: OAUTH_SCOPES };
}

function manifestDriveReadonly() {
  return Object.assign({}, manifest(), { oauthScopes: OAUTH_SCOPES_DRIVE_READONLY });
}

function gopMa() {
  const phan = THU_TU.map((t) => {
    const nd = fs.readFileSync(path.join(THU_MUC_GOC, 'src', t), 'utf8');
    return `// ===== src/${t} =====\n${nd.endsWith('\n') ? nd : nd + '\n'}`;
  });
  return '// Tệp SINH TỰ ĐỘNG bởi tools/build-gs.js. Không sửa tay: sửa trong src/ rồi chạy lại lệnh gộp mã.\n\n' + phan.join('\n');
}

// Bản thử = bản dùng thật + một hàm nạp dữ liệu GIẢ. Chỉ để thử nghiệm trên Sheet trống.
function gopMaThu() {
  return gopMa() + maNguonThu();
}

function build(thuMucRa) {
  const ra = thuMucRa || path.join(THU_MUC_GOC, 'dist');
  fs.mkdirSync(ra, { recursive: true });
  fs.writeFileSync(path.join(ra, 'Code.gs'), gopMa());
  fs.writeFileSync(path.join(ra, 'Code-thu.gs'), gopMaThu());
  fs.writeFileSync(path.join(ra, 'appsscript.json'), JSON.stringify(manifest(), null, 2) + '\n');
  fs.writeFileSync(path.join(ra, 'appsscript.drive-readonly.json'), JSON.stringify(manifestDriveReadonly(), null, 2) + '\n');
  return ra;
}

if (require.main === module) {
  const ra = build();
  console.log('Đã tạo trong ' + ra + ':');
  console.log('  Code.gs        bản DÙNG THẬT');
  console.log('  Code-thu.gs    bản THỬ (thêm menu nạp dữ liệu mẫu GIẢ, chỉ dùng trên Sheet trống)');
  console.log('  appsscript.json  manifest quyền mặc định (Drive đầy đủ, đã kiểm chứng)');
  console.log('  appsscript.drive-readonly.json  manifest thử thu hẹp quyền Drive (chưa kiểm chứng)');
}

module.exports = { THU_TU, OAUTH_SCOPES, OAUTH_SCOPES_DRIVE_READONLY, manifest, manifestDriveReadonly, gopMa, gopMaThu, build };
