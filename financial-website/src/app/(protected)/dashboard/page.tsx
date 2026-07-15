import { requireSession } from "@/lib/dal";
import { listTransactions } from "@/lib/data/transactions";
import { listBudgets } from "@/lib/data/budgets";
import { listGoals } from "@/lib/data/goals";
import { balance, budgetStatus, formatCurrency, goalProgress, totalExpenses, totalIncome } from "@/lib/calculations";

export const metadata = { title: "Dashboard — Meridian Budget" };

export default async function DashboardPage() {
  const { userId } = await requireSession();
  const transactions = listTransactions(userId);
  const budgets = listBudgets(userId).map((b) => budgetStatus(b, transactions));
  const goals = listGoals(userId).map((g) => ({ goal: g, progress: goalProgress(g) }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Balance" value={formatCurrency(balance(transactions))} tone="default" />
        <SummaryCard label="Income" value={formatCurrency(totalIncome(transactions))} tone="positive" />
        <SummaryCard label="Expenses" value={formatCurrency(totalExpenses(transactions))} tone="negative" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Budgets this month</h2>
        {budgets.length === 0 ? (
          <p className="text-sm text-slate-500">No budgets set yet. Head to the Budgets page to create one.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {budgets.map((b) => (
              <div key={b.category} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{b.category}</span>
                  <span className={b.isOverBudget ? "text-red-600" : "text-slate-500"}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${b.isOverBudget ? "bg-red-500" : "bg-slate-900"}`}
                    style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Savings goals</h2>
        {goals.length === 0 ? (
          <p className="text-sm text-slate-500">No goals yet. Head to the Goals page to create one.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map(({ goal, progress }) => (
              <div key={goal.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-900">{goal.name}</span>
                  <span className="text-slate-500">{progress.percentComplete}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${progress.percentComplete}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {transactions.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{t.description}</p>
                  <p className="text-slate-500">
                    {t.category} · {t.date}
                  </p>
                </div>
                <span className={t.type === "income" ? "text-emerald-600" : "text-slate-900"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "default" | "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
