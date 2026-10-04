import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  product_ids: string[];
}

export interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
  items: SubCategory[];
}

export interface BrandCollection {
  id: string;
  brand: string;
  slug: string;
  description?: string;
  groups: CategoryGroup[];
}

export const defaultCollections: BrandCollection[] = [
  {
    id: 'col-atelier',
    brand: 'Atelier Originals',
    slug: 'atelier-originals',
    description: 'Dòng sản phẩm may đo độc bản cao cấp Atelier CAISHOP',
    groups: [
      {
        id: 'grp-atelier-ao',
        name: 'Áo',
        slug: 'ao',
        items: [
          { id: 'sub-tsh', name: 'Áo thun', slug: 'ao-thun', product_ids: ['prod-1'] },
          { id: 'sub-smi', name: 'Áo sơ mi', slug: 'ao-so-mi', product_ids: ['prod-2'] },
          { id: 'sub-pol', name: 'Áo Polo', slug: 'ao-polo', product_ids: ['prod-5'] },
        ]
      },
      {
        id: 'grp-atelier-quan',
        name: 'Quần',
        slug: 'quan',
        items: [
          { id: 'sub-jea', name: 'Quần Jean', slug: 'quan-jean', product_ids: ['prod-3'] },
          { id: 'sub-tay', name: 'Quần Tây', slug: 'quan-tay', product_ids: [] },
          { id: 'sub-sho', name: 'Quần Shorts', slug: 'quan-shorts', product_ids: [] },
        ]
      },
      {
        id: 'grp-atelier-khoac',
        name: 'Áo khoác',
        slug: 'ao-khoac',
        items: [
          { id: 'sub-bmb', name: 'Áo khoác Bomber', slug: 'ao-khoac-bomber', product_ids: ['prod-4'] },
          { id: 'sub-blz', name: 'Áo Blazer & Suit', slug: 'ao-blazer', product_ids: [] },
        ]
      }
    ]
  },
  {
    id: 'col-lacoste',
    brand: 'Lacoste (Cá Sấu)',
    slug: 'lacoste',
    description: 'Huyền thoại thể thao phong cách Pháp với chất vải Pique danh tiếng',
    groups: [
      {
        id: 'grp-lacoste-ao',
        name: 'Áo',
        slug: 'ao',
        items: [
          { id: 'sub-lacoste-polo', name: 'Áo Polo Pique', slug: 'ao-polo-pique', product_ids: ['prod-5'] },
          { id: 'sub-lacoste-tee', name: 'Áo thun thể thao', slug: 'ao-thun-the-thao', product_ids: [] },
        ]
      },
      {
        id: 'grp-lacoste-khoac',
        name: 'Áo khoác',
        slug: 'ao-khoac',
        items: [
          { id: 'sub-lacoste-jacket', name: 'Áo Gió Track Jacket', slug: 'ao-gio-track-jacket', product_ids: [] },
        ]
      }
    ]
  },
  {
    id: 'col-ck',
    brand: 'Calvin Klein (Xi-Kê)',
    slug: 'calvin-klein',
    description: 'Định hình phong cách tối giản thanh lịch New York',
    groups: [
      {
        id: 'grp-ck-ao',
        name: 'Áo',
        slug: 'ao',
        items: [
          { id: 'sub-ck-tee', name: 'Áo thun Minimalist', slug: 'ao-thun-minimalist', product_ids: ['prod-1'] },
          { id: 'sub-ck-shirt', name: 'Áo sơ mi Regular', slug: 'ao-so-mi-regular', product_ids: ['prod-2'] },
        ]
      },
      {
        id: 'grp-ck-quan',
        name: 'Quần',
        slug: 'quan',
        items: [
          { id: 'sub-ck-denim', name: 'Quần Denim Straight', slug: 'quan-denim-straight', product_ids: ['prod-3'] },
        ]
      }
    ]
  },
  {
    id: 'col-tommy',
    brand: 'Tommy Hilfiger (Tô-Mì)',
    slug: 'tommy-hilfiger',
    description: 'Phong cách Classic American Cool trẻ trung và phóng khoáng',
    groups: [
      {
        id: 'grp-tommy-ao',
        name: 'Áo',
        slug: 'ao',
        items: [
          { id: 'sub-tommy-shirt', name: 'Áo sơ mi Oxford Kẻ', slug: 'ao-so-mi-oxford-ke', product_ids: ['prod-2'] },
          { id: 'sub-tommy-polo', name: 'Áo Polo Classic', slug: 'ao-polo-classic', product_ids: ['prod-5'] },
        ]
      }
    ]
  },
  {
    id: 'col-levis',
    brand: "Levi's (Lê-Vy)",
    slug: 'levis',
    description: 'Thương hiệu Denim nguyên bản với di sản đinh tán đồng bất hủ',
    groups: [
      {
        id: 'grp-levis-quan',
        name: 'Quần',
        slug: 'quan',
        items: [
          { id: 'sub-levis-501', name: 'Quần Jean 501 Original', slug: 'quan-jean-501', product_ids: ['prod-3'] },
          { id: 'sub-levis-slim', name: 'Quần Slim Fit Co Giãn', slug: 'quan-slim-fit-co-gian', product_ids: ['prod-3'] },
        ]
      },
      {
        id: 'grp-levis-ao',
        name: 'Áo',
        slug: 'ao',
        items: [
          { id: 'sub-levis-trucker', name: 'Áo khoác Trucker', slug: 'ao-khoac-trucker', product_ids: ['prod-4'] },
          { id: 'sub-levis-tee', name: 'Áo thun Batwing', slug: 'ao-thun-batwing', product_ids: ['prod-1'] },
        ]
      }
    ]
  }
];

export async function GET() {
  try {
    const collections = getSiteContent<BrandCollection[]>('product_collections', defaultCollections);
    return NextResponse.json({
      success: true,
      data: collections
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lấy danh mục bộ sưu tập' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu bộ sưu tập phải là một danh sách mảng' },
        { status: 400 }
      );
    }

    setSiteContent('product_collections', body);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật bộ sưu tập thành công',
      data: body
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lưu bộ sưu tập' },
      { status: 500 }
    );
  }
}
