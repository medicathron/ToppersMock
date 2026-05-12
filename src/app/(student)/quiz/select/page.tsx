"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  timePerQuestion: number;
  _count: { questions: number };
}

export default function QuizSelectPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses").then((r) => r.json()).then(setCourses);
  }, []);

  const selected = courses.find((c) => c.id === selectedId);
  const maxQs = selected?._count.questions ?? 0;
  const timeSecs = selected ? numQuestions * selected.timePerQuestion : 0;
  const timeMins = Math.floor(timeSecs / 60);
  const timeSec = timeSecs % 60;

  async function startQuiz() {
    if (!selectedId) { setError("Please select a course."); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedId, numQuestions }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to start quiz.");
    } else {
      const { sessionId } = await res.json();
      router.push(`/quiz/${sessionId}`);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-6">
        Start a Quiz
      </h1>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }} className="p-6 flex flex-col gap-5">
        <div>
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Select Course
          </label>
          <select
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              const c = courses.find((x) => x.id === id);
              setNumQuestions(Math.min(20, c?._count.questions ?? 20));
            }}
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
            className="w-full px-3 py-2 text-sm outline-none"
          >
            <option value="">— Choose a course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id} disabled={c._count.questions === 0}>
                {c.code} — {c.name} ({c._count.questions} questions)
              </option>
            ))}
          </select>
          {selected?.description && (
            <p style={{ color: "var(--muted)", fontSize: 12 }} className="mt-1">{selected.description}</p>
          )}
        </div>

        {selected && (
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
              Number of Questions: <strong style={{ color: "var(--orange)" }}>{numQuestions}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={maxQs}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              style={{ accentColor: "var(--orange)", width: "100%" }}
            />
            <p style={{ color: "var(--muted)", fontSize: 12 }} className="mt-1">
              Time limit: <strong style={{ color: "var(--dark)" }}>
                {timeMins > 0 ? `${timeMins}m ` : ""}{timeSec}s
              </strong>
              {" "}({selected.timePerQuestion}s per question)
            </p>
          </div>
        )}

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        <button
          onClick={startQuiz}
          disabled={loading || !selectedId || maxQs === 0}
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="w-full py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Starting…" : "Start Quiz"}
        </button>

        <div style={{ background: "var(--orange-pale)", borderRadius: 10 }} className="p-3">
          <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }}>Rules</p>
          <ul style={{ color: "var(--muted)", fontSize: 12 }} className="mt-1 list-disc pl-4 flex flex-col gap-1">
            <li>Questions and answer options are shuffled each attempt.</li>
            <li>The quiz auto-submits when time runs out.</li>
            <li>Switching tabs will start a 2-second countdown — return before it ends.</li>
            <li>You can take unlimited attempts per course.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
