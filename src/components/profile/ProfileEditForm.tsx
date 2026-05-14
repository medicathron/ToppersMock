"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FACULTIES } from "@/lib/constants";

interface Props {
  profile: {
    firstname: string;
    surname: string;
    phone: string;
    faculty: string;
    dept: string;
    aimedScore: number;
  };
  onCancel: () => void;
}

export default function ProfileEditForm({ profile, onCancel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...profile });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const depts = form.faculty ? (FACULTIES[form.faculty] ?? []) : [];

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save.");
    } else {
      router.refresh();
      onCancel();
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { id: "surname", label: "Surname" },
          { id: "firstname", label: "First Name" },
        ].map(({ id, label }) => (
          <div key={id}>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">{label}</label>
            <input
              type="text"
              value={form[id as keyof typeof form] as string}
              onChange={(e) => set(id, e.target.value)}
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
          style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
          className="w-full px-3 py-2 text-sm outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, color: "var(--dark)", fontSize: 14 }}
          className="py-2 font-medium hover:bg-orange-pale transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{ flex: 1, background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 14 }}
          className="py-2 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
