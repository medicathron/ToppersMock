"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TutorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const res = await fetch("/api/tutor/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
    } else {
      router.push("/tutor/login?registered=1");
    }
  }

  return (
    <div
      style={{ background: "var(--surface)", borderRadius: 16, maxWidth: 440 }}
      className="w-full p-8 shadow-xl"
    >
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-1">
        Tutor Registration
      </h1>
      <p style={{ color: "var(--muted)" }} className="text-sm mb-6">
        Create your tutor account to get started.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { id: "name", label: "Full Name", type: "text", placeholder: "Dr. Jane Smith" },
          { id: "email", label: "Email", type: "email", placeholder: "you@university.edu" },
          { id: "password", label: "Password", type: "password", placeholder: "Min. 6 characters" },
          { id: "confirm", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
        ].map(({ id, label, type, placeholder }) => (
          <div key={id}>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[id as keyof typeof form]}
              onChange={(e) => set(id, e.target.value)}
              placeholder={placeholder}
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange"
              required
            />
          </div>
        ))}

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
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p style={{ color: "var(--muted)", fontSize: 13 }} className="text-center mt-6">
        Already have an account?{" "}
        <Link href="/tutor/login" style={{ color: "var(--orange)" }} className="font-semibold">
          Sign In
        </Link>
      </p>
    </div>
  );
}
