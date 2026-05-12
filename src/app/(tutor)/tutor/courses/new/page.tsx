"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", code: "", description: "", timePerQuestion: "60",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create course.");
    } else {
      const course = await res.json();
      router.push(`/tutor/courses/${course.id}`);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 32 }} className="mb-6">
        New Course
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { id: "name", label: "Course Name", placeholder: "e.g. Heat and Thermodynamics" },
          { id: "code", label: "Course Code", placeholder: "e.g. PHY103" },
          { id: "description", label: "Description (optional)", placeholder: "Brief description of the course" },
        ].map(({ id, label, placeholder }) => (
          <div key={id}>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
              {label}
            </label>
            {id === "description" ? (
              <textarea
                value={form[id as keyof typeof form]}
                onChange={(e) => set(id, e.target.value)}
                placeholder={placeholder}
                rows={2}
                style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
                className="w-full px-3 py-2 text-sm outline-none resize-none"
              />
            ) : (
              <input
                type="text"
                value={form[id as keyof typeof form]}
                onChange={(e) => set(id, e.target.value)}
                placeholder={placeholder}
                style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
                className="w-full px-3 py-2 text-sm outline-none"
                required={id !== "description"}
              />
            )}
          </div>
        ))}

        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Time per Question (seconds)
          </label>
          <input
            type="number"
            min={10}
            max={300}
            value={form.timePerQuestion}
            onChange={(e) => set("timePerQuestion", e.target.value)}
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="w-full px-3 py-2 text-sm outline-none"
            required
          />
          <p style={{ color: "var(--muted)", fontSize: 12 }} className="mt-1">
            Total quiz time = number of questions × this value. E.g. 60s → 20 questions = 20 minutes.
          </p>
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => router.back()}
            style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="px-4 py-2 text-sm font-medium hover:bg-orange-pale transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
            className="px-6 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creating…" : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
