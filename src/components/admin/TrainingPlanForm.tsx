import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell, Copy, ChevronDown, ChevronUp, FileDown, GripVertical, Download } from "lucide-react";
import type { Exercise, DayPlan, GymExerciseEntry } from "@/types/training";
import { DAYS, INTENSITIES, MUSCLE_GROUPS } from "@/types/training";

interface Props {
  dayPlans: DayPlan[];
  onChange: (plans: DayPlan[]) => void;
  userSports?: string | null;
  equipmentType?: string;
  specificGoal?: string;
}

const emptyGymExercise = (): GymExerciseEntry => ({
  exercise_id: "", name: "", series: 3, reps: 10, weight: "", rest: "60s",
});

// ─── Training Templates ───
const STRUCTURE_TEMPLATES: Record<string, { label: string; days: DayPlan[] }> = {
  ppl: {
    label: "PPL (Push/Pull/Legs)",
    days: [
      { day: "Lunes", type: "gimnasio", routine_name: "Push A", muscle_focus: "Pecho · Hombros · Tríceps", exercises: [] },
      { day: "Martes", type: "gimnasio", routine_name: "Pull A", muscle_focus: "Espalda · Bíceps", exercises: [] },
      { day: "Miércoles", type: "gimnasio", routine_name: "Legs A", muscle_focus: "Piernas · Glúteos", exercises: [] },
      { day: "Jueves", type: "gimnasio", routine_name: "Push B", muscle_focus: "Pecho · Hombros · Tríceps", exercises: [] },
      { day: "Viernes", type: "gimnasio", routine_name: "Pull B", muscle_focus: "Espalda · Bíceps", exercises: [] },
      { day: "Sábado", type: "gimnasio", routine_name: "Legs B", muscle_focus: "Piernas · Glúteos · Core", exercises: [] },
    ],
  },
  upper_lower: {
    label: "Upper/Lower (4 días)",
    days: [
      { day: "Lunes", type: "gimnasio", routine_name: "Upper A", muscle_focus: "Pecho · Espalda · Hombros", exercises: [] },
      { day: "Martes", type: "gimnasio", routine_name: "Lower A", muscle_focus: "Piernas · Glúteos · Core", exercises: [] },
      { day: "Jueves", type: "gimnasio", routine_name: "Upper B", muscle_focus: "Pecho · Espalda · Bíceps · Tríceps", exercises: [] },
      { day: "Viernes", type: "gimnasio", routine_name: "Lower B", muscle_focus: "Piernas · Glúteos · Core", exercises: [] },
    ],
  },
  fullbody: {
    label: "Full Body (3 días)",
    days: [
      { day: "Lunes", type: "gimnasio", routine_name: "Full Body A", muscle_focus: "Cuerpo completo", exercises: [] },
      { day: "Miércoles", type: "gimnasio", routine_name: "Full Body B", muscle_focus: "Cuerpo completo", exercises: [] },
      { day: "Viernes", type: "gimnasio", routine_name: "Full Body C", muscle_focus: "Cuerpo completo", exercises: [] },
    ],
  },
  torso_pierna: {
    label: "Torso/Pierna (4 días)",
    days: [
      { day: "Lunes", type: "gimnasio", routine_name: "Torso A", muscle_focus: "Pecho · Espalda · Hombros", exercises: [] },
      { day: "Martes", type: "gimnasio", routine_name: "Pierna A", muscle_focus: "Piernas · Glúteos", exercises: [] },
      { day: "Jueves", type: "gimnasio", routine_name: "Torso B", muscle_focus: "Pecho · Espalda · Bíceps · Tríceps", exercises: [] },
      { day: "Viernes", type: "gimnasio", routine_name: "Pierna B", muscle_focus: "Piernas · Glúteos · Core", exercises: [] },
    ],
  },
};

// ─── Goal-Specific Skill Templates ───
interface SkillTemplate {
  label: string;
  emoji: string;
  skillTag: string;
  supportMuscles: string[];
  days: { name: string; focus: string; muscles: string[] }[];
}

