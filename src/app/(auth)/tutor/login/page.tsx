"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TutorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("tutor", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/tutor/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      style={{ background: "var(--surface)", borderRadius: 16, maxWidth: 420 }}
      className="w-full p-8 shadow-xl"
    >
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-1">
        Tutor Login
      </h1>
      <p style={{ color: "var(--muted)" }} className="text-sm mb-6">
        Sign in to manage your courses and students.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
            required
          />
        </div>
        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
            required
          />
        </div>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 13 }} className="text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="w-full py-2.5 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ color: "var(--muted)", fontSize: 13 }} className="text-center mt-6">
        No account yet?{" "}
        <Link href="/tutor/register" style={{ color: "var(--orange)" }} className="font-semibold">
          Register as Tutor
        </Link>
      </p>
      <p style={{ color: "var(--muted)", fontSize: 13 }} className="text-center mt-2">
        Are you a student?{" "}
        <Link href="/login" style={{ color: "var(--orange)" }} className="font-semibold">
          Student Login
        </Link>
      </p>
    </div>
  );
}
