import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse, getClientIp } from "@/lib/api-helpers";
import { createSession } from "@/lib/session";
import { verifyCredentials } from "@/lib/data/auth";
import { LoginSchema } from "@/lib/validation";
import { checkRateLimit, clearAttempts, recordFailedAttempt } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const input = LoginSchema.parse(body);
    const rateLimitKey = `${getClientIp(request)}:${input.email}`;

    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } }
      );
    }

    const user = await verifyCredentials(input);
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    clearAttempts(rateLimitKey);
    await createSession(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return errorToResponse(error);
  }
}
