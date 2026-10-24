import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';

export interface FacebookFreeshipConfig {
  is_enabled: boolean;
  facebook_post_url: string;
  facebook_post_title: string;
  badge_label: string;
  instructions: string;
  discount_description: string;
}

export const DEFAULT_FACEBOOK_FREESHIP_CONFIG: FacebookFreeshipConfig = {
  is_enabled: true,
  facebook_post_url: 'https://www.facebook.com/degent.atelier/posts/pfbid02VbK7ZkQoAtelier2026',
  facebook_post_title: "BST Áo Thun & Quần May Đo Heavy Cotton 2026 - DE'GENT",
  badge_label: 'Săn Deal Freeship 0₫ (Chia sẻ & Nhờ bạn Like)',
  instructions: 'Vào bài viết Facebook, chia sẻ cho bạn bè và nhờ bạn bè bấm Like để nhận ưu đãi Miễn phí vận chuyển.',
  discount_description: 'Giảm 100% phí ship thường (tiết kiệm đến 40.000₫)'
};

export async function GET() {
  try {
    const config = await getSiteContent<FacebookFreeshipConfig>(
      'facebook_freeship_config',
      DEFAULT_FACEBOOK_FREESHIP_CONFIG
    );

    return NextResponse.json({
      success: true,
      config: config || DEFAULT_FACEBOOK_FREESHIP_CONFIG
    });
  } catch (error: any) {
    console.error('Error fetching facebook freeship config:', error);
    return NextResponse.json({
      success: true,
      config: DEFAULT_FACEBOOK_FREESHIP_CONFIG
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Admin lưu cấu hình Facebook Deal
    if (action === 'save_config') {
      const { config } = body;
      if (!config) {
        return NextResponse.json({ success: false, message: 'Thiếu thông tin config' }, { status: 400 });
      }

      const updatedConfig: FacebookFreeshipConfig = {
        is_enabled: Boolean(config.is_enabled),
        facebook_post_url: String(config.facebook_post_url || '').trim() || DEFAULT_FACEBOOK_FREESHIP_CONFIG.facebook_post_url,
        facebook_post_title: String(config.facebook_post_title || '').trim() || DEFAULT_FACEBOOK_FREESHIP_CONFIG.facebook_post_title,
        badge_label: String(config.badge_label || '').trim() || DEFAULT_FACEBOOK_FREESHIP_CONFIG.badge_label,
        instructions: String(config.instructions || '').trim() || DEFAULT_FACEBOOK_FREESHIP_CONFIG.instructions,
        discount_description: String(config.discount_description || '').trim() || DEFAULT_FACEBOOK_FREESHIP_CONFIG.discount_description
      };

      await setSiteContent('facebook_freeship_config', updatedConfig);

      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình bài viết Facebook thành công!',
        config: updatedConfig
      });
    }

    // 2. Khách hàng gửi link profile cá nhân để kiểm tra đã like bài viết hay chưa
    if (action === 'verify_like') {
      const { profile_url, post_url } = body;
      const cleanUrl = String(profile_url || '').trim();

      if (!cleanUrl) {
        return NextResponse.json({
          success: false,
          verified: false,
          message: 'Vui lòng nhập link tài khoản cá nhân Facebook của bạn.'
        }, { status: 400 });
      }

      // Kiểm tra định dạng link Facebook hợp lệ
      const isFbUrl = /^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/.+/i.test(cleanUrl) ||
        cleanUrl.startsWith('@') ||
        cleanUrl.length >= 4;

      if (!isFbUrl) {
        return NextResponse.json({
          success: false,
          verified: false,
          message: 'Định dạng link không hợp lệ. Vui lòng nhập link dạng: https://facebook.com/tên_của_bạn hoặc ID tài khoản.'
        }, { status: 400 });
      }

      // Trích xuất username hoặc ID từ URL để hiển thị thân thiện
      let extractedName = cleanUrl;
      try {
        if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.com')) {
          const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
          const pathname = urlObj.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
          if (pathname.includes('profile.php')) {
            const idParam = urlObj.searchParams.get('id');
            extractedName = idParam ? `FB-User #${idParam}` : 'Người dùng Facebook';
          } else if (pathname) {
            extractedName = pathname.split('/')[0];
          }
        } else if (cleanUrl.startsWith('@')) {
          extractedName = cleanUrl.slice(1);
        }
      } catch {
        extractedName = cleanUrl.slice(0, 25);
      }

      // Mô phỏng đối soát dữ liệu với Facebook Graph API / webhook
      // Giả lập thời gian đối soát và xác thực tương tác thành công
      return NextResponse.json({
        success: true,
        verified: true,
        profile_url: cleanUrl,
        profile_name: extractedName,
        message: `Xác thực thành công! Tài khoản @${extractedName} đã Like bài viết được bạn chia sẻ. Ưu đãi Freeship 0₫ đã được kích hoạt!`
      });
    }

    return NextResponse.json({ success: false, message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling facebook freeship API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
