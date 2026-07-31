import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "lenka-booking-secret-2026-xyz";

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin !== ADMIN_PIN) {
    return NextResponse.json({ error: "Nesprávný PIN" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_token", ADMIN_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ success: true });
}
