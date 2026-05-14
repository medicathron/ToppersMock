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

      {/* Course cards */}
      <div className="flex flex-col gap-3 mb-6">
        {courses.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading courses…</p>
        )}
        {courses.map((c) => {
          const isSelected = selectedId === c.id;
          const hasQs = c._count.questions > 0;
          return (
            <button
              key={c.id}
              onClick={() => hasQs && selectCourse(c.id)}
              disabled={!hasQs}
              className="quiz-option text-left"
              style={{
                background: isSelected ? "var(--dark)" : "var(--surface)",
                border: `2px solid ${isSelected ? "var(--orange)" : "var(--border)"}`,
                borderRadius: 12,
                padding: "16px 18px",
                cursor: hasQs ? "pointer" : "not-allowed",
                opacity: hasQs ? 1 : 0.5,
                width: "100%",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ color: "var(--orange)", fontWeight: 700, fontSize: 15 }}>
                      {c.code}
                    </span>
                    <span style={{
                      background: isSelected ? "rgba(255,255,255,0.15)" : "var(--orange-pale)",
                      color: isSelected ? "#fff" : "var(--orange)",
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    }}>
                      {c._count.questions} Qs
                    </span>
                    {!hasQs && (
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>No questions yet</span>
                    )}
                  </div>
                  <p style={{
                    color: isSelected ? "rgba(255,255,255,0.85)" : "var(--dark)",
                    fontSize: 14, marginTop: 3, fontWeight: 500,
                  }}>
                    {c.name}
                  </p>
                  {c.description && (
                    <p style={{ color: isSelected ? "rgba(255,255,255,0.5)" : "var(--muted)", fontSize: 12, marginTop: 2 }}>
                      {c.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--orange)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Question count + time */}
      {selected && maxQs > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5 mb-5">
          <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 14 }} className="mb-3">
            Number of Questions
          </p>

          {/* Quick-pick pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[...QUICK_COUNTS.filter((n) => n <= maxQs), ...(QUICK_COUNTS.every((n) => n !== maxQs) ? [maxQs] : [])].map((n) => (
              <button
                key={n}
                onClick={() => setNumQuestions(n)}
                style={{
                  border: `1.5px solid ${numQuestions === n ? "var(--orange)" : "var(--border)"}`,
                  background: numQuestions === n ? "var(--orange)" : "transparent",
                  color: numQuestions === n ? "#fff" : "var(--dark)",
                  borderRadius: 99, fontSize: 13, fontWeight: 600,
                  padding: "5px 16px", cursor: "pointer",
                }}
              >
                {n === maxQs && !QUICK_COUNTS.includes(n) ? `All (${n})` : n}
              </button>
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
