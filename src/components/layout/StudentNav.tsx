"use client";
import { useState } from "react";
import Link from "next/link";

export default function StudentNav({ displayName }: { displayName: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{ background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      className="px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-dm-serif)", color: "var(--orange)", fontSize: 18 }}>
          ToppersMock
        </span>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-4">
          {displayName && (
            <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 500 }}>{displayName}</span>
          )}
          <Link href="/profile" style={{ color: "var(--border)", fontSize: 13 }} className="hover:text-white transition-colors">Profile</Link>
          <Link href="/quiz/select" style={{ color: "var(--border)", fontSize: 13 }} className="hover:text-white transition-colors">Start Quiz</Link>
          <Link href="/api/auth/signout" style={{ color: "var(--muted)", fontSize: 13 }} className="hover:text-white transition-colors">Sign out</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="sm:hidden"
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "5px 10px", color: "#fff", fontSize: 16, cursor: "pointer",
          }}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden flex flex-col gap-1 mt-2 pb-1">
          {displayName && (
            <span style={{ color: "var(--muted)", fontSize: 12, padding: "4px 8px" }}>{displayName}</span>
          )}
          {[
            { href: "/profile", label: "Profile" },
            { href: "/quiz/select", label: "Start Quiz" },
            { href: "/api/auth/signout", label: "Sign out" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ color: "#fff", fontSize: 14, padding: "8px 8px", borderRadius: 6 }}
              className="hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
