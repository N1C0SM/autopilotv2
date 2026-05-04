export type QuizAnswers = {
  goal?: "lose_fat" | "gain_muscle" | "performance" | "health";
  level?: "beginner" | "intermediate" | "advanced";
  frequency?: 2 | 3 | 4 | 5;
  equipment?: "gym" | "calisthenics" | "mixed";
  session_minutes?: 30 | 45 | 60 | 90;
  problem?: "consistency" | "guidance" | "results" | "injuries";
  age?: number;
  sex?: "male" | "female";
  email?: string;
};

export type PlanPreview = {
  focus: string;
  frequencyLabel: string;
  weekStructure: { day: string; title: string; locked: boolean }[];
  nutrition: { kcal: number; protein: number };
  insight: string;
  mistake: string;
  action: string;
};

const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

export function buildPreview(a: QuizAnswers): PlanPreview {
  const freq = a.frequency ?? 4;
  const goal = a.goal ?? "gain_muscle";
  const equip = a.equipment ?? "mixed";
  const problem = a.problem ?? "consistency";

  const focusByGoal: Record<string, string> = {
    lose_fat: "Hipertrofia + déficit calórico moderado",
    gain_muscle: "Hipertrofia con superávit controlado",
    performance: "Fuerza y skills + alimentación de mantenimiento",
    health: "Salud, movilidad y hábitos sostenibles",
  };

  const splits: Record<number, string[]> = {
    2: ["Full body A", "Full body B"],
    3: ["Empuje", "Tirón", "Pierna"],
    4: ["Empuje superior", "Tren inferior", "Tirón superior", "Full body"],
    5: ["Pecho + tríceps", "Espalda + bíceps", "Pierna", "Hombro + core", "Full body"],
  };
  const session = splits[freq] ?? splits[4];
  const weekStructure: { day: string; title: string; locked: boolean }[] = [];
  let s = 0;
  for (let i = 0; i < 7; i++) {
    const train = i < freq;
    if (train) {
      weekStructure.push({ day: dayNames[i], title: session[s % session.length], locked: s >= 2 });
      s++;
    } else {
      weekStructure.push({ day: dayNames[i], title: "Descanso activo", locked: false });
    }
  }

  // Naive nutrition estimate
  const baseKcal = a.sex === "female" ? 1700 : 2200;
  const kcalDelta = goal === "lose_fat" ? -300 : goal === "gain_muscle" ? 250 : 0;
  const kcal = Math.round((baseKcal + kcalDelta) / 50) * 50;
  const protein = a.sex === "female" ? 110 : 160;

  const insightByProblem: Record<string, string> = {
    consistency:
      "Tu mayor bloqueo no es el plan: es la constancia. Por eso tu plan vive en tu Google Calendar y se reajusta solo cuando fallas un día.",
    guidance:
      "No te falta esfuerzo, te falta saber exactamente qué tocar cada día. Te lo dejamos escrito en tu Calendar minuto a minuto.",
    results:
      "Llevas meses entrenando sin progresión clara. Aplicamos 9 reglas de volumen y fatiga para que cada semana avances.",
    injuries:
      "Tu lesión no debería detenerte. Adaptamos cada ejercicio y bajamos carga de forma automática cuando lo necesitas.",
  };

  const mistakeByGoal: Record<string, string> = {
    lose_fat: "Estás haciendo demasiado cardio y poca proteína. Te frena más de lo que ayuda.",
    gain_muscle: "Entrenas duro pero comes por debajo de mantenimiento. No vas a crecer.",
    performance: "Saltas de un programa a otro cada 3 semanas. La fuerza necesita continuidad.",
    health: "Buscas el plan perfecto en lugar de empezar uno que puedas mantener 6 meses.",
  };

  const actionByEquip: Record<string, string> = {
    gym: "Esta semana fija 4 entrenos en tu calendario y mide solo eso. Olvídate del resto.",
    calisthenics: "Hoy haz 3 series de la progresión más fácil que aún te exige. Nada más.",
    mixed: "Esta semana entrena 4 días y come 1.6 g de proteína por kilo. Solo eso.",
  };

  return {
    focus: focusByGoal[goal],
    frequencyLabel: `${freq} entrenos/semana · ${a.session_minutes ?? 60} min`,
    weekStructure,
    nutrition: { kcal, protein },
    insight: insightByProblem[problem],
    mistake: mistakeByGoal[goal],
    action: actionByEquip[equip],
  };
}

export const QUIZ_STORAGE_KEY = "autopilot_quiz";

export function saveQuiz(a: QuizAnswers) {
  try {
    sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function loadQuiz(): QuizAnswers | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizAnswers) : null;
  } catch {
    return null;
  }
}