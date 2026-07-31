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

const DAY_NAMES_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const DAY_NAMES_LONG = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

/* ── Component ── */

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  // Suggestion form
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [sugName, setSugName] = useState("");
  const [sugEmail, setSugEmail] = useState("");
  const [sugDate, setSugDate] = useState("");
  const [sugTimeFrom, setSugTimeFrom] = useState("");
  const [sugTimeTo, setSugTimeTo] = useState("");
  const [sugActivity, setSugActivity] = useState("☕ Káva / Procházka");
  const [sugCustomActivity, setSugCustomActivity] = useState("");
  const [sugNote, setSugNote] = useState("");
  const [sugSubmitting, setSugSubmitting] = useState(false);
  const [sugSuccess, setSugSuccess] = useState(false);
  const [sugError, setSugError] = useState("");

  useEffect(() => { fetchSlots(); }, []);

  async function fetchSlots() {
    try {
      const res = await fetch("/api/slots");
      if (res.ok) setSlots(await res.json());
    } finally { setLoading(false); }
  }

  async function handleSubmit(slotId: string) {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: slotId, name: name.trim(), email: email.trim() || null, note: note.trim() || null }),
      });
      if (res.ok) {
        setSubmitted((prev) => new Set(prev).add(slotId));
        setSelectedSlot(null);
        setName("");
        setEmail("");
        setNote("");
        fetchSlots();
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
      }
    } catch { setError("Nepodařilo se odeslat rezervaci"); }
    finally { setSubmitting(false); }
  }

  async function handleSuggestion(e: React.FormEvent) {
    e.preventDefault();
    setSugSubmitting(true);
    setSugError("");
    try {
      const activity = sugActivity === "custom" ? `✏️ ${sugCustomActivity}` : sugActivity;
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sugName.trim(), email: sugEmail.trim() || null, date: sugDate, time_from: sugTimeFrom, time_to: sugTimeTo, activity, note: sugNote.trim() || null }),
      });
      if (res.ok) {
        setSugSuccess(true);
        setSugName(""); setSugEmail(""); setSugDate(""); setSugTimeFrom(""); setSugTimeTo("");
        setSugActivity("☕ Káva / Procházka"); setSugCustomActivity(""); setSugNote("");
      } else {
        const data = await res.json();
        setSugError(data.error || "Chyba při odesílání");
      }
    } catch { setSugError("Nepodařilo se odeslat návrh"); }
    finally { setSugSubmitting(false); }
  }

  // Computed
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const slot of slots) (map[slot.date] ??= []).push(slot);
    return map;
  }, [slots]);
  const weekHasSlots = weekDays.some((d) => (slotsByDate[toDateStr(d)] ?? []).length > 0);
  const today = toDateStr(new Date());
  const weekLabel = `${weekDays[0].toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 pt-2 md:pt-6 flex flex-col items-center">
          <div className="relative mb-5 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#3B00DB] via-[#7B00ED] to-[#BF00FF] rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img
              src="/lenka.jpg"
              alt="Lenka"
              className="relative w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-full border-4 border-white shadow-xl transform transition duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#3B00DB] to-[#BF00FF] bg-clip-text text-transparent">
            Lenka
          </h1>
          <p className="text-gray-600 mt-3 text-base sm:text-lg lg:text-xl max-w-md mx-auto font-medium">
            Ahoj! Tady si můžeš zarezervovat čas, kdy se uvidíme. 🙈
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-violet-100/80 border border-violet-200/60 text-violet-700 text-sm font-semibold shadow-sm animate-fade-in">
            <span>✨ Už se na vás moc těším!</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-violet-200 border-t-[#3B00DB] rounded-full animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Načítám termíny…</p>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-5 md:mb-6 card px-3 py-2.5 sm:px-5 sm:py-3">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-2 sm:px-4 sm:py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 font-medium text-sm sm:text-base cursor-pointer"
              >
                ← <span className="hidden sm:inline">Předchozí</span>
              </button>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">{weekLabel}</span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-2 sm:px-4 sm:py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 font-medium text-sm sm:text-base cursor-pointer"
              >
                <span className="hidden sm:inline">Další</span> →
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {weekDays.map((day, i) => {
                const dateStr = toDateStr(day);
                const daySlots = slotsByDate[dateStr] ?? [];
                const isToday = dateStr === today;
                const isPast = dateStr < today;
                // Only show available (non-full) slots
                const visibleSlots = daySlots.filter(
                  (slot) => slot.max_persons - slot.approved_count > 0
                );

                return (
                  <div
                    key={dateStr}
                    className={`rounded-2xl border transition-all min-h-[130px] sm:min-h-[150px] lg:min-h-[170px] flex flex-col
                      ${isToday
                        ? "border-[#BF00FF]/30 bg-violet-50/80 shadow-md shadow-violet-100/50 ring-1 ring-[#BF00FF]/20"
                        : isPast
                          ? "border-gray-100 bg-gray-50/50 opacity-50"
                          : "border-white/40 bg-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform"
                      }`}
                  >
                    {/* Day header */}
                    <div className={`text-center py-2 lg:py-2.5 border-b ${isToday ? "border-violet-200 bg-violet-100/50" : "border-gray-100"} rounded-t-2xl`}>
                      <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide ${isToday ? "text-[#3B00DB]" : "text-gray-400"}`}>
                        <span className="lg:hidden">{DAY_NAMES_SHORT[i]}</span>
                        <span className="hidden lg:inline">{DAY_NAMES_LONG[i]}</span>
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${isToday ? "text-[#3B00DB]" : "text-gray-700"}`}>
                        {day.getDate()}.
                      </p>
                    </div>

                    {/* Slots – only show available ones */}
                    <div className="flex-1 p-1.5 sm:p-2 space-y-1.5">
                      {visibleSlots.length === 0 && !isPast && (
                        <p className="text-[10px] text-gray-300 text-center mt-6 sm:mt-8">—</p>
                      )}
                      {visibleSlots.map((slot) => {
                        const available = slot.max_persons - slot.approved_count;
                        const isSubmitted = submitted.has(slot.id);

                        return (
                          <button
                            key={slot.id}
                            onClick={() => {
                              if (!isSubmitted && !isPast) {
                                setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
                                setError("");
                              }
                            }}
                            disabled={isSubmitted || isPast}
                            className={`w-full text-left p-2 sm:p-2.5 rounded-xl text-[11px] sm:text-xs leading-tight transition-all
                              ${selectedSlot === slot.id
                                ? "bg-violet-100 ring-2 ring-[#BF00FF] shadow-sm scale-[1.02]"
                                : isSubmitted
                                  ? "bg-amber-50 border border-amber-200"
                                  : "bg-gradient-to-r from-[#3B00DB]/5 to-[#BF00FF]/10 hover:from-[#3B00DB]/10 hover:to-[#BF00FF]/20 border border-violet-200/60 cursor-pointer hover:shadow-sm"
                              } disabled:cursor-default`}
                          >
                            <p className="font-semibold text-gray-700 truncate">
                              {formatTime(slot.time_from)}–{formatTime(slot.time_to)}
                            </p>
                            <p className="truncate mt-0.5">{slot.activity}</p>
                            <p className="mt-0.5">
                              {isSubmitted ? (
                                <span className="text-amber-600">⏳ Odesláno</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">{available} {spotsLabel(available)}</span>
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
              <div className="text-center py-10 mt-4">
                <p className="text-gray-400 text-base">V tomto týdnu nejsou žádné termíny 🙈</p>
                <p className="text-gray-300 text-sm mt-1">Zkus přepnout na další týden →</p>
              </div>
            )}

            {/* ── Suggest a time ── */}
            <div className="mt-10 md:mt-14 max-w-2xl mx-auto">
              {!showSuggestion && !sugSuccess && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">Nevyhovuje ti žádný termín?</p>
                  <button
                    onClick={() => setShowSuggestion(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-violet-200 text-[#3B00DB] font-medium hover:bg-violet-50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    💡 Navrhnout vlastní termín
                  </button>
                </div>
              )}

              {sugSuccess && (
                <div className="text-center py-8 card border-emerald-200 bg-emerald-50/80 animate-fade-in">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-emerald-700 font-medium text-lg">Návrh odeslán!</p>
                  <p className="text-emerald-600 text-sm mt-1">Lenka ho posoudí a dá ti vědět.</p>
                  <button
                    onClick={() => { setSugSuccess(false); setShowSuggestion(false); }}
                    className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Zavřít
                  </button>
                </div>
              )}

              {showSuggestion && !sugSuccess && (
                <div className="card border-violet-200 p-5 sm:p-6 lg:p-8 animate-fade-in">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">💡 Navrhnout termín</h2>
                    <button onClick={() => setShowSuggestion(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">✕</button>
                  </div>
                  <form onSubmit={handleSuggestion} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-500 mb-1.5 block">Tvoje jméno *</label>
                      <input type="text" value={sugName} onChange={(e) => setSugName(e.target.value)} required placeholder="Jméno a příjmení" className="input-field" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-500 mb-1.5 block">E-mail (pro potvrzení)</label>
                      <input type="email" value={sugEmail} onChange={(e) => setSugEmail(e.target.value)} placeholder="tvuj@email.cz" className="input-field" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1.5 block">Navrhované datum *</label>
                      <input type="date" value={sugDate} onChange={(e) => setSugDate(e.target.value)} required className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-500 mb-1.5 block">Od *</label>
                        <input type="time" value={sugTimeFrom} onChange={(e) => setSugTimeFrom(e.target.value)} required className="input-field" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 mb-1.5 block">Do *</label>
                        <input type="time" value={sugTimeTo} onChange={(e) => setSugTimeTo(e.target.value)} required className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1.5 block">Aktivita</label>
                      <select value={sugActivity} onChange={(e) => setSugActivity(e.target.value)} className="input-field">
                        <option value="☕ Káva / Procházka">☕ Káva / Procházka</option>
                        <option value="🍷 Posezení u vína">🍷 Posezení u vína</option>
                        <option value="custom">✏️ Vlastní…</option>
                      </select>
                    </div>
                    {sugActivity === "custom" && (
                      <div className="animate-fade-in">
                        <label className="text-sm text-gray-500 mb-1.5 block">Vlastní aktivita *</label>
                        <input type="text" value={sugCustomActivity} onChange={(e) => setSugCustomActivity(e.target.value)} required placeholder="Např. Piknik v parku 🧺" className="input-field" />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-500 mb-1.5 block">Poznámka (volitelné)</label>
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

            {/* Booking bottom sheet */}
            {selectedSlot && (() => {
              const slot = slots.find((s) => s.id === selectedSlot);
              if (!slot) return null;
              return (
                <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
                  <div className="max-w-lg mx-auto p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-violet-200 p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {new Date(slot.date + "T00:00:00").toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
                          </p>
                          <p className="font-semibold text-gray-800 text-base sm:text-lg">
                            {formatTime(slot.time_from)}–{formatTime(slot.time_to)} · {slot.activity}
                          </p>
                        </div>
                        <button onClick={() => { setSelectedSlot(null); setError(""); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">✕</button>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Jméno a příjmení *" value={name} onChange={(e) => setName(e.target.value)} className="input-field" autoFocus />
                        <input type="email" placeholder="E-mail (pro potvrzení)" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
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
              <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" onClick={() => { setSelectedSlot(null); setError(""); }} />
            )}
          </>
        )}

        <footer className="text-center text-xs text-gray-400 mt-12 pb-6 flex items-center justify-center gap-3">
          <span>Made with 🙈</span>
          <span>·</span>
          <a href="/admin" className="hover:text-violet-600 font-medium transition-colors">
            🔐 Admin panel
          </a>
        </footer>
      </div>
    </main>
  );
}
