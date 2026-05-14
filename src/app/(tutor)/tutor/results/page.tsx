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

function ScoreBar({ pct, count, total }: { pct: number; count: number; total: number }) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--orange)" : "var(--red)";
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: "var(--muted)", fontSize: 11, width: 60, flexShrink: 0 }}>{pct}–{Math.min(pct + 19, 100)}%</span>
      <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ color: "var(--muted)", fontSize: 11, width: 24, textAlign: "right", flexShrink: 0 }}>{count}</span>
    </div>
  );
}

function exportCSV(results: SessionResult[], courseCode: string) {
  const rows = [
    ["Rank", "Name", "Matric", "Department", "Score", "Percentage", "Time (s)", "Submitted"],
    ...results.map((s, i) => {
      const p = s.student.studentProfile;
      const pct = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0;
      return [
        i + 1,
        p ? `${p.surname} ${p.firstname}` : "—",
        p?.matric ?? "—",
        p?.dept ?? "—",
        `${s.score}/${s.numQuestions}`,
        `${pct}%`,
        s.timeElapsed,
        new Date(s.submittedAt).toLocaleDateString(),
      ];
    }),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${courseCode}-results.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const selectedCourse = courses.find((c) => c.id === selectedId);

  // Distribution buckets: 0-19, 20-39, 40-59, 60-79, 80-100
  const buckets = [0, 20, 40, 60, 80].map((min) => ({
    min,
    count: sorted.filter((s) => {
      const p = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0;
      return p >= min && p < min + 20;
    }).length,
  }));
  buckets[4].count += sorted.filter((s) => {
    const p = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0;
    return p === 100;
  }).length;

  const avgPct = sorted.length
    ? Math.round(sorted.reduce((sum, s) => sum + (s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0), 0) / sorted.length)
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 30 }}>Results</h1>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)", minWidth: 200 }}
          className="px-3 py-2 text-sm outline-none"
        >
          <option value="">— Select a course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>

        {selectedId && (
          <>
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
              {released ? "Released ✓" : "Release Results"}
            </button>

            {sorted.length > 0 && (
              <button
                onClick={() => exportCSV(sorted, selectedCourse?.code ?? "results")}
                style={{ border: "1px solid var(--border)", color: "var(--dark)", borderRadius: 8, fontSize: 13 }}
                className="px-4 py-2 font-medium hover:bg-orange-pale transition-colors"
              >
                Export CSV
              </button>
            )}
          </>
        )}
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}

      {!loading && selectedId && sorted.length > 0 && (
        <>
          {/* Summary stats + distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Quick stats */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
              <p style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Summary</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Submissions", value: sorted.length },
                  { label: "Class Average", value: avgPct !== null ? `${avgPct}%` : "—" },
                  { label: "Top Score", value: sorted[0]?.score !== null ? `${Math.round((sorted[0].score! / sorted[0].numQuestions) * 100)}%` : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ color: "var(--muted)", fontSize: 11 }}>{label}</p>
                    <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 20 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution bars */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
              <p style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Score Distribution</p>
              <div className="flex flex-col gap-2">
                {buckets.map(({ min, count }) => (
                  <ScoreBar key={min} pct={min} count={count} total={sorted.length} />
                ))}
              </div>
            </div>
          </div>

          {/* Scoreboard table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="overflow-hidden overflow-x-auto">
            <table className="w-full" style={{ minWidth: 560 }}>
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Rank", "Name", "Matric", "Department", "Score", "%", "Time", "Date"].map((h) => (
                    <th key={h} style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, textAlign: "left" }} className="px-3 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, idx) => {
                  const profile = s.student.studentProfile;
                  const pct = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : 0;
                  const scoreColor = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)";
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
                      <td className="px-3 py-3">
                        <span style={{ color: scoreColor, fontWeight: 700 }}>{pct}%</span>
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
        </>
      )}

      {!loading && selectedId && sorted.length === 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-10 text-center">
          <p style={{ color: "var(--muted)", fontSize: 24 }}>📋</p>
          <p style={{ color: "var(--dark)", fontSize: 14, fontWeight: 600, marginTop: 8 }}>No submissions yet</p>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Students haven&apos;t completed any quizzes for this course.</p>
        </div>
      )}
    </div>
  );
}
