// Sheet giả tối thiểu trong bộ nhớ cho SpreadsheetApp, DriveApp, Utilities và HtmlService, đủ để kiểm thử các tệp src/sheet/gas*.js bằng Node.
// Ghi lại MỌI thao tác ghi (mảng nhatKy) để kiểm tra "không động tới tab đầu vào". Mô phỏng thô việc Sheet tự đánh giá công thức:
// chuỗi bắt đầu bằng "=" mà ô không được định dạng văn bản và không có dấu nháy đơn đầu chuỗi sẽ bị đánh dấu là công thức.
'use strict';

function chuoiCot(n) {
  let s = '';
  n += 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function a1(r, c) { return chuoiCot(c) + (r + 1); }
function giaiA1(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  let c = 0;
  for (const ch of m[1]) c = c * 26 + ch.charCodeAt(0) - 64;
  return { r: Number(m[2]) - 1, c: c - 1 };
}
// "B2" hoặc "A1:C3" → {r, c, nr, nc} với r,c đếm từ 1
function giaiVung(ref) {
  const [dau, cuoi] = ref.split(':');
  const x = giaiA1(dau);
  const y = cuoi ? giaiA1(cuoi) : x;
  return { r: x.r + 1, c: x.c + 1, nr: y.r - x.r + 1, nc: y.c - x.c + 1 };
}
function oTrongVung(ref) {
  const v = giaiVung(ref);
  const ds = [];
  for (let i = 0; i < v.nr; i++) for (let j = 0; j < v.nc; j++) ds.push(a1(v.r - 1 + i, v.c - 1 + j));
  return ds;
}

class FakeSheet {
  constructor(ten, nhatKy, duLieu) {
    this.ten = ten; this.data = duLieu ? JSON.parse(JSON.stringify(duLieu)) : []; this.dinhDang = {}; this.dam = {}; this.doRong = {};
    this.congThuc = []; this.nhatKy = nhatKy; this.baoVe = null;
  }
  getName() { return this.ten; }
  setName(ten) { this.nhatKy.push({ tab: this.ten, thaoTac: 'rename', thanh: ten }); this.ten = ten; return this; }
  getLastRow() { let l = 0; this.data.forEach((d, i) => { if (d.some((o) => o !== '' && o !== null && o !== undefined)) l = i + 1; }); return l; }
  getDataRange() {
    const l = this.getLastRow();
    if (l === 0) return { getValues: () => [['']] };
    const rong = Math.max(...this.data.slice(0, l).map((d) => d.length));
    return { getValues: () => this.data.slice(0, l).map((d) => { const x = [...d]; while (x.length < rong) x.push(''); return x; }) };
  }
  getRange(...a) {
    const sheet = this;
    const { r, c, nr, nc } = typeof a[0] === 'string' ? giaiVung(a[0]) : { r: a[0], c: a[1], nr: a[2] || 1, nc: a[3] || 1 };
    const cacO = () => { const ds = []; for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) ds.push(a1(r - 1 + i, c - 1 + j)); return ds; };
    return {
      setNumberFormat: (f) => { sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'setNumberFormat', soO: nr * nc }); cacO().forEach((o) => { sheet.dinhDang[o] = f; }); },
      setFontWeight: (w) => { sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'setFontWeight', soO: nr * nc }); cacO().forEach((o) => { sheet.dam[o] = w; }); },
      getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const d = []; for (let j = 0; j < nc; j++) d.push(((sheet.data[r - 1 + i] || [])[c - 1 + j]) ?? ''); o.push(d); } return o; },
      setValues: (v) => {
        sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'setValues', soDong: v.length });
        v.forEach((dong, i) => dong.forEach((o, j) => {
          const rr = r - 1 + i, cc = c - 1 + j;
          while (sheet.data.length <= rr) sheet.data.push([]);
          while (sheet.data[rr].length <= cc) sheet.data[rr].push('');
          sheet.data[rr][cc] = o;
          const ref = a1(rr, cc);
          if (typeof o === 'string' && o.startsWith('=') && sheet.dinhDang[ref] !== '@') sheet.congThuc.push(ref);
        }));
      }
    };
  }
  getRangeList(ds) {
    const sheet = this;
    const tatCa = () => ds.flatMap((x) => oTrongVung(x));
    return {
      setNumberFormat: (f) => { sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'setNumberFormat', soO: tatCa().length }); tatCa().forEach((ref) => { sheet.dinhDang[ref] = f; }); },
      setFontWeight: (w) => { sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'setFontWeight', soO: tatCa().length }); tatCa().forEach((ref) => { sheet.dam[ref] = w; }); }
    };
  }
  setColumnWidth(cot, px) { this.nhatKy.push({ tab: this.ten, thaoTac: 'setColumnWidth', cot }); this.doRong[cot] = px; return this; }
  protect() {
    const sheet = this;
    sheet.nhatKy.push({ tab: sheet.ten, thaoTac: 'protect' });
    sheet.baoVe = { canhBao: false };
    return { setWarningOnly: (b) => { sheet.baoVe.canhBao = b; return this; }, setDescription: (d) => { sheet.baoVe.moTa = d; return this; } };
  }
  activate() { this.nhatKy.push({ tab: this.ten, thaoTac: 'activate' }); if (this.bangTinh) this.bangTinh.tabDangMo = this.ten; return this; }
  clear() { this.nhatKy.push({ tab: this.ten, thaoTac: 'clear' }); this.data = []; this.dinhDang = {}; this.dam = {}; this.doRong = {}; this.congThuc = []; }
}

class FakeSpreadsheet {
  constructor(cacTab, nhatKy) {
    this.nhatKy = nhatKy;
    this.sheets = Object.keys(cacTab).map((ten) => this._moi(ten, cacTab[ten]));
    this.tabDangMo = this.sheets.length ? this.sheets[0].ten : null;
  }
  _moi(ten, du) { const s = new FakeSheet(ten, this.nhatKy, du); s.bangTinh = this; return s; }
  getId() { return 'tep-gia'; }
  getSpreadsheetTimeZone() { return 'Asia/Ho_Chi_Minh'; }
  getSheets() { return this.sheets; }
  getSheetByName(ten) { return this.sheets.find((s) => s.ten === ten) || null; }
  insertSheet(ten) { this.nhatKy.push({ tab: ten, thaoTac: 'insertSheet' }); if (this.getSheetByName(ten)) throw new Error('Đã có tab tên ' + ten); const s = this._moi(ten); this.sheets.push(s); return s; }
  deleteSheet(sheet) { this.nhatKy.push({ tab: sheet.ten, thaoTac: 'deleteSheet' }); this.sheets = this.sheets.filter((s) => s !== sheet); }
  setActiveSheet(sheet) { this.nhatKy.push({ tab: sheet.ten, thaoTac: 'setActiveSheet' }); this.tabDangMo = sheet.ten; return sheet; }
  // Bản chụp giá trị của một nhóm tab để so sánh trước và sau
  chup(tenCacTab) {
    return JSON.stringify(this.sheets.filter((s) => tenCacTab.includes(s.ten)).map((s) => [s.ten, s.data]));
  }
}

// chiaSe: {truyCap: 'PRIVATE'|'ANYONE_WITH_LINK'|..., nguoiKhac: ['email'], chu: 'email', khongDoc: true}
function taoMoiTruong(cacTab, chiaSe) {
  const nhatKy = [];
  const ss = new FakeSpreadsheet(cacTab, nhatKy);
  const cs = Object.assign({ truyCap: 'PRIVATE', nguoiKhac: [], chu: 'chu@vi-du.test', khongDoc: false }, chiaSe || {});
  const ui = { thongBao: [], menu: null, hopThoai: [] };
  const gio = { hienTai: '2026-10-14 08:00:00' };
  const nguoi = (e) => ({ getEmail: () => e });
  const globals = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ({
        alert: (n) => { ui.thongBao.push(n); },
        createMenu: (ten) => { const m = { ten, muc: [], addItem(nhan, ham) { this.muc.push([nhan, ham]); return this; }, addToUi() { ui.menu = this; return this; } }; return m; },
        showModelessDialog: (out, tieuDe) => { nhatKy.push({ tab: null, thaoTac: 'showModelessDialog' }); ui.hopThoai.push({ tieuDe, noiDung: out.getContent(), rong: out.rong, cao: out.cao }); }
      })
    },
    HtmlService: {
      createHtmlOutput: (noiDung) => ({ getContent: () => noiDung, setWidth(w) { this.rong = w; return this; }, setHeight(h) { this.cao = h; return this; }, setTitle(t) { this.tieuDe = t; return this; } })
    },
    DriveApp: {
      getFileById: () => {
        if (cs.khongDoc) throw new Error('Không có quyền Drive');
        return { getSharingAccess: () => cs.truyCap, getOwner: () => nguoi(cs.chu), getEditors: () => cs.nguoiKhac.map(nguoi), getViewers: () => [] };
      }
    },
    Utilities: { formatDate: () => gio.hienTai }
  };
  return { ss, ui, nhatKy, globals, datGio: (s) => { gio.hienTai = s; }, datChiaSe: (x) => Object.assign(cs, x) };
}

module.exports = { taoMoiTruong, FakeSheet, FakeSpreadsheet, a1, giaiA1, giaiVung, oTrongVung };
