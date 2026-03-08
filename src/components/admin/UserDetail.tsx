import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import type { Profile } from "@/pages/Dashboard";
import type { Json } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";
import type { DayPlan } from "@/types/training";
import ExerciseLibrary from "./ExerciseLibrary";
import TrainingPlanForm from "./TrainingPlanForm";

interface OnboardingData {
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  sports: string | null;
  availability: Json | null;
  nutrition_preferences: string | null;
  allergies: string | null;
}

interface Props {
  profile: Profile;
  onBack: () => void;
  onUpdate: (userId: string, updates: Partial<Profile>) => void;
}

const UserDetail = ({ profile, onBack, onUpdate }: Props) => {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [macros, setMacros] = useState({ protein: "", carbs: "", fats: "" });
  const [mealsText, setMealsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: onb }, { data: roleData }, { data: tp }, { data: np }] = await Promise.all([
        supabase.from("onboarding").select("*").eq("user_id", profile.user_id).single(),
        supabase.from("user_roles").select("role").eq("user_id", profile.user_id).eq("role", "admin").maybeSingle(),
        supabase.from("training_plan").select("workouts_json").eq("user_id", profile.user_id).single(),
        supabase.from("nutrition_plan").select("macros_json, meals_json").eq("user_id", profile.user_id).single(),
      ]);
      setOnboarding(onb as OnboardingData | null);
      setIsUserAdmin(!!roleData);

      // Load existing training plan
      if (tp?.workouts_json) {
        const existing = tp.workouts_json as unknown as DayPlan[];
        if (Array.isArray(existing) && existing.length > 0) {
          setDayPlans(existing);
        }
      }

      // Load existing nutrition plan
      if (np?.macros_json) {
        const m = np.macros_json as any;
        setMacros({ protein: m.protein?.toString() || "", carbs: m.carbs?.toString() || "", fats: m.fats?.toString() || "" });
      }
      if (np?.meals_json) {
        const meals = np.meals_json as any[];
        if (Array.isArray(meals)) {
          setMealsText(meals.map((m: any) => `${m.name}: ${m.description}`).join("\n"));
        }
      }
    };
    fetchData();
  }, [profile.user_id]);

  const toggleAdminRole = async () => {
    setRoleLoading(true);
    if (isUserAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", profile.user_id).eq("role", "admin");
      if (!error) { setIsUserAdmin(false); toast.success("Rol de admin eliminado"); }
      else toast.error("Error al cambiar rol");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "admin" as Database["public"]["Enums"]["app_role"] });
      if (!error) { setIsUserAdmin(true); toast.success("Rol de admin asignado"); }
      else toast.error("Error al cambiar rol");
    }
    setRoleLoading(false);
  };

  const savePlans = async () => {
    setSaving(true);
    const meals = mealsText.split("\n").filter(Boolean).map((line) => {
      const [name, ...rest] = line.split(":");
      return { name: name?.trim() || "", description: rest.join(":").trim() || "" };
    });

    const { error: tpError } = await supabase.from("training_plan").upsert({
      user_id: profile.user_id,
      workouts_json: dayPlans as unknown as Json,
    });

    const { error: npError } = await supabase.from("nutrition_plan").upsert({
      user_id: profile.user_id,
      macros_json: { protein: parseInt(macros.protein) || 0, carbs: parseInt(macros.carbs) || 0, fats: parseInt(macros.fats) || 0 } as unknown as Json,
      meals_json: meals as unknown as Json,
    });

    if (!tpError && !npError) {
      await supabase.from("profiles").update({ plan_status: "plan_ready" }).eq("user_id", profile.user_id);
      toast.success("¡Planes guardados!");
      onUpdate(profile.user_id, { plan_status: "plan_ready" });
    } else {
      toast.error("Error al guardar los planes.");
    }
    setSaving(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Volver a usuarios
      </Button>

      <h1 className="text-2xl font-bold font-display mb-2">{profile.email}</h1>
      <div className="flex gap-2 mb-6">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile.payment_status === "paid" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
          {profile.payment_status}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile.plan_status === "plan_ready" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
          {profile.plan_status}
        </span>
      </div>

      {/* Rol de admin */}
      <div className="bg-card rounded-xl p-5 border border-border flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium text-sm">Rol de Administrador</div>
            <div className="text-xs text-muted-foreground">
              {isUserAdmin ? "Este usuario es admin" : "Este usuario es usuario normal"}
            </div>
          </div>
        </div>
        <Switch checked={isUserAdmin} onCheckedChange={toggleAdminRole} disabled={roleLoading} />
      </div>

      {/* Respuestas onboarding */}
      {onboarding && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="font-bold font-display mb-4">Respuestas del Onboarding</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Edad:</span> {onboarding.age}</div>
            <div><span className="text-muted-foreground">Altura:</span> {onboarding.height} cm</div>
            <div><span className="text-muted-foreground">Peso:</span> {onboarding.weight} kg</div>
            <div><span className="text-muted-foreground">Objetivo:</span> {onboarding.goal}</div>
            <div><span className="text-muted-foreground">Deportes:</span> {onboarding.sports}</div>
            <div><span className="text-muted-foreground">Disponibilidad:</span> {JSON.stringify(onboarding.availability)}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Nutrición:</span> {onboarding.nutrition_preferences}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Alergias:</span> {onboarding.allergies}</div>
          </div>
        </div>
      )}

      {/* Biblioteca de ejercicios */}
      <div className="mt-6">
        <ExerciseLibrary />
      </div>

      {/* Plan de entrenamiento */}
      <TrainingPlanForm
        dayPlans={dayPlans}
        onChange={setDayPlans}
        userSports={onboarding?.sports}
      />

      {/* Plan de nutrición */}
      <div className="bg-card rounded-xl p-6 border border-border mt-6">
        <h2 className="font-bold font-display mb-4">Crear Plan de Nutrición</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><Label className="text-xs">Proteína (g)</Label><Input type="number" value={macros.protein} onChange={(e) => setMacros((m) => ({ ...m, protein: e.target.value }))} /></div>
          <div><Label className="text-xs">Carbos (g)</Label><Input type="number" value={macros.carbs} onChange={(e) => setMacros((m) => ({ ...m, carbs: e.target.value }))} /></div>
          <div><Label className="text-xs">Grasas (g)</Label><Input type="number" value={macros.fats} onChange={(e) => setMacros((m) => ({ ...m, fats: e.target.value }))} /></div>
        </div>
        <div>
          <Label className="text-xs">Comidas (una por línea, formato: Nombre: Descripción)</Label>
          <Textarea value={mealsText} onChange={(e) => setMealsText(e.target.value)} placeholder="Desayuno: Avena con frutos rojos y batido de proteínas&#10;Almuerzo: Pollo a la plancha con arroz y verduras" rows={5} className="mt-1" />
        </div>
      </div>

      <Button variant="hero" size="lg" className="mt-6" onClick={savePlans} disabled={saving}>
        <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Guardar Planes y Notificar"}
      </Button>
    </>
  );
};

export default UserDetail;
