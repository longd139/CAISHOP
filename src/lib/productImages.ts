export interface ProductImagePlate {
  id: number;
  url: string;
  plate: string;
  tag: string;
  title: string;
  description: string;
}

const CATEGORY_IMAGE_PRESETS: Record<string, Omit<ProductImagePlate, 'id'>[]> = {
  'T-Shirt': [
    {
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop',
      plate: 'PLATE 01',
      tag: 'TOÀN CẢNH',
      title: 'Phom Dáng Tổng Thể (Front Look)',
      description: 'Phom dáng Oversized cấu trúc vuông đứng, vai trễ drop-shoulder hiện đại giữ thăng bằng hoàn hảo.'
    },
    {
      url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop',
      plate: 'PLATE 02',
      tag: 'CHẤT LIỆU',
      title: 'Bề Mặt Dệt Sợi (Heavy Cotton 250gsm)',
      description: '100% Cotton chải kỹ tự nhiên, dệt mật độ cao chống co rút, êm mịn và thông thoáng tối đa.'
    },
    {
      url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop',
      plate: 'PLATE 03',
      tag: 'FORM DÁNG',
      title: 'Góc Nghiêng & Độ Rủ Chuyển Động',
      description: 'Đường cắt may công thái học tạo độ buông rủ tự nhiên, không nhăn nhúm khi vận động cường độ cao.'
    },
    {
      url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&auto=format&fit=crop',
      plate: 'PLATE 04',
      tag: 'ĐƯỜNG MAY',
      title: 'Bo Cổ Dệt Rib & Đường May Kép',
      description: 'Cổ dệt bo rib spandex chống giãn nhão, đường may trần đè 2 kim gia cố chuẩn Atelier.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop',
      plate: 'PLATE 05',
      tag: 'GÓC SAU & LOOKBOOK',
      title: 'Mặt Sau & Phối Đồ Tổng Thể',
      description: 'Góc nhìn toàn cảnh phía sau và chi tiết form dáng khi phối trang phục trọn vẹn.'
    }
  ],
  'Shirt': [
    {
      url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop',
      plate: 'PLATE 01',
      tag: 'TOÀN CẢNH',
      title: 'Thiết Kế Cổ Điển (Oxford Regular Fit)',
      description: 'Đường nét thanh lịch chuẩn mực, tỷ lệ hoàn hảo để diện cùng suit jacket hoặc phối thường ngày.'
    },
    {
      url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&auto=format&fit=crop',
      plate: 'PLATE 02',
      tag: 'CHẤT LIỆU',
      title: 'Cấu Trúc Sợi Dệt Thoi Oxford Basketweave',
      description: 'Mặt dệt vân rổ thoáng khí, kháng nhăn tự nhiên, thấm hút mồ hôi và bền bỉ qua năm tháng.'
    },
    {
      url: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=1200&auto=format&fit=crop',
      plate: 'PLATE 03',
      tag: 'FORM DÁNG',
      title: 'Góc Nghiêng Tay Áo & Độ Cử Động',
      description: 'Mang tay cắt vát công thái học kết hợp xếp ly đôi ở măng sét cho cử động tay thoải mái nhất.'
    },
    {
      url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=1200&auto=format&fit=crop',
      plate: 'PLATE 04',
      tag: 'ĐƯỜNG MAY',
      title: 'Chân Cổ Button-Down & Cúc Khắc Laser',
      description: 'Chân cổ ép mex định hình cao cấp giữ form đứng vững, cúc ngọc trai khắc laser tỉ mỉ.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop',
      plate: 'PLATE 05',
      tag: 'GÓC SAU & LOOKBOOK',
      title: 'Mặt Sau & Phối Đồ Tổng Thể',
      description: 'Góc nhìn toàn cảnh phía sau và chi tiết form dáng khi phối trang phục trọn vẹn.'
    }
  ],
  'Pants': [
    {
      url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop',
      plate: 'PLATE 01',
      tag: 'TOÀN CẢNH',
      title: 'Phom Quần Slim-Fit Thuôn Gọn',
      description: 'Độ ôm vừa vặn từ đùi xuống gấu quần, tạo hiệu ứng kéo dài đôi chân và tôn dáng người mặc.'
    },
    {
      url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&auto=format&fit=crop',
      plate: 'PLATE 02',
      tag: 'CHẤT LIỆU',
      title: 'Sợi Denim 12oz Pha 2% Spandex Co Giãn',
      description: 'Vải chéo Twill mật độ cao tạo độ bền cơ học ấn tượng, wash mộc tự nhiên theo thời gian.'
    },
    {
      url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1200&auto=format&fit=crop',
      plate: 'PLATE 03',
      tag: 'FORM DÁNG',
      title: 'Góc Nhìn Nghiêng & Ống Quần Xếp Nếp',
      description: 'Độ mở ống tiêu chuẩn 16.5cm phối hợp ăn ý cùng mọi dòng giày từ Derby cổ điển đến Sneaker.'
    },
    {
      url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=1200&auto=format&fit=crop',
      plate: 'PLATE 04',
      tag: 'ĐƯỜNG MAY',
      title: 'Đinh Tán Đồng & Tag Da Thuộc Thủ Công',
      description: 'Đinh tán đồng đúc nguyên khối gia cố các góc túi, tag da dập nhiệt chìm sắc sảo phía sau lưng.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop',
      plate: 'PLATE 05',
      tag: 'GÓC SAU & LOOKBOOK',
      title: 'Mặt Sau & Phối Đồ Tổng Thể',
      description: 'Góc nhìn toàn cảnh phía sau và chi tiết form dáng khi phối trang phục trọn vẹn.'
    }
  ],
  'Jacket': [
    {
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&auto=format&fit=crop',
      plate: 'PLATE 01',
      tag: 'TOÀN CẢNH',
      title: 'Toàn Cảnh Bomber Minimalist Windbreaker',
      description: 'Cảm hứng phi công tối giản với phom áo phồng nhẹ, bảo vệ tối ưu trước gió lạnh và mưa nhẹ.'
    },
    {
      url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=1200&auto=format&fit=crop',
      plate: 'PLATE 02',
      tag: 'CHẤT LIỆU',
      title: 'Vải Kỹ Thuật Trượt Nước Mặt Nhám Lì',
      description: 'Lớp ngoài phủ công nghệ trượt nước DWR cao cấp, cản gió 100% nhưng vẫn đảm bảo độ thoát ẩm.'
    },
    {
      url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop',
      plate: 'PLATE 03',
      tag: 'FORM DÁNG',
      title: 'Cấu Trúc Thân & Bo Chun Dệt Kim Đàn Hồi',
      description: 'Bo thun gân dệt nguyên bản tại cổ áo và thắt lưng ôm êm ái, giữ ấm cơ thể ổn định.'
    },
    {
      url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&auto=format&fit=crop',
      plate: 'PLATE 04',
      tag: 'ĐƯỜNG MAY',
      title: 'Khóa Kéo Phủ Mờ & Túi Trong Bảo Mật',
      description: 'Dây kéo kim loại cao cấp dập chìm logo Atelier, bên trong lót lụa thông khí cùng túi phụ ẩn an toàn.'
    }
  ],
  'Polo': [
    {
      url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=1200&auto=format&fit=crop',
      plate: 'PLATE 01',
      tag: 'TOÀN CẢNH',
      title: 'Toàn Cảnh Thiết Kế Áo Polo Pique Cổ Điển',
      description: 'Sự pha trộn hoàn mỹ giữa sự lịch lãm của áo sơ mi và tính năng động phóng khoáng của áo thun.'
    },
    {
      url: 'https://images.unsplash.com/photo-1625910513413-5629472e3ea8?w=1200&auto=format&fit=crop',
      plate: 'PLATE 02',
      tag: 'CHẤT LIỆU',
      title: 'Bề Mặt Dệt Mắt Chim Tổ Ong (Cotton Pique)',
      description: 'Mắt dệt dạng hạt tổ ong tạo kênh lưu thông không khí vi mô, thấm hút và khô cực nhanh.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&auto=format&fit=crop',
      plate: 'PLATE 03',
      tag: 'FORM DÁNG',
      title: 'Phom Suông Thoải Mái & Bo Tay Ôm Vừa Vặn',
      description: 'Bo cánh tay ôm nhẹ nhàng tôn bắp tay, phom thân áo buông tự nhiên không lộ khuyết điểm.'
    },
    {
      url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1200&auto=format&fit=crop',
      plate: 'PLATE 04',
      tag: 'ĐƯỜNG MAY',
      title: 'Nẹp Cúc Ép Nhiệt & Xẻ Tà Đáy Tinh Tế',
      description: 'Nẹp cổ áo giữ phom phẳng phiu sau nhiều lần giặt, đường xẻ tà lai áo hỗ trợ vận động tối ưu.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop',
      plate: 'PLATE 05',
      tag: 'GÓC SAU & LOOKBOOK',
      title: 'Mặt Sau & Phối Đồ Tổng Thể',
      description: 'Góc nhìn toàn cảnh phía sau và chi tiết form dáng khi phối trang phục trọn vẹn.'
    }
  ]
};

