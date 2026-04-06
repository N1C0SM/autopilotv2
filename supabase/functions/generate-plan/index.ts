import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECOVERY_HOURS: Record<string, number> = {
  Pecho: 48, Espalda: 48, Hombros: 48, Bíceps: 36, Tríceps: 36,
  Piernas: 72, Glúteos: 48, Core: 24, "Cuerpo completo": 48, Cardio: 24,
};

// ─── Helpers ───

interface ExerciseRow {
  id: string; name: string; image_url: string | null;
  muscle_group: string | null; exercise_type: string | null;
  movement_pattern: string | null; level: number | null;
  priority: number | null; stimulus_type: string | null;
  load_level: string | null; fatigue_level: string | null;
  recommended_order: number | null;
}

function calcMacros(weight: number, goal: string) {
  switch (goal) {
    case "gain_muscle": return { protein: Math.round(weight * 2.2), carbs: Math.round(weight * 4), fats: Math.round(weight * 1) };
    case "lose_weight": return { protein: Math.round(weight * 2.4), carbs: Math.round(weight * 2), fats: Math.round(weight * 0.8) };
    case "recomp": return { protein: Math.round(weight * 2.2), carbs: Math.round(weight * 3), fats: Math.round(weight * 0.9) };
    case "improve_endurance": return { protein: Math.round(weight * 1.8), carbs: Math.round(weight * 4.5), fats: Math.round(weight * 0.9) };
    default: return { protein: Math.round(weight * 1.8), carbs: Math.round(weight * 3.5), fats: Math.round(weight * 1) };
  }
}

function getMeals(goal: string) {
  const base = [
    { name: "Desayuno", description: "Avena con plátano, frutos rojos y batido de proteínas" },
    { name: "Media mañana", description: "Yogur griego con nueces y miel" },
    { name: "Almuerzo", description: "Pollo a la plancha con arroz integral y verduras salteadas" },
    { name: "Merienda", description: "Tostada integral con aguacate y huevo duro" },
    { name: "Cena", description: "Salmón al horno con patata y ensalada variada" },
  ];
  if (goal === "gain_muscle") {
    base.push({ name: "Pre-entreno", description: "Plátano con mantequilla de cacahuete y pan integral" });
    base.push({ name: "Post-entreno", description: "Batido de proteínas con avena y frutos rojos" });
  }
  if (goal === "lose_weight") {
    base[4] = { name: "Cena", description: "Pechuga de pavo con ensalada verde y vinagreta ligera" };
  }
  return base;
}

// ─── Stimulus-based rep schemes ───

function getRepScheme(stimulus: string | null, intensityLevel: number) {
  switch (stimulus) {
    case "Fuerza":      return { series: 5, reps: 5, rest: "180s" };
    case "Hipertrofia":  return { series: 4, reps: intensityLevel >= 7 ? 10 : 12, rest: "90s" };
    case "Resistencia":  return { series: 3, reps: 15, rest: "45s" };
    case "Isométrico":   return { series: 3, reps: 30, rest: "60s" }; // reps = seconds
    default:             return { series: intensityLevel >= 7 ? 4 : 3, reps: 10, rest: intensityLevel >= 7 ? "90s" : "60s" };
  }
}

// ─── Fatigue tracking ───

const FATIGUE_POINTS: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };
const MAX_FATIGUE_PER_SESSION = 18;

// ─── Gym split ───

interface RoutineDay { name: string; muscles: string[]; }

function getGymSplit(daysAvailable: number): RoutineDay[] {
  if (daysAvailable >= 6) return [
    { name: "Push A", muscles: ["Pecho", "Hombros", "Tríceps"] },
    { name: "Pull A", muscles: ["Espalda", "Bíceps"] },
    { name: "Legs A", muscles: ["Piernas", "Glúteos"] },
    { name: "Push B", muscles: ["Pecho", "Hombros", "Tríceps"] },
    { name: "Pull B", muscles: ["Espalda", "Bíceps"] },
    { name: "Legs B", muscles: ["Piernas", "Glúteos", "Core"] },
  ];
  if (daysAvailable >= 4) return [
    { name: "Upper A", muscles: ["Pecho", "Espalda", "Hombros"] },
    { name: "Lower A", muscles: ["Piernas", "Glúteos", "Core"] },
    { name: "Upper B", muscles: ["Pecho", "Espalda", "Bíceps", "Tríceps"] },
    { name: "Lower B", muscles: ["Piernas", "Glúteos", "Core"] },
  ];
  if (daysAvailable >= 3) return [
    { name: "Full Body A", muscles: ["Pecho", "Espalda", "Piernas"] },
    { name: "Full Body B", muscles: ["Hombros", "Piernas", "Core"] },
    { name: "Full Body C", muscles: ["Espalda", "Pecho", "Glúteos"] },
  ];
  return [
    { name: "Full Body A", muscles: ["Pecho", "Espalda", "Piernas", "Core"] },
    { name: "Full Body B", muscles: ["Hombros", "Piernas", "Glúteos", "Core"] },
  ];
}

// ─── Smart exercise picker ───

function pickExercises(
  muscles: string[],
  exerciseLib: Record<string, ExerciseRow[]>,
  intensityLevel: number,
  userLevel: number,
) {
  const exercises: any[] = [];
  const exercisesPerMuscle = intensityLevel >= 7 ? 3 : 2;
  let sessionFatigue = 0;

  for (const muscle of muscles) {
    const available = (exerciseLib[muscle] || [])
      // Filter by user level: show exercises at or below user level
      .filter((ex) => (ex.level ?? 1) <= userLevel);

    if (available.length === 0) {
      console.log(`[GENERATE-PLAN] No exercises for ${muscle} at level ${userLevel}, skipping`);
      continue;
    }

    // Sort: priority 1 (base) first, then by recommended_order
    const sorted = [...available].sort((a, b) => {
      const pDiff = (a.priority ?? 2) - (b.priority ?? 2);
      if (pDiff !== 0) return pDiff;
      return (a.recommended_order ?? 2) - (b.recommended_order ?? 2);
    });

    const picked: ExerciseRow[] = [];
    for (const ex of sorted) {
      if (picked.length >= exercisesPerMuscle) break;
      const fatigueCost = FATIGUE_POINTS[ex.fatigue_level || "Media"] || 2;
      if (sessionFatigue + fatigueCost > MAX_FATIGUE_PER_SESSION) continue;
      picked.push(ex);
      sessionFatigue += fatigueCost;
    }

    for (const ex of picked) {
      const scheme = getRepScheme(ex.stimulus_type, intensityLevel);
      exercises.push({
        exercise_id: ex.id,
        name: ex.name,
        series: scheme.series,
        reps: scheme.reps,
        weight: "",
        rest: scheme.rest,
        image_url: ex.image_url || undefined,
      });
    }
  }

  // Sort final list by recommended_order for proper session flow
  const orderMap: Record<string, number> = {};
  for (const muscle of muscles) {
    for (const ex of exerciseLib[muscle] || []) {
      orderMap[ex.id] = ex.recommended_order ?? 2;
    }
  }
  exercises.sort((a, b) => (orderMap[a.exercise_id] ?? 2) - (orderMap[b.exercise_id] ?? 2));

  return exercises;
}

