import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "./dal";
import { ConflictError, ForbiddenError, NotFoundError } from "./data/errors";

/**
 * Defense-in-depth CSRF guard for state-changing requests. SameSite=Lax
 * cookies already stop cross-site fetch/XHR from carrying the session
 * cookie, but we also require the Origin header to match Host, mirroring
 * the check Next.js performs internally for Server Actions.
 */
export function assertSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Same-origin browser requests always send Origin for POST/PUT/DELETE.
    // Missing Origin is only expected from non-browser clients; reject to
    // be conservative.
    return NextResponse.json({ error: "Missing Origin header." }, { status: 403 });
  }
  const host = request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Invalid Origin header." }, { status: 403 });
  }
  if (originHost !== host) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  return null;
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

export function errorToResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed.", issues: error.flatten() }, { status: 400 });
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
