import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_INDEX: Record<string, number> = {
  Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 0,
};
const DAY_RRULE: Record<string, string> = {
  Lunes: "MO", Martes: "TU", Miércoles: "WE", Jueves: "TH", Viernes: "FR", Sábado: "SA", Domingo: "SU",
};

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
function nextDateForDay(targetDow: number, hour: number) {
  const now = new Date();
  const today = now.getDay();
  let diff = (targetDow - today + 7) % 7;
  if (diff === 0 && now.getHours() >= hour) diff = 7;
  const d = new Date(now);
  d.setDate(d.getDate() + diff);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function escape(t: string) {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

interface DayPlan {
  day: string;
  type: "actividad" | "gimnasio";
  sport?: string;
  intensity?: string;
  duration?: string;
  routine_name?: string;
  muscle_focus?: string;
  exercises?: { name: string; series: number; reps: number; rest: string }[];
}

function buildICS(plans: DayPlan[], opts: { startHourGym: number; startHourActivity: number; durationMin: number; reminderMin: number }) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Autopilot//Plan//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Mi Plan Autopilot",
    "X-WR-TIMEZONE:Europe/Madrid",
  ];
  for (const plan of plans) {
    const dow = DAY_INDEX[plan.day];
    const rrule = DAY_RRULE[plan.day];
    if (dow === undefined) continue;
    const hour = plan.type === "gimnasio" ? opts.startHourGym : opts.startHourActivity;
    const start = nextDateForDay(dow, hour);
    const end = new Date(start.getTime() + opts.durationMin * 60 * 1000);
    const title = plan.type === "gimnasio" ? `🏋️ ${plan.routine_name || "Entrenamiento"}` : `🔥 ${plan.sport || "Actividad"}`;
    const description = plan.type === "gimnasio"
      ? `Músculos: ${plan.muscle_focus || "-"}\n\n${(plan.exercises || []).map((e, i) => `${i + 1}. ${e.name} — ${e.series}x${e.reps} (descanso ${e.rest})`).join("\n")}`
      : `Intensidad: ${plan.intensity || "-"}\nDuración: ${plan.duration || "-"}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${plan.day}-${plan.type}-autopilot@lovable.app`);
    lines.push(`DTSTAMP:${toICSDate(new Date())}`);
    lines.push(`DTSTART:${toICSDate(start)}`);
    lines.push(`DTEND:${toICSDate(end)}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${rrule}`);
    lines.push(`SUMMARY:${escape(title)}`);
    lines.push(`DESCRIPTION:${escape(description)}`);
    if (opts.reminderMin > 0) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escape(title)}`);
      lines.push(`TRIGGER:-PT${opts.reminderMin}M`);
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token || token.length < 16) {
      return new Response("Token requerido", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenRow } = await supabase
      .from("calendar_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!tokenRow) {
      return new Response("Token inválido", { status: 404, headers: corsHeaders });
    }

    const { data: tp } = await supabase
      .from("training_plan")
      .select("workouts_json")
      .eq("user_id", tokenRow.user_id)
      .maybeSingle();

    const plans = (tp?.workouts_json as DayPlan[]) || [];
    const ics = buildICS(plans, {
      startHourGym: tokenRow.start_hour_gym,
      startHourActivity: tokenRow.start_hour_activity,
      durationMin: tokenRow.duration_min,
      reminderMin: tokenRow.reminder_min,
    });

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="autopilot.ics"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});