const SKILL_TEMPLATES: Record<string, SkillTemplate> = {
  handstand: {
    label: "Pino / Handstand",
    emoji: "🤸",
    skillTag: "handstand",
    supportMuscles: ["Hombros", "Core", "Tríceps"],
    days: [
      { name: "Skill + Empuje", focus: "Progresión de pino + Hombros · Tríceps", muscles: ["Hombros", "Tríceps"] },
      { name: "Core + Estabilidad", focus: "Core · Equilibrio · Hombros", muscles: ["Core", "Hombros"] },
      { name: "Pull + Compensación", focus: "Espalda · Bíceps · Movilidad", muscles: ["Espalda", "Bíceps"] },
      { name: "Skill + Full", focus: "Progresión de pino + Cuerpo completo", muscles: ["Hombros", "Piernas", "Core"] },
    ],
  },
  muscle_up: {
    label: "Muscle Up",
    emoji: "💪",
    skillTag: "muscle_up",
    supportMuscles: ["Espalda", "Pecho", "Bíceps", "Tríceps"],
    days: [
      { name: "Pull Pesado", focus: "Progresión muscle up + Espalda · Bíceps", muscles: ["Espalda", "Bíceps"] },
      { name: "Push + Transición", focus: "Pecho · Tríceps · Fondos", muscles: ["Pecho", "Tríceps"] },
      { name: "Piernas + Core", focus: "Piernas · Glúteos · Core", muscles: ["Piernas", "Core"] },
      { name: "Pull Explosivo", focus: "Progresión muscle up + Espalda", muscles: ["Espalda", "Pecho"] },
    ],
  },
  planche: {
    label: "Planche",
    emoji: "🏋️",
    skillTag: "planche",
    supportMuscles: ["Hombros", "Pecho", "Core", "Tríceps"],
    days: [
      { name: "Skill + Push", focus: "Progresión planche + Hombros · Pecho", muscles: ["Hombros", "Pecho"] },
      { name: "Core + Recto abdominal", focus: "Core intenso · Hollow · Protracción", muscles: ["Core", "Hombros"] },
      { name: "Pull + Compensación", focus: "Espalda · Bíceps", muscles: ["Espalda", "Bíceps"] },
      { name: "Skill + Pierna", focus: "Progresión planche + Piernas", muscles: ["Hombros", "Piernas"] },
    ],
  },
  front_lever: {
    label: "Front Lever",
    emoji: "🔥",
    skillTag: "front_lever",
    supportMuscles: ["Espalda", "Core", "Bíceps"],
    days: [
      { name: "Skill + Pull", focus: "Progresión front lever + Espalda", muscles: ["Espalda", "Bíceps"] },
      { name: "Core + Retracción", focus: "Core · Hollow · Espalda", muscles: ["Core", "Espalda"] },
      { name: "Push + Compensación", focus: "Pecho · Hombros · Tríceps", muscles: ["Pecho", "Hombros"] },
      { name: "Skill + Pierna", focus: "Progresión front lever + Piernas", muscles: ["Espalda", "Piernas"] },
    ],
  },
  back_lever: {
    label: "Back Lever",
    emoji: "⚡",
    skillTag: "back_lever",
    supportMuscles: ["Espalda", "Hombros", "Bíceps"],
    days: [
      { name: "Skill + Pull", focus: "Progresión back lever + Espalda", muscles: ["Espalda", "Hombros"] },
      { name: "Push + Hombros", focus: "Pecho · Hombros · Tríceps", muscles: ["Pecho", "Hombros"] },
      { name: "Core + Movilidad", focus: "Core · Movilidad de hombro", muscles: ["Core", "Hombros"] },
      { name: "Pull + Pierna", focus: "Espalda · Piernas", muscles: ["Espalda", "Piernas"] },
    ],
  },
  human_flag: {
    label: "Bandera Humana",
    emoji: "🚩",
    skillTag: "human_flag",
    supportMuscles: ["Hombros", "Core", "Espalda"],
    days: [
      { name: "Skill + Lateral", focus: "Progresión bandera + Oblicuos · Hombros", muscles: ["Hombros", "Core"] },
      { name: "Push + Pull", focus: "Espalda · Pecho · Hombros", muscles: ["Espalda", "Pecho"] },
      { name: "Core + Pierna", focus: "Core intenso · Piernas", muscles: ["Core", "Piernas"] },
    ],
  },
  pistol_squat: {
    label: "Pistol Squat",
    emoji: "🦵",
    skillTag: "pistol_squat",
    supportMuscles: ["Piernas", "Glúteos", "Core"],
    days: [
      { name: "Skill + Pierna", focus: "Progresión pistol + Piernas · Glúteos", muscles: ["Piernas", "Glúteos"] },
      { name: "Upper Push", focus: "Pecho · Hombros · Tríceps", muscles: ["Pecho", "Hombros"] },
      { name: "Upper Pull", focus: "Espalda · Bíceps · Core", muscles: ["Espalda", "Core"] },
      { name: "Skill + Movilidad", focus: "Progresión pistol + Movilidad · Core", muscles: ["Piernas", "Core"] },
    ],
  },
  l_sit: {
    label: "L-Sit",
    emoji: "🧘",
    skillTag: "l_sit",
    supportMuscles: ["Core", "Hombros", "Tríceps"],
    days: [
      { name: "Skill + Core", focus: "Progresión L-sit + Core · Compresión", muscles: ["Core", "Hombros"] },
      { name: "Push", focus: "Pecho · Hombros · Tríceps", muscles: ["Pecho", "Tríceps"] },
      { name: "Pull + Pierna", focus: "Espalda · Bíceps · Piernas", muscles: ["Espalda", "Piernas"] },
    ],
  },
};

