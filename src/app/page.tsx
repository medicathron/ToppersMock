import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role === "STUDENT" && !session.user.needsRegistration) redirect("/profile");
  if (session?.user?.role === "TUTOR") redirect("/tutor/dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "80px 24px 72px", textAlign: "center" }}>
        <p style={{ color: "var(--orange)", fontFamily: "var(--font-dm-serif)", fontSize: 44, lineHeight: 1.1 }}>
          ToppersMock
        </p>
        <p style={{ color: "#fff", fontSize: 22, marginTop: 14, fontWeight: 600 }}>
          Practice smarter. Score higher.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 15, marginTop: 10, maxWidth: 480, margin: "12px auto 0", lineHeight: 1.7 }}>
          AI-powered MCQ practice platform. Tutors build course question banks; students test themselves before the real thing.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, padding: "13px 32px", fontWeight: 700, fontSize: 15, display: "inline-block" }}
            className="hover:opacity-90 transition-opacity"
          >
            Student Login
          </Link>
          <Link
            href="/tutor/login"
            style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "13px 32px", fontWeight: 600, fontSize: 15, display: "inline-block" }}
            className="hover:bg-white/10 transition-colors"
          >
            Tutor Login
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24,
        }}
      >
        {[
          {
            title: "AI Question Generation",
            body: "Upload lecture PDFs, notes or images — Claude generates ready-to-use MCQs in seconds.",
            icon: "✦",
          },
          {
            title: "Timed Practice",
            body: "Custom time limits per question. Mid-quiz resume means no progress is lost if you close the tab.",
            icon: "◷",
          },
          {
            title: "Instant Feedback",
            body: "Detailed answer review with explanations once your tutor releases results.",
            icon: "✓",
          },
        ].map(({ title, body, icon }) => (
          <div
            key={title}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 28,
            }}
          >
            <span style={{ fontSize: 24, color: "var(--orange)", display: "block", marginBottom: 12 }}>{icon}</span>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--dark)", marginBottom: 8 }}>{title}</p>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>ToppersMock · Powered by AI</p>
      </div>
    </div>
  );
}
