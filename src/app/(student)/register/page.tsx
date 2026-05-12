"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FACULTIES } from "@/lib/constants";

export default function RegisterPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const matric = session?.user?.matric ?? "";

  const [form, setForm] = useState({
    surname: "", firstname: "", phone: "", gender: "",
    faculty: "", dept: "", aimedScore: 70,
    password: "", confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const depts = form.faculty ? FACULTIES[form.faculty] ?? [] : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.gender) { setError("Please select your gender."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, matric }),
    });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Registration failed.");
    } else {
      // Update session to clear needsRegistration flag
      await update({ needsRegistration: false });
      router.push("/profile");
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-1">
        Complete Your Registration
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }} className="mb-6">
        Matric: <strong style={{ color: "var(--dark)" }}>{matric}</strong> — fill in your details to create your account.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "surname", label: "Surname", placeholder: "SMITH" },
            { id: "firstname", label: "First Name", placeholder: "Jane" },
          ].map(({ id, label, placeholder }) => (
            <div key={id}>
              <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">{label}</label>
              <input
                type="text"
                value={form[id as keyof typeof form] as string}
                onChange={(e) => set(id, e.target.value)}
                placeholder={placeholder}
                style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
                className="w-full px-3 py-2 text-sm outline-none"
                required
              />
            </div>
          ))}
        </div>

        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="08012345678"
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="w-full px-3 py-2 text-sm outline-none"
            required
          />
        </div>

        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-2">Gender</label>
          <div className="flex gap-4">
            {["Male", "Female"].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={form.gender === g}
                  onChange={() => set("gender", g)}
                  style={{ accentColor: "var(--orange)" }}
                />
                <span style={{ color: "var(--dark)", fontSize: 14 }}>{g}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Faculty</label>
            <select
              value={form.faculty}
              onChange={(e) => { set("faculty", e.target.value); set("dept", ""); }}
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none"
              required
            >
              <option value="">Select faculty…</option>
              {Object.keys(FACULTIES).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Department</label>
            <select
              value={form.dept}
              onChange={(e) => set("dept", e.target.value)}
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none"
              required
              disabled={!form.faculty}
            >
              <option value="">Select department…</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Target Score: {form.aimedScore}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.aimedScore}
            onChange={(e) => set("aimedScore", parseInt(e.target.value))}
            style={{ accentColor: "var(--orange)", width: "100%" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min. 6 characters"
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none"
              required
            />
          </div>
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              placeholder="Repeat password"
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none"
              required
            />
          </div>
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="w-full py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Creating account…" : "Create Account & Continue"}
        </button>
      </form>
    </div>
  );
}
