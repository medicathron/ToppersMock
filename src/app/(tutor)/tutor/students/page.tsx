"use client";
import { useState, useEffect, useCallback } from "react";

interface Student {
  id: string;
  matric: string;
  registered: boolean;
  createdAt: string;
  userId?: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [matric, setMatric] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ added: number; skipped: number; invalid: string[] } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addSingle(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matric }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed.");
    } else {
      setSuccess(`Matric ${matric} added successfully.`);
      setMatric("");
      load();
    }
  }

  async function uploadCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) return;
    setError(""); setCsvResult(null);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", csvFile);
    const res = await fetch("/api/students/upload", { method: "POST", body: fd });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? "Upload failed.");
    } else {
      setCsvResult(d);
      setCsvFile(null);
      load();
    }
  }

  async function resetPassword(id: string, m: string) {
    if (!confirm(`Reset password for ${m}? They will need to set a new password on next login.`)) return;
    await fetch(`/api/students/${id}/reset-password`, { method: "POST" });
    load();
  }

  async function remove(id: string, m: string) {
    if (!confirm(`Remove ${m} from the whitelist?`)) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 32 }} className="mb-6">Students</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Manual add */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <h2 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-3">Add Single Student</h2>
          <form onSubmit={addSingle} className="flex gap-2">
            <input
              type="text"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              placeholder="6-digit matric number"
              maxLength={6}
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="flex-1 px-3 py-2 text-sm outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
              className="px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {error && <p style={{ color: "var(--red)", fontSize: 12 }} className="mt-2">{error}</p>}
          {success && <p style={{ color: "var(--green)", fontSize: 12 }} className="mt-2">{success}</p>}
        </div>

        {/* CSV upload */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <h2 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-1">Bulk Upload (CSV)</h2>
          <p style={{ color: "var(--muted)", fontSize: 12 }} className="mb-3">CSV with one matric per row (6 digits each).</p>
          <form onSubmit={uploadCsv} className="flex gap-2 items-center">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              style={{ color: "var(--dark)", fontSize: 12 }}
              className="flex-1"
            />
            <button
              type="submit"
              disabled={!csvFile || loading}
              style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
              className="px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              Upload
            </button>
          </form>
          {csvResult && (
            <p style={{ fontSize: 12, color: "var(--green)" }} className="mt-2">
              Added: {csvResult.added} · Skipped: {csvResult.skipped}
              {csvResult.invalid.length > 0 && (
                <span style={{ color: "var(--red)" }}> · Invalid: {csvResult.invalid.join(", ")}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Student table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {["Matric", "Status", "Added", "Actions"].map((h) => (
                <th key={h} style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, textAlign: "left" }} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--muted)", fontSize: 13 }} className="px-4 py-8 text-center">
                  No students added yet.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ color: "var(--dark)", fontWeight: 600, fontSize: 14 }} className="px-4 py-3">{s.matric}</td>
                  <td className="px-4 py-3">
                    <span style={{
                      background: s.registered ? "rgba(30,122,69,0.1)" : "var(--orange-pale)",
                      color: s.registered ? "var(--green)" : "var(--orange)",
                      borderRadius: 99, fontSize: 11, fontWeight: 600,
                    }} className="px-2 py-0.5">
                      {s.registered ? "Registered" : "Pending"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-4 py-3">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    {s.registered && (
                      <button
                        onClick={() => resetPassword(s.id, s.matric)}
                        style={{ color: "var(--orange)", fontSize: 12 }}
                        className="hover:underline"
                      >
                        Reset Password
                      </button>
                    )}
                    <button
                      onClick={() => remove(s.id, s.matric)}
                      style={{ color: "var(--red)", fontSize: 12 }}
                      className="hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
