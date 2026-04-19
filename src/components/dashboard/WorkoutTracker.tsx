import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Dumbbell, ChevronDown, ChevronUp, Flame, Clock,
  Timer, TrendingUp, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DayPlan } from "@/types/training";
import RPEDialog from "./RPEDialog";

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
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState<string>(DAYS_ORDER[todayIndex]);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>({});
  const [previousLogs, setPreviousLogs] = useState<Record<string, SetLog[]>>({});
  const [saving, setSaving] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState(0);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentPlan = dayPlans.find((p) => p.day === selectedDay);

  // Auto-expand first exercise on day change
  useEffect(() => {
    if (currentPlan?.type === "gimnasio" && currentPlan.exercises?.length) {
      setExpandedExercise(0);
    } else {
      setExpandedExercise(null);
    }
  }, [selectedDay]);

  // Load existing logs + previous session
  useEffect(() => {
    const loadLogs = async () => {
      // Today's logs
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
      } else if (currentPlan?.type === "gimnasio" && currentPlan.exercises) {
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

      // Previous session logs (last workout on this day)
      const { data: prevData } = await supabase
        .from("workout_logs")
        .select("exercise_name, sets_completed, logged_at")
        .eq("user_id", userId)
        .eq("day_label", selectedDay)
        .lt("logged_at", todayStr)
        .order("logged_at", { ascending: false })
        .limit(20);

      if (prevData && prevData.length > 0) {
        const lastDate = prevData[0].logged_at;
        const prev: Record<string, SetLog[]> = {};
        prevData
          .filter((r: any) => r.logged_at === lastDate)
          .forEach((row: any) => {
            prev[row.exercise_name] = row.sets_completed as SetLog[];
          });
        setPreviousLogs(prev);
      } else {
        setPreviousLogs({});
      }
    };
    loadLogs();
  }, [selectedDay, userId, todayStr]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          toast("⏰ ¡Descanso terminado!", { duration: 3000 });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer !== null]);

  const updateSet = (exerciseName: string, setIndex: number, field: keyof SetLog, value: any) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exerciseName] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseName]: sets };
    });
  };

  const toggleSetDone = (exerciseName: string, setIndex: number, restSeconds?: number) => {
    const wasDone = exerciseLogs[exerciseName]?.[setIndex]?.done;
    updateSet(exerciseName, setIndex, "done", !wasDone);

    // Start rest timer when marking set as done
    if (!wasDone && restSeconds) {
      setRestTarget(restSeconds);
      setRestTimer(restSeconds);
    }
  };

  const parseRestSeconds = (rest: string): number => {
    const match = rest.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  };

  const saveWorkout = async () => {
    setSaving(true);
    try {
      await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", userId)
        .eq("day_label", selectedDay)
        .eq("logged_at", todayStr);

      const rows = Object.entries(exerciseLogs).map(([name, sets]) => ({
        user_id: userId,
        day_label: selectedDay,
        exercise_name: name,
        sets_completed: JSON.parse(JSON.stringify(sets)),
        logged_at: todayStr,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("workout_logs").insert(rows);
        if (error) throw error;
      }

      // Also mark day as completed if all sets done
      const allDone = Object.values(exerciseLogs).flat().every((s) => s.done);
      if (allDone) {
        await supabase.from("day_completions").upsert({
          user_id: userId,
          day_label: selectedDay,
          completed_at: todayStr,
        });
      }

      toast.success("¡Entrenamiento guardado! 💪");
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  };

  const completedSets = Object.values(exerciseLogs).flat().filter((s) => s.done).length;
  const totalSets = Object.values(exerciseLogs).flat().length;
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Day selector pills */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {DAYS_ORDER.map((day) => {
          const plan = dayPlans.find((p) => p.day === day);
          const isSelected = day === selectedDay;
          const isToday = day === DAYS_ORDER[todayIndex];
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 min-w-[48px] ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : plan
                  ? "bg-card border border-border hover:border-primary/30"
                  : "bg-card/30 border border-border/30 opacity-40"
              } ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}`}
            >
              <span className="font-bold">{day.slice(0, 3)}</span>
              {plan && (
                <span className="text-[10px] mt-0.5 opacity-80">
                  {plan.type === "gimnasio" ? "🏋️" : "🏃"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rest day */}
      {!currentPlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-10 border border-border text-center"
        >
          <div className="text-4xl mb-3">😴</div>
          <h3 className="font-display font-bold text-lg mb-1">Día de descanso</h3>
          <p className="text-sm text-muted-foreground">Recupera y vuelve más fuerte mañana</p>
        </motion.div>
      )}

      {/* Activity day */}
      {currentPlan?.type === "actividad" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="font-bold font-display text-lg mb-3">{currentPlan.sport}</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-primary" />{currentPlan.intensity}
            </span>
            <span className="text-sm bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />{currentPlan.duration}
            </span>
          </div>
        </motion.div>
      )}

      {/* Gym day */}
      {currentPlan?.type === "gimnasio" && (
        <div className="space-y-3">
          {/* Header with routine name + progress */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-display font-bold text-base">
                  {currentPlan.routine_name || selectedDay}
                </h3>
                {currentPlan.muscle_focus && (
                  <p className="text-xs text-muted-foreground">{currentPlan.muscle_focus}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-display text-gradient">
                  {completedSets}/{totalSets}
                </span>
                <p className="text-[10px] text-muted-foreground">series</p>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden mt-3">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Rest timer floating */}
          <AnimatePresence>
            {restTimer !== null && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">Descanso</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold font-mono text-primary">
                    {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => setRestTimer(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise list */}
          {(currentPlan.exercises || []).map((ex, i) => {
            const isExpanded = expandedExercise === i;
            const sets = exerciseLogs[ex.name] || [];
            const doneSets = sets.filter((s) => s.done).length;
            const allDone = doneSets === sets.length && sets.length > 0;
            const prevSets = previousLogs[ex.name];
            const restSec = parseRestSeconds(ex.rest);

            return (
              <motion.div
                key={`${selectedDay}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-card rounded-xl border overflow-hidden transition-colors ${
                  allDone ? "border-primary/40" : "border-border"
                }`}
              >
                {/* Exercise header */}
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/20 transition-colors"
                >
                  {/* Exercise image or icon */}
                  {ex.image_url ? (
                    <img
                      src={ex.image_url}
                      alt={ex.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      allDone ? "bg-primary/20" : "bg-secondary"
                    }`}>
                      <Dumbbell className={`w-4 h-4 ${allDone ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-medium text-sm ${allDone ? "text-primary" : ""}`}>
                      {ex.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {ex.series} series × {ex.reps} reps · {ex.rest} descanso
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      allDone
                        ? "bg-primary/20 text-primary"
                        : doneSets > 0
                        ? "bg-secondary text-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {doneSets}/{sets.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded set tracking */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1.5">
                        {/* Previous session hint */}
                        {prevSets && prevSets.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2 px-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Última sesión: {prevSets.map((s) => `${s.weight || "—"}×${s.reps}`).join(", ")}</span>
                          </div>
                        )}

                        {/* Column headers */}
                        <div className="grid grid-cols-[36px_1fr_1fr_44px] gap-2 text-[10px] text-muted-foreground font-semibold uppercase px-1 pb-1">
                          <span>Serie</span>
                          <span>Peso (kg)</span>
                          <span>Reps</span>
                          <span className="text-center">✓</span>
                        </div>

                        {sets.map((set, si) => (
                          <div
                            key={si}
                            className={`grid grid-cols-[36px_1fr_1fr_44px] gap-2 items-center p-2 rounded-lg transition-all ${
                              set.done
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-secondary/30"
                            }`}
                          >
                            {/* Set number */}
                            <span className={`text-xs font-bold text-center ${
                              set.done ? "text-primary" : "text-muted-foreground"
                            }`}>
                              {si + 1}
                            </span>

                            {/* Weight input */}
                            <input
                              type="text"
                              inputMode="decimal"
                              value={set.weight}
                              onChange={(e) => updateSet(ex.name, si, "weight", e.target.value)}
                              placeholder={prevSets?.[si]?.weight || "kg"}
                              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            />

                            {/* Reps input */}
                            <input
                              type="text"
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) updateSet(ex.name, si, "reps", val);
                              }}
                              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            />

                            {/* Done toggle */}
                            <button
                              onClick={() => toggleSetDone(ex.name, si, restSec)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto ${
                                set.done
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                              }`}
                            >
                              <Check className="w-5 h-5" />
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
          <div className="pt-3 pb-4">
            <Button
              onClick={saveWorkout}
              disabled={saving || completedSets === 0}
              className="w-full h-12 text-base font-bold"
              variant={progressPercent === 100 ? "hero" : "default"}
              size="lg"
            >
              {saving
                ? "Guardando..."
                : progressPercent === 100
                ? "✅ Completar entrenamiento"
                : `Guardar progreso (${completedSets}/${totalSets})`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTracker;
