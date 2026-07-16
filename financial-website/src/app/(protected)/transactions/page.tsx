import { requireSession } from "@/lib/dal";
import { listTransactions } from "@/lib/data/transactions";
import TransactionsClient from "@/components/TransactionsClient";

export const metadata = { title: "Transactions — Meridian Budget" };

export default async function TransactionsPage() {
  const { userId } = await requireSession();
  const transactions = listTransactions(userId);

  return <TransactionsClient initialTransactions={transactions} />;
}
