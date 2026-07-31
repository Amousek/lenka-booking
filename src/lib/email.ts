import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Lenka Booking <onboarding@resend.dev>";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

/* ── Notifications for admins ── */

export async function notifyAdminNewReservation(data: {
  name: string;
  email?: string;
  note?: string;
  slotDate: string;
  slotTime: string;
  slotActivity: string;
}) {
  if (!ADMIN_EMAILS.length) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `📩 Nová rezervace od ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8f5ff; border-radius: 16px;">
          <h2 style="color: #3B00DB; margin: 0 0 16px 0;">📩 Nová rezervace</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 100px;">Jméno:</td><td style="padding: 8px 0; font-weight: bold;">${data.name}</td></tr>
            ${data.email ? `<tr><td style="padding: 8px 0; color: #666;">E-mail:</td><td style="padding: 8px 0;">${data.email}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #666;">Termín:</td><td style="padding: 8px 0;">${formatDate(data.slotDate)} · ${data.slotTime}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Aktivita:</td><td style="padding: 8px 0;">${data.slotActivity}</td></tr>
            ${data.note ? `<tr><td style="padding: 8px 0; color: #666;">Poznámka:</td><td style="padding: 8px 0; font-style: italic;">„${data.note}"</td></tr>` : ""}
          </table>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">Přejdi do <a href="${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://lenka-booking.vercel.app"}/admin" style="color: #3B00DB;">Admin panelu</a> pro schválení.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email error (admin reservation):", e);
  }
}

export async function notifyAdminNewSuggestion(data: {
  name: string;
  email?: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  activity: string;
  note?: string;
}) {
  if (!ADMIN_EMAILS.length) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `💡 Nový návrh termínu od ${data.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8f5ff; border-radius: 16px;">
          <h2 style="color: #3B00DB; margin: 0 0 16px 0;">💡 Nový návrh termínu</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 100px;">Jméno:</td><td style="padding: 8px 0; font-weight: bold;">${data.name}</td></tr>
            ${data.email ? `<tr><td style="padding: 8px 0; color: #666;">E-mail:</td><td style="padding: 8px 0;">${data.email}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #666;">Datum:</td><td style="padding: 8px 0;">${formatDate(data.date)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Čas:</td><td style="padding: 8px 0;">${formatTime(data.timeFrom)} – ${formatTime(data.timeTo)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Aktivita:</td><td style="padding: 8px 0;">${data.activity}</td></tr>
            ${data.note ? `<tr><td style="padding: 8px 0; color: #666;">Poznámka:</td><td style="padding: 8px 0; font-style: italic;">„${data.note}"</td></tr>` : ""}
          </table>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">Přejdi do <a href="${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://lenka-booking.vercel.app"}/admin" style="color: #3B00DB;">Admin panelu</a> pro posouzení.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email error (admin suggestion):", e);
  }
}

/* ── Notifications for users ── */

export async function notifyUserReservationStatus(data: {
  email: string;
  name: string;
  status: "approved" | "rejected";
  slotDate: string;
  slotTime: string;
  slotActivity: string;
}) {
  if (!data.email) return;
  const isApproved = data.status === "approved";
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: isApproved
        ? `✅ Tvoje rezervace u Lenky byla schválena!`
        : `❌ Tvoje rezervace u Lenky byla zamítnuta`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: ${isApproved ? "#f0fdf4" : "#fef2f2"}; border-radius: 16px;">
          <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"}; margin: 0 0 16px 0;">
            ${isApproved ? "✅ Rezervace schválena!" : "❌ Rezervace zamítnuta"}
          </h2>
          <p style="margin: 0 0 12px 0;">Ahoj <strong>${data.name}</strong>,</p>
          <p style="margin: 0 0 16px 0;">
            ${isApproved
              ? "Lenka schválila tvoji rezervaci. Už se na tebe těší! 🙈"
              : "Bohužel, Lenka tentokrát nemůže. Zkus prosím jiný termín."}
          </p>
          <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid ${isApproved ? "#bbf7d0" : "#fecaca"};">
            <p style="margin: 0; color: #666; font-size: 14px;">📅 ${formatDate(data.slotDate)}</p>
            <p style="margin: 4px 0 0 0; font-weight: bold;">${data.slotTime} · ${data.slotActivity}</p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("Email error (user reservation):", e);
  }
}

export async function notifyUserSuggestionStatus(data: {
  email: string;
  name: string;
  status: "approved" | "rejected";
  date: string;
  timeFrom: string;
  timeTo: string;
  activity: string;
}) {
  if (!data.email) return;
  const isApproved = data.status === "approved";
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: isApproved
        ? `✅ Tvůj návrh termínu byl přijat!`
        : `❌ Tvůj návrh termínu byl zamítnut`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: ${isApproved ? "#f0fdf4" : "#fef2f2"}; border-radius: 16px;">
          <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"}; margin: 0 0 16px 0;">
            ${isApproved ? "✅ Návrh přijat!" : "❌ Návrh zamítnut"}
          </h2>
          <p style="margin: 0 0 12px 0;">Ahoj <strong>${data.name}</strong>,</p>
          <p style="margin: 0 0 16px 0;">
            ${isApproved
              ? "Lenka přijala tvůj návrh termínu a vytvořila z něj nový blok. Přejdi na web a zarezervuj se! 🙈"
              : "Bohužel, Lenka nemůže v navrhovaném čase. Zkus prosím jiný termín."}
          </p>
          <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid ${isApproved ? "#bbf7d0" : "#fecaca"};">
            <p style="margin: 0; color: #666; font-size: 14px;">📅 ${formatDate(data.date)}</p>
            <p style="margin: 4px 0 0 0; font-weight: bold;">${formatTime(data.timeFrom)} – ${formatTime(data.timeTo)} · ${data.activity}</p>
          </div>
          ${isApproved ? `<p style="margin-top: 16px;"><a href="https://lenka-booking.vercel.app" style="color: #3B00DB; font-weight: bold;">Otevřít rezervace →</a></p>` : ""}
        </div>
      `,
    });
  } catch (e) {
    console.error("Email error (user suggestion):", e);
  }
}
