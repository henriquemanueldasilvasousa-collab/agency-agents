"use client";

import { useState, type FormEvent } from "react";
import type { Goal } from "@/lib/types";
import { formatCurrency, goalProgress } from "@/lib/calculations";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetDate, setTargetDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetAmount, currentAmount, targetDate }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to add goal.");
        return;
      }

      setGoals((prev) => [...prev, data.goal]);
      setName("");
      setTargetAmount("");
      setCurrentAmount("0");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = goals;
    setGoals((prev) => prev.filter((g) => g.id !== id));

    const response = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setGoals(previous);
      setError("Unable to delete goal.");
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Savings goals</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5">
        <input
          type="text"
          required
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-2"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Target amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Saved so far"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <input
          type="date"
          required
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 sm:col-span-5"
        >
          {pending ? "Adding..." : "Add goal"}
        </button>
        {error && (
          <p role="alert" data-testid="form-error" className="text-sm text-red-600 sm:col-span-5">
            {error}
          </p>
        )}
      </form>

      {goals.length === 0 ? (
        <p className="text-sm text-slate-500">No goals yet. Add one above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const progress = goalProgress(g);
            return (
              <div key={g.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{g.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                    aria-label={`Delete ${g.name}`}
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-1 flex justify-between text-sm text-slate-500">
                  <span>
                    {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                  </span>
                  <span>{progress.percentComplete}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${progress.percentComplete}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">Target date: {g.targetDate}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
