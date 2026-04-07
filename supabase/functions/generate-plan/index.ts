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
  userLevel: number;        // 1-3
  goal: string;             // gain_muscle, lose_weight, recomp, improve_endurance, general_health
  exerciseType: string;     // Calistenia, Gimnasio, Mixto
  intensityLevel: number;   // 1-10
}

// ─── Constants ───

const RECOVERY_HOURS: Record<string, number> = {
  Pecho: 48, Espalda: 48, Hombros: 48, Bíceps: 36, Tríceps: 36,
  Piernas: 72, Glúteos: 48, Core: 24, "Cuerpo completo": 48, Cardio: 24,
};

const REQUIRED_PATTERNS = ["Empuje", "Tirón", "Sentadilla", "Bisagra", "Core"];

const MIN_SETS_PER_SESSION = 12;
const MAX_SETS_PER_SESSION = 20;

// ─── Rule 6: Rep schemes by stimulus ───

function getRepScheme(stimulus: string | null, priority: number): { series: number; reps: string; rest: string } {
  // Rule 5: series by priority
  let seriesRange: [number, number];
  switch (priority) {
    case 1: seriesRange = [3, 5]; break;
    case 2: seriesRange = [3, 4]; break;
    case 3: seriesRange = [2, 3]; break;
    default: seriesRange = [3, 4];
  }

  let reps: string;
  let rest: string;

  // Rule 6: reps by stimulus
  switch (stimulus) {
    case "Fuerza":
      reps = "4-8";
      rest = "180s";
      break;
    case "Hipertrofia":
      reps = "8-15";
      rest = "90s";
      break;
    case "Resistencia":
      reps = "15-25";
      rest = "45s";
      break;
    case "Isométrico":
      reps = "20-60s";
      rest = "60s";
      break;
    default:
      reps = "8-12";
      rest = "90s";
  }

  // Use higher end of series range for priority 1 (compound), lower for accessories
  const series = priority === 1 ? seriesRange[1] : seriesRange[0];

  return { series, reps, rest };
}

// ─── Rule 1-2: Smart exercise picker following mandatory structure ───

