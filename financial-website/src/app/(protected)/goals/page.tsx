import { requireSession } from "@/lib/dal";
import { listGoals } from "@/lib/data/goals";
import GoalsClient from "@/components/GoalsClient";

export const metadata = { title: "Goals — Meridian Budget" };

export default async function GoalsPage() {
  const { userId } = await requireSession();
  const goals = listGoals(userId);

  return <GoalsClient initialGoals={goals} />;
}
