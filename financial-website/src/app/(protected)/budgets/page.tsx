import { requireSession } from "@/lib/dal";
import { listBudgets } from "@/lib/data/budgets";
import { listTransactions } from "@/lib/data/transactions";
import BudgetsClient from "@/components/BudgetsClient";

export const metadata = { title: "Budgets — Meridian Budget" };

export default async function BudgetsPage() {
  const { userId } = await requireSession();
  const budgets = listBudgets(userId);
  const transactions = listTransactions(userId);

  return <BudgetsClient initialBudgets={budgets} transactions={transactions} />;
}
