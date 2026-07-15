import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { createBudget, listBudgets } from "@/lib/data/budgets";
import { BudgetSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { userId } = await verifySession();
    return NextResponse.json({ budgets: listBudgets(userId) });
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
    const input = BudgetSchema.parse(body);
    const budget = createBudget(userId, input);
    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
