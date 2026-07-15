import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { createGoal, listGoals } from "@/lib/data/goals";
import { GoalSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { userId } = await verifySession();
    return NextResponse.json({ goals: listGoals(userId) });
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
    const input = GoalSchema.parse(body);
    const goal = createGoal(userId, input);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
