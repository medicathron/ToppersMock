"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  options: string;
  correctAnswerIndex: number;
  explanation?: string | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  timePerQuestion: number;
  resultsReleased: boolean;
  questions: Question[];
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" });
  const [addMode, setAddMode] = useState(false);
  const [newQ, setNewQ] = useState({ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" });
  const [saving, setSaving] = useState(false);
  const [releasingResults, setReleasingResults] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) setCourse(await res.json());
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setEditForm({
      questionText: q.questionText,
      options: JSON.parse(q.options),
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation ?? "",
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/questions/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, options: editForm.options }),
    });
    setSaving(false);
    setEditingId(null);
    load();
  }

  async function addQuestion() {
    setSaving(true);
    await fetch(`/api/courses/${courseId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newQ, question: newQ.questionText, correctIndex: newQ.correctAnswerIndex }),
    });
    setSaving(false);
    setAddMode(false);
    setNewQ({ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" });
    load();
  }

  async function toggleResults() {
    if (!course) return;
    setReleasingResults(true);
    await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsReleased: !course.resultsReleased }),
    });
    setReleasingResults(false);
    load();
  }

  if (!course) return <div style={{ color: "var(--muted)" }}>Loading…</div>;

  const OPTIONS_LABELS = ["A", "B", "C", "D"];

  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
        <button onClick={() => router.back()} style={{ color: "var(--muted)", fontSize: 13 }}>← Back</button>
        <span style={{ color: "var(--orange)", fontWeight: 700, fontSize: 13 }}>{course.code}</span>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }}>{course.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{course.questions.length} questions · {course.timePerQuestion}s per question</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={toggleResults}
            disabled={releasingResults}
            style={{
              background: course.resultsReleased ? "var(--green)" : "transparent",
              border: `1px solid ${course.resultsReleased ? "var(--green)" : "var(--border)"}`,
              color: course.resultsReleased ? "#fff" : "var(--dark)",
              borderRadius: 8,
              fontSize: 13,
            }}
            className="px-3 py-1.5 font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {course.resultsReleased ? "Results Released ✓" : "Release Results"}
          </button>
          <Link
            href={`/tutor/courses/${courseId}/generate`}
            style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--dark)", fontSize: 13 }}
            className="px-3 py-1.5 font-medium hover:bg-orange-pale transition-colors"
          >
            Generate with AI
          </Link>
          <button
            onClick={() => setAddMode(true)}
            style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }}
            className="px-3 py-1.5 font-medium hover:opacity-90 transition-opacity"
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Add question form */}
      {addMode && (
        <div style={{ background: "var(--orange-pale)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5 mb-4">
          <h3 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-3">New Question</h3>
          <QuestionForm
            form={newQ}
            onChange={setNewQ}
            optLabels={OPTIONS_LABELS}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setAddMode(false)} style={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--dark)" }} className="px-4 py-1.5">Cancel</button>
            <button onClick={addQuestion} disabled={saving} style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }} className="px-4 py-1.5 disabled:opacity-50">{saving ? "Saving…" : "Save Question"}</button>
          </div>
        </div>
      )}

      {course.questions.length === 0 ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 12 }} className="p-10 text-center">
          <p style={{ color: "var(--muted)" }}>No questions yet. Add manually or generate with AI.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {course.questions.map((q, idx) => {
            const opts: string[] = JSON.parse(q.options);
            const isEditing = editingId === q.id;
            return (
              <div key={q.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
                {isEditing ? (
                  <>
                    <QuestionForm form={editForm} onChange={setEditForm} optLabels={OPTIONS_LABELS} />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditingId(null)} style={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--dark)" }} className="px-4 py-1.5">Cancel</button>
                      <button onClick={saveEdit} disabled={saving} style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }} className="px-4 py-1.5 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 24, fontWeight: 700 }}>{idx + 1}.</span>
                    <div className="flex-1">
                      <p style={{ color: "var(--dark)", fontSize: 14 }}>{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {opts.map((opt, i) => (
                          <p key={i} style={{ fontSize: 12, color: i === q.correctAnswerIndex ? "var(--green)" : "var(--muted)", fontWeight: i === q.correctAnswerIndex ? 700 : 400 }}>
                            {OPTIONS_LABELS[i]}. {opt}
                          </p>
                        ))}
                      </div>
                      {q.explanation && <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>Explanation: {q.explanation}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => startEdit(q)} style={{ color: "var(--orange)", fontSize: 12 }} className="hover:underline">Edit</button>
                      <button onClick={() => deleteQuestion(q.id)} style={{ color: "var(--red)", fontSize: 12 }} className="hover:underline">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QForm {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

function QuestionForm({ form, onChange, optLabels }: { form: QForm; onChange: (f: QForm) => void; optLabels: string[] }) {
  function setOpt(i: number, v: string) {
    const opts = [...form.options];
    opts[i] = v;
    onChange({ ...form, options: opts });
  }
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={form.questionText}
        onChange={(e) => onChange({ ...form, questionText: e.target.value })}
        placeholder="Question text"
        rows={2}
        style={{ border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--dark)" }}
        className="w-full px-3 py-2 outline-none resize-none"
      />
      <div className="grid grid-cols-2 gap-2">
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${form.questionText.slice(0, 10)}`}
              checked={form.correctAnswerIndex === i}
              onChange={() => onChange({ ...form, correctAnswerIndex: i })}
              style={{ accentColor: "var(--orange)" }}
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => setOpt(i, e.target.value)}
              placeholder={`Option ${optLabels[i]}`}
              style={{ border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--dark)" }}
              className="flex-1 px-2 py-1 outline-none"
            />
          </div>
        ))}
      </div>
      <input
        type="text"
        value={form.explanation}
        onChange={(e) => onChange({ ...form, explanation: e.target.value })}
        placeholder="Explanation (optional)"
        style={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--dark)" }}
        className="w-full px-3 py-1.5 outline-none"
      />
    </div>
  );
}
