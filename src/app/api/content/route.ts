import { NextResponse } from 'next/server';
import { getSiteContent, setSiteContent } from '@/lib/db';
import { defaultSiteContent } from '@/lib/defaultSiteContent';

export const defaultContent = defaultSiteContent;

export async function GET() {
  try {
    const rawHeader = await getSiteContent('header', null);
    const rawHome = await getSiteContent('home', null);
    const rawProducts = await getSiteContent('products', null);
    const rawStudio = await getSiteContent('studio', null);
    const rawAbout = await getSiteContent('about', null);

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
    const existing = (await getSiteContent(section, null)) || fallback;
    const merged = { ...existing, ...data };
    
    const result = await setSiteContent(section, merged);
    return NextResponse.json({ success: true, result, data: merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
