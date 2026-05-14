"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const Icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  courses: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  students: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  results: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  signout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

interface NavLink {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  badge?: number;
}

export default function TutorSidebar({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const SidebarInner = () => (
    <aside
      style={{ background: "var(--dark2)", width: 220, minHeight: "100vh" }}
      className="flex flex-col px-4 py-6 gap-1 h-full"
    >
      <div
        style={{ fontFamily: "var(--font-dm-serif)", color: "var(--orange)", fontSize: 22 }}
        className="mb-8 px-2"
      >
        ToppersMock
      </div>
      {links.map(({ href, label, icon, badge }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            style={{
              color: active ? "#fff" : "var(--border)",
              background: active ? "rgba(224,92,26,0.15)" : "transparent",
              borderRadius: 8,
              fontSize: 14,
              borderLeft: `2px solid ${active ? "var(--orange)" : "transparent"}`,
            }}
            className="px-3 py-2 hover:bg-white/10 transition-colors font-medium flex items-center gap-2.5"
          >
            <span style={{ color: active ? "var(--orange)" : "var(--muted)", flexShrink: 0 }}>
              {Icons[icon]}
            </span>
            <span className="flex-1">{label}</span>
            {badge ? (
              <span style={{
                background: "var(--orange)", color: "#fff", borderRadius: 10,
                fontSize: 10, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center",
              }}>
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
      <div className="mt-auto">
        <Link
          href="/api/auth/signout"
          style={{ color: "var(--muted)", fontSize: 13 }}
          className="px-3 py-2 flex items-center gap-2.5 hover:text-white transition-colors"
        >
          <span style={{ flexShrink: 0 }}>{Icons.signout}</span>
          Sign out
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden"
        style={{
          position: "fixed", top: 14, left: 14, zIndex: 60,
          background: "var(--dark2)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 18, lineHeight: 1,
          cursor: "pointer",
        }}
        aria-label="Open menu"
      >
        &#9776;
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50 }}
          className="md:hidden"
        />
      )}

      {/* Sidebar — fixed position, slide in on mobile, always visible on desktop */}
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          zIndex: 55,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.2s ease",
        }}
        className="md:translate-x-0"
      >
        <SidebarInner />
      </div>

      {/* Desktop spacer — pushes main content right of the fixed sidebar */}
      <div className="hidden md:block shrink-0" style={{ width: 220 }} />
    </>
  );
}
