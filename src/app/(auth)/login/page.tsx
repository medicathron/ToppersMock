"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentLoginPage() {
  const router = useRouter();
  const [matric, setMatric] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(matric.trim())) {
      setError("Matric number must be exactly 6 digits.");
      return;
    }
    setLoading(true);
    const result = await signIn("student", {
      matric: matric.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid matric number or password. Check that you have been added by your tutor.");
    } else {
      router.push("/profile");
      router.refresh();
    }
  }

  return (
    <div
      style={{ background: "var(--surface)", borderRadius: 16, maxWidth: 420 }}
      className="w-full p-8 shadow-xl"
    >
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-1">
        Student Login
      </h1>
      <p style={{ color: "var(--muted)" }} className="text-sm mb-6">
        Enter your matric number and password to continue.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Matric Number
          </label>
          <input
            type="text"
            maxLength={6}
            value={matric}
            onChange={(e) => setMatric(e.target.value)}
            placeholder="e.g. 212345"
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
        Are you a tutor?{" "}
        <Link href="/tutor/login" style={{ color: "var(--orange)" }} className="font-semibold">
          Tutor Login
        </Link>
      </p>
    </div>
  );
}
