import { NextResponse } from "next/server";
import { errorToResponse } from "@/lib/api-helpers";
import { verifySession } from "@/lib/dal";
import { listTransactions } from "@/lib/data/transactions";
import { listBudgets } from "@/lib/data/budgets";
import { listGoals } from "@/lib/data/goals";
import { balance, budgetStatus, goalProgress, totalExpenses, totalIncome } from "@/lib/calculations";

export async function GET() {
  try {
    const { userId } = await verifySession();
    const transactions = listTransactions(userId);
    const budgets = listBudgets(userId).map((b) => budgetStatus(b, transactions));
    const goals = listGoals(userId).map((g) => ({ ...g, progress: goalProgress(g) }));

    return NextResponse.json({
      balance: balance(transactions),
      income: totalIncome(transactions),
      expenses: totalExpenses(transactions),
      recentTransactions: transactions.slice(0, 5),
      budgets,
      goals,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
