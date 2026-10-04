import { NextResponse } from 'next/server';
import { getAllProductsWithVariants, updateVariantPrice } from '@/lib/db';

export async function GET() {
  try {
    const products = await getAllProductsWithVariants();
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { variant_id, selling_price } = body;

    if (!variant_id || selling_price === undefined) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin variant_id hoặc selling_price' }, { status: 400 });
    }

    const result = await updateVariantPrice(variant_id, Number(selling_price));
    if (!result.success) {
      return NextResponse.json(result, { status: 422 }); // Unprocessable Entity due to business rule (Floor price)
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
