/**
 * Module Chuẩn Bị Thông Số Kích Thước Nhà Sản Xuất & Trợ Lý Tư Vấn Size (AI Ready)
 * Hỗ trợ phân tích: Chiều cao, Cân nặng, Vòng 1 (Ngực), Vòng 2 (Eo/Bụng), Vòng 3 (Mông)
 * và Gu ăn mặc (Fit / Regular / Oversize)
 */

export interface SizeMeasurement {
  length: number;     // Dài áo (cm)
  chest: number;      // Rộng ngực áo (cm) - đo ngang ngực x 2
  shoulder: number;   // Rộng vai (cm)
  sleeve: number;     // Dài tay (cm)
  minHeight: number;  // Chiều cao tối thiểu (cm)
  maxHeight: number;  // Chiều cao tối đa (cm)
  minWeight: number;  // Cân nặng tối thiểu (kg)
  maxWeight: number;  // Cân nặng tối đa (kg)
  minBust: number;    // Vòng ngực cơ thể tối thiểu (cm)
  maxBust: number;    // Vòng ngực cơ thể tối đa (cm)
  fitName: string;    // Tên form
}

export interface ProductSizeSpecs {
  fabric: string;
  stretch: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  fitType: 'REGULAR' | 'SLIM' | 'OVERSIZE' | 'BOXY';
  unit: string;
  sizes: Record<string, SizeMeasurement>;
}

export interface UserBodyMeasurements {
  height: number;              // Chiều cao (cm)
  weight: number;              // Cân nặng (kg)
  bust?: number;               // Vòng 1: Ngực (cm)
  waist?: number;              // Vòng 2: Eo/Bụng (cm)
  hips?: number;               // Vòng 3: Mông (cm)
  fitPreference: 'fit' | 'comfort' | 'oversize'; // Gu mặc
}

export interface SizeConsultationResult {
  recommendedSize: string;
  alternativeSize?: string;
  confidenceScore: number;
  isAiPowered: boolean;
  headline: string;
  analysisText: string;
  fitBreakdown: {
    size: string;
    status: 'CHẬT' | 'VỪA_VẶN' | 'THOẢI_MÁI' | 'RỘNG_OVERSIZE' | 'QUÁ_RỘNG';
    chestEase: string; // Độ dư ngực
    notes: string;
  }[];
}

/**
 * Thông số đo thành phẩm chuẩn từ xưởng/nhà sản xuất DE'GENT (Form Áo Thun & Sơ Mi)
 */
export const DEFAULT_DEGENT_SIZE_SPECS: ProductSizeSpecs = {
  fabric: '100% Heavy Cotton 250gsm (Đứng form, độ co giãn nhẹ)',
  stretch: 'LOW',
  fitType: 'OVERSIZE',
  unit: 'cm',
  sizes: {
    S: {
      length: 68,
      chest: 104,
      shoulder: 48,
      sleeve: 21,
      minHeight: 155,
      maxHeight: 165,
      minWeight: 48,
      maxWeight: 55,
      minBust: 80,
      maxBust: 86,
      fitName: 'Vừa vặn (Regular)',
    },
    M: {
      length: 71,
      chest: 108,
      shoulder: 50,
      sleeve: 22,
      minHeight: 165,
      maxHeight: 172,
      minWeight: 55,
      maxWeight: 65,
      minBust: 86,
      maxBust: 92,
      fitName: 'Vừa vặn (Regular/Fit)',
    },
    L: {
      length: 74,
      chest: 114,
      shoulder: 52,
      sleeve: 23,
      minHeight: 170,
      maxHeight: 178,
      minWeight: 65,
      maxWeight: 75,
      minBust: 92,
      maxBust: 98,
      fitName: 'Thoải mái (Comfort)',
    },
    XL: {
      length: 77,
      chest: 120,
      shoulder: 54,
      sleeve: 24,
      minHeight: 175,
      maxHeight: 185,
      minWeight: 75,
      maxWeight: 85,
      minBust: 98,
      maxBust: 106,
      fitName: 'Rộng rãi (Oversize)',
    },
    XXL: {
      length: 80,
      chest: 126,
      shoulder: 56,
      sleeve: 25,
      minHeight: 180,
      maxHeight: 192,
      minWeight: 85,
      maxWeight: 95,
      minBust: 106,
      maxBust: 116,
      fitName: 'Rộng rãi (Big size)',
    },
  },
};

