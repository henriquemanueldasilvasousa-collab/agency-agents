import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Meridian Budget</h1>
        <p className="text-lg text-slate-600">
          Track income, expenses, budgets, and savings goals in one place. This is a demo
          application seeded with mock data — no real accounts or transactions.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-white font-medium hover:bg-slate-700 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-900 font-medium hover:bg-slate-100 transition-colors"
          >
            Create an account
          </Link>
        </div>
        <p className="text-sm text-slate-400">Demo login: demo@example.com / Password123!</p>
      </div>
    </main>
  );
}
