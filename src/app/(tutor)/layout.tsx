import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") redirect("/tutor/login");

  const links = [
    { href: "/tutor/dashboard", label: "Dashboard" },
    { href: "/tutor/courses", label: "Courses" },
    { href: "/tutor/students", label: "Students" },
    { href: "/tutor/results", label: "Results" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        style={{ background: "var(--dark2)", width: 220, minHeight: "100vh" }}
        className="flex flex-col px-4 py-6 gap-1 shrink-0"
      >
        <div style={{ fontFamily: "var(--font-dm-serif)", color: "var(--orange)", fontSize: 22 }} className="mb-8 px-2">
          ToppersMock
        </div>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{ color: "var(--border)", borderRadius: 8, fontSize: 14 }}
            className="px-3 py-2 hover:bg-white/10 transition-colors font-medium"
          >
            {label}
          </Link>
        ))}
        <div className="mt-auto">
          <Link
            href="/api/auth/signout"
            style={{ color: "var(--muted)", fontSize: 13 }}
            className="px-3 py-2 block hover:text-white transition-colors"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
