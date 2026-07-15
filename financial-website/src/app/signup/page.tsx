import SignupForm from "@/components/SignupForm";

export const metadata = { title: "Sign up — Meridian Budget" };

export default function SignupPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Create your account</h1>
      <SignupForm />
    </main>
  );
}
