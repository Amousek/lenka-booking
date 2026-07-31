"use client";

import { useState, useEffect, useMemo } from "react";

interface Slot {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  activity: string;
  max_persons: number;
  approved_count: number;
}

/* ── Helpers ── */

function formatTime(time: string) {
  return time.slice(0, 5);
}

function spotsLabel(n: number) {
  if (n === 1) return "místo";
  if (n >= 2 && n <= 4) return "místa";
  return "míst";
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

/* ── Component ── */

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  // Suggestion form state
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [sugName, setSugName] = useState("");
  const [sugDate, setSugDate] = useState("");
  const [sugTimeFrom, setSugTimeFrom] = useState("");
  const [sugTimeTo, setSugTimeTo] = useState("");
  const [sugActivity, setSugActivity] = useState("☕ Káva / Procházka");
  const [sugCustomActivity, setSugCustomActivity] = useState("");
  const [sugNote, setSugNote] = useState("");
  const [sugSubmitting, setSugSubmitting] = useState(false);
  const [sugSuccess, setSugSuccess] = useState(false);
  const [sugError, setSugError] = useState("");

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    try {
      const res = await fetch("/api/slots");
      if (res.ok) setSlots(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(slotId: string) {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slotId,
          name: name.trim(),
          note: note.trim() || null,
        }),
      });
      if (res.ok) {
        setSubmitted((prev) => new Set(prev).add(slotId));
        setSelectedSlot(null);
        setName("");
        setNote("");
        fetchSlots();
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
      }
    } catch {
      setError("Nepodařilo se odeslat rezervaci");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSuggestion(e: React.FormEvent) {
    e.preventDefault();
    setSugSubmitting(true);
    setSugError("");
    try {
      const activity =
        sugActivity === "custom" ? `✏️ ${sugCustomActivity}` : sugActivity;
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sugName.trim(),
          date: sugDate,
          time_from: sugTimeFrom,
          time_to: sugTimeTo,
          activity,
          note: sugNote.trim() || null,
        }),
      });
      if (res.ok) {
        setSugSuccess(true);
        setSugName("");
        setSugDate("");
        setSugTimeFrom("");
        setSugTimeTo("");
        setSugActivity("☕ Káva / Procházka");
        setSugCustomActivity("");
        setSugNote("");
      } else {
        const data = await res.json();
        setSugError(data.error || "Chyba při odesílání");
      }
    } catch {
      setSugError("Nepodařilo se odeslat návrh");
    } finally {
      setSugSubmitting(false);
    }
  }

  // Computed values
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const slot of slots) {
      (map[slot.date] ??= []).push(slot);
    }
    return map;
  }, [slots]);

  const weekHasSlots = weekDays.some(
    (d) => (slotsByDate[toDateStr(d)] ?? []).length > 0
  );

  const today = toDateStr(new Date());

  const weekLabel = `${weekDays[0].toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Lenka
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Ahoj! Tady si můžeš zarezervovat čas, kdy se konečně uvidíme. 💕
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Načítám termíny…</p>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm px-4 py-3">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 font-medium"
              >
                ← Předchozí
              </button>
              <span className="text-sm font-semibold text-gray-700">
                {weekLabel}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 font-medium"
              >
                Další →
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {weekDays.map((day, i) => {
                const dateStr = toDateStr(day);
                const daySlots = slotsByDate[dateStr] ?? [];
                const isToday = dateStr === today;
                const isPast = dateStr < today;

                return (
                  <div
                    key={dateStr}
                    className={`rounded-2xl border transition-all min-h-[140px] flex flex-col
                      ${isToday
                        ? "border-rose-300 bg-rose-50/80 shadow-md shadow-rose-100/50"
                        : isPast
                          ? "border-gray-100 bg-gray-50/50 opacity-50"
                          : "border-white/40 bg-white/70 shadow-sm"
                      }`}
                  >
                    <div
                      className={`text-center py-2 border-b ${
                        isToday ? "border-rose-200 bg-rose-100/50" : "border-gray-100"
                      } rounded-t-2xl`}
                    >
                      <p className={`text-xs font-medium ${isToday ? "text-rose-600" : "text-gray-400"}`}>
                        {DAY_NAMES[i]}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? "text-rose-600" : "text-gray-700"}`}>
                        {day.getDate()}.
                      </p>
                    </div>

                    <div className="flex-1 p-1.5 space-y-1.5">
                      {daySlots.length === 0 && !isPast && (
                        <p className="text-[10px] text-gray-300 text-center mt-4">—</p>
                      )}
                      {daySlots.map((slot) => {
                        const available = slot.max_persons - slot.approved_count;
                        const isFull = available <= 0;
                        const isSubmitted = submitted.has(slot.id);

                        return (
                          <button
                            key={slot.id}
                            onClick={() => {
                              if (!isFull && !isSubmitted && !isPast) {
                                setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
                                setError("");
                              }
                            }}
                            disabled={isFull || isSubmitted || isPast}
                            className={`w-full text-left p-2 rounded-xl text-[11px] leading-tight transition-all
                              ${selectedSlot === slot.id
                                ? "bg-rose-100 ring-2 ring-rose-400 shadow-sm"
                                : isSubmitted
                                  ? "bg-amber-50 border border-amber-200"
                                  : isFull
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-gradient-to-r from-purple-50 to-rose-50 hover:from-purple-100 hover:to-rose-100 border border-purple-100 cursor-pointer hover:shadow-sm"
                              } disabled:cursor-default`}
                          >
                            <p className="font-semibold text-gray-700 truncate">
                              {formatTime(slot.time_from)}–{formatTime(slot.time_to)}
                            </p>
                            <p className="truncate mt-0.5">{slot.activity}</p>
                            <p className="mt-0.5">
                              {isSubmitted ? (
                                <span className="text-amber-600">⏳ Odesláno</span>
                              ) : isFull ? (
                                <span className="text-gray-400">Obsazeno</span>
                              ) : (
                                <span className="text-emerald-600">
                                  {available} {spotsLabel(available)}
                                </span>
                              )}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!weekHasSlots && (
              <div className="text-center py-8 mt-4">
                <p className="text-gray-400">V tomto týdnu nejsou žádné termíny 🌸</p>
                <p className="text-gray-300 text-sm mt-1">Zkus přepnout na další týden →</p>
              </div>
            )}

            {/* ── Suggest a time section ── */}
            <div className="mt-10">
              {!showSuggestion && !sugSuccess && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">Nevyhovuje ti žádný termín?</p>
                  <button
                    onClick={() => setShowSuggestion(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 font-medium hover:bg-purple-50 hover:shadow-md transition-all"
                  >
                    💡 Navrhnout vlastní termín
                  </button>
                </div>
              )}

              {sugSuccess && (
                <div className="text-center py-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 animate-fade-in">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-emerald-700 font-medium">Návrh odeslán!</p>
                  <p className="text-emerald-600 text-sm mt-1">Lenka ho posoudí a dá ti vědět.</p>
                  <button
                    onClick={() => { setSugSuccess(false); setShowSuggestion(false); }}
                    className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Zavřít
                  </button>
                </div>
              )}

              {showSuggestion && !sugSuccess && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200 p-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">💡 Navrhnout termín</h2>
                    <button
                      onClick={() => setShowSuggestion(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSuggestion} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-500 mb-1 block">Tvoje jméno *</label>
                      <input type="text" value={sugName} onChange={(e) => setSugName(e.target.value)} required placeholder="Jméno a příjmení" className="input-field" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Navrhované datum *</label>
                      <input type="date" value={sugDate} onChange={(e) => setSugDate(e.target.value)} required className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-500 mb-1 block">Od *</label>
                        <input type="time" value={sugTimeFrom} onChange={(e) => setSugTimeFrom(e.target.value)} required className="input-field" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 mb-1 block">Do *</label>
                        <input type="time" value={sugTimeTo} onChange={(e) => setSugTimeTo(e.target.value)} required className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Aktivita</label>
                      <select value={sugActivity} onChange={(e) => setSugActivity(e.target.value)} className="input-field">
                        <option value="☕ Káva / Procházka">☕ Káva / Procházka</option>
                        <option value="🍷 Posezení u vína">🍷 Posezení u vína</option>
                        <option value="custom">✏️ Vlastní…</option>
                      </select>
                    </div>
                    {sugActivity === "custom" && (
                      <div className="animate-fade-in">
                        <label className="text-sm text-gray-500 mb-1 block">Vlastní aktivita *</label>
                        <input type="text" value={sugCustomActivity} onChange={(e) => setSugCustomActivity(e.target.value)} required placeholder="Např. Piknik v parku 🧺" className="input-field" />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-500 mb-1 block">Poznámka (volitelné)</label>
                      <textarea value={sugNote} onChange={(e) => setSugNote(e.target.value)} rows={2} placeholder="Např. Mohl/a bych i dříve…" className="input-field resize-none" />
                    </div>
                    {sugError && <p className="sm:col-span-2 text-red-500 text-sm">{sugError}</p>}
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={sugSubmitting || !sugName.trim()} className="btn-primary w-full">
                        {sugSubmitting ? "Odesílám…" : "Odeslat návrh termínu"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Booking form (bottom sheet) */}
            {selectedSlot && (() => {
              const slot = slots.find((s) => s.id === selectedSlot);
              if (!slot) return null;
              return (
                <div className="fixed inset-x-0 bottom-0 z-50 animate-fade-in">
                  <div className="max-w-lg mx-auto p-4">
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-rose-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(slot.date + "T00:00:00").toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
                          </p>
                          <p className="font-semibold text-gray-800">
                            {formatTime(slot.time_from)}–{formatTime(slot.time_to)} · {slot.activity}
                          </p>
                        </div>
                        <button onClick={() => { setSelectedSlot(null); setError(""); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">✕</button>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Jméno a příjmení *" value={name} onChange={(e) => setName(e.target.value)} className="input-field" autoFocus />
                        <textarea placeholder="Poznámka (volitelné)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input-field resize-none" />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button onClick={() => handleSubmit(slot.id)} disabled={submitting || !name.trim()} className="btn-primary w-full">
                          {submitting ? "Odesílám…" : "Odeslat rezervaci"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {selectedSlot && (
              <div className="fixed inset-0 bg-black/20 z-40" onClick={() => { setSelectedSlot(null); setError(""); }} />
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-10 pb-8">Made with 💕</p>
      </div>
    </main>
  );
}