// ─── Build weekly plan ───

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function buildWeeklyPlan(
  gymSplit: RoutineDay[], sports: string[], daysAvailable: number,
  intensityLevel: number, userLevel: number,
  exerciseLib: Record<string, ExerciseRow[]>,
) {
  const plan: any[] = [];
  const trainedMuscles: Record<string, number> = {};
  let gymDayIdx = 0;
  const sportDays: number[] = [];
  const hasSports = sports.length > 0;
  const gymDays = hasSports ? Math.max(Math.ceil(daysAvailable * 0.6), gymSplit.length) : daysAvailable;
  const sportDayCount = hasSports ? Math.max(1, daysAvailable - gymDays) : 0;

  for (let dayIdx = 0; dayIdx < 7 && plan.length < daysAvailable; dayIdx++) {
    if (gymDayIdx < gymSplit.length && gymDayIdx < gymDays) {
      const routine = gymSplit[gymDayIdx];
      const canTrain = routine.muscles.every((m) => {
        const lastDay = trainedMuscles[m];
        if (lastDay === undefined) return true;
        return (dayIdx - lastDay) * 24 >= (RECOVERY_HOURS[m] || 48);
      });

      if (canTrain) {
        const exercises = pickExercises(routine.muscles, exerciseLib, intensityLevel, userLevel);
        plan.push({
          day: DAYS[dayIdx], type: "gimnasio",
          routine_name: routine.name, muscle_focus: routine.muscles.join(" · "),
          exercises,
        });
        for (const m of routine.muscles) trainedMuscles[m] = dayIdx;
        gymDayIdx++;
        continue;
      }
    }

    if (sportDays.length < sportDayCount && hasSports) {
      const sport = sports[sportDays.length % sports.length];
      plan.push({
        day: DAYS[dayIdx], type: "actividad", sport,
        intensity: intensityLevel >= 7 ? "Alta" : intensityLevel >= 4 ? "Media" : "Baja",
        duration: intensityLevel >= 7 ? "60min" : "45min",
      });
      sportDays.push(dayIdx);
      continue;
    }

    if (gymDayIdx < gymSplit.length) {
      const routine = gymSplit[gymDayIdx];
      const exercises = pickExercises(routine.muscles, exerciseLib, intensityLevel, userLevel);
      plan.push({
        day: DAYS[dayIdx], type: "gimnasio",
        routine_name: routine.name, muscle_focus: routine.muscles.join(" · "),
        exercises,
      });
      for (const m of routine.muscles) trainedMuscles[m] = dayIdx;
      gymDayIdx++;
    }
  }
  return plan;
}

// ─── Map intensity to user level ───

function intensityToLevel(intensity: number): number {
  if (intensity >= 8) return 3; // avanzado
  if (intensity >= 5) return 2; // intermedio
  return 1; // básico
}

// ─── Serve ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    let targetUserId = user.id;
    try { const body = await req.json(); if (body.user_id) targetUserId = body.user_id; } catch { /* no body */ }

    const { data: onb, error: onbError } = await supabase
      .from("onboarding").select("*").eq("user_id", targetUserId).single();
    if (onbError || !onb) throw new Error("Onboarding data not found");

    const weight = onb.weight || 70;
    const goal = onb.goal || "general_health";
    const sports = onb.sports ? onb.sports.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const daysAvailable = parseInt(
      typeof onb.availability === "object" && onb.availability !== null
        ? (onb.availability as any).days || "4" : "4"
    );
    const intensityLevel = onb.intensity_level || 5;
    const userLevel = intensityToLevel(intensityLevel);

    // Fetch full exercise library
    const { data: allExercises } = await supabase
      .from("exercises")
      .select("id, name, muscle_group, image_url, exercise_type, movement_pattern, level, priority, stimulus_type, load_level, fatigue_level, recommended_order");

    const exerciseLib: Record<string, ExerciseRow[]> = {};
    for (const ex of (allExercises || []) as ExerciseRow[]) {
      const g = ex.muscle_group || "Otro";
      if (!exerciseLib[g]) exerciseLib[g] = [];
      exerciseLib[g].push(ex);
    }

    console.log(`[GENERATE-PLAN] Exercise library: ${Object.entries(exerciseLib).map(([k, v]) => `${k}:${v.length}`).join(", ")}`);
    console.log(`[GENERATE-PLAN] User level: ${userLevel}, intensity: ${intensityLevel}`);

    const gymSplit = getGymSplit(Math.min(daysAvailable, 6));
    const weeklyPlan = buildWeeklyPlan(gymSplit, sports, Math.min(daysAvailable, 7), intensityLevel, userLevel, exerciseLib);

    for (const day of weeklyPlan) {
      if (day.type === "gimnasio") {
        console.log(`[GENERATE-PLAN] ${day.day} (${day.routine_name}): ${(day.exercises || []).length} exercises`);
      }
    }

    const macros = calcMacros(weight, goal);
    const meals = getMeals(goal);

    await supabase.from("training_plan").upsert({ user_id: targetUserId, workouts_json: weeklyPlan });
    await supabase.from("nutrition_plan").upsert({ user_id: targetUserId, macros_json: macros, meals_json: meals });
    await supabase.from("profiles").update({ plan_status: "plan_ready" }).eq("user_id", targetUserId);

    console.log(`[GENERATE-PLAN] Plan generated for ${targetUserId}: ${weeklyPlan.length} days`);

    return new Response(JSON.stringify({
      success: true, training_days: weeklyPlan.length, macros, meals_count: meals.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[GENERATE-PLAN] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
