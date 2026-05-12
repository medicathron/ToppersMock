"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface GeneratedQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  _editing?: boolean;
}

const OPT_LABELS = ["A", "B", "C", "D"];

export default function GeneratePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [mode, setMode] = useState<"file" | "topic">("topic");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<GeneratedQ[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    setGenerating(true);
    const fd = new FormData();
    fd.append("count", String(count));
    if (mode === "topic") fd.append("topic", topic);
    else if (file) fd.append("file", file);

    const res = await fetch("/api/generate", { method: "POST", body: fd });
    setGenerating(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Generation failed.");
    } else {
      setQuestions(await res.json());
    }
  }

  async function saveAll() {
    setSaving(true);
    await fetch(`/api/courses/${courseId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questions),
    });
    setSaving(false);
    router.push(`/tutor/courses/${courseId}`);
  }

  function updateQ(i: number, field: string, value: unknown) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  function removeQ(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={() => router.back()} style={{ color: "var(--muted)", fontSize: 13 }} className="mb-4 block">← Back</button>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }} className="mb-6">
        Generate Questions with AI
      </h1>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        {(["topic", "file"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "var(--orange)" : "transparent",
              color: mode === m ? "#fff" : "var(--dark)",
              border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 13,
            }}
            className="px-4 py-2 font-medium transition-colors capitalize"
          >
            {m === "topic" ? "By Topic" : "Upload File"}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5 mb-4">
        {mode === "topic" ? (
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. First Law of Thermodynamics, Newton's Laws of Motion"
              style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)" }}
              className="w-full px-3 py-2 text-sm outline-none"
            />
          </div>
        ) : (
          <div>
            <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
              Upload File (PDF, DOCX, image, or text)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ color: "var(--dark)", fontSize: 13 }}
              className="w-full"
            />
          </div>
        )}

        <div className="mt-3">
          <label style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600 }} className="block mb-1">
            Number of Questions to Generate
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            style={{ border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--dark)", width: 100 }}
            className="px-3 py-2 text-sm outline-none"
          />
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }} className="mt-2">{error}</p>}

        <button
          onClick={generate}
          disabled={generating || (mode === "topic" ? !topic.trim() : !file)}
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="mt-4 px-6 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {generating ? "Generating…" : "Generate Questions"}
        </button>
      </div>

      {questions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ color: "var(--dark)", fontWeight: 700 }}>{questions.length} Questions Generated</h2>
            <button
              onClick={saveAll}
              disabled={saving}
              style={{ background: "var(--green)", color: "#fff", borderRadius: 8 }}
              className="px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : `Save All to Course`}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700, minWidth: 24 }}>{i + 1}.</span>
                  <div className="flex-1">
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQ(i, "question", e.target.value)}
                      rows={2}
                      style={{ border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, color: "var(--dark)" }}
                      className="w-full px-2 py-1 resize-none outline-none"
                    />
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {q.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={q.correctIndex === j}
                            onChange={() => updateQ(i, "correctIndex", j)}
                            name={`q-${i}`}
                            style={{ accentColor: "var(--orange)" }}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...q.options]; opts[j] = e.target.value;
                              updateQ(i, "options", opts);
                            }}
                            style={{ border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, color: j === q.correctIndex ? "var(--green)" : "var(--dark)" }}
                            className="flex-1 px-2 py-0.5 outline-none"
                          />
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{OPT_LABELS[j]}</span>
                        </div>
                      ))}
                    </div>
                    {q.explanation !== undefined && (
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => updateQ(i, "explanation", e.target.value)}
                        placeholder="Explanation (optional)"
                        style={{ border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--muted)" }}
                        className="w-full px-2 py-1 mt-2 outline-none"
                      />
                    )}
                  </div>
                  <button onClick={() => removeQ(i)} style={{ color: "var(--red)", fontSize: 12 }} className="hover:underline shrink-0">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveAll}
            disabled={saving}
            style={{ background: "var(--green)", color: "#fff", borderRadius: 8 }}
            className="mt-4 px-6 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving…" : `Save All ${questions.length} Questions`}
          </button>
        </div>
      )}
    </div>
  );
}
