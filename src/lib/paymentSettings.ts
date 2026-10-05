export interface PaymentSettings {
  // VietQR Bank Config
  bank_id: string; // e.g. 'MB', 'VCB', 'TCB'
  bank_name: string; // e.g. 'MB Bank (Quân Đội)'
  account_number: string; // e.g. '0903112233'
  account_holder: string; // e.g. 'CAISHOP ATELIER'
  qr_template: 'compact2' | 'compact' | 'qr_only' | 'print';
  transfer_syntax: string; // e.g. '{ORDER_CODE}'
  payment_instructions: string;

  // PayOS Open Banking Integration (Tự động sinh QR & Webhook tự khớp tiền)
  is_payos_enabled: boolean;
  payos_client_id: string;
  payos_api_key: string;
  payos_checksum_key: string;

  // Method toggles
  is_vietqr_enabled: boolean;
  is_cod_enabled: boolean;
  cod_note: string;
  cod_max_amount: number; // 0 for unlimited
}

export interface BankOption {
  id: string;
  name: string;
  shortName: string;
}

export const POPULAR_VIETNAMESE_BANKS: BankOption[] = [
  { id: 'MB', name: 'Ngân hàng TMCP Quân Đội (MB Bank)', shortName: 'MB Bank' },
  { id: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương VN (Vietcombank)', shortName: 'Vietcombank' },
  { id: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương VN (Techcombank)', shortName: 'Techcombank' },
  { id: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)', shortName: 'ACB' },
  { id: 'ICB', name: 'Ngân hàng TMCP Công Thương VN (VietinBank)', shortName: 'VietinBank' },
  { id: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển VN (BIDV)', shortName: 'BIDV' },
  { id: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank' },
  { id: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)', shortName: 'TPBank' },
  { id: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank' },
  { id: 'HDB', name: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)', shortName: 'HDBank' },
  { id: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)', shortName: 'VIB' },
  { id: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)', shortName: 'OCB' },
  { id: 'MSB', name: 'Ngân hàng TMCP Hàng Hải (MSB)', shortName: 'MSB' },
  { id: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)', shortName: 'SHB' }
];

export const QR_TEMPLATES = [
  { id: 'compact2', name: 'Compact 2 (Đầy đủ viền & logo ngân hàng - Khuyên dùng)', preview: 'Mẫu chuẩn đẹp' },
  { id: 'compact', name: 'Compact (Gọn gàng)', preview: 'Mẫu nhỏ gọn' },
  { id: 'qr_only', name: 'QR Only (Chỉ mã QR, không kèm khung thông tin)', preview: 'Chỉ mã QR' },
  { id: 'print', name: 'Print (Bản in độ phân giải cao)', preview: 'Dành cho in ấn' }
];

export const defaultPaymentSettings: PaymentSettings = {
  bank_id: 'MB',
  bank_name: 'MB Bank (Quân Đội)',
  account_number: '0903112233',
  account_holder: 'CAISHOP ATELIER',
  qr_template: 'compact2',
  transfer_syntax: '{ORDER_CODE}',
  payment_instructions: 'Mở ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới, hệ thống đã điền sẵn số tiền và mã đơn hàng của bạn.',
  is_payos_enabled: false,
  payos_client_id: '',
  payos_api_key: '',
  payos_checksum_key: '',
  is_vietqr_enabled: true,
  is_cod_enabled: true,
  cod_note: 'Chỉ áp dụng nội thành TP.HCM • Bao kiểm tra chất vải khi nhận hàng',
  cod_max_amount: 5000000
};

export function getVietQrUrl(settings: Partial<PaymentSettings>, amount: number, orderCode: string): string {
  const bank = settings.bank_id || defaultPaymentSettings.bank_id;
  const acc = (settings.account_number || defaultPaymentSettings.account_number).trim();
  const template = settings.qr_template || defaultPaymentSettings.qr_template;
  const syntax = settings.transfer_syntax || '{ORDER_CODE}';
  const memo = syntax.replace('{ORDER_CODE}', orderCode);
  const accHolder = encodeURIComponent((settings.account_holder || defaultPaymentSettings.account_holder).trim());
  const cleanAmount = Math.max(0, Math.round(amount || 0));

  return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${cleanAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${accHolder}`;
}
