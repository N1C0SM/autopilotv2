import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───

interface ExerciseRow {
  id: string; name: string; image_url: string | null;
  muscle_group: string | null; exercise_type: string | null;
  movement_pattern: string | null; level: number | null;
  priority: number | null; stimulus_type: string | null;
  load_level: string | null; fatigue_level: string | null;
  recommended_order: number | null;
}

interface PickedExercise {
  exercise_id: string;
  name: string;
  series: number;
  reps: string;
  weight: string;
  rest: string;
  image_url?: string;
  movement_pattern?: string;
  priority?: number;
  fatigue_level?: string;
}

interface UserConfig {
  userLevel: number;
  goal: string;
  exerciseType: string;
  intensityLevel: number;
}

interface Rules {
  min_sets_per_session: number;
  max_sets_per_session: number;
  series_p1_min: number; series_p1_max: number;
  series_p2_min: number; series_p2_max: number;
  series_p3_min: number; series_p3_max: number;
  reps_fuerza: string; reps_hipertrofia: string;
  reps_resistencia: string; reps_isometrico: string;
  rest_fuerza: string; rest_hipertrofia: string;
  rest_resistencia: string; rest_isometrico: string;
  max_consecutive_high_fatigue: number;
  max_heavy_hinges: number;
  max_pattern_repeats: number;
  push_pull_max_diff: number;
  max_p2_exercises: number;
  max_p3_exercises: number;
  required_patterns: string[];
  recovery_hours: Record<string, number>;
}

const DEFAULT_RULES: Rules = {
  min_sets_per_session: 12, max_sets_per_session: 20,
  series_p1_min: 3, series_p1_max: 5,
  series_p2_min: 3, series_p2_max: 4,
  series_p3_min: 2, series_p3_max: 3,
  reps_fuerza: "4-8", reps_hipertrofia: "8-15", reps_resistencia: "15-25", reps_isometrico: "20-60s",
  rest_fuerza: "180s", rest_hipertrofia: "90s", rest_resistencia: "45s", rest_isometrico: "60s",
  max_consecutive_high_fatigue: 2, max_heavy_hinges: 1, max_pattern_repeats: 2, push_pull_max_diff: 1,
  max_p2_exercises: 2, max_p3_exercises: 2,
  required_patterns: ["Empuje", "Tirón", "Sentadilla", "Bisagra", "Core"],
  recovery_hours: { Pecho: 48, Espalda: 48, Hombros: 48, Bíceps: 36, Tríceps: 36, Piernas: 72, Glúteos: 48, Core: 24, "Cuerpo completo": 48, Cardio: 24 },
};

// ─── Rep/series scheme using dynamic rules ───

function getRepScheme(stimulus: string | null, priority: number, rules: Rules): { series: number; reps: string; rest: string } {
  let seriesRange: [number, number];
  switch (priority) {
    case 1: seriesRange = [rules.series_p1_min, rules.series_p1_max]; break;
    case 2: seriesRange = [rules.series_p2_min, rules.series_p2_max]; break;
    case 3: seriesRange = [rules.series_p3_min, rules.series_p3_max]; break;
    default: seriesRange = [rules.series_p2_min, rules.series_p2_max];
  }

  let reps: string;
  let rest: string;
  switch (stimulus) {
    case "Fuerza": reps = rules.reps_fuerza; rest = rules.rest_fuerza; break;
    case "Hipertrofia": reps = rules.reps_hipertrofia; rest = rules.rest_hipertrofia; break;
    case "Resistencia": reps = rules.reps_resistencia; rest = rules.rest_resistencia; break;
    case "Isométrico": reps = rules.reps_isometrico; rest = rules.rest_isometrico; break;
    default: reps = rules.reps_hipertrofia; rest = rules.rest_hipertrofia;
  }

  const series = priority === 1 ? seriesRange[1] : seriesRange[0];
  return { series, reps, rest };
}

// ─── Smart exercise picker ───

