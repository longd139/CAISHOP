import { NextResponse } from 'next/server';
import { getCashFlowSummary, getFinancialTransactions } from '@/lib/db';

export async function GET() {
  try {
    const summary = getCashFlowSummary();
    const recentTransactions = getFinancialTransactions(15);

    return NextResponse.json({
      success: true,
      summary,
      transactions: recentTransactions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