const TrainingPlanForm = ({ dayPlans, onChange, userSports, equipmentType = "Mixto", specificGoal }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  // Determine equipment filter
  const eqFilter = equipmentType === "Calistenia" ? "Calistenia" : equipmentType === "Gimnasio" ? "Gimnasio" : null;

  useEffect(() => {
    supabase.from("exercises")
      .select("id, name, muscle_group, image_url, exercise_type, movement_pattern, level, priority, stimulus_type, load_level, fatigue_level, recommended_order, skill_tag, progression_order")
      .order("muscle_group").order("recommended_order").order("name")
      .then(({ data }) => { if (data) setExercises(data as Exercise[]); });
  }, []);

  // Filtered exercises based on equipment preference
  const filteredExercises = eqFilter
    ? exercises.filter(e => e.exercise_type === eqFilter || e.exercise_type === "Mixto" || !e.exercise_type)
    : exercises;

  const sportOptions = userSports
    ? userSports.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleExpand = (i: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Helper: pick exercises from library for given muscles
  const pickExercisesForMuscles = (muscleFocus: string, count = 4): GymExerciseEntry[] => {
    const muscles = muscleFocus.split("·").map(m => m.trim()).filter(Boolean);
    const result: GymExerciseEntry[] = [];
    for (const muscle of muscles) {
      const available = filteredExercises.filter(e => e.muscle_group === muscle);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const perMuscle = Math.max(1, Math.floor(count / muscles.length));
      for (const ex of shuffled.slice(0, perMuscle)) {
        result.push({
          exercise_id: ex.id, name: ex.name, series: 3, reps: 10,
          weight: "", rest: "60s", image_url: ex.image_url || undefined,
        });
      }
    }
    return result;
  };

  const loadTemplate = (key: string) => {
    const tpl = STRUCTURE_TEMPLATES[key];
    if (!tpl) return;
    const days = tpl.days.map((d) => ({
      ...d,
      exercises: d.muscle_focus ? pickExercisesForMuscles(d.muscle_focus) : [],
    }));
    onChange(days);
    setExpandedDays(new Set([0]));
    toast.success(`Plantilla "${tpl.label}" cargada con ejercicios`);
  };

  const loadSkillTemplate = (key: string) => {
    const tpl = SKILL_TEMPLATES[key];
    if (!tpl) return;

    // Get skill progression exercises (skill exercises bypass equipment filter)
    const skillExercises = exercises
      .filter(e => e.skill_tag === tpl.skillTag)
      .sort((a, b) => (a.progression_order || 0) - (b.progression_order || 0));

    const days: DayPlan[] = tpl.days.map((d, i) => {
      const dayName = DAYS[i] || DAYS[0];
      const gymExercises: GymExerciseEntry[] = [];

      // Add skill progression exercises first (on skill days)
      if (d.focus.toLowerCase().includes("progresión")) {
        for (const se of skillExercises) {
          gymExercises.push({
            exercise_id: se.id,
            name: se.name,
            series: 3,
            reps: 10,
            weight: "",
            rest: "90s",
            image_url: se.image_url || undefined,
          });
        }
      }

      // Fill with support exercises from the specified muscles (respecting equipment filter)
      for (const muscle of d.muscles) {
        const available = filteredExercises
          .filter(e => e.muscle_group === muscle && !gymExercises.find(g => g.exercise_id === e.id))
          .sort(() => Math.random() - 0.5);
        const take = Math.max(1, Math.floor(3 / d.muscles.length));
        for (const ex of available.slice(0, take)) {
          gymExercises.push({
            exercise_id: ex.id,
            name: ex.name,
            series: 3,
            reps: 10,
            weight: "",
            rest: "60s",
            image_url: ex.image_url || undefined,
          });
        }
      }

      return {
        day: dayName,
        type: "gimnasio" as const,
        routine_name: d.name,
        muscle_focus: d.focus,
        exercises: gymExercises,
      };
    });

    onChange(days);
    setExpandedDays(new Set([0]));
    toast.success(`🎯 Plantilla "${tpl.emoji} ${tpl.label}" cargada con ${skillExercises.length} ejercicios de progresión`);
  };

  const exportRoutine = () => {
    let text = "RUTINA DE ENTRENAMIENTO\n" + "=".repeat(40) + "\n\n";
    for (const plan of dayPlans) {
      text += `📅 ${plan.day} — ${plan.type === "gimnasio" ? plan.routine_name || "Gimnasio" : plan.sport || "Actividad"}\n`;
      if (plan.muscle_focus) text += `   Músculos: ${plan.muscle_focus}\n`;
      if (plan.type === "gimnasio" && plan.exercises?.length) {
        for (const ex of plan.exercises) {
          text += `   • ${ex.name} — ${ex.series}x${ex.reps} ${ex.weight ? `@ ${ex.weight}` : ""} (descanso: ${ex.rest})\n`;
        }
      }
      if (plan.type === "actividad") {
        text += `   Intensidad: ${plan.intensity || "Media"} · Duración: ${plan.duration || "—"}\n`;
      }
      text += "\n";
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rutina.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Rutina exportada");
  };

  const addDay = () => {
    const usedDays = dayPlans.map((d) => d.day);
    const nextDay = DAYS.find((d) => !usedDays.includes(d)) || DAYS[0];
    const newIdx = dayPlans.length;
    onChange([...dayPlans, { day: nextDay, type: "gimnasio", routine_name: "", muscle_focus: "", exercises: [emptyGymExercise()] }]);
    setExpandedDays((prev) => new Set(prev).add(newIdx));
  };

  const duplicateDay = (i: number) => {
    const src = dayPlans[i];
    const usedDays = dayPlans.map((d) => d.day);
    const nextDay = DAYS.find((d) => !usedDays.includes(d)) || DAYS[0];
    const copy = { ...JSON.parse(JSON.stringify(src)), day: nextDay };
    const newIdx = dayPlans.length;
    onChange([...dayPlans, copy]);
    setExpandedDays((prev) => new Set(prev).add(newIdx));
    toast.success(`Día duplicado como ${nextDay}`);
  };

  const removeDay = (i: number) => onChange(dayPlans.filter((_, idx) => idx !== i));

  const updateDay = (i: number, updates: Partial<DayPlan>) => {
    onChange(dayPlans.map((d, idx) => idx === i ? { ...d, ...updates } : d));
  };

  const addGymExercise = (dayIdx: number) => {
    const plan = dayPlans[dayIdx];
    updateDay(dayIdx, { exercises: [...(plan.exercises || []), emptyGymExercise()] });
  };

  const updateGymExercise = (dayIdx: number, exIdx: number, updates: Partial<GymExerciseEntry>) => {
    const plan = dayPlans[dayIdx];
    const exs = [...(plan.exercises || [])];
    exs[exIdx] = { ...exs[exIdx], ...updates };
    updateDay(dayIdx, { exercises: exs });
  };

  const removeGymExercise = (dayIdx: number, exIdx: number) => {
    const plan = dayPlans[dayIdx];
    updateDay(dayIdx, { exercises: (plan.exercises || []).filter((_, i) => i !== exIdx) });
  };

  const selectExerciseFromLibrary = (dayIdx: number, exIdx: number, exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (ex) {
      updateGymExercise(dayIdx, exIdx, {
        exercise_id: ex.id,
        name: ex.name,
        image_url: ex.image_url || undefined,
      });
    }
  };

  const groupedExercises = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscle_group || "Otro";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold font-display flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          Plan de Entrenamiento
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dayPlans.length}/7 días</span>
          {dayPlans.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportRoutine}>
              <Download className="w-3.5 h-3.5 mr-1" /> Exportar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addDay} disabled={dayPlans.length >= 7}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Día
          </Button>
        </div>
      </div>

      {/* Structure template buttons */}
      <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plantillas de estructura</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STRUCTURE_TEMPLATES).map(([key, tpl]) => (
            <Button key={key} variant="outline" size="sm" className="text-xs h-7" onClick={() => loadTemplate(key)}>
              {tpl.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Skill/Goal template buttons */}
      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">🎯</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plantillas por objetivo (con progresiones)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SKILL_TEMPLATES).map(([key, tpl]) => (
            <Button key={key} variant="outline" size="sm" className="text-xs h-7 border-primary/20 hover:bg-primary/10" onClick={() => loadSkillTemplate(key)}>
              {tpl.emoji} {tpl.label}
            </Button>
          ))}
        </div>
      </div>

      {dayPlans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Carga una plantilla o pulsa "Día" para empezar.</p>
        </div>
      )}

      <div className="space-y-3">
        {dayPlans.map((plan, dayIdx) => {
          const isExpanded = expandedDays.has(dayIdx);
          const summary = plan.type === "gimnasio"
            ? `${plan.routine_name || "Sin nombre"} · ${plan.muscle_focus || ""} · ${(plan.exercises || []).length} ejercicios`
            : `${plan.sport || "Sin actividad"} · ${plan.intensity} · ${plan.duration || "—"}`;

          return (
            <div key={dayIdx} className={`border rounded-xl overflow-hidden transition-colors ${isExpanded ? "border-primary/40 bg-secondary/20" : "border-border"}`}>
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => toggleExpand(dayIdx)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${plan.type === "gimnasio" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground"}`}>
                  {plan.day.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{plan.day}</div>
                  <div className="text-xs text-muted-foreground truncate">{summary}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.type === "gimnasio" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {plan.type === "gimnasio" ? "🏋️ Gimnasio" : "🏃 Actividad"}
                </span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-28">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Día</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={plan.day} onChange={(e) => updateDay(dayIdx, { day: e.target.value })}>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="w-28">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={plan.type} onChange={(e) => updateDay(dayIdx, {
                        type: e.target.value as "actividad" | "gimnasio",
                        ...(e.target.value === "gimnasio" ? { routine_name: "", muscle_focus: "", exercises: [emptyGymExercise()] } : { sport: "", intensity: "Media", duration: "" }),
                      })}>
                        <option value="gimnasio">Gimnasio</option>
                        <option value="actividad">Actividad</option>
                      </select>
                    </div>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => duplicateDay(dayIdx)} className="text-muted-foreground h-8">
                      <Copy className="w-3.5 h-3.5 mr-1" /> Duplicar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeDay(dayIdx)} className="text-destructive h-8">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                    </Button>
                  </div>

                  {plan.type === "actividad" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Actividad</Label>
                        {sportOptions.length > 0 ? (
                          <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={plan.sport || ""} onChange={(e) => updateDay(dayIdx, { sport: e.target.value })}>
                            <option value="">Seleccionar...</option>
                            {sportOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                            <option value="__custom">Otra...</option>
                          </select>
                        ) : (
                          <Input className="h-9" value={plan.sport || ""} onChange={(e) => updateDay(dayIdx, { sport: e.target.value })} placeholder="Escalada, Running..." />
                        )}
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Intensidad</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={plan.intensity || "Media"} onChange={(e) => updateDay(dayIdx, { intensity: e.target.value })}>
                          {INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Duración</Label>
                        <Input className="h-9" value={plan.duration || ""} onChange={(e) => updateDay(dayIdx, { duration: e.target.value })} placeholder="45min" />
                      </div>
                    </div>
                  )}

                  {plan.type === "gimnasio" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nombre de la rutina</Label>
                          <Input className="h-9" value={plan.routine_name || ""} onChange={(e) => updateDay(dayIdx, { routine_name: e.target.value })} placeholder="Push A, Piernas..." />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Músculos principales</Label>
                          <Input className="h-9" value={plan.muscle_focus || ""} onChange={(e) => updateDay(dayIdx, { muscle_focus: e.target.value })} placeholder="Pecho · Tríceps" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
                          <span className="w-[35%]">Ejercicio</span>
                          <span className="w-[12%]">Series</span>
                          <span className="w-[12%]">Reps</span>
                          <span className="w-[15%]">Peso</span>
                          <span className="w-[12%]">Desc.</span>
                        </div>

                        {(plan.exercises || []).map((ex, exIdx) => (
                          <div key={exIdx} className="flex items-center gap-2 bg-background/50 rounded-lg p-2.5 border border-border/50 group">
                            {/* Exercise image thumbnail */}
                            {ex.image_url && (
                              <img src={ex.image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            )}
                            <div className="w-[35%] shrink-0">
                              <select className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs" value={ex.exercise_id} onChange={(e) => selectExerciseFromLibrary(dayIdx, exIdx, e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {Object.entries(groupedExercises).map(([group, exs]) => (
                                  <optgroup key={group} label={group}>
                                    {exs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div className="w-[12%]">
                              <Input type="number" className="h-8 text-xs text-center" value={ex.series} onChange={(e) => updateGymExercise(dayIdx, exIdx, { series: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="w-[12%]">
                              <Input type="number" className="h-8 text-xs text-center" value={ex.reps} onChange={(e) => updateGymExercise(dayIdx, exIdx, { reps: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="w-[15%]">
                              <Input className="h-8 text-xs text-center" value={ex.weight} onChange={(e) => updateGymExercise(dayIdx, exIdx, { weight: e.target.value })} placeholder="kg" />
                            </div>
                            <div className="w-[12%]">
                              <Input className="h-8 text-xs text-center" value={ex.rest} onChange={(e) => updateGymExercise(dayIdx, exIdx, { rest: e.target.value })} placeholder="60s" />
                            </div>
                            <button onClick={() => removeGymExercise(dayIdx, exIdx)} className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addGymExercise(dayIdx)} className="h-8 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Añadir ejercicio
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingPlanForm;
