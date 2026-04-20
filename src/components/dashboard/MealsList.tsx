import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface Meal {
  name: string;
  description: string;
}

interface Props {
  meals: Meal[];
}

const todayKey = () => {
  const d = new Date();
  return `meals_done_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const MealsList = ({ meals }: Props) => {
  const [done, setDone] = useState<Set<string>>(new Set());

  // Cargar progreso de hoy desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey());
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const persist = (next: Set<string>) => {
    setDone(next);
    try {
      localStorage.setItem(todayKey(), JSON.stringify(Array.from(next)));
    } catch { /* ignore */ }
  };

  const toggle = (name: string) => {
    const next = new Set(done);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    persist(next);
  };

  return (
    <div className="space-y-3">
      {meals.map((meal, i) => {
        const isDone = done.has(meal.name);
        return (
          <div
            key={i}
            onDoubleClick={() => toggle(meal.name)}
            className={`border-b border-border pb-3 last:border-0 last:pb-0 cursor-pointer select-none transition-opacity ${
              isDone ? "opacity-50" : "opacity-100"
            }`}
            title="Doble click para marcar/desmarcar"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isDone ? "bg-primary border-primary" : "border-border"
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <div className={`font-medium ${isDone ? "line-through" : ""}`}>{meal.name}</div>
            </div>
            <div className={`text-sm text-muted-foreground mt-1 ${isDone ? "line-through" : ""}`}>
              {meal.description}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealsList;