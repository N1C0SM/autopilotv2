import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { DayPlan } from "@/types/training";

interface Props {
  userId: string;
  dayPlans: DayPlan[];
}

const DAYS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const WeeklyProgress = ({ userId, dayPlans }: Props) => {
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get current week's Monday
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(new Date());
  const weekDates: Record<string, string> = {};
  DAYS_ORDER.forEach((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates[day] = d.toISOString().split("T")[0];
  });

  useEffect(() => {
    const fetchCompletions = async () => {
      const weekStart = weekDates["Lunes"];
      const weekEnd = weekDates["Domingo"];

      const [{ data: completions }, { data: allCompletions }] = await Promise.all([
        supabase
          .from("day_completions")
          .select("day_label, completed_at")
          .eq("user_id", userId)
          .gte("completed_at", weekStart)
          .lte("completed_at", weekEnd),
        supabase
          .from("day_completions")
          .select("completed_at")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(30),
      ]);

      if (completions) {
        const set = new Set<string>();
        completions.forEach((c: any) => set.add(c.day_label));
        setCompletedDays(set);
      }

      // Calculate streak
      if (allCompletions && allCompletions.length > 0) {
        const uniqueDates = [...new Set(allCompletions.map((c: any) => c.completed_at))].sort().reverse();
        let count = 0;
        const checkDate = new Date();

        for (const dateStr of uniqueDates) {
          const expected = checkDate.toISOString().split("T")[0];
          if (dateStr === expected) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Check if yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            const altExpected = checkDate.toISOString().split("T")[0];
            if (dateStr === altExpected && count === 0) {
              count++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
        setStreak(count);
      }

      setLoading(false);
    };

    fetchCompletions();
  }, [userId]);

  const toggleDay = async (dayLabel: string) => {
    const dateForDay = weekDates[dayLabel];
    if (!dateForDay) return;

    if (completedDays.has(dayLabel)) {
      // Remove
      await supabase
        .from("day_completions")
        .delete()
        .eq("user_id", userId)
        .eq("day_label", dayLabel)
        .eq("completed_at", dateForDay);

      setCompletedDays((prev) => {
        const next = new Set(prev);
        next.delete(dayLabel);
        return next;
      });
    } else {
      // Add
      const { error } = await supabase.from("day_completions").insert({
        user_id: userId,
        day_label: dayLabel,
        completed_at: dateForDay,
      });

      if (!error) {
        setCompletedDays((prev) => new Set(prev).add(dayLabel));
        toast.success(`¡${dayLabel} completado! 💪`);
      }
    }
  };

  const planDays = dayPlans.map((p) => p.day);
  const completedCount = planDays.filter((d) => completedDays.has(d)).length;
  const totalDays = planDays.length;
  const progressPct = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;

  if (loading) return null;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border card-shadow mb-8">
      {/* Header with streak */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold font-display text-lg">Tu Semana</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalDays} días completados
          </p>
        </div>
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2"
          >
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{streak} días de racha</span>
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-secondary rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Day circles */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_ORDER.map((day) => {
          const hasPlan = planDays.includes(day);
          const isCompleted = completedDays.has(day);
          const isToday = weekDates[day] === todayStr;

          return (
            <button
              key={day}
              onClick={() => hasPlan && toggleDay(day)}
              disabled={!hasPlan}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${
                hasPlan ? "cursor-pointer hover:bg-secondary/50" : "opacity-30 cursor-default"
              } ${isToday ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                {day.slice(0, 3)}
              </span>
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unchecked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Circle className={`w-8 h-8 ${hasPlan ? "text-muted-foreground/40" : "text-muted-foreground/20"}`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Celebration */}
      {completedCount === totalDays && totalDays > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center bg-primary/10 rounded-xl p-4 border border-primary/20"
        >
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-bold font-display text-primary">¡Semana completada! 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">Increíble trabajo, ¡sigue así!</p>
        </motion.div>
      )}
    </div>
  );
};

export default WeeklyProgress;
