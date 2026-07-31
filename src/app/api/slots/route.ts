import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

function isAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.get("admin_token")?.value === process.env.ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";

  let query = supabase
    .from("slots")
    .select("*, reservations(id, status)");

  if (!showAll) {
    query = query.gte("date", new Date().toISOString().split("T")[0]);
  }

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("time_from", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data ?? []).map((slot) => {
    const reservations = slot.reservations as { id: string; status: string }[];
    return {
      ...slot,
      approved_count: reservations.filter((r) => r.status === "approved").length,
      pending_count: reservations.filter((r) => r.status === "pending").length,
      reservations: undefined,
    };
  });

  return NextResponse.json(slots);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const body = await request.json();
  const { data, error } = await supabase
    .from("slots")
    .insert({
      date: body.date,
      time_from: body.time_from,
      time_to: body.time_to,
      activity: body.activity,
      max_persons: body.max_persons ?? 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id } = await request.json();
  const { error } = await supabase.from("slots").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
