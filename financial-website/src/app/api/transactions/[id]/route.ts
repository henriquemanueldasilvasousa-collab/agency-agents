import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { deleteTransaction, getTransaction, updateTransaction } from "@/lib/data/transactions";
import { TransactionSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { userId } = await verifySession();
    const { id } = await params;
    return NextResponse.json({ transaction: getTransaction(userId, id) });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const { userId } = await verifySession();
    const { id } = await params;
    const body = await request.json();
    const input = TransactionSchema.parse(body);
    const transaction = updateTransaction(userId, id, input);
    return NextResponse.json({ transaction });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const { userId } = await verifySession();
    const { id } = await params;
    deleteTransaction(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorToResponse(error);
  }
}