function pickExercisesForSession(
  targetMuscles: string[],
  exerciseLib: Record<string, ExerciseRow[]>,
  config: UserConfig,
  rules: Rules,
): PickedExercise[] {
  const { userLevel, goal, exerciseType } = config;

  const allAvailable: ExerciseRow[] = [];
  for (const muscle of targetMuscles) {
    const muscleExercises = exerciseLib[muscle] || [];
    for (const ex of muscleExercises) {
      if (exerciseType !== "Mixto" && ex.exercise_type && ex.exercise_type !== "Mixto" && ex.exercise_type !== exerciseType) continue;
      if ((ex.level ?? 1) > userLevel + 1) continue;
      allAvailable.push(ex);
    }
  }

  if (allAvailable.length === 0) {
    console.log(`[GENERATE-PLAN] No exercises available for muscles: ${targetMuscles.join(", ")}`);
    return [];
  }

  const picked: PickedExercise[] = [];
  const usedIds = new Set<string>();
  const patternCounts: Record<string, number> = {};
  let totalSets = 0;
  let consecutiveHighFatigue = 0;
  let heavyHingeCount = 0;

  function findBest(pattern: string, targetPriority: number): ExerciseRow | null {
    const candidates = allAvailable
      .filter(ex =>
        ex.movement_pattern === pattern &&
        (ex.priority ?? 2) === targetPriority &&
        !usedIds.has(ex.id)
      )
      .sort((a, b) => {
        const aLevelDiff = Math.abs((a.level ?? 1) - userLevel);
        const bLevelDiff = Math.abs((b.level ?? 1) - userLevel);
        if (aLevelDiff !== bLevelDiff) return aLevelDiff - bLevelDiff;
        return (a.recommended_order ?? 2) - (b.recommended_order ?? 2);
      });
    return candidates[0] || null;
  }

  function tryAdd(ex: ExerciseRow): boolean {
    const pattern = ex.movement_pattern || "Otro";
    const fatigue = ex.fatigue_level || "Media";
    const priority = ex.priority ?? 2;

    if ((patternCounts[pattern] || 0) >= rules.max_pattern_repeats) return false;
    if (pattern === "Bisagra" && ex.load_level === "Alta" && heavyHingeCount >= rules.max_heavy_hinges) return false;

    const pushCount = patternCounts["Empuje"] || 0;
    const pullCount = patternCounts["Tirón"] || 0;
    if (pattern === "Empuje" && pushCount > pullCount + rules.push_pull_max_diff) return false;
    if (pattern === "Tirón" && pullCount > pushCount + rules.push_pull_max_diff) return false;

    const stimulus = getEffectiveStimulus(ex.stimulus_type, goal);
    const scheme = getRepScheme(stimulus, priority, rules);

    if (totalSets + scheme.series > rules.max_sets_per_session) return false;

    if (fatigue === "Alta") {
      if (consecutiveHighFatigue >= rules.max_consecutive_high_fatigue) return false;
      consecutiveHighFatigue++;
    } else {
      consecutiveHighFatigue = 0;
    }

    picked.push({
      exercise_id: ex.id,
      name: ex.name,
      series: scheme.series,
      reps: scheme.reps,
      weight: "",
      rest: scheme.rest,
      image_url: ex.image_url || undefined,
      movement_pattern: pattern,
      priority,
      fatigue_level: fatigue,
    });

    usedIds.add(ex.id);
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    totalSets += scheme.series;
    if (pattern === "Bisagra" && ex.load_level === "Alta") heavyHingeCount++;

    return true;
  }

  // STEP 1: Mandatory base structure
  for (const pattern of rules.required_patterns) {
    const ex = findBest(pattern, 1);
    if (ex) {
      tryAdd(ex);
    } else {
      const fallback = findBest(pattern, 2);
      if (fallback) tryAdd(fallback);
      else console.log(`[GENERATE-PLAN] Missing base exercise for pattern: ${pattern}`);
    }
  }

  // STEP 2: Complements
  const p2Candidates = allAvailable
    .filter(ex => (ex.priority ?? 2) === 2 && !usedIds.has(ex.id))
    .sort((a, b) => (a.recommended_order ?? 2) - (b.recommended_order ?? 2));

  let p2Added = 0;
  for (const ex of p2Candidates) {
    if (p2Added >= rules.max_p2_exercises || totalSets >= rules.max_sets_per_session) break;
    if (tryAdd(ex)) p2Added++;
  }

  const p3Candidates = allAvailable
    .filter(ex => (ex.priority ?? 2) === 3 && !usedIds.has(ex.id))
    .sort((a, b) => (a.recommended_order ?? 2) - (b.recommended_order ?? 2));

  let p3Added = 0;
  for (const ex of p3Candidates) {
    if (p3Added >= rules.max_p3_exercises || totalSets >= rules.max_sets_per_session) break;
    if (tryAdd(ex)) p3Added++;
  }

  // STEP 3: Fill to minimum volume
  if (totalSets < rules.min_sets_per_session) {
    const remaining = allAvailable
      .filter(ex => !usedIds.has(ex.id))
      .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    for (const ex of remaining) {
      if (totalSets >= rules.min_sets_per_session) break;
      tryAdd(ex);
    }
  }

  // STEP 4: Sort
  picked.sort((a, b) => {
    const orderA = getOrder(a, allAvailable);
    const orderB = getOrder(b, allAvailable);
    if (orderA !== orderB) return orderA - orderB;
    if ((a.priority ?? 2) !== (b.priority ?? 2)) return (a.priority ?? 2) - (b.priority ?? 2);
    const fatigueOrder: Record<string, number> = { Baja: 1, Media: 2, Alta: 3 };
    return (fatigueOrder[a.fatigue_level || "Media"] || 2) - (fatigueOrder[b.fatigue_level || "Media"] || 2);
  });

  const final = enforceConsecutiveFatigueRule(picked, rules.max_consecutive_high_fatigue);

  console.log(`[GENERATE-PLAN] Session: ${final.length} exercises, ${totalSets} total sets`);
  return final;
}

