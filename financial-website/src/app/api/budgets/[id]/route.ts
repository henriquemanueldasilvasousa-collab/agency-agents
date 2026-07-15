import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { deleteBudget, updateBudget } from "@/lib/data/budgets";
import { BudgetSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const { userId } = await verifySession();
    const { id } = await params;
    const body = await request.json();
    const input = BudgetSchema.parse(body);
    const budget = updateBudget(userId, id, input);
    return NextResponse.json({ budget });
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
    deleteBudget(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorToResponse(error);
  }
}
