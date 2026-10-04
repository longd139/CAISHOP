import { NextResponse } from 'next/server';
import { findUserByIdentifier, comparePassword, signJwt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.email || body.phone;
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        message: 'Vui lòng nhập số điện thoại hoặc email và mật khẩu.',
      }, { status: 400 });
    }

    const user = findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Số điện thoại/Email hoặc mật khẩu không chính xác.',
      }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({
        success: false,
        message: 'Số điện thoại/Email hoặc mật khẩu không chính xác.',
      }, { status: 401 });
    }

    // Ký JWT Token
    const authUser = {
      id: user.id,
      name: user.name,
      phone: user.phone || null,
      email: user.email || null,
      role: user.role as 'ADMIN' | 'USER',
    };
    const token = await signJwt(authUser);

    // Trả về kèm HTTP-Only Cookie an toàn
    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: authUser,
    });

    response.cookies.set({
      name: 'caishop_token',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