const DEFAULT_PRESET: Omit<ProductImagePlate, 'id'>[] = [
  {
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&auto=format&fit=crop',
    plate: 'PLATE 01',
    tag: 'TOÀN CẢNH',
    title: 'Phom Dáng Toàn Cảnh (Lookbook 01)',
    description: 'Thần thái tổng thể và tỉ lệ chuẩn mực của thiết kế được may đo tỉ mỉ theo tiêu chuẩn Atelier.'
  },
  {
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop',
    plate: 'PLATE 02',
    tag: 'CHẤT LIỆU',
    title: 'Cận Cảnh Kết Cấu & Bề Mặt Sợi Dệt',
    description: 'Chất liệu sợi tự nhiên tuyển chọn, bề mặt dệt đan khít có độ bền cơ học cao và êm dịu cho làn da.'
  },
  {
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&auto=format&fit=crop',
    plate: 'PLATE 03',
    tag: 'FORM DÁNG',
    title: 'Góc Nghiêng Cử Động & Thần Thái Phom',
    description: 'Cắt may công thái học tạo độ buông rủ thanh thoát, giữ dáng áo thẳng đẹp ở mọi chuyển động.'
  },
  {
    url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&auto=format&fit=crop',
    plate: 'PLATE 04',
    tag: 'ĐƯỜNG MAY',
    title: 'Chi Tiết Kỹ Thuật May Đo & Hoàn Thiện',
    description: 'Từng mũi kim đều tăm tắp, bo viền giấu chỉ chắc chắn, thể hiện trọn vẹn tinh thần thủ công cao cấp.'
    },
    {
      url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&auto=format&fit=crop',
      plate: 'PLATE 05',
      tag: 'GÓC SAU & LOOKBOOK',
      title: 'Mặt Sau & Phối Đồ Tổng Thể',
      description: 'Góc nhìn toàn cảnh phía sau và chi tiết form dáng khi phối trang phục trọn vẹn.'
    }
];

