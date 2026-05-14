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

const QUICK_COUNTS = [10, 20, 30, 50];

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
  const effectiveNum = Math.min(numQuestions, maxQs);
  const timeSecs = selected ? effectiveNum * selected.timePerQuestion : 0;
  const timeMins = Math.floor(timeSecs / 60);
  const timeSec = timeSecs % 60;

  function selectCourse(id: string) {
    setSelectedId(id);
    const c = courses.find((x) => x.id === id);
    const max = c?._count.questions ?? 0;
    setNumQuestions(Math.min(20, max));
    setError("");
  }

  async function startQuiz() {
    if (!selectedId) { setError("Please select a course."); return; }
    if (maxQs === 0) { setError("This course has no questions yet."); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedId, numQuestions: effectiveNum }),
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
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-2">
        Start a Quiz
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }} className="mb-6">
        Select a course and choose how many questions you want.
      </p>

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
          </div>

          {/* Fine-grained slider */}
          <input
            type="range"
            min={1}
            max={maxQs}
            value={effectiveNum}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            style={{ accentColor: "var(--orange)", width: "100%" }}
          />

          <div className="flex items-center justify-between mt-2">
            <p style={{ color: "var(--muted)", fontSize: 12 }}>
              {effectiveNum} question{effectiveNum !== 1 ? "s" : ""}
            </p>
            <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }}>
              ~{timeMins > 0 ? `${timeMins}m ` : ""}{timeSec > 0 ? `${timeSec}s` : ""}
              {" "}estimated
            </p>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--red)", fontSize: 13 }} className="mb-4">{error}</p>}

      <button
        onClick={startQuiz}
        disabled={loading || !selectedId || maxQs === 0}
        style={{ background: "var(--orange)", color: "#fff", borderRadius: 10 }}
        className="w-full py-3 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity mb-5"
      >
        {loading ? "Starting quiz…" : "Start Quiz →"}
      </button>

      {/* Rules */}
      <div style={{ background: "var(--orange-pale)", border: "1px solid var(--border)", borderRadius: 10 }} className="p-4">
        <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Quiz Rules</p>
        <ul style={{ color: "var(--muted)", fontSize: 12 }} className="flex flex-col gap-1.5">
          {[
            "Questions and options are shuffled each attempt.",
            "The quiz auto-submits when the timer reaches zero.",
            "Switching tabs starts a 2-second auto-submit countdown.",
            "You can resume if you accidentally close the tab.",
            "Unlimited attempts per course are allowed.",
          ].map((rule, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: "var(--orange)", flexShrink: 0 }}>·</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
