"use client";

import { useState, useEffect } from "react";

interface Slot {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  activity: string;
  max_persons: number;
  approved_count: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function spotsLabel(n: number) {
  if (n === 1) return "místo";
  if (n >= 2 && n <= 4) return "místa";
  return "míst";
}

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Lenka
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Vyber si volný termín a zarezervuj se 💕
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Načítám termíny…</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🌸</p>
            <p className="text-gray-500 text-lg">
              Momentálně nejsou vypsané žádné termíny.
            </p>
            <p className="text-gray-400 text-sm mt-2">Zkus to později ✨</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => {
              const available = slot.max_persons - slot.approved_count;
              const isFull = available <= 0;
              const isSelected = selectedSlot === slot.id;
              const isSubmitted = submitted.has(slot.id);

              return (
                <div
                  key={slot.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300
                    ${isSelected
                      ? "border-rose-300 shadow-xl shadow-rose-100/50"
                      : "border-white/40 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    }
                    ${isFull && !isSubmitted ? "opacity-60" : ""}`}
                >
                  {/* Slot info */}
                  <div
                    className={`p-5 ${!isFull && !isSubmitted ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (!isFull && !isSubmitted) {
                        setSelectedSlot(isSelected ? null : slot.id);
                        setError("");
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500 capitalize">
                          {formatDate(slot.date)}
                        </p>
                        <p className="text-xl font-semibold text-gray-800 mt-1">
                          {formatTime(slot.time_from)} –{" "}
                          {formatTime(slot.time_to)}
                        </p>
                        <p className="text-gray-600 mt-1">{slot.activity}</p>
                      </div>
                      <div className="shrink-0">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            ⏳ Čeká na schválení
                          </span>
                        ) : isFull ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Obsazeno
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {available} {spotsLabel(available)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking form (expanded) */}
                  {isSelected && !isSubmitted && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 animate-fade-in">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Jméno a příjmení *"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input-field"
                          autoFocus
                        />
                        <textarea
                          placeholder="Poznámka (volitelné)"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          className="input-field resize-none"
                        />
                        {error && (
                          <p className="text-red-500 text-sm">{error}</p>
                        )}
                        <button
                          onClick={() => handleSubmit(slot.id)}
                          disabled={submitting || !name.trim()}
                          className="btn-primary w-full"
                        >
                          {submitting ? "Odesílám…" : "Odeslat rezervaci"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-12 pb-8">
          Made with 💕
        </p>
      </div>
    </main>
  );
}
