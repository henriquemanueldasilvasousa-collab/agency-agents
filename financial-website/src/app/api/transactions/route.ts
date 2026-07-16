import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { createTransaction, listTransactions } from "@/lib/data/transactions";
import { TransactionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { userId } = await verifySession();
    return NextResponse.json({ transactions: listTransactions(userId) });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const { userId } = await verifySession();
    const body = await request.json();
    const input = TransactionSchema.parse(body);
    const transaction = createTransaction(userId, input);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
