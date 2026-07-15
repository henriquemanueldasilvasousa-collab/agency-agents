"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, type Budget, type Transaction } from "@/lib/types";
import { budgetStatus, formatCurrency } from "@/lib/calculations";

export default function BudgetsClient({
  initialBudgets,
  transactions,
}: {
  initialBudgets: Budget[];
  transactions: Transaction[];
}) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [category, setCategory] = useState<string>(CATEGORIES[1]);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, monthlyLimit }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to save budget.");
        return;
      }

      setBudgets((prev) => {
        const existingIndex = prev.findIndex((b) => b.category === data.budget.category);
        if (existingIndex === -1) return [...prev, data.budget];
        const copy = [...prev];
        copy[existingIndex] = data.budget;
        return copy;
      });
      setMonthlyLimit("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = budgets;
    setBudgets((prev) => prev.filter((b) => b.id !== id));

    const response = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setBudgets(previous);
      setError("Unable to delete budget.");
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-2"
        >
          {CATEGORIES.filter((c) => c !== "Income").map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Monthly limit"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 sm:col-span-1"
        >
          {pending ? "Saving..." : "Set budget"}
        </button>
        {error && (
          <p role="alert" data-testid="form-error" className="text-sm text-red-600 sm:col-span-4">
            {error}
          </p>
        )}
      </form>

      {budgets.length === 0 ? (
        <p className="text-sm text-slate-500">No budgets yet. Set one above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map((b) => {
            const status = budgetStatus(b, transactions);
            return (
              <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{b.category}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                    aria-label={`Delete ${b.category} budget`}
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className={status.isOverBudget ? "text-red-600" : "text-slate-500"}>
                    {formatCurrency(status.spent)} / {formatCurrency(status.monthlyLimit)}
                  </span>
                  <span className="text-slate-500">{status.percentUsed}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${status.isOverBudget ? "bg-red-500" : "bg-slate-900"}`}
                    style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