function getOrder(ex: PickedExercise, lib: ExerciseRow[]): number {
  const found = lib.find(e => e.id === ex.exercise_id);
  return found?.recommended_order ?? 2;
}

function enforceConsecutiveFatigueRule(exercises: PickedExercise[], maxConsecutive: number): PickedExercise[] {
  const result = [...exercises];
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (let i = maxConsecutive; i < result.length; i++) {
      const allHigh = Array.from({ length: maxConsecutive + 1 }, (_, k) => result[i - k]?.fatigue_level === "Alta").every(Boolean);
      if (allHigh) {
        for (let j = i + 1; j < result.length; j++) {
          if (result[j].fatigue_level !== "Alta") {
            [result[i], result[j]] = [result[j], result[i]];
            changed = true;
            break;
          }
        }
      }
    }
  }
  return result;
}

function getEffectiveStimulus(exerciseStimulus: string | null, goal: string): string {
  if (exerciseStimulus) return exerciseStimulus;
  switch (goal) {
    case "gain_muscle": return "Hipertrofia";
    case "lose_weight": return "Resistencia";
    case "recomp": return "Hipertrofia";
    case "improve_endurance": return "Resistencia";
    default: return "Hipertrofia";
  }
}

// ─── Nutrition helpers ───

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

// ─── Build weekly plan ───

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function buildWeeklyPlan(
  gymSplit: RoutineDay[], sports: string[], daysAvailable: number,
  config: UserConfig,
  exerciseLib: Record<string, ExerciseRow[]>,
  rules: Rules,
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
        const recoveryNeeded = rules.recovery_hours[m] || 48;
        return (dayIdx - lastDay) * 24 >= recoveryNeeded;
      });

      if (canTrain) {
        const exercises = pickExercisesForSession(routine.muscles, exerciseLib, config, rules);
        plan.push({
          day: DAYS[dayIdx], type: "gimnasio",
          routine_name: routine.name, muscle_focus: routine.muscles.join(" · "),
          exercises: exercises.map(({ movement_pattern, priority, fatigue_level, ...rest }) => rest),
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
        intensity: config.intensityLevel >= 7 ? "Alta" : config.intensityLevel >= 4 ? "Media" : "Baja",
        duration: config.intensityLevel >= 7 ? "60min" : "45min",
      });
      sportDays.push(dayIdx);
      continue;
    }

    if (gymDayIdx < gymSplit.length) {
      const routine = gymSplit[gymDayIdx];
      const exercises = pickExercisesForSession(routine.muscles, exerciseLib, config, rules);
      plan.push({
        day: DAYS[dayIdx], type: "gimnasio",
        routine_name: routine.name, muscle_focus: routine.muscles.join(" · "),
        exercises: exercises.map(({ movement_pattern, priority, fatigue_level, ...rest }) => rest),
      });
      for (const m of routine.muscles) trainedMuscles[m] = dayIdx;
      gymDayIdx++;
    }
  }
  return plan;
}

// ─── Intensity to level ───

