import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Allow the login page through
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get("admin_token")?.value;

  if (adminToken !== process.env.ADMIN_SECRET) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
