// DOM giả tối thiểu, viết tay, để kiểm thử logic hiển thị của trang bảng điều khiển bằng Node (không thêm thư viện kiểu jsdom).
// Không thay thế trình duyệt thật: hành vi bố cục, kiểu dáng và HtmlService thật vẫn phải kiểm tay trên Sheet.
// Mọi cách đưa chuỗi thành mã HTML (innerHTML, outerHTML, insertAdjacentHTML, document.write) đều NÉM LỖI để test đỏ ngay.
'use strict';

class FakeNode {
  constructor(tag) {
    this.tag = tag; this.children = []; this._text = ''; this.className = ''; this.attrs = {};
    this.listeners = {}; this.disabled = false; this.checked = false; this.value = ''; this.parent = null;
  }
  set textContent(v) { this._text = v === null || v === undefined ? '' : String(v); this.children = []; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set innerHTML(v) { throw new Error('innerHTML bị cấm (đưa chuỗi dữ liệu thành mã HTML)'); }
  get innerHTML() { throw new Error('innerHTML bị cấm'); }
  set outerHTML(v) { throw new Error('outerHTML bị cấm'); }
  insertAdjacentHTML() { throw new Error('insertAdjacentHTML bị cấm'); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'disabled') this.disabled = true; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(tenSuKien, f) { (this.listeners[tenSuKien] = this.listeners[tenSuKien] || []).push(f); }
  phat(tenSuKien) { (this.listeners[tenSuKien] || []).forEach((f) => f({ target: this })); }
  click() { if (this.disabled) return false; this.phat('click'); return true; }
  duyet(f, ra = []) { if (f(this)) ra.push(this); this.children.forEach((c) => c.duyet(f, ra)); return ra; }
  tim(f) { return this.duyet(f); }
}

class FakeDocument {
  constructor() { this.goc = new FakeNode('div'); this.tatCa = []; this.docWrite = 0; }
  createElement(tag) { const n = new FakeNode(tag); this.tatCa.push(n); return n; }
  getElementById(id) { return id === 'goc' ? this.goc : null; }
  write() { throw new Error('document.write bị cấm'); }
}

// google.script.run giả: ghi lại lời gọi, test tự quyết định lúc nào trả về thành công hay thất bại.
function taoGoogleGia() {
  const goi = [];
  const run = {
    withSuccessHandler(ok) {
      return {
        withFailureHandler(fail) {
          return new Proxy({}, { get: (_, ten) => (...tham) => { goi.push({ ten, tham, thanhCong: ok, thatBai: fail }); } });
        }
      };
    }
  };
  return { gg: { script: { run } }, goi };
}

// Tiện ích tìm phần tử
const chuaChu = (n, chu) => n.textContent.includes(chu);
function nutCoChu(doc, chu) { return doc.goc.tim((n) => n.tag === 'button' && n.textContent === chu); }
function tatCaChu(doc) { return doc.goc.textContent; }

module.exports = { FakeNode, FakeDocument, taoGoogleGia, chuaChu, nutCoChu, tatCaChu };
