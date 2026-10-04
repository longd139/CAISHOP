import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';

export const defaultContent = {
  header: {
    brand_name: 'ATELIER',
    menu_items: [
      { id: '1', label: 'NEW', href: '/#hero', is_active: true, order: 1 },
      { id: '2', label: 'PRODUCT', href: '/products', is_active: true, order: 2 },
      { id: '3', label: 'STUDIO', href: '/#studio', is_active: true, order: 3 },
      { id: '4', label: 'ABOUT', href: '/#manifesto', is_active: true, order: 4 },
    ]
  },
  home: {
    // Khối 1: Hero Banner
    hero_badge: 'TUYỂN TẬP ĐỒ HIỆU ĐƯƠNG ĐẠI / CÁ SẤU • XI-KÊ • TÔ-MÌ • LÊ-VY',
    hero_title: 'ĐỒ HIỆU CHẤT LƯỢNG. ĐỊNH HÌNH PHONG CÁCH.',
    hero_description: 'Bộ tứ kinh điển hội tụ tại Cái Shop: từ chất vải pique dệt kim trứ danh nhà Cá Sấu, đường nét denim tối giản phong trần của Xi-Kê, năng động chất Mỹ cùng Tô-Mì đến những mẫu quần bò đinh tán bất hủ của Lê-Vy. Hàng có sẵn kho, cập nhật số lượng thời gian thực.',
    hero_cta_1: 'Săn đồ hiệu ngay',
    hero_cta_2: 'Bảng chọn size chuẩn',
    hero_image_url: '/images/hero-atelier-wide.jpg',
    
    // Dải 4 Khung Quy trình dưới Hero (4-Plate Process Strip)
    hero_plate1_num: '001',
    hero_plate1_tag: 'Áo Polo',
    hero_plate1_title: 'DÒNG CÁ SẤU',
    hero_plate1_logo: '/image/lacoste.png',

    hero_plate2_num: '002',
    hero_plate2_tag: 'Denim & Tee',
    hero_plate2_title: 'DÒNG XI-KÊ',
    hero_plate2_logo: '/image/CK.png',

    hero_plate3_num: '003',
    hero_plate3_tag: 'Phong cách Mỹ',
    hero_plate3_title: 'DÒNG TÔ-MÌ',
    hero_plate3_logo: '/image/tommy.png',

    hero_plate4_num: '004',
    hero_plate4_tag: 'Jeans Đinh Tán',
    hero_plate4_title: 'DÒNG LÊ-VY',
    hero_plate4_logo: '/image/LEVIS.png',
    
    // Khối 2: Marquee
    marquee_text: 'CÁI SHOP • TUYỂN TẬP ĐỒ HIỆU KINH ĐIỂN • POLO CÁ SẤU CHẤT VẢI PIQUE • TEE & DENIM XI-KÊ TỐI GIẢN • SƠ MI TÔ-MÌ ĐỎ TRẮNG XANH • JEANS BÒ LÊ-VY ĐINH TÁN • KHO D1 THỜI GIAN THỰC • CHECK SIZE TỨC THÌ •',
    
    // Khối 3: Bộ sưu tập
    collection_badge: 'LOOKBOOK 4 HÃNG NỔI TIẾNG',
    collection_title: 'THIẾT KẾ ĐƯỢC CHĂM CHÚT NHẤT',
    
    // Khối 4: Studio Fitting Room
    studio_badge: 'PHÒNG MAY & THỬ SIZE CHUẨN XÁC',
    studio_title: 'Chất vải nguyên bản. Form dáng vừa vặn từng centimet.',
    studio_narrative: 'Mỗi chiếc Polo Cá Sấu, quần jeans Lê-Vy hay áo thun Xi-Kê đều được chúng tôi kiểm tra kỹ lưỡng độ co giãn, form dáng thực tế và mã vạch trước khi lên kệ. Đặt hàng qua mã VietQR động, sổ cái D1 xác thực giao dịch sau 3 giây để đóng gói giao ngay.',
    studio_canvas: 'Form Á / Âu chuẩn size',
    studio_ledger: 'Kho hàng thực tế D1 (Singapore)',
    
    // Khối 5: Tuyên ngôn
    manifesto_badge: 'CAM KẾT TẠI CÁI SHOP',
    manifesto_quote: 'Chúng tôi không bán hàng trôi nổi. Từ thớ vải dệt tổ ong dày dặn của dòng Cá Sấu đến từng đường may chỉ vàng đinh tán đồng nhà Lê-Vy: tên gọi biến tấu cho vui vẻ gần gũi, nhưng chất lượng vải và độ bền luôn phải đạt điểm mười.',
    manifesto_signature: 'CÁI SHOP / BỘ TỨ CÁ SẤU • XI-KÊ • TÔ-MÌ • LÊ-VY',
    
    // Khối 6: Kêu gọi hành động CTA
    cta_badge: 'SỐ LƯỢNG MỖI MẪU CÓ HẠN',
    cta_title: 'SỞ HỮU ITEM ĐỒ HIỆU ƯA THÍCH',
    cta_button_text: 'CHỐT ĐƠN NGAY',
    cta_note: 'Quét mã VietQR tự động xác nhận đơn • Bao kiểm tra chất vải khi nhận hàng',
    
    // Khối 7: Chân trang Storefront
    footer_brand: 'CÁI SHOP - HỘI TỤ ĐỒ HIỆU TUYỂN CHỌN',
    footer_address: 'Hà Nội • TP. Hồ Chí Minh • Hệ thống kho vận Cloudflare D1',
    footer_copyright: '© 2026 CÁI SHOP. ĐỒNG HÀNH CÙNG CÁ SẤU, XI-KÊ, TÔ-MÌ VÀ LÊ-VY.'
  },
  products: {
    badge: 'COLLECTION 01 • EDITIONS CATALOGUE',
    title: 'THE PRODUCT ARCHIVE',
    subhead: 'Curated minimalist silhouettes, structured tailoring, and heavy cotton garments. Synchronized in real time with Cloudflare D1 inventory.',
    fulfillment_tag: 'WH-HN-01 (HA NOI FULFILLMENT)',
    empty_state_text: 'Không tìm thấy sản phẩm phù hợp với bộ lọc.'
  },
  studio: {
    badge: 'The Fitting Room',
    title: 'Crafted at the edge. Verified by code.',
    narrative: 'Every garment is linked to Cloudflare D1 distributed edge storage. Zero speculative inventory, instant double-entry accounting records, and automated dispatch upon bank confirmation.',
    spec_canvas: 'Full-bleed monochrome UI',
    spec_ledger: 'Cloudflare D1 APAC (Singapore)',
    spec_sla: 'Auto-reconciled under 3s'
  },
  about: {
    badge: 'Manifesto',
    headline: 'NO ORNAMENT. NO COMPROMISE.',
    body_text: 'We build garments the same way we architect software: stripped of decorative excess, mathematically structured, and committed to pure material truth. Autonomous cashflow and inventory control run silently in the background.',
    signature: 'ATELIER AT THE EDGE • 2026'
  }
};

export async function GET() {
  try {
    const rawHeader = getSiteContent('header', null);
    const rawHome = getSiteContent('home', null);
    const rawProducts = getSiteContent('products', null);
    const rawStudio = getSiteContent('studio', null);
    const rawAbout = getSiteContent('about', null);

    const header = { ...defaultContent.header, ...(rawHeader || {}) };
    const home = { ...defaultContent.home, ...(rawHome || {}) };
    const products = { ...defaultContent.products, ...(rawProducts || {}) };
    const studio = { ...defaultContent.studio, ...(rawStudio || {}) };
    const about = { ...defaultContent.about, ...(rawAbout || {}) };

    const siteData = {
      header,
      home,
      products,
      studio,
      about
    };

    return NextResponse.json({
      success: true,
      data: siteData,
      content: siteData
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json({ success: false, error: 'Thiếu section hoặc data' }, { status: 400 });
    }

    const fallback = (defaultContent as any)[section] || {};
    const existing = getSiteContent(section, null) || fallback;
    const merged = { ...existing, ...data };
    
    const result = setSiteContent(section, merged);
    return NextResponse.json({ success: true, result, data: merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
