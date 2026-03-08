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
  const [workouts, setWorkouts] = useState([{ day: "Monday", sport: "", intensity: "", duration: "" }]);
  const [macros, setMacros] = useState({ protein: "", carbs: "", fats: "" });
  const [mealsText, setMealsText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("onboarding").select("*").eq("user_id", profile.user_id).single();
      setOnboarding(data as OnboardingData | null);
    };
    fetch();
  }, [profile.user_id]);

  const addWorkoutRow = () => setWorkouts((w) => [...w, { day: "", sport: "", intensity: "", duration: "" }]);
  const updateWorkout = (i: number, field: string, value: string) => {
    setWorkouts((w) => w.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };
  const removeWorkout = (i: number) => setWorkouts((w) => w.filter((_, idx) => idx !== i));

  const savePlans = async () => {
    setSaving(true);
    const meals = mealsText.split("\n").filter(Boolean).map((line) => {
      const [name, ...rest] = line.split(":");
      return { name: name?.trim() || "", description: rest.join(":").trim() || "" };
    });

    const { error: tpError } = await supabase.from("training_plan").upsert({
      user_id: profile.user_id,
      workouts_json: workouts as unknown as Json,
    });

    const { error: npError } = await supabase.from("nutrition_plan").upsert({
      user_id: profile.user_id,
      macros_json: { protein: parseInt(macros.protein) || 0, carbs: parseInt(macros.carbs) || 0, fats: parseInt(macros.fats) || 0 } as unknown as Json,
      meals_json: meals as unknown as Json,
    });

    if (!tpError && !npError) {
      await supabase.from("profiles").update({ plan_status: "plan_ready" }).eq("user_id", profile.user_id);
      toast.success("Plans saved!");
      onUpdate(profile.user_id, { plan_status: "plan_ready" });
    } else {
      toast.error("Failed to save plans.");
    }
    setSaving(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to users
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

      {onboarding && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="font-bold font-display mb-4">Onboarding Answers</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Age:</span> {onboarding.age}</div>
            <div><span className="text-muted-foreground">Height:</span> {onboarding.height} cm</div>
            <div><span className="text-muted-foreground">Weight:</span> {onboarding.weight} kg</div>
            <div><span className="text-muted-foreground">Goal:</span> {onboarding.goal}</div>
            <div><span className="text-muted-foreground">Sports:</span> {onboarding.sports}</div>
            <div><span className="text-muted-foreground">Availability:</span> {JSON.stringify(onboarding.availability)}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Nutrition:</span> {onboarding.nutrition_preferences}</div>
            <div className="sm:col-span-2"><span className="text-muted-foreground">Allergies:</span> {onboarding.allergies}</div>
          </div>
        </div>
      )}

      {/* Training Plan Form */}
      <div className="bg-card rounded-xl p-6 border border-border mt-6">
        <h2 className="font-bold font-display mb-4">Create Training Plan</h2>
        <div className="space-y-3">
          {workouts.map((w, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-end">
              <div><Label className="text-xs">Day</Label><Input value={w.day} onChange={(e) => updateWorkout(i, "day", e.target.value)} placeholder="Monday" /></div>
              <div><Label className="text-xs">Sport</Label><Input value={w.sport} onChange={(e) => updateWorkout(i, "sport", e.target.value)} placeholder="Running" /></div>
              <div><Label className="text-xs">Intensity</Label><Input value={w.intensity} onChange={(e) => updateWorkout(i, "intensity", e.target.value)} placeholder="High" /></div>
              <div><Label className="text-xs">Duration</Label><Input value={w.duration} onChange={(e) => updateWorkout(i, "duration", e.target.value)} placeholder="45min" /></div>
              <Button variant="ghost" size="sm" onClick={() => removeWorkout(i)} className="text-destructive">✕</Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addWorkoutRow} className="mt-3">+ Add Day</Button>
      </div>

      {/* Nutrition Plan Form */}
      <div className="bg-card rounded-xl p-6 border border-border mt-6">
        <h2 className="font-bold font-display mb-4">Create Nutrition Plan</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><Label className="text-xs">Protein (g)</Label><Input type="number" value={macros.protein} onChange={(e) => setMacros((m) => ({ ...m, protein: e.target.value }))} /></div>
          <div><Label className="text-xs">Carbs (g)</Label><Input type="number" value={macros.carbs} onChange={(e) => setMacros((m) => ({ ...m, carbs: e.target.value }))} /></div>
          <div><Label className="text-xs">Fats (g)</Label><Input type="number" value={macros.fats} onChange={(e) => setMacros((m) => ({ ...m, fats: e.target.value }))} /></div>
        </div>
        <div>
          <Label className="text-xs">Meals (one per line, format: Name: Description)</Label>
          <Textarea value={mealsText} onChange={(e) => setMealsText(e.target.value)} placeholder="Breakfast: Oatmeal with berries and protein shake\nLunch: Grilled chicken with rice and vegetables" rows={5} className="mt-1" />
        </div>
      </div>

      <Button variant="hero" size="lg" className="mt-6" onClick={savePlans} disabled={saving}>
        <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Plans & Notify User"}
      </Button>
    </>
  );
};

export default UserDetail;
