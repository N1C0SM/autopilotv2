import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Dumbbell, GripVertical } from "lucide-react";
import type { Exercise, DayPlan, GymExerciseEntry } from "@/types/training";
import { DAYS, INTENSITIES } from "@/types/training";

interface Props {
  dayPlans: DayPlan[];
  onChange: (plans: DayPlan[]) => void;
  userSports?: string | null;
}

const emptyGymExercise = (): GymExerciseEntry => ({
  exercise_id: "", name: "", series: 3, reps: 10, weight: "", rest: "60s",
});

const TrainingPlanForm = ({ dayPlans, onChange, userSports }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    supabase.from("exercises").select("*").order("muscle_group").order("name")
      .then(({ data }) => { if (data) setExercises(data as Exercise[]); });
  }, []);

  const sportOptions = userSports
    ? userSports.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const addDay = () => {
    const usedDays = dayPlans.map((d) => d.day);
    const nextDay = DAYS.find((d) => !usedDays.includes(d)) || DAYS[0];
    onChange([...dayPlans, { day: nextDay, type: "actividad", sport: "", intensity: "Media", duration: "" }]);
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
    if (ex) updateGymExercise(dayIdx, exIdx, { exercise_id: ex.id, name: ex.name });
  };

  const groupedExercises = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscle_group || "Otro";
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl p-6 border border-border mt-6">
      <h2 className="font-bold font-display mb-4 flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-primary" />
        Crear Plan de Entrenamiento
      </h2>

      <div className="space-y-4">
        {dayPlans.map((plan, dayIdx) => (
          <div key={dayIdx} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              {/* Day selector */}
              <div className="w-36">
                <Label className="text-xs">Día</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={plan.day}
                  onChange={(e) => updateDay(dayIdx, { day: e.target.value })}
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Type selector */}
              <div className="w-36">
                <Label className="text-xs">Tipo</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={plan.type}
                  onChange={(e) => updateDay(dayIdx, {
                    type: e.target.value as "actividad" | "gimnasio",
                    ...(e.target.value === "gimnasio" ? { routine_name: "", exercises: [emptyGymExercise()] } : { sport: "", intensity: "Media", duration: "" }),
                  })}
                >
                  <option value="actividad">Actividad</option>
                  <option value="gimnasio">Gimnasio</option>
                </select>
              </div>

              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => removeDay(dayIdx)} className="text-destructive self-end">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Activity fields */}
            {plan.type === "actividad" && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Actividad</Label>
                  {sportOptions.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={plan.sport || ""}
                      onChange={(e) => updateDay(dayIdx, { sport: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {sportOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="__custom">Otra...</option>
                    </select>
                  ) : (
                    <Input value={plan.sport || ""} onChange={(e) => updateDay(dayIdx, { sport: e.target.value })} placeholder="Escalada, Running..." />
                  )}
                  {plan.sport === "__custom" && (
                    <Input className="mt-1" placeholder="Escribe la actividad..." onChange={(e) => updateDay(dayIdx, { sport: e.target.value })} />
                  )}
                </div>
                <div>
                  <Label className="text-xs">Intensidad</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={plan.intensity || "Media"}
                    onChange={(e) => updateDay(dayIdx, { intensity: e.target.value })}
                  >
                    {INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Duración</Label>
                  <Input value={plan.duration || ""} onChange={(e) => updateDay(dayIdx, { duration: e.target.value })} placeholder="45min" />
                </div>
              </div>
            )}

            {/* Gym fields */}
            {plan.type === "gimnasio" && (
              <div className="space-y-3">
                <div className="w-64">
                  <Label className="text-xs">Nombre de la rutina</Label>
                  <Input
                    value={plan.routine_name || ""}
                    onChange={(e) => updateDay(dayIdx, { routine_name: e.target.value })}
                    placeholder="Tren superior A"
                  />
                </div>

                <div className="space-y-2">
                  {(plan.exercises || []).map((ex, exIdx) => (
                    <div key={exIdx} className="grid grid-cols-12 gap-2 items-end bg-secondary/30 rounded-lg p-2">
                      <div className="col-span-4">
                        <Label className="text-xs">Ejercicio</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={ex.exercise_id}
                          onChange={(e) => selectExerciseFromLibrary(dayIdx, exIdx, e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {Object.entries(groupedExercises).map(([group, exs]) => (
                            <optgroup key={group} label={group}>
                              {exs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Series</Label>
                        <Input type="number" className="h-9" value={ex.series} onChange={(e) => updateGymExercise(dayIdx, exIdx, { series: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Reps</Label>
                        <Input type="number" className="h-9" value={ex.reps} onChange={(e) => updateGymExercise(dayIdx, exIdx, { reps: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Peso</Label>
                        <Input className="h-9" value={ex.weight} onChange={(e) => updateGymExercise(dayIdx, exIdx, { weight: e.target.value })} placeholder="60kg" />
                      </div>
                      <div className="col-span-1">
                        <Label className="text-xs">Desc.</Label>
                        <Input className="h-9" value={ex.rest} onChange={(e) => updateGymExercise(dayIdx, exIdx, { rest: e.target.value })} placeholder="60s" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button onClick={() => removeGymExercise(dayIdx, exIdx)} className="text-muted-foreground hover:text-destructive h-9 flex items-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={() => addGymExercise(dayIdx)}>
                  <Plus className="w-3 h-3 mr-1" /> Añadir ejercicio
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addDay} className="mt-4">
        <Plus className="w-4 h-4 mr-1" /> Añadir día
      </Button>
    </div>
  );
};

export default TrainingPlanForm;
