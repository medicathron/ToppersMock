"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: "/quiz/select",
    label: "Start Quiz",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
  },
];

export default function StudentNav({ displayName }: { displayName: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide bottom nav on quiz pages — they have their own navigation
  const hideBottomNav = pathname.startsWith("/quiz/") && !pathname.startsWith("/quiz/select");

  return (
    <>
      {/* Top bar */}
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
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>{displayName}</span>
            )}
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{ color: active ? "var(--orange)" : "var(--border)", fontSize: 13, fontWeight: active ? 600 : 400 }}
                  className="hover:text-white transition-colors"
                >
                  {label}
                </Link>
              );
            })}
            <Link href="/api/auth/signout" style={{ color: "var(--muted)", fontSize: 13 }} className="hover:text-white transition-colors">
              Sign out
            </Link>
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
            {[...NAV_ITEMS, { href: "/api/auth/signout", label: "Sign out", icon: null }].map(({ href, label }) => (
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

      {/* Mobile bottom tab bar — hidden on quiz pages and desktop */}
      {!hideBottomNav && (
        <div
          className="sm:hidden"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
            background: "var(--surface)", borderTop: "1px solid var(--border)",
            display: "flex",
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, padding: "10px 0", minHeight: 56,
                  color: active ? "var(--orange)" : "var(--muted)",
                  fontSize: 10, fontWeight: 600, textDecoration: "none",
                }}
              >
                <span style={{ color: active ? "var(--orange)" : "var(--muted)" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
          <Link
            href="/api/auth/signout"
            style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, padding: "10px 0", minHeight: 56,
              color: "var(--muted)", fontSize: 10, fontWeight: 600, textDecoration: "none",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </Link>
        </div>
      )}
    </>
  );
}
