import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.role === "TUTOR") redirect("/tutor/dashboard");
  if (session?.user?.role === "STUDENT") {
    if (session.user.needsRegistration) redirect("/register");
    redirect("/profile");
  }
  redirect("/login");
}