function intensityToLevel(intensity: number): number {
  if (intensity >= 8) return 3;
  if (intensity >= 5) return 2;
  return 1;
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

    // Fetch rules and onboarding in parallel
    const [onbResult, rulesResult] = await Promise.all([
      supabase.from("onboarding").select("*").eq("user_id", targetUserId).single(),
      supabase.from("training_rules").select("*").limit(1).single(),
    ]);

    const onb = onbResult.data;
    if (onbResult.error || !onb) throw new Error("Onboarding data not found");

    // Build rules object — fallback to defaults if no row
    let rules: Rules = DEFAULT_RULES;
    if (rulesResult.data) {
      const r = rulesResult.data;
      rules = {
        min_sets_per_session: r.min_sets_per_session ?? DEFAULT_RULES.min_sets_per_session,
        max_sets_per_session: r.max_sets_per_session ?? DEFAULT_RULES.max_sets_per_session,
        series_p1_min: r.series_p1_min ?? DEFAULT_RULES.series_p1_min,
        series_p1_max: r.series_p1_max ?? DEFAULT_RULES.series_p1_max,
        series_p2_min: r.series_p2_min ?? DEFAULT_RULES.series_p2_min,
        series_p2_max: r.series_p2_max ?? DEFAULT_RULES.series_p2_max,
        series_p3_min: r.series_p3_min ?? DEFAULT_RULES.series_p3_min,
        series_p3_max: r.series_p3_max ?? DEFAULT_RULES.series_p3_max,
        reps_fuerza: r.reps_fuerza ?? DEFAULT_RULES.reps_fuerza,
        reps_hipertrofia: r.reps_hipertrofia ?? DEFAULT_RULES.reps_hipertrofia,
        reps_resistencia: r.reps_resistencia ?? DEFAULT_RULES.reps_resistencia,
        reps_isometrico: r.reps_isometrico ?? DEFAULT_RULES.reps_isometrico,
        rest_fuerza: r.rest_fuerza ?? DEFAULT_RULES.rest_fuerza,
        rest_hipertrofia: r.rest_hipertrofia ?? DEFAULT_RULES.rest_hipertrofia,
        rest_resistencia: r.rest_resistencia ?? DEFAULT_RULES.rest_resistencia,
        rest_isometrico: r.rest_isometrico ?? DEFAULT_RULES.rest_isometrico,
        max_consecutive_high_fatigue: r.max_consecutive_high_fatigue ?? DEFAULT_RULES.max_consecutive_high_fatigue,
        max_heavy_hinges: r.max_heavy_hinges ?? DEFAULT_RULES.max_heavy_hinges,
        max_pattern_repeats: r.max_pattern_repeats ?? DEFAULT_RULES.max_pattern_repeats,
        push_pull_max_diff: r.push_pull_max_diff ?? DEFAULT_RULES.push_pull_max_diff,
        max_p2_exercises: r.max_p2_exercises ?? DEFAULT_RULES.max_p2_exercises,
        max_p3_exercises: r.max_p3_exercises ?? DEFAULT_RULES.max_p3_exercises,
        required_patterns: Array.isArray(r.required_patterns) ? r.required_patterns as string[] : DEFAULT_RULES.required_patterns,
        recovery_hours: typeof r.recovery_hours === "object" && r.recovery_hours !== null ? r.recovery_hours as Record<string, number> : DEFAULT_RULES.recovery_hours,
      };
    }
    console.log(`[GENERATE-PLAN] Rules loaded: min=${rules.min_sets_per_session} max=${rules.max_sets_per_session} patterns=${rules.required_patterns.join(",")}`);

    const weight = onb.weight || 70;
    const goal = onb.goal || "general_health";
    const sports = onb.sports ? onb.sports.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const daysAvailable = parseInt(
      typeof onb.availability === "object" && onb.availability !== null
        ? (onb.availability as any).days || "4" : "4"
    );
    const intensityLevel = onb.intensity_level || 5;
    const userLevel = intensityToLevel(intensityLevel);

    const equipmentType = onb.equipment_type || "Mixto";

    const config: UserConfig = {
      userLevel,
      goal,
      exerciseType: equipmentType,
      intensityLevel,
    };

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
    console.log(`[GENERATE-PLAN] User level: ${userLevel}, intensity: ${intensityLevel}, goal: ${goal}`);

    const gymSplit = getGymSplit(Math.min(daysAvailable, 6));
    const weeklyPlan = buildWeeklyPlan(gymSplit, sports, Math.min(daysAvailable, 7), config, exerciseLib, rules);

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