/**
 * Trả về danh sách đúng 4 ảnh cho sản phẩm kèm metadata phục vụ bộ sưu tập chi tiết
 */
export function getProductGallery(product?: {
  id?: string;
  category?: string;
  image_url?: string | null;
  name?: string;
} | null): ProductImagePlate[] {
  if (!product) {
    return DEFAULT_PRESET.map((p, idx) => ({ ...p, id: idx + 1 }));
  }

  // 1. Kiểm tra xem image_url có chứa danh sách nhiều ảnh (JSON array hoặc cách nhau bằng dấu phẩy) không
  let customUrls: string[] = [];
  if (product.image_url) {
    const raw = product.image_url.trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          customUrls = parsed.filter(Boolean);
        }
      } catch {
        customUrls = [raw];
      }
    } else if (raw.includes(',')) {
      customUrls = raw.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      customUrls = [raw];
    }
  }

  // 2. Tìm bộ preset phù hợp theo category hoặc id
  const categoryKey = Object.keys(CATEGORY_IMAGE_PRESETS).find(
    k => product.category && product.category.toLowerCase().includes(k.toLowerCase())
  ) || 'T-Shirt';

  const basePreset = CATEGORY_IMAGE_PRESETS[categoryKey] || DEFAULT_PRESET;

  // 3. Ghép bộ 5 ảnh: ưu tiên custom URLs
  const result: ProductImagePlate[] = basePreset.slice(0, 5).map((preset, idx) => {
    const url = customUrls[idx] || (idx === 0 && customUrls[0] ? customUrls[0] : preset.url);
    return {
      id: idx + 1,
      url,
      plate: preset.plate || `PLATE 0${idx + 1}`,
      tag: preset.tag,
      title: preset.title,
      description: preset.description
    };
  });

  return result;
}

/**
 * Lấy ra URL ảnh chính đầu tiên an toàn, hỗ trợ JSON array hoặc chuỗi URL đơn lẻ
 */
export function getPrimaryImageUrl(imageUrl?: string | null, fallback = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'): string {
  if (!imageUrl) return fallback;
  const raw = imageUrl.trim();
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        return parsed[0];
      }
    } catch {
      // fallback to raw
    }
  } else if (raw.includes(',')) {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0 && parts[0]) return parts[0];
  }
  return raw || fallback;
}
