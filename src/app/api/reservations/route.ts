import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { notifyAdminNewReservation, notifyUserReservationStatus } from "@/lib/email";

function isAdmin(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.get("admin_token")?.value === process.env.ADMIN_SECRET;
}

export async function GET() {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reservations")
    .select("*, slots(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.json();

  // Check slot capacity
  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", body.slot_id)
    .single();

  if (!slot) {
    return NextResponse.json({ error: "Blok nenalezen" }, { status: 404 });
  }

  const { data: approved } = await supabase
    .from("reservations")
    .select("id")
    .eq("slot_id", body.slot_id)
    .eq("status", "approved");

  if (approved && approved.length >= slot.max_persons) {
    return NextResponse.json(
      { error: "Tento blok je již plně obsazen" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({
      slot_id: body.slot_id,
      name: body.name,
      email: body.email || null,
      note: body.note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify admin via email (non-blocking)
  notifyAdminNewReservation({
    name: body.name,
    email: body.email || undefined,
    note: body.note || undefined,
    slotDate: slot.date,
    slotTime: `${slot.time_from.slice(0, 5)}–${slot.time_to.slice(0, 5)}`,
    slotActivity: slot.activity,
  });

  return NextResponse.json(data, { status: 201 });
}

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

  // Get the reservation with its slot details BEFORE updating
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, slots(*)")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify the user if they provided an email (non-blocking)
  if (reservation?.email && reservation?.slots) {
    notifyUserReservationStatus({
      email: reservation.email,
      name: reservation.name,
      status,
      slotDate: reservation.slots.date,
      slotTime: `${reservation.slots.time_from.slice(0, 5)}–${reservation.slots.time_to.slice(0, 5)}`,
      slotActivity: reservation.slots.activity,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { id } = await request.json();
  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
