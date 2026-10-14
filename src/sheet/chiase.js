// Kiểm tra mức chia sẻ của Sheet (spec sheet-result-output). Phần đánh giá là hàm thuần; phần đọc từ Drive nhận đối tượng
// `drive` (DriveApp hoặc bản giả khi test) nên không phụ thuộc phạm vi toàn cục.
//
// Quy tắc: chia sẻ cho bất kỳ ai có liên kết hoặc cho cả tên miền thì CHẶN; không đọc được mức chia sẻ thì CHẶN (không coi
// là an toàn); chia sẻ cho người cụ thể khác chủ sở hữu thì CẢNH BÁO; riêng tư thì cho qua. Không bao giờ ghi email vào kết quả.

var CHIA_SE_RONG = ['ANYONE', 'ANYONE_WITH_LINK', 'DOMAIN', 'DOMAIN_WITH_LINK'];
var HUONG_DAN_RIENG_TU = 'Hãy mở Chia sẻ, đổi "Quyền truy cập chung" thành "Bị hạn chế" rồi tính lại.';

// thongTin: {docDuoc: boolean, truyCap: chuỗi, soNguoiKhac: số}
// Trả {mucDo: 'on' | 'canhBao' | 'chan', ma, thongDiep}
function danhGiaChiaSe(thongTin) {
  if (!thongTin || !thongTin.docDuoc) {
    return { mucDo: 'chan', ma: 'CHIA_SE_KHONG_DOC_DUOC',
      thongDiep: 'Không đọc được mức chia sẻ của Sheet (có thể chưa cấp quyền Drive), nên không tính để tránh làm lộ dữ liệu lương. Hãy cấp quyền khi được hỏi rồi chạy lại.' };
  }
  var truyCap = String(thongTin.truyCap).toUpperCase();
  if (CHIA_SE_RONG.indexOf(truyCap) >= 0) {
    return { mucDo: 'chan', ma: 'CHIA_SE_RONG',
      thongDiep: 'Sheet đang được chia sẻ rộng (' + truyCap + '), không an toàn với dữ liệu lương. ' + HUONG_DAN_RIENG_TU };
  }
  if (thongTin.soNguoiKhac > 0) {
    return { mucDo: 'canhBao', ma: 'CHIA_SE_NGUOI_KHAC',
      thongDiep: 'Sheet đang được chia sẻ cho ' + thongTin.soNguoiKhac + ' người khác ngoài chủ sở hữu. Dữ liệu lương chỉ nên một người xem.' };
  }
  return { mucDo: 'on', ma: 'CHIA_SE_RIENG_TU', thongDiep: '' };
}

// Đọc thông tin chia sẻ của đúng tệp này. Mọi lỗi (thiếu quyền, tệp không tồn tại) coi như "không đọc được".
function docThongTinChiaSe(drive, fileId) {
  try {
    var file = drive.getFileById(fileId);
    var truyCap = file.getSharingAccess();
    var chu = file.getOwner();
    var emailChu = chu ? String(chu.getEmail()).toLowerCase() : '';
    var daDem = {};
    ['getEditors', 'getViewers'].forEach(function (ham) {
      (file[ham]() || []).forEach(function (u) {
        var e = String(u.getEmail()).toLowerCase();
        if (e !== '' && e !== emailChu) daDem[e] = true;
      });
    });
    return { docDuoc: true, truyCap: String(truyCap), soNguoiKhac: Object.keys(daDem).length };
  } catch (e) {
    return { docDuoc: false };
  }
}

// Tên tab kết quả không được trùng tab đầu vào (cấu hình, nhập tay, báo cáo kiểm kê) hay tab đầu ra khác.
// Trả chuỗi lỗi hoặc null.
function kiemTraTenTabKetQua(tenKetQua, khuVuc) {
  var ten = chuanHoaKhoa(tenKetQua);
  if (ten === '') return 'Tên tab kết quả đang trống';
  var cam = danhSachTabDauVao().concat([TEN_TAB.giaiThich, TEN_TAB.nhatKyHeThong, TEN_TAB.kyDaChot]);
  if (laTabChot(tenKetQua)) return 'Tên tab kết quả "' + tenKetQua + '" trùng với tab chỉ mục hoặc bản sao kỳ đã chốt nên bị từ chối';
  (khuVuc || []).forEach(function (k) { cam.push(k.tabBaoCao); });
  for (var i = 0; i < cam.length; i++) {
    if (chuanHoaKhoa(cam[i]) === ten) return 'Tên tab kết quả "' + tenKetQua + '" trùng với tab "' + cam[i] + '" nên bị từ chối để không ghi đè dữ liệu đầu vào';
  }
  return null;
}
