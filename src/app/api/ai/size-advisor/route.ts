import { NextResponse } from 'next/server';
import {
  DEFAULT_DEGENT_SIZE_SPECS,
  consultSizeWithAi,
  ProductSizeSpecs,
  UserBodyMeasurements
} from '@/lib/aiSizeAdvisor';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      productName = 'Áo Thun DE\'GENT',
      sizeSpecs,
      height,
      weight,
      bust,
      waist,
      hips,
      fitPreference = 'comfort'
    } = body;

    const parsedHeight = parseFloat(height);
    const parsedWeight = parseFloat(weight);

    if (!parsedHeight || !parsedWeight || parsedHeight < 100 || parsedWeight < 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng cung cấp chiều cao (cm) và cân nặng (kg) hợp lệ.'
        },
        { status: 400 }
      );
    }

    const userMeasurements: UserBodyMeasurements = {
      height: parsedHeight,
      weight: parsedWeight,
      bust: bust ? parseFloat(bust) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      fitPreference: ['fit', 'comfort', 'oversize'].includes(fitPreference)
        ? fitPreference
        : 'comfort'
    };

    const finalSpecs: ProductSizeSpecs = (sizeSpecs && sizeSpecs.sizes)
      ? sizeSpecs
      : DEFAULT_DEGENT_SIZE_SPECS;

    const consultation = await consultSizeWithAi(
      productName,
      finalSpecs,
      userMeasurements
    );

    return NextResponse.json({
      success: true,
      data: consultation
    });
  } catch (error: any) {
    console.error('Lỗi API /api/ai/size-advisor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi xử lý tư vấn kích cỡ.'
      },
      { status: 500 }
    );
  }
}
