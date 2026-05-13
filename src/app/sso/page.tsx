"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SSOPage() {
  const token = useSearchParams().get("token");
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    signIn("sso", { token, redirect: false }).then((res) => {
      router.replace(res?.ok ? "/quiz/select" : "/login?error=sso_failed");
    });
  }, [token, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <p style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)", fontSize: 15 }}>
        Signing you in to ToppersMock…
      </p>
    </div>
  );
}
