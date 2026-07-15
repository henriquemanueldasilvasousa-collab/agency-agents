import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api-helpers";
import { deleteSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  await deleteSession();
  return NextResponse.json({ success: true });
}
