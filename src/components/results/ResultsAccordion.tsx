"use client";
import { useState } from "react";

const OPT_LABELS = ["A", "B", "C", "D"];

interface Answer {
  id: string;
  questionOrder: number;
  shuffledOptions: string;
  shuffledCorrectIndex: number;
  selectedOption: number | null;
  isCorrect: boolean | null;
  question: { questionText: string; explanation: string | null };
}

export default function ResultsAccordion({ answers }: { answers: Answer[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {answers.map((a, idx) => {
        const opts: string[] = JSON.parse(a.shuffledOptions);
        const correct = a.shuffledCorrectIndex;
        const selected = a.selectedOption;
        const isOpen = openId === a.id;

        return (
          <div
            key={a.id}
            style={{
              background: "var(--surface)",
              border: `1px solid ${a.isCorrect ? "var(--green)" : "var(--red)"}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Header (always visible) */}
            <button
              onClick={() => setOpenId(isOpen ? null : a.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
              style={{ background: "transparent", cursor: "pointer" }}
            >
              <span style={{
                minWidth: 24, height: 24, borderRadius: 6,
                background: a.isCorrect ? "var(--green)" : "var(--red)",
                color: "#fff", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {a.isCorrect ? "✓" : "✗"}
              </span>
              <p style={{ color: "var(--dark)", fontSize: 14, lineHeight: 1.4, flex: 1 }}>
                <strong style={{ color: "var(--muted)", fontSize: 12 }}>Q{idx + 1}. </strong>
                {a.question.questionText}
              </p>
              <span style={{ color: "var(--muted)", fontSize: 16, flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                ▾
              </span>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                  {opts.map((opt, i) => {
                    const isCorrectOpt = i === correct;
                    const isSelectedOpt = i === selected;
                    let bg = "transparent";
                    let border = "1px solid var(--border)";
                    let color = "var(--muted)";
                    if (isCorrectOpt) { bg = "rgba(30,122,69,0.1)"; border = "1px solid var(--green)"; color = "var(--green)"; }
                    if (isSelectedOpt && !isCorrectOpt) { bg = "rgba(192,57,43,0.1)"; border = "1px solid var(--red)"; color = "var(--red)"; }
                    return (
                      <div key={i} style={{ background: bg, border, borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                        <span style={{ color, fontWeight: 700 }}>{OPT_LABELS[i]}. </span>
                        <span style={{ color }}>{opt}</span>
                        {isCorrectOpt && <span style={{ color: "var(--green)", fontSize: 11 }}> ✓</span>}
                        {isSelectedOpt && !isCorrectOpt && <span style={{ color: "var(--red)", fontSize: 11 }}> ✗</span>}
                      </div>
                    );
                  })}
                </div>

                {a.question.explanation && (
                  <div style={{ background: "var(--orange-pale)", borderRadius: 6, padding: "8px 10px" }}>
                    <p style={{ color: "var(--dark)", fontSize: 12 }}>
                      <strong style={{ color: "var(--orange)" }}>Explanation: </strong>
                      {a.question.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
