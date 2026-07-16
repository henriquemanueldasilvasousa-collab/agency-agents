import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Log in — Meridian Budget" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Log in</h1>
      <LoginForm />
    </main>
  );
}
