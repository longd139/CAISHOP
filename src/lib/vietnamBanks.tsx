/**
 * Danh sách toàn bộ các ngân hàng và ví điện tử tại Việt Nam (hệ thống Napas / VietQR / SBV)
 * Hỗ trợ tìm kiếm nhanh theo: Tên thương hiệu, tên viết tắt, mã cổ phiếu (VCB, TCB, MB...), và tên tiếng Việt đầy đủ.
 */

export interface VietnamBankItem {
  id: string; // Mã chuẩn / viết tắt (VCB, MB, TCB...)
  shortName: string; // Tên hiển thị ngắn gọn & thông dụng khi chọn
  fullName: string; // Tên giao dịch đầy đủ tiếng Việt
  keywords?: string; // Từ khóa tìm kiếm bổ sung
}

export const ALL_VIETNAMESE_BANKS: VietnamBankItem[] = [
  // --- TOP NGÂN HÀNG THƯƠNG MẠI PHỔ BIẾN NHẤT ---
  {
    id: 'VCB',
    shortName: 'Vietcombank (VCB)',
    fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    keywords: 'ngoai thuong vietcom vcb'
  },
  {
    id: 'MB',
    shortName: 'MB Bank (Quân Đội)',
    fullName: 'Ngân hàng TMCP Quân Đội',
    keywords: 'quan doi mb mbbank'
  },
  {
    id: 'TCB',
    shortName: 'Techcombank (TCB)',
    fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    keywords: 'ky thuong tech techcom tcb'
  },
  {
    id: 'CTG',
    shortName: 'VietinBank (CTG)',
    fullName: 'Ngân hàng TMCP Công Thương Việt Nam',
    keywords: 'cong thuong vietin ctg icb'
  },
  {
    id: 'BIDV',
    shortName: 'BIDV',
    fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    keywords: 'dau tu va phat trien bidv'
  },
  {
    id: 'VBA',
    shortName: 'Agribank (VBA)',
    fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    keywords: 'nong nghiep nong thon agri agribank vba'
  },
  {
    id: 'ACB',
    shortName: 'ACB (Á Châu)',
    fullName: 'Ngân hàng TMCP Á Châu',
    keywords: 'a chau acb'
  },
  {
    id: 'VPB',
    shortName: 'VPBank',
    fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    keywords: 'viet nam thinh vuong vpbank vpb'
  },
  {
    id: 'TPB',
    shortName: 'TPBank (Tiên Phong)',
    fullName: 'Ngân hàng TMCP Tiên Phong',
    keywords: 'tien phong tpbank tpb'
  },
  {
    id: 'STB',
    shortName: 'Sacombank (STB)',
    fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    keywords: 'sai gon thuong tin sacombank stb sacom'
  },
  {
    id: 'HDB',
    shortName: 'HDBank',
    fullName: 'Ngân hàng TMCP Phát triển TP.HCM',
    keywords: 'phat trien tphcm hdbank hdb'
  },
  {
    id: 'VIB',
    shortName: 'VIB (Quốc Tế)',
    fullName: 'Ngân hàng TMCP Quốc tế Việt Nam',
    keywords: 'quoc te vib'
  },
  {
    id: 'SHB',
    shortName: 'SHB',
    fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    keywords: 'sai gon ha noi shb'
  },
  {
    id: 'MSB',
    shortName: 'MSB (Hàng Hải)',
    fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam',
    keywords: 'hang hai msb maritime bank'
  },
  {
    id: 'OCB',
    shortName: 'OCB (Phương Đông)',
    fullName: 'Ngân hàng TMCP Phương Đông',
    keywords: 'phuong dong ocb'
  },
  {
    id: 'LPB',
    shortName: 'LPBank (Lộc Phát / Bưu Điện Liên Việt)',
    fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam',
    keywords: 'loc phat buu dien lien viet lpb lienvietpostbank'
  },
  {
    id: 'SEAB',
    shortName: 'SeABank (Đông Nam Á)',
    fullName: 'Ngân hàng TMCP Đông Nam Á',
    keywords: 'dong nam a seabank seab'
  },
  {
    id: 'EIB',
    shortName: 'Eximbank (EIB)',
    fullName: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam',
    keywords: 'xuat nhap khau eximbank eib exim'
  },
  {
    id: 'BAB',
    shortName: 'Bac A Bank (Bắc Á)',
    fullName: 'Ngân hàng TMCP Bắc Á',
    keywords: 'bac a bacabank bab'
  },
  {
    id: 'PVCB',
    shortName: 'PVcomBank (Đại Chúng)',
    fullName: 'Ngân hàng TMCP Đại Chúng Việt Nam',
    keywords: 'dai chung pvcom pvcombank pvcb dau khi'
  },
  {
    id: 'NAB',
    shortName: 'Nam A Bank (Nam Á)',
    fullName: 'Ngân hàng TMCP Nam Á',
    keywords: 'nam a namabank nab'
  },
  {
    id: 'BVB',
    shortName: 'BVBank (Bản Việt / Viet Capital Bank)',
    fullName: 'Ngân hàng TMCP Bản Việt',
    keywords: 'ban viet viet capital bvbank bvb'
  },
  {
    id: 'ABB',
    shortName: 'ABBank (An Bình)',
    fullName: 'Ngân hàng TMCP An Bình',
    keywords: 'an binh abbank abb'
  },
  {
    id: 'VAB',
    shortName: 'VietABank (Việt Á)',
    fullName: 'Ngân hàng TMCP Việt Á',
    keywords: 'viet a vietabank vab'
  },
  {
    id: 'KLB',
    shortName: 'Kienlongbank (Kiên Long)',
    fullName: 'Ngân hàng TMCP Kiên Long',
    keywords: 'kien long kienlongbank klb'
  },
  {
    id: 'BAOVIET',
    shortName: 'BaoViet Bank (Bảo Việt)',
    fullName: 'Ngân hàng TMCP Bảo Việt',
    keywords: 'bao viet baovietbank'
  },
  {
    id: 'SGB',
    shortName: 'Saigonbank (Sài Gòn Công Thương)',
    fullName: 'Ngân hàng TMCP Sài Gòn Công Thương',
    keywords: 'sai gon cong thuong saigonbank sgb'
  },
  {
    id: 'PGB',
    shortName: 'PGBank (Thịnh Vượng & Phát Triển / Petrolimex)',
    fullName: 'Ngân hàng TMCP Thịnh vượng và Phát triển',
    keywords: 'thinh vuong va phat trien petrolimex pgbank pgb'
  },
  {
    id: 'SCB',
    shortName: 'SCB (Sài Gòn)',
    fullName: 'Ngân hàng TMCP Sài Gòn',
    keywords: 'sai gon scb'
  },
  {
    id: 'OCEAN',
    shortName: 'OceanBank (Đại Dương)',
    fullName: 'Ngân hàng Thương mại TNHH MTV Đại Dương',
    keywords: 'dai duong oceanbank'
  },
  {
    id: 'GPB',
    shortName: 'GPBank (Dầu Khí Toàn Cầu)',
    fullName: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu',
    keywords: 'dau khi toan cau gpbank gpb'
  },
  {
    id: 'CB',
    shortName: 'CB Bank (Xây Dựng)',
    fullName: 'Ngân hàng Thương mại TNHH MTV Xây Dựng',
    keywords: 'xay dung cbbank cb'
  },

  // --- NGÂN HÀNG SỐ & VÍ ĐIỆN TỬ PHỔ BIẾN ---
  {
    id: 'CAKE',
    shortName: 'Cake by VPBank',
    fullName: 'Ngân hàng số Cake by VPBank',
    keywords: 'ngan hang so cake vpbank'
  },
  {
    id: 'TIMO',
    shortName: 'Timo by BVBank',
    fullName: 'Ngân hàng số Timo by Bản Việt',
    keywords: 'ngan hang so timo ban viet bvbank'
  },
  {
    id: 'TNEX',
    shortName: 'TNEX by MSB',
    fullName: 'Ngân hàng số TNEX by MSB',
    keywords: 'ngan hang so tnex msb'
  },
  {
    id: 'LIO',
    shortName: 'Liobank by OCB',
    fullName: 'Ngân hàng số Liobank by OCB',
    keywords: 'ngan hang so liobank ocb'
  },
  {
    id: 'MOMO',
    shortName: 'MoMo',
    fullName: 'Ví điện tử MoMo',
    keywords: 'vi momo'
  },
  {
    id: 'ZALOPAY',
    shortName: 'ZaloPay',
    fullName: 'Ví điện tử ZaloPay',
    keywords: 'vi zalopay zalo'
  },
  {
    id: 'VIETTELPAY',
    shortName: 'Viettel Money (ViettelPay)',
    fullName: 'Tiền di động Viettel Money',
    keywords: 'viettel money viettelpay vtpay'
  },
  {
    id: 'VNPT',
    shortName: 'VNPT Money',
    fullName: 'Tiền di động VNPT Money',
    keywords: 'vnpt money vnptpay'
  },

  // --- NGÂN HÀNG QUỐC TẾ TẠI VIỆT NAM ---
  {
    id: 'SHINHAN',
    shortName: 'Shinhan Bank',
    fullName: 'Ngân hàng TNHH MTV Shinhan Việt Nam',
    keywords: 'shinhan han quoc'
  },
  {
    id: 'WOORI',
    shortName: 'Woori Bank',
    fullName: 'Ngân hàng TNHH MTV Woori Việt Nam',
    keywords: 'woori han quoc'
  },
  {
    id: 'SCVN',
    shortName: 'Standard Chartered',
    fullName: 'Ngân hàng TNHH MTV Standard Chartered Việt Nam',
    keywords: 'standard chartered scvn'
  },
  {
    id: 'HSBC',
    shortName: 'HSBC Việt Nam',
    fullName: 'Ngân hàng TNHH MTV HSBC Việt Nam',
    keywords: 'hsbc'
  },
  {
    id: 'PUBLIC',
    shortName: 'Public Bank Vietnam',
    fullName: 'Ngân hàng TNHH MTV Public Việt Nam',
    keywords: 'public bank pbvn'
  },
  {
    id: 'HONGLEONG',
    shortName: 'Hong Leong Bank',
    fullName: 'Ngân hàng TNHH MTV Hong Leong Việt Nam',
    keywords: 'hong leong hlbank'
  },
  {
    id: 'CIMB',
    shortName: 'CIMB Bank',
    fullName: 'Ngân hàng TNHH MTV CIMB Việt Nam',
    keywords: 'cimb'
  },
  {
    id: 'UOB',
    shortName: 'UOB Việt Nam',
    fullName: 'Ngân hàng TNHH MTV United Overseas Bank Việt Nam',
    keywords: 'uob united overseas'
  },
  {
    id: 'CITI',
    shortName: 'Citibank Việt Nam',
    fullName: 'Chi nhánh Ngân hàng Citibank tại Việt Nam',
    keywords: 'citibank citi'
  },
  {
    id: 'HANA',
    shortName: 'KEB Hana Bank',
    fullName: 'Chi nhánh Ngân hàng KEB Hana tại Việt Nam',
    keywords: 'keb hana'
  },
  {
    id: 'IBK',
    shortName: 'IBK (Industrial Bank of Korea)',
    fullName: 'Ngân hàng Công nghiệp Hàn Quốc tại Việt Nam',
    keywords: 'ibk industrial bank of korea'
  },
  {
    id: 'KBANK',
    shortName: 'KBank (Kasikornbank)',
    fullName: 'Chi nhánh Ngân hàng Kasikornbank tại Việt Nam',
    keywords: 'kbank kasikornbank thai lan'
  },
  {
    id: 'BANGKOK',
    shortName: 'Bangkok Bank',
    fullName: 'Chi nhánh Ngân hàng Bangkok tại Việt Nam',
    keywords: 'bangkok bank'
  },
  {
    id: 'IVB',
    shortName: 'Indovina Bank (IVB)',
    fullName: 'Ngân hàng TNHH Indovina',
    keywords: 'indovina ivb'
  },
  {
    id: 'VRB',
    shortName: 'VRB (Việt - Nga)',
    fullName: 'Ngân hàng Liên doanh Việt - Nga',
    keywords: 'viet nga vrb'
  },
  {
    id: 'COOP',
    shortName: 'Co-opBank (Hợp Tác Xã)',
    fullName: 'Ngân hàng Hợp tác xã Việt Nam',
    keywords: 'hop tac xa coopbank'
  },
  {
    id: 'VBSP',
    shortName: 'VBSP (Chính Sách Xã Hội)',
    fullName: 'Ngân hàng Chính sách Xã hội Việt Nam',
    keywords: 'chinh sach xa hoi vbsp'
  }
];

/**
 * Component render datalist chứa toàn bộ ngân hàng tại Việt Nam.
 * Người dùng có thể gõ bất kỳ từ khóa nào (tên viết tắt, tên tiếng Việt, tên thương hiệu) để tìm kiếm và chọn nhanh.
 */
export function VietnamBankDatalist({ id = 'bank-list-suggestions' }: { id?: string }) {
  return (
    <datalist id={id}>
      {ALL_VIETNAMESE_BANKS.map((b) => (
        <option key={b.id} value={b.shortName} label={b.fullName}>
          {b.shortName} - {b.fullName}
        </option>
      ))}
    </datalist>
  );
}
