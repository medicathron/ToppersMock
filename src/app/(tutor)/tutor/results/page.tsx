"use client";
import { useState, useEffect, useCallback } from "react";

interface CourseOption { id: string; name: string; code: string; resultsReleased: boolean; }
interface SessionResult {
  id: string;
  numQuestions: number;
  score: number | null;
  timeLimitSeconds: number;
  timeElapsed: number;
  submittedAt: string;
  student: { studentProfile: { surname: string; firstname: string; matric: string; dept: string; } | null };
}

export default function ResultsPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [results, setResults] = useState<SessionResult[]>([]);
  const [released, setReleased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses);
  }, []);

  const loadResults = useCallback(async (courseId: string) => {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/results`);
    if (res.ok) {
      const d = await res.json();
      setResults(d.sessions);
      setReleased(d.course.resultsReleased);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadResults(selectedId);
  }, [selectedId, loadResults]);

  async function toggleRelease() {
    await fetch(`/api/courses/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsReleased: !released }),
    });
    loadResults(selectedId);
  }

  const sorted = [...results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 32 }} className="mb-6">Results</h1>

      <div className="flex gap-4 items-center mb-6">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)", minWidth: 220 }}
          className="px-3 py-2 text-sm outline-none"
        >
          <option value="">— Select a course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>

        {selectedId && (
          <button
            onClick={toggleRelease}
            style={{
              background: released ? "var(--green)" : "transparent",
              border: `1px solid ${released ? "var(--green)" : "var(--border)"}`,
              color: released ? "#fff" : "var(--dark)",
              borderRadius: 8, fontSize: 13,
            }}
            className="px-4 py-2 font-medium hover:opacity-80 transition-opacity"
          >
            {released ? "Results Released ✓" : "Release Results to Students"}
          </button>
        )}
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && selectedId && (
        results.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No submitted attempts for this course yet.</p>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Rank", "Name", "Matric", "Department", "Score", "%", "Time Used", "Submitted"].map((h) => (
                    <th key={h} style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, textAlign: "left" }} className="px-3 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => {
                  const profile = s.student.studentProfile;
                  const pct = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0;
                  const mins = Math.floor(s.timeElapsed / 60);
                  const secs = s.timeElapsed % 60;
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ color: "var(--orange)", fontWeight: 700, fontSize: 14 }} className="px-3 py-3">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="px-3 py-3">
                        {profile ? `${profile.surname} ${profile.firstname}` : "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-3 py-3">{profile?.matric ?? "—"}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-3 py-3">{profile?.dept ?? "—"}</td>
                      <td style={{ color: "var(--dark)", fontWeight: 700 }} className="px-3 py-3">
                        {s.score}/{s.numQuestions}
                      </td>
                      <td style={{ color: pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)", fontWeight: 700 }} className="px-3 py-3">
                        {pct}%
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-3 py-3">
                        {mins}m {secs}s
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-3 py-3">
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
