import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Users, ArrowLeft, Save, Loader2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Profile {
  user_id: string;
  email: string;
  plan_status: string;
  created_at: string;
}

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

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);

  // Training plan form
  const [workouts, setWorkouts] = useState([
    { day: "Monday", sport: "", intensity: "", duration: "" },
  ]);

  // Nutrition plan form
  const [macros, setMacros] = useState({ protein: "", carbs: "", fats: "" });
  const [mealsText, setMealsText] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) {
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (profiles) setUsers(profiles);
      setLoading(false);
    };
    checkAdmin();
  }, [user, navigate]);

  const selectUser = async (profile: Profile) => {
    setSelectedUser(profile);
    const { data } = await supabase.from("onboarding").select("*").eq("user_id", profile.user_id).single();
    setOnboarding(data as OnboardingData | null);
  };

  const addWorkoutRow = () => setWorkouts((w) => [...w, { day: "", sport: "", intensity: "", duration: "" }]);

  const updateWorkout = (i: number, field: string, value: string) => {
    setWorkouts((w) => w.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const removeWorkout = (i: number) => setWorkouts((w) => w.filter((_, idx) => idx !== i));

  const savePlans = async () => {
    if (!selectedUser) return;
    setSaving(true);

    const meals = mealsText.split("\n").filter(Boolean).map((line) => {
      const [name, ...rest] = line.split(":");
      return { name: name?.trim() || "", description: rest.join(":").trim() || "" };
    });

    const { error: tpError } = await supabase.from("training_plan").upsert({
      user_id: selectedUser.user_id,
      workouts_json: workouts as unknown as Json,
    });

    const { error: npError } = await supabase.from("nutrition_plan").upsert({
      user_id: selectedUser.user_id,
      macros_json: {
        protein: parseInt(macros.protein) || 0,
        carbs: parseInt(macros.carbs) || 0,
        fats: parseInt(macros.fats) || 0,
      } as unknown as Json,
      meals_json: meals as unknown as Json,
    });

    if (!tpError && !npError) {
      await supabase.from("profiles").update({ plan_status: "plan_ready" }).eq("user_id", selectedUser.user_id);
      toast.success("Plans saved and user notified!");
      setUsers((u) => u.map((p) => p.user_id === selectedUser.user_id ? { ...p, plan_status: "plan_ready" } : p));
      setSelectedUser((p) => p ? { ...p, plan_status: "plan_ready" } : p);
    } else {
      toast.error("Failed to save plans.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">FitPlan Pro Admin</span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {!selectedUser ? (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold font-display">All Users</h1>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.user_id} className="bg-card rounded-xl p-5 border border-border flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors" onClick={() => selectUser(u)}>
                  <div>
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${u.plan_status === "plan_ready" ? "bg-primary/20 text-primary" : u.plan_status === "plan_pending" ? "bg-secondary text-muted-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {u.plan_status}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to users
            </Button>

            <h1 className="text-2xl font-bold font-display mb-2">{selectedUser.email}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedUser.plan_status === "plan_ready" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {selectedUser.plan_status}
            </span>

            {/* Onboarding Answers */}
            {onboarding && (
              <div className="bg-card rounded-xl p-6 border border-border mt-6">
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
                    <div>
                      <Label className="text-xs">Day</Label>
                      <Input value={w.day} onChange={(e) => updateWorkout(i, "day", e.target.value)} placeholder="Monday" />
                    </div>
                    <div>
                      <Label className="text-xs">Sport</Label>
                      <Input value={w.sport} onChange={(e) => updateWorkout(i, "sport", e.target.value)} placeholder="Running" />
                    </div>
                    <div>
                      <Label className="text-xs">Intensity</Label>
                      <Input value={w.intensity} onChange={(e) => updateWorkout(i, "intensity", e.target.value)} placeholder="High" />
                    </div>
                    <div>
                      <Label className="text-xs">Duration</Label>
                      <Input value={w.duration} onChange={(e) => updateWorkout(i, "duration", e.target.value)} placeholder="45min" />
                    </div>
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
                <div>
                  <Label className="text-xs">Protein (g)</Label>
                  <Input type="number" value={macros.protein} onChange={(e) => setMacros((m) => ({ ...m, protein: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input type="number" value={macros.carbs} onChange={(e) => setMacros((m) => ({ ...m, carbs: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Fats (g)</Label>
                  <Input type="number" value={macros.fats} onChange={(e) => setMacros((m) => ({ ...m, fats: e.target.value }))} />
                </div>
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
        )}
      </div>
    </div>
  );
};

export default Admin;