/**
 * Thuật toán may đo Heuristic phân tích độ dư ngực (Ease Allowance) và tỷ lệ thể hình
 */
export function analyzeBodySpecsHeuristically(
  specs: ProductSizeSpecs,
  body: UserBodyMeasurements
): SizeConsultationResult {
  const { height, weight, bust, waist, fitPreference } = body;
  const estimatedBust = bust || (weight * 1.35 + 10); // Ước tính nếu khách không nhớ vòng 1
  const estimatedWaist = waist || (weight * 1.1 + 8);

  const entries = Object.entries(specs.sizes);
  let bestSize = 'M';
  let altSize = 'L';
  let bestScore = -999;

  // Tính điểm phù hợp cho từng size
  const fitBreakdown = entries.map(([sizeKey, sizeData]) => {
    const chestEase = sizeData.chest - estimatedBust;
    let status: 'CHẬT' | 'VỪA_VẶN' | 'THOẢI_MÁI' | 'RỘNG_OVERSIZE' | 'QUÁ_RỘNG' = 'VỪA_VẶN';
    let notes = '';

    if (chestEase < 4) {
      status = 'CHẬT';
      notes = 'Kích ngực, khó vận động với chất vải ít co giãn';
    } else if (chestEase < 10) {
      status = 'VỪA_VẶN';
      notes = 'Ôm vừa người, tôn dáng gọn gàng';
    } else if (chestEase < 18) {
      status = 'THOẢI_MÁI';
      notes = 'Độ rộng cử động chuẩn form hiện đại';
    } else if (chestEase < 26) {
      status = 'RỘNG_OVERSIZE';
      notes = 'Thụng vai, phủ mông phong cách streetwear';
    } else {
      status = 'QUÁ_RỘNG';
      notes = 'Khá thùng thình so với số đo cơ thể';
    }

    // Đánh giá điểm theo sở thích
    let score = 100;
    const heightDiff = (height < sizeData.minHeight ? sizeData.minHeight - height : height > sizeData.maxHeight ? height - sizeData.maxHeight : 0);
    const weightDiff = (weight < sizeData.minWeight ? sizeData.minWeight - weight : weight > sizeData.maxWeight ? weight - sizeData.maxWeight : 0);
    score -= heightDiff * 2 + weightDiff * 3;

    if (fitPreference === 'fit') {
      if (status === 'VỪA_VẶN') score += 20;
      else if (status === 'RỘNG_OVERSIZE' || status === 'QUÁ_RỘNG') score -= 25;
    } else if (fitPreference === 'oversize') {
      if (status === 'RỘNG_OVERSIZE') score += 25;
      else if (status === 'THOẢI_MÁI') score += 15;
      else if (status === 'VỪA_VẶN') score -= 15;
    } else {
      if (status === 'THOẢI_MÁI') score += 20;
      else if (status === 'VỪA_VẶN') score += 15;
    }

    // Cảnh báo bụng to
    if (waist && waist >= sizeData.chest - 6) {
      score -= 30;
      notes += ' (Lưu ý: Vòng bụng gần sát với ngực áo)';
    }

    if (score > bestScore) {
      altSize = bestSize;
      bestScore = score;
      bestSize = sizeKey;
    }

    return {
      size: sizeKey,
      status,
      chestEase: `+${Math.round(chestEase)}cm so với vòng 1`,
      notes,
    };
  });

  const bestSpec = specs.sizes[bestSize] || specs.sizes['M'];
  const easeCm = Math.round(bestSpec.chest - estimatedBust);

  let headline = `Đề xuất tối ưu: Size ${bestSize}`;
  let analysisText = `Với chiều cao ${height}cm, cân nặng ${weight}kg`;
  if (bust) analysisText += ` và số đo vòng ngực ${bust}cm`;
  if (waist) analysisText += `, vòng bụng ${waist}cm`;

  analysisText += `: Áo Size ${bestSize} (ngực áo ${bestSpec.chest}cm, dài ${bestSpec.length}cm) sẽ có độ cử động dư khoảng +${easeCm}cm, mang lại cảm giác ${
    fitPreference === 'oversize' ? 'rộng rãi chuẩn form Streetwear' : fitPreference === 'fit' ? 'vừa vặn, gọn gàng' : 'thoải mái, dễ phối đồ'
  }.`;

  if (altSize && altSize !== bestSize) {
    headline += ` (Hoặc Size ${altSize})`;
  }

  return {
    recommendedSize: bestSize,
    alternativeSize: altSize !== bestSize ? altSize : undefined,
    confidenceScore: Math.min(98, Math.max(85, Math.round(bestScore))),
    isAiPowered: false,
    headline,
    analysisText,
    fitBreakdown,
  };
}

