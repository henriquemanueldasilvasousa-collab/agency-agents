import { requireSession, getCurrentUser } from "@/lib/dal";
import Nav from "@/components/Nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const user = await getCurrentUser();

  // requireSession redirects if there's no session, so user should always
  // be present here; this is a defensive fallback in case the account was
  // deleted mid-session.
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
