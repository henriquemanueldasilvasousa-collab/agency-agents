import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { deleteGoal, updateGoal } from "@/lib/data/goals";
import { GoalSchema } from "@/lib/validation";

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
    const input = GoalSchema.parse(body);
    const goal = updateGoal(userId, id, input);
    return NextResponse.json({ goal });
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
    deleteGoal(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorToResponse(error);
  }
}
