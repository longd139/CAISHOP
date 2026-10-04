import { NextResponse } from 'next/server';
import { createUser, signJwt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu.',
      }, { status: 400 });
    }

    // Phone validation (VN 10 digits starting with 03, 05, 07, 08, 09)
    let cleanPhone = phone.trim().replace(/[\s\.-]/g, '');
    if (cleanPhone.startsWith('+84')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('84') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    if (!/^0[35789]\d{8}$/.test(cleanPhone)) {
      return NextResponse.json({
        success: false,
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số gồm 10 chữ số (đầu số 03, 05, 07, 08 hoặc 09).',
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự.',
      }, { status: 400 });
    }

    // Email optional validation
    let cleanEmail: string | null = null;
    if (email && typeof email === 'string' && email.trim()) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json({
          success: false,
          message: 'Định dạng email không hợp lệ.',
        }, { status: 400 });
      }
      cleanEmail = trimmedEmail;
    }

    // Tạo user với role USER
    const newUser = await createUser(name, cleanPhone, cleanEmail, password, 'USER');
    const token = await signJwt(newUser);

    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: newUser,
    });

    response.cookies.set({
      name: 'caishop_token',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
