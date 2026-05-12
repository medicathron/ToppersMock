export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "var(--dark)" }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      {children}
    </div>
  );
}
