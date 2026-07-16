"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, type Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  type: "expense" as "income" | "expense",
  amount: "",
  category: "Food",
  description: "",
  date: todayIso(),
};

export default function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setForm({ type: t.type, amount: String(t.amount), category: t.category, description: t.description, date: t.date });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const isEditing = editingId !== null;
      const response = await fetch(isEditing ? `/api/transactions/${editingId}` : "/api/transactions", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? `Unable to ${isEditing ? "update" : "add"} transaction.`);
        return;
      }

      if (isEditing) {
        setTransactions((prev) => prev.map((t) => (t.id === editingId ? data.transaction : t)));
      } else {
        setTransactions((prev) => [data.transaction, ...prev]);
      }
      cancelEdit();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) cancelEdit();

    const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setTransactions(previous);
      setError("Unable to delete transaction.");
    }
  }

  const isEditing = editingId !== null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-6">
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "income" | "expense" }))}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          required
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-2"
        />
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm sm:col-span-1"
        />
        <div className="flex gap-2 sm:col-span-6">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Saving..." : isEditing ? "Save changes" : "Add transaction"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>
        {error && (
          <p role="alert" data-testid="form-error" className="text-sm text-red-600 sm:col-span-6">
            {error}
          </p>
        )}
      </form>

      {transactions.length === 0 ? (
        <p className="text-sm text-slate-500">No transactions yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{t.description}</p>
                <p className="text-slate-500">
                  {t.category} · {t.date}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={t.type === "income" ? "text-emerald-600" : "text-slate-900"}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="text-xs font-medium text-slate-600 hover:underline"
                  aria-label={`Edit ${t.description}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                  aria-label={`Delete ${t.description}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