/**
 * Gọi Google Gemini AI (khi người dùng thiết lập GEMINI_API_KEY)
 * hoặc tự động fallback sang phân tích Heuristic nếu chưa có Key.
 */
export async function consultSizeWithAi(
  productName: string,
  specs: ProductSizeSpecs,
  body: UserBodyMeasurements
): Promise<SizeConsultationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Nếu chưa có API Key, sử dụng bộ phân tích số đo thông minh chuẩn xác
  if (!apiKey) {
    return analyzeBodySpecsHeuristically(specs, body);
  }

  try {
    const prompt = `
Bạn là Chuyên gia tư vấn may đo thời trang cao cấp của thương hiệu DE'GENT.
Hãy phân tích số đo của khách hàng và bảng số đo sản phẩm từ xưởng may dưới đây để đưa ra lời khuyên chọn size chuẩn xác nhất.

THÔNG TIN SẢN PHẨM:
- Tên sản phẩm: ${productName}
- Chất liệu: ${specs.fabric}
- Độ co giãn: ${specs.stretch}
- Form dáng thiết kế: ${specs.fitType}
- Bảng số đo xưởng may (cm):
${JSON.stringify(specs.sizes, null, 2)}

SỐ ĐO CỦA KHÁCH HÀNG:
- Chiều cao: ${body.height} cm
- Cân nặng: ${body.weight} kg
- Vòng 1 (Ngực): ${body.bust ? `${body.bust} cm` : 'Chưa đo cụ thể'}
- Vòng 2 (Bụng/Eo): ${body.waist ? `${body.waist} cm` : 'Chưa đo cụ thể'}
- Vòng 3 (Mông): ${body.hips ? `${body.hips} cm` : 'Chưa đo cụ thể'}
- Gu mặc mong muốn: ${body.fitPreference === 'fit' ? 'Vừa vặn ôm người (Slim/Fit)' : body.fitPreference === 'oversize' ? 'Rộng rãi cá tính (Oversize)' : 'Thoải mái (Regular)'}

YÊU CẦU:
Trả về định dạng JSON thuần túy (không bọc trong \`\`\`json) với cấu trúc sau:
{
  "recommendedSize": "M",
  "alternativeSize": "L",
  "confidenceScore": 96,
  "headline": "Tiêu đề ngắn gọn đề xuất size",
  "analysisText": "Đoạn văn tư vấn chuyên nghiệp, giải thích rõ độ dài áo, độ rộng ngực, vòng bụng và lời khuyên ăn mặc.",
  "fitBreakdown": [
    {
      "size": "S",
      "status": "CHẬT",
      "chestEase": "+4cm",
      "notes": "Nhận xét ngắn"
    }
  ]
}
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      return analyzeBodySpecsHeuristically(specs, body);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        ...parsed,
        isAiPowered: true,
      };
    }
    return analyzeBodySpecsHeuristically(specs, body);
  } catch (err) {
    console.error('Lỗi khi gọi Gemini AI tư vấn size:', err);
    return analyzeBodySpecsHeuristically(specs, body);
  }
}
