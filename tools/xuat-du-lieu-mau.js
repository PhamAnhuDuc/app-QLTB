// Xuất bộ dữ liệu GIẢ (tests/fixtures/sheet/<bo>.tabs.json) thành các tệp .tsv để dán vào Google Sheet khi thử nghiệm.
// Chạy: node tools/xuat-du-lieu-mau.js [bo1|bo2|bo3] [--vi]   →  dist/du-lieu-mau/<bo>/<tên tab>.tsv
// --vi: ghi số thập phân bằng dấu phẩy (0,17) cho Sheet đặt locale Việt Nam. Mặc định dùng dấu chấm (0.17), hợp với locale Hoa Kỳ.
// Toàn bộ là dữ liệu giả. dist/ nằm trong .gitignore.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const doiS = process.argv.slice(2);
const bo = doiS.find((x) => !x.startsWith('--')) || 'bo1';
const dauPhay = doiS.includes('--vi');
if (!['bo1', 'bo2', 'bo3'].includes(bo)) { console.error('Chỉ nhận bo1, bo2 hoặc bo3'); process.exit(1); }
const goc = path.join(__dirname, '..');
const tabs = JSON.parse(fs.readFileSync(path.join(goc, 'tests', 'fixtures', 'sheet', `${bo}.tabs.json`), 'utf8'));
const ra = path.join(goc, 'dist', 'du-lieu-mau', bo);
fs.mkdirSync(ra, { recursive: true });

const o = (v) => {
  if (v === null || v === undefined) return '';
  const t = String(v);
  return dauPhay && typeof v === 'number' && !Number.isInteger(v) ? t.replace('.', ',') : t;
};
const rongToiDa = (b) => Math.max(...b.map((d) => d.length));
for (const ten of Object.keys(tabs)) {
  const b = tabs[ten];
  const n = rongToiDa(b);
  const tsv = b.map((d) => { const x = d.map(o); while (x.length < n) x.push(''); return x.join('\t'); }).join('\n') + '\n';
  fs.writeFileSync(path.join(ra, `${ten}.tsv`), tsv);
}
console.log(`Đã xuất ${Object.keys(tabs).length} tab giả (${bo}, số thập phân dùng dấu ${dauPhay ? 'phẩy' : 'chấm'}) vào ${ra}`);
