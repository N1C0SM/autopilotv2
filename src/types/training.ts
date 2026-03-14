export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  image_url?: string | null;
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
