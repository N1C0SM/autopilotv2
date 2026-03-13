import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Minus, Dumbbell, ChevronDown, ChevronUp, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DayPlan, GymExerciseEntry } from "@/types/training";

interface SetLog {
  reps: number;
  weight: string;
  done: boolean;
}

interface Props {
  userId: string;
  dayPlans: DayPlan[];
}

const DAYS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const WorkoutTracker = ({ userId, dayPlans }: Props) => {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return DAYS_ORDER[todayIndex];
  });
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>({});
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentPlan = dayPlans.find((p) => p.day === selectedDay);

  // Load existing logs for the selected day
  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("exercise_name, sets_completed")
        .eq("user_id", userId)
        .eq("day_label", selectedDay)
        .eq("logged_at", todayStr);

      if (data && data.length > 0) {
        const logs: Record<string, SetLog[]> = {};
        data.forEach((row: any) => {
          logs[row.exercise_name] = row.sets_completed as SetLog[];
        });
        setExerciseLogs(logs);
      } else {
        // Initialize from plan
        if (currentPlan?.type === "gimnasio" && currentPlan.exercises) {
          const logs: Record<string, SetLog[]> = {};
          currentPlan.exercises.forEach((ex) => {
            logs[ex.name] = Array.from({ length: ex.series }, () => ({
              reps: ex.reps,
              weight: ex.weight || "",
              done: false,
            }));
          });
          setExerciseLogs(logs);
        } else {
          setExerciseLogs({});
        }
      }
    };
    loadLogs();
  }, [selectedDay, userId, todayStr]);

  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetLog, value: any) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exerciseName] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseName]: sets };
    });
  };

  const toggleSetDone = (exerciseName: string, setIndex: number) => {
    updateSet(exerciseName, setIndex, "done", !exerciseLogs[exerciseName]?.[setIndex]?.done);
  };

  const saveWorkout = async () => {
    setSaving(true);
    try {
      // Delete existing logs for today
      await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", userId)
        .eq("day_label", selectedDay)
        .eq("logged_at", todayStr);

      // Insert new logs
      const rows = Object.entries(exerciseLogs).map(([name, sets]) => ({
        user_id: userId,
        day_label: selectedDay,
        exercise_name: name,
        sets_completed: sets,
        logged_at: todayStr,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("workout_logs").insert(rows);
        if (error) throw error;
      }

      toast.success("¡Entrenamiento guardado! 💪");
    } catch {
      toast.error("Error al guardar el entrenamiento");
    }
    setSaving(false);
  };

  const completedSets = Object.values(exerciseLogs).flat().filter((s) => s.done).length;
  const totalSets = Object.values(exerciseLogs).flat().length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Dumbbell className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold font-display">Plan de Entrenamiento</h2>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {DAYS_ORDER.map((day) => {
          const plan = dayPlans.find((p) => p.day === day);
          const isSelected = day === selectedDay;
          const todayIndex = (new Date().getDay() + 6) % 7;
          const isToday = day === DAYS_ORDER[todayIndex];
          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setExpandedExercise(null);
              }}
              className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : plan
                  ? "bg-card border border-border hover:border-primary/30"
                  : "bg-card/50 border border-border/50 opacity-50"
              } ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}`}
            >
              <span>{day.slice(0, 3)}</span>
              <span className="text-[10px] mt-0.5">
                {plan?.type === "gimnasio" ? "🏋️" : plan?.type === "actividad" ? "🏃" : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current day content */}
      {!currentPlan && (
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <p className="text-muted-foreground">Día de descanso 😴</p>
        </div>
      )}

      {currentPlan?.type === "actividad" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="font-bold font-display text-lg mb-3">{currentPlan.sport}</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-primary" />{currentPlan.intensity}
            </span>
            <span className="text-sm bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />{currentPlan.duration}
            </span>
          </div>
        </motion.div>
      )}

      {currentPlan?.type === "gimnasio" && (
        <div className="space-y-3">
          {/* Progress bar */}
          {totalSets > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{currentPlan.routine_name || selectedDay}</span>
                <span className="text-xs text-muted-foreground">{completedSets}/{totalSets} series</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Exercises */}
          {(currentPlan.exercises || []).map((ex, i) => {
            const isExpanded = expandedExercise === ex.name;
            const sets = exerciseLogs[ex.name] || [];
            const doneSets = sets.filter((s) => s.done).length;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Exercise header */}
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : ex.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    doneSets === sets.length && sets.length > 0
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {doneSets}/{sets.length}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{ex.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {ex.series}×{ex.reps} {ex.weight && `· ${ex.weight}`}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded sets */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {/* Header row */}
                        <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-[10px] text-muted-foreground font-medium uppercase px-1">
                          <span>Serie</span>
                          <span>Reps</span>
                          <span>Peso</span>
                          <span></span>
                        </div>

                        {sets.map((set, si) => (
                          <div
                            key={si}
                            className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg transition-colors ${
                              set.done ? "bg-primary/10" : "bg-secondary/30"
                            }`}
                          >
                            <span className="text-xs font-mono text-center text-muted-foreground">{si + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateSet(ex.name, si, "reps", Math.max(0, set.reps - 1))}
                                className="w-6 h-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-mono w-8 text-center">{set.reps}</span>
                              <button
                                onClick={() => updateSet(ex.name, si, "reps", set.reps + 1)}
                                className="w-6 h-6 rounded bg-secondary flex items-center justify-center hover:bg-secondary/80"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={set.weight}
                              onChange={(e) => updateSet(ex.name, si, "weight", e.target.value)}
                              placeholder="kg"
                              className="bg-secondary/50 border border-border rounded px-2 py-1 text-sm w-full text-center font-mono focus:outline-none focus:border-primary/50"
                            />
                            <button
                              onClick={() => toggleSetDone(ex.name, si)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                set.done
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Save button */}
          <div className="pt-2">
            <Button
              onClick={saveWorkout}
              disabled={saving}
              className="w-full"
              variant="hero"
              size="lg"
            >
              {saving ? "Guardando..." : `Guardar entrenamiento (${completedSets}/${totalSets} series)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
