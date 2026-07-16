import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, errorToResponse, getClientIp } from "@/lib/api-helpers";
import { createSession } from "@/lib/session";
import { createUser } from "@/lib/data/auth";
import { SignupSchema } from "@/lib/validation";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const rateLimitKey = `signup:${getClientIp(request)}`;
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  // Count every attempt (not just failures) so this endpoint can't be used
  // to enumerate registered emails or spin up accounts in bulk.
  recordFailedAttempt(rateLimitKey);

  try {
    const body = await request.json();
    const input = SignupSchema.parse(body);
    const user = await createUser(input);
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