function pickExercisesForSession(
  targetMuscles: string[],
  exerciseLib: Record<string, ExerciseRow[]>,
  config: UserConfig,
): PickedExercise[] {
  const { userLevel, goal, exerciseType } = config;

  // Collect all available exercises for these muscles, filtered by type and level
  const allAvailable: ExerciseRow[] = [];
  for (const muscle of targetMuscles) {
    const muscleExercises = exerciseLib[muscle] || [];
    for (const ex of muscleExercises) {
      // Rule 7: Filter by exercise type preference
      if (exerciseType !== "Mixto" && ex.exercise_type && ex.exercise_type !== "Mixto" && ex.exercise_type !== exerciseType) continue;
      // Rule 8: Filter by level (allow user level + 1 level up for progression)
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

  // Helper to pick best exercise for a pattern+priority combo
  function findBest(pattern: string, targetPriority: number): ExerciseRow | null {
    // Prefer user's exact level, then allow one level up for progression (Rule 8)
    const candidates = allAvailable
      .filter(ex =>
        ex.movement_pattern === pattern &&
        (ex.priority ?? 2) === targetPriority &&
        !usedIds.has(ex.id)
      )
      .sort((a, b) => {
        // Prefer exact level match
        const aLevelDiff = Math.abs((a.level ?? 1) - userLevel);
        const bLevelDiff = Math.abs((b.level ?? 1) - userLevel);
        if (aLevelDiff !== bLevelDiff) return aLevelDiff - bLevelDiff;
        // Then by recommended_order
        return (a.recommended_order ?? 2) - (b.recommended_order ?? 2);
      });
    return candidates[0] || null;
  }

  // Helper to add exercise with all rule checks
  function tryAdd(ex: ExerciseRow): boolean {
    const pattern = ex.movement_pattern || "Otro";
    const fatigue = ex.fatigue_level || "Media";
    const priority = ex.priority ?? 2;

    // Rule 3: No more than 2 of same pattern
    if ((patternCounts[pattern] || 0) >= 2) return false;

    // Rule 3: No more than 1 heavy hinge
    if (pattern === "Bisagra" && (ex.load_level === "Alta") && heavyHingeCount >= 1) return false;

    // Rule 3: Balance push/pull — don't let difference exceed 1
    const pushCount = patternCounts["Empuje"] || 0;
    const pullCount = patternCounts["Tirón"] || 0;
    if (pattern === "Empuje" && pushCount > pullCount + 1) return false;
    if (pattern === "Tirón" && pullCount > pushCount + 1) return false;

    // Determine stimulus based on goal override or exercise default
    const stimulus = getEffectiveStimulus(ex.stimulus_type, goal);
    const scheme = getRepScheme(stimulus, priority);

    // Rule 8: Check total volume (12-20 sets)
    if (totalSets + scheme.series > MAX_SETS_PER_SESSION) return false;

    // Rule 3: No more than 2 high-fatigue exercises in a row
    if (fatigue === "Alta") {
      if (consecutiveHighFatigue >= 2) return false;
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
      priority: priority,
      fatigue_level: fatigue,
    });

    usedIds.add(ex.id);
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    totalSets += scheme.series;
    if (pattern === "Bisagra" && ex.load_level === "Alta") heavyHingeCount++;

    return true;
  }

  // ── STEP 1: Mandatory base structure (Rule 1) ──
  // Pick 1 exercise per required pattern at priority 1
  for (const pattern of REQUIRED_PATTERNS) {
    const ex = findBest(pattern, 1);
    if (ex) {
      tryAdd(ex);
    } else {
      // Fallback: try priority 2 for this pattern
      const fallback = findBest(pattern, 2);
      if (fallback) tryAdd(fallback);
      else console.log(`[GENERATE-PLAN] Missing base exercise for pattern: ${pattern}`);
    }
  }

  // ── STEP 2: Complements (Rule 2) ──
  // Add 1-2 priority 2 exercises
  const p2Candidates = allAvailable
    .filter(ex => (ex.priority ?? 2) === 2 && !usedIds.has(ex.id))
    .sort((a, b) => (a.recommended_order ?? 2) - (b.recommended_order ?? 2));

  let p2Added = 0;
  for (const ex of p2Candidates) {
    if (p2Added >= 2 || totalSets >= MAX_SETS_PER_SESSION) break;
    if (tryAdd(ex)) p2Added++;
  }

  // Add 1-2 priority 3 exercises (accessories)
  const p3Candidates = allAvailable
    .filter(ex => (ex.priority ?? 2) === 3 && !usedIds.has(ex.id))
    .sort((a, b) => (a.recommended_order ?? 2) - (b.recommended_order ?? 2));

  let p3Added = 0;
  for (const ex of p3Candidates) {
    if (p3Added >= 2 || totalSets >= MAX_SETS_PER_SESSION) break;
    if (tryAdd(ex)) p3Added++;
  }

  // ── STEP 3: Fill to minimum volume if needed ──
  if (totalSets < MIN_SETS_PER_SESSION) {
    const remaining = allAvailable
      .filter(ex => !usedIds.has(ex.id))
      .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    for (const ex of remaining) {
      if (totalSets >= MIN_SETS_PER_SESSION) break;
      tryAdd(ex);
    }
  }

  // ── STEP 4: Sort final list (Rule 4) ──
  picked.sort((a, b) => {
    const orderA = getOrder(a, allAvailable);
    const orderB = getOrder(b, allAvailable);
    // 1) recommended_order
    if (orderA !== orderB) return orderA - orderB;
    // 2) priority
    if ((a.priority ?? 2) !== (b.priority ?? 2)) return (a.priority ?? 2) - (b.priority ?? 2);
    // 3) fatigue (low fatigue first within same group to manage consecutive high fatigue)
    const fatigueOrder: Record<string, number> = { Baja: 1, Media: 2, Alta: 3 };
    return (fatigueOrder[a.fatigue_level || "Media"] || 2) - (fatigueOrder[b.fatigue_level || "Media"] || 2);
  });

  // Validate Rule 3 post-sort: no more than 2 high-fatigue in a row
  // (Re-arrange if needed)
  const final = enforceConsecutiveFatigueRule(picked);

  console.log(`[GENERATE-PLAN] Session: ${final.length} exercises, ${totalSets} total sets`);
  return final;
}

function getOrder(ex: PickedExercise, lib: ExerciseRow[]): number {
  const found = lib.find(e => e.id === ex.exercise_id);
  return found?.recommended_order ?? 2;
}

function enforceConsecutiveFatigueRule(exercises: PickedExercise[]): PickedExercise[] {
  // Simple bubble-swap if 3+ high-fatigue are consecutive
  const result = [...exercises];
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (let i = 2; i < result.length; i++) {
      if (
        result[i].fatigue_level === "Alta" &&
        result[i - 1].fatigue_level === "Alta" &&
        result[i - 2].fatigue_level === "Alta"
      ) {
        // Find next non-Alta exercise to swap with
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
  // If exercise has a defined stimulus, use it
  if (exerciseStimulus) return exerciseStimulus;
  // Otherwise derive from user goal
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
        const exercises = pickExercisesForSession(routine.muscles, exerciseLib, config);
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
      const exercises = pickExercisesForSession(routine.muscles, exerciseLib, config);
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

    const config: UserConfig = {
      userLevel,
      goal,
      exerciseType: "Mixto", // Default; could be derived from onboarding in the future
      intensityLevel,
    };

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
    console.log(`[GENERATE-PLAN] User level: ${userLevel}, intensity: ${intensityLevel}, goal: ${goal}`);

    const gymSplit = getGymSplit(Math.min(daysAvailable, 6));
    const weeklyPlan = buildWeeklyPlan(gymSplit, sports, Math.min(daysAvailable, 7), config, exerciseLib);

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
