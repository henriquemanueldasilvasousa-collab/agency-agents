import type { Budget, Goal, Transaction } from "./types";

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function totalIncome(transactions: Transaction[]): number {
  return round2(transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0));
}

export function totalExpenses(transactions: Transaction[]): number {
  return round2(transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0));
}

export function balance(transactions: Transaction[]): number {
  return round2(totalIncome(transactions) - totalExpenses(transactions));
}

export function isSameMonth(dateIso: string, reference: Date = new Date()): boolean {
  const d = new Date(dateIso + "T00:00:00Z");
  return d.getUTCFullYear() === reference.getUTCFullYear() && d.getUTCMonth() === reference.getUTCMonth();
}

export function spentByCategoryThisMonth(transactions: Transaction[], category: string, reference: Date = new Date()): number {
  return round2(
    transactions
      .filter((t) => t.type === "expense" && t.category === category && isSameMonth(t.date, reference))
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

export interface BudgetStatus {
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export function budgetStatus(budget: Budget, transactions: Transaction[], reference: Date = new Date()): BudgetStatus {
  const spent = spentByCategoryThisMonth(transactions, budget.category, reference);
  const remaining = round2(budget.monthlyLimit - spent);
  const percentUsed = budget.monthlyLimit > 0 ? round2((spent / budget.monthlyLimit) * 100) : spent > 0 ? 100 : 0;
  return {
    category: budget.category,
    monthlyLimit: budget.monthlyLimit,
    spent,
    remaining,
    percentUsed,
    isOverBudget: spent > budget.monthlyLimit,
  };
}

export interface GoalProgress {
  percentComplete: number;
  amountRemaining: number;
  isComplete: boolean;
}

export function goalProgress(goal: Goal): GoalProgress {
  const percentComplete = goal.targetAmount > 0 ? round2(Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)) : 0;
  return {
    percentComplete,
    amountRemaining: round2(Math.max(0, goal.targetAmount - goal.currentAmount)),
    isComplete: goal.currentAmount >= goal.targetAmount,
  };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
