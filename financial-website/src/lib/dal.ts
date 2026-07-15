import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "./session";
import { getDb } from "./store";
import type { PublicUser } from "./types";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Verifies the session cookie. Throws UnauthorizedError if absent/invalid. */
export const verifySession = cache(async (): Promise<{ userId: string }> => {
  const session = await getSessionFromCookies();
  if (!session?.userId) {
    throw new UnauthorizedError();
  }
  return { userId: session.userId };
});

/** Like verifySession but returns null instead of throwing. */
export const getOptionalSession = cache(async (): Promise<{ userId: string } | null> => {
  const session = await getSessionFromCookies();
  return session?.userId ? { userId: session.userId } : null;
});

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await getOptionalSession();
  if (!session) return null;
  const user = getDb().users.find((u) => u.id === session.userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
});

/** For Server Component pages: redirects to /login if there is no valid session. */
export async function requireSession(): Promise<{ userId: string }> {
  const session = await getOptionalSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
