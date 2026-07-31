import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

function isAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.get("admin_token")?.value === process.env.ADMIN_SECRET;
}

// GET – admin only: list all suggestions
export async function GET() {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST – public: anyone can suggest a time
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      name: body.name,
      date: body.date,
      time_from: body.time_from,
      time_to: body.time_to,
      activity: body.activity,
      note: body.note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PATCH – admin: approve (creates a slot from suggestion) or reject
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id, status } = await request.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Neplatný status" }, { status: 400 });
  }

  // If approving, create a slot from the suggestion
  if (status === "approved") {
    const { data: suggestion } = await supabase
      .from("suggestions")
      .select("*")
      .eq("id", id)
      .single();

    if (suggestion) {
      await supabase.from("slots").insert({
        date: suggestion.date,
        time_from: suggestion.time_from,
        time_to: suggestion.time_to,
        activity: suggestion.activity,
        max_persons: 1,
      });
    }
  }

  const { data, error } = await supabase
    .from("suggestions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE – admin only
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id } = await request.json();
  const { error } = await supabase.from("suggestions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
