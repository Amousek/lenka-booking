"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Slot {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  activity: string;
  max_persons: number;
  approved_count: number;
  pending_count: number;
}

interface Reservation {
  id: string;
  slot_id: string;
  name: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  slots: {
    date: string;
    time_from: string;
    time_to: string;
    activity: string;
  } | null;
}

interface Suggestion {
  id: string;
  name: string;
  date: string;
  time_from: string;
  time_to: string;
  activity: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const PRESET_ACTIVITIES = [
  "☕ Káva / Procházka",
  "🍷 Posezení u vína",
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

const STATUS_CONFIG = {
  pending: { label: "Čeká", bg: "bg-amber-100 text-amber-800" },
  approved: { label: "Schváleno", bg: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Zamítnuto", bg: "bg-red-100 text-red-800" },
} as const;

export default function AdminPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form state
  const [date, setDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [activityType, setActivityType] = useState(PRESET_ACTIVITIES[0]);
  const [customActivity, setCustomActivity] = useState("");
  const [maxPersons, setMaxPersons] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [slotsRes, reservationsRes, suggestionsRes] = await Promise.all([
        fetch("/api/slots?all=true"),
        fetch("/api/reservations"),
        fetch("/api/suggestions"),
      ]);
      if (slotsRes.ok) setSlots(await slotsRes.json());
      if (reservationsRes.ok) setReservations(await reservationsRes.json());
      if (suggestionsRes.ok) setSuggestions(await suggestionsRes.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestionAction(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchData();
  }

  async function handleDeleteSuggestion(id: string) {
    const res = await fetch("/api/suggestions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchData();
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError("");

    const activity =
      activityType === "custom"
        ? `✏️ ${customActivity}`
        : activityType;

    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time_from: timeFrom,
          time_to: timeTo,
          activity,
          max_persons: maxPersons,
        }),
      });

      if (res.ok) {
        setDate("");
        setTimeFrom("");
        setTimeTo("");
        setActivityType(PRESET_ACTIVITIES[0]);
        setCustomActivity("");
        setMaxPersons(1);
        fetchData();
      } else {
        const data = await res.json();
        setFormError(data.error || "Chyba při vytváření");
      }
    } catch {
      setFormError("Chyba připojení");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm("Opravdu smazat tento blok? Smaže se i se všemi rezervacemi.")) return;
    await fetch("/api/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handleUpdateReservation(id: string, status: "approved" | "rejected") {
    await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  }

  async function handleDeleteReservation(id: string) {
    if (!confirm("Opravdu smazat tuto rezervaci?")) return;
    await fetch("/api/reservations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-violet-200 border-t-[#3B00DB] rounded-full animate-spin" />
      </div>
    );
  }

  const pendingReservations = reservations.filter((r) => r.status === "pending");
  const decidedReservations = reservations.filter((r) => r.status !== "pending");

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#3B00DB] to-[#BF00FF] bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            Odhlásit se →
          </button>
        </div>

        {/* ── Create Slot ── */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ➕ Nový časový blok
          </h2>
          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Od</label>
                <input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Do</label>
                <input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Aktivita</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="input-field"
              >
                {PRESET_ACTIVITIES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value="custom">✏️ Vlastní…</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Max. osob
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxPersons}
                onChange={(e) => setMaxPersons(Number(e.target.value))}
                required
                className="input-field"
              />
            </div>
            {activityType === "custom" && (
              <div className="sm:col-span-2 animate-fade-in">
                <label className="text-sm text-gray-500 mb-1 block">
                  Název vlastní aktivity
                </label>
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  required
                  placeholder="Např. Piknik v parku 🧺"
                  className="input-field"
                />
              </div>
            )}
            {formError && (
              <p className="sm:col-span-2 text-red-500 text-sm">{formError}</p>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? "Vytvářím…" : "Vytvořit blok"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Pending Reservations ── */}
        {pendingReservations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ⏳ Čekající rezervace{" "}
              <span className="text-amber-600">({pendingReservations.length})</span>
            </h2>
            <div className="space-y-3">
              {pendingReservations.map((r) => (
                <div
                  key={r.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-5 animate-fade-in"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">{r.name}</p>
                      {r.note && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          „{r.note}"
                        </p>
                      )}
                      {r.slots && (
                        <p className="text-sm text-gray-400 mt-2">
                          {formatDate(r.slots.date)}{" "}
                          {formatTime(r.slots.time_from)}–
                          {formatTime(r.slots.time_to)} · {r.slots.activity}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateReservation(r.id, "approved")}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        ✓ Schválit
                      </button>
                      <button
                        onClick={() => handleUpdateReservation(r.id, "rejected")}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        ✗ Zamítnout
                      </button>
                      <button
                        onClick={() => handleDeleteReservation(r.id)}
                        className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Smazat"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Active Slots ── */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📅 Vypsané bloky ({slots.length})
          </h2>
          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white/50 rounded-2xl border border-white/40">
              Žádné bloky – vytvoř první výše ☝️
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-white/40 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">
                      {formatDate(slot.date)} ·{" "}
                      {formatTime(slot.time_from)}–{formatTime(slot.time_to)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {slot.activity} ·{" "}
                      <span className="text-emerald-600">
                        {slot.approved_count}/{slot.max_persons} schváleno
                      </span>
                      {slot.pending_count > 0 && (
                        <span className="text-amber-600 ml-1">
                          · {slot.pending_count} čeká
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="shrink-0 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Smazat
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Decided Reservations ── */}
        {decidedReservations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Vyřízené rezervace ({decidedReservations.length})
            </h2>
            <div className="space-y-3">
              {decidedReservations.map((r) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <div
                    key={r.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/40 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800">{r.name}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      {r.note && (
                        <p className="text-sm text-gray-500 mt-0.5 italic">
                          „{r.note}"
                        </p>
                      )}
                      {r.slots && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(r.slots.date)} · {r.slots.activity}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReservation(r.id)}
                      className="shrink-0 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Smazat"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Suggestions section ── */}
        {suggestions.filter((s) => s.status === "pending").length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              💡 Návrhy termínů od kamarádů ({suggestions.filter((s) => s.status === "pending").length})
            </h2>
            <div className="space-y-3">
              {suggestions
                .filter((s) => s.status === "pending")
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-purple-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {formatDate(s.date)} · {formatTime(s.time_from)}–{formatTime(s.time_to)}
                        </p>
                        <p className="text-sm text-gray-600">{s.activity}</p>
                        {s.note && (
                          <p className="text-sm text-gray-500 mt-1 italic">„{s.note}"</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleSuggestionAction(s.id, "approved")}
                          className="px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          title="Schválit a vytvořit blok"
                        >
                          ✅ Schválit
                        </button>
                        <button
                          onClick={() => handleSuggestionAction(s.id, "rejected")}
                          className="px-3 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => handleDeleteSuggestion(s.id)}
                          className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
