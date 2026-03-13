import { motion } from "framer-motion";
import { Dumbbell, Apple, MessageCircle, ArrowRight, Flame, Clock } from "lucide-react";
import type { DayPlan } from "@/types/training";
import type { UserSection } from "@/components/UserSidebar";

interface Macros {
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  name: string;
  description: string;
}

interface Props {
  dayPlans: DayPlan[];
  macros: Macros | null;
  meals: Meal[];
  onNavigate: (s: UserSection) => void;
}

const DAYS_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const HomeOverview = ({ dayPlans, macros, meals, onNavigate }: Props) => {
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const todayName = DAYS_ORDER[todayIndex];
  const todayPlan = dayPlans.find((p) => p.day === todayName);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Today's Training Card */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => onNavigate("training")}
        className="bg-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-all duration-200 text-left group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="font-display font-bold text-sm mb-1">Entrenamiento de hoy</h3>
        {todayPlan ? (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground font-medium">
              {todayPlan.type === "gimnasio" ? todayPlan.routine_name || "Gimnasio" : todayPlan.sport}
            </p>
            {todayPlan.type === "gimnasio" && todayPlan.exercises && (
              <p className="text-xs text-muted-foreground">
                {todayPlan.exercises.length} ejercicios
              </p>
            )}
            {todayPlan.type === "actividad" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="w-3 h-3" />{todayPlan.intensity}
                <Clock className="w-3 h-3 ml-1" />{todayPlan.duration}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Día de descanso 😴</p>
        )}
      </motion.button>

      {/* Nutrition Card */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => onNavigate("nutrition")}
        className="bg-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-all duration-200 text-left group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Apple className="w-5 h-5 text-primary" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="font-display font-bold text-sm mb-1">Tu Nutrición</h3>
        {macros ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{macros.protein}g prot</span>
              <span className="bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{macros.carbs}g carbs</span>
              <span className="bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{macros.fats}g grasas</span>
            </div>
            <p className="text-xs text-muted-foreground">{meals.length} comidas planificadas</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin plan de nutrición aún</p>
        )}
      </motion.button>

      {/* Chat Card */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => onNavigate("chat")}
        className="bg-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-all duration-200 text-left group cursor-pointer sm:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="font-display font-bold text-sm mb-1">Chat con tu entrenador</h3>
        <p className="text-sm text-muted-foreground">Pregunta dudas, pide cambios en tu plan o cuenta cómo te sientes.</p>
      </motion.button>

      {/* Weekly Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl p-5 border border-border sm:col-span-2 lg:col-span-3"
      >
        <h3 className="font-display font-bold text-sm mb-3">Resumen semanal</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_ORDER.map((day) => {
            const plan = dayPlans.find((p) => p.day === day);
            const isToday = day === todayName;
            return (
              <div
                key={day}
                className={`text-center p-2 rounded-xl transition-colors ${
                  isToday ? "ring-2 ring-primary/40 bg-primary/5" : ""
                } ${plan ? "bg-secondary/50" : "opacity-40"}`}
              >
                <div className="text-[10px] font-medium text-muted-foreground uppercase">{day.slice(0, 3)}</div>
                <div className="text-xs mt-1 font-medium truncate">
                  {plan?.type === "gimnasio" ? "🏋️" : plan?.type === "actividad" ? "🏃" : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default HomeOverview;
