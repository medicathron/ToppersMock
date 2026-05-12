import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;
  const needsRegistration = session?.user?.needsRegistration;

  const isTutorRoute =
    pathname.startsWith("/tutor") &&
    pathname !== "/tutor/login" &&
    pathname !== "/tutor/register";
  const isStudentRoute =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/results");
  const isRegisterRoute = pathname === "/register";

  if (isTutorRoute && role !== "TUTOR") {
    return NextResponse.redirect(new URL("/tutor/login", req.url));
  }

  if (isStudentRoute && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (role === "STUDENT" && needsRegistration && !isRegisterRoute && isStudentRoute) {
    return NextResponse.redirect(new URL("/register", req.url));
  }

  if (isRegisterRoute && role === "STUDENT" && !needsRegistration) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  if (pathname === "/login" && role === "STUDENT" && !needsRegistration) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }
  if (pathname === "/login" && role === "TUTOR") {
    return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
  }
  if (pathname === "/tutor/login" && role === "TUTOR") {
    return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/tutor/:path*",
    "/profile/:path*",
    "/quiz/:path*",
    "/results/:path*",
    "/register",
    "/login",
    "/tutor/login",
  ],
};
