import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get("admin_token")?.value;
  const expectedSecret = process.env.ADMIN_SECRET || "lenka-booking-secret-2026-xyz";

  if (adminToken !== expectedSecret) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
