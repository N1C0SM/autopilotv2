export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  image_url?: string | null;
  exercise_type?: string | null;
  movement_pattern?: string | null;
  level?: number | null;
  priority?: number | null;
  stimulus_type?: string | null;
  load_level?: string | null;
  fatigue_level?: string | null;
  recommended_order?: number | null;
  alternative_id?: string | null;
}

export interface GymExerciseEntry {
  exercise_id: string;
  name: string;
  series: number;
  reps: number;
  weight: string;
  rest: string;
  image_url?: string;
}

export interface DayPlan {
  day: string;
  type: "actividad" | "gimnasio";
  // actividad
  sport?: string;
  intensity?: string;
  duration?: string;
  // gimnasio
  routine_name?: string;
  muscle_focus?: string;
  exercises?: GymExerciseEntry[];
}

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
export const INTENSITIES = ["Baja", "Media", "Alta", "Muy Alta"] as const;

export const MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Piernas", "Glúteos", "Core", "Cardio", "Cuerpo completo",
] as const;

export const EXERCISE_TYPES = ["Calistenia", "Gimnasio", "Mixto"] as const;
export const MOVEMENT_PATTERNS = ["Empuje", "Tirón", "Sentadilla", "Bisagra", "Core"] as const;
export const LEVELS = [
  { value: 1, label: "Básico" },
  { value: 2, label: "Intermedio" },
  { value: 3, label: "Avanzado" },
] as const;
export const PRIORITIES = [
  { value: 1, label: "Base" },
  { value: 2, label: "Desarrollo" },
  { value: 3, label: "Accesorio" },
] as const;
export const STIMULUS_TYPES = ["Fuerza", "Hipertrofia", "Resistencia", "Isométrico"] as const;
export const LOAD_LEVELS = ["Alta", "Media", "Baja"] as const;
export const FATIGUE_LEVELS = ["Alta", "Media", "Baja"] as const;
export const RECOMMENDED_ORDERS = [
  { value: 1, label: "Inicio" },
  { value: 2, label: "Medio" },
  { value: 3, label: "Final" },
] as const;
