// Log lỗi tối thiểu (chuẩn Sapo 3.2, mục D5). Hàm thuần.
//
// Log phục vụ gỡ lỗi, KHÔNG phải nơi lưu dữ liệu người dùng. Mỗi dòng chỉ gồm:
//   thoiDiem  : thời điểm ghi (do bên gọi truyền vào)
//   muc       : 'loi' | 'canhBao' | 'thongTin'
//   ma        : loại lỗi (ví dụ MA_HANG_LA)
//   truong    : tên trường liên quan (tên tham số, chỉ số, nguồn, khu vực), không phải giá trị
//   phamVi    : loại phạm vi bị chặn ('toanBo', 'nguon', 'km', 'tv', 'qk', 'doiSoat' hoặc null)
// Không bao giờ ghi: tài khoản, tên, số lương, thu nhập, số tiền, nội dung nhật ký công việc.

var TRUONG_DUOC_GHI = ['thamSo', 'chiSo', 'nguon', 'khuVuc'];

function truongLienQuan(thongBao) {
  var kq = [];
  var ct = thongBao.chiTiet || {};
  TRUONG_DUOC_GHI.forEach(function (k) {
    if (ct[k] !== undefined && ct[k] !== null && typeof ct[k] === 'string') kq.push(k + '=' + ct[k]);
  });
  return kq;
}

function phamViLog(chan) {
  if (!chan) return null;
  return String(chan).split(':')[0];
}

function taoLog(ketQua, thoiDiem) {
  var dong = [];
  function them(ds) {
    (ds || []).forEach(function (t) {
      dong.push({ thoiDiem: thoiDiem, muc: t.muc, ma: t.ma, truong: truongLienQuan(t), phamVi: phamViLog(t.chan) });
    });
  }
  them(ketQua.loi);
  them(ketQua.canhBao);
  return dong;
}
