import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Dumbbell, Apple, Clock, Flame, Loader2, CreditCard, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import UserList from "@/components/admin/UserList";
import UserDetail from "@/components/admin/UserDetail";
import PaymentModeToggle from "@/components/admin/PaymentModeToggle";

export interface Profile {
  user_id: string;
  email: string;
  plan_status: string;
  payment_status: string;
  created_at: string;
}

interface Workout {
  day: string;
  sport: string;
  intensity: string;
  duration: string;
}

interface Macros {
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  name: string;
  description: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [planStatus, setPlanStatus] = useState<string>("onboarding");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [adminUsers, setAdminUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Check if admin
      const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (roleData) {
        setIsAdmin(true);
        // Fetch all users for admin
        const { data: profiles } = await supabase.from("profiles").select("*");
        if (profiles) setAdminUsers(profiles as unknown as Profile[]);
        setLoading(false);
        return;
      }

      // Regular user flow
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_status, payment_status")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setPlanStatus(profile.plan_status);
        setPaymentStatus(profile.payment_status);

        if (profile.payment_status === "unpaid") {
          setLoading(false);
          return;
        }

        if (profile.plan_status === "onboarding") {
          navigate("/onboarding");
          return;
        }

        if (profile.plan_status === "plan_ready") {
          const { data: tp } = await supabase.from("training_plan").select("workouts_json").eq("user_id", user.id).single();
          const { data: np } = await supabase.from("nutrition_plan").select("macros_json, meals_json").eq("user_id", user.id).single();

          if (tp) setWorkouts(tp.workouts_json as unknown as Workout[]);
          if (np) {
            setMacros(np.macros_json as unknown as Macros);
            setMeals(np.meals_json as unknown as Meal[]);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  const handleCompletePayment = () => {
    const paymentLink = "https://buy.stripe.com/test_3cIbJ2gbzcumb0e8KP9IQ00";
    const userEmail = user?.email || "";
    window.location.href = `${paymentLink}?prefilled_email=${encodeURIComponent(userEmail)}`;
  };

  const updateUserInList = (userId: string, updates: Partial<Profile>) => {
    setAdminUsers((u) => u.map((p) => p.user_id === userId ? { ...p, ...updates } : p));
    setSelectedUser((p) => p?.user_id === userId ? { ...p, ...updates } : p);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ─── Admin View ───
  if (isAdmin) {
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
          <PaymentModeToggle />

          {!selectedUser ? (
            <UserList users={adminUsers} onSelectUser={setSelectedUser} />
          ) : (
            <UserDetail
              profile={selectedUser}
              onBack={() => setSelectedUser(null)}
              onUpdate={updateUserInList}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── User View ───
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">FitPlan Pro</span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold font-display mb-8">Your Dashboard</h1>

        {paymentStatus === "unpaid" && (
          <div className="bg-card rounded-2xl p-10 border border-border card-shadow text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Complete Your Payment</h2>
            <p className="text-muted-foreground mb-6">You need to complete your payment of €29 to access your personalized training and nutrition plan.</p>
            <Button variant="hero" size="lg" onClick={handleCompletePayment}>
              Complete Payment — €29
            </Button>
          </div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_pending" && (
          <div className="bg-card rounded-2xl p-10 border border-border card-shadow text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Your personalized plan is being created.</h2>
            <p className="text-muted-foreground">Our team is working on your custom training and nutrition plan. You'll be notified when it's ready!</p>
          </div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_ready" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Training Plan</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workouts.map((w, i) => (
                  <div key={i} className="bg-card rounded-xl p-5 border border-border">
                    <div className="text-sm text-primary font-bold font-display mb-1">{w.day}</div>
                    <div className="font-semibold mb-2">{w.sport}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{w.intensity}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{w.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Apple className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Nutrition Plan</h2>
              </div>

              {macros && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Protein", value: `${macros.protein}g` },
                    { label: "Carbs", value: `${macros.carbs}g` },
                    { label: "Fats", value: `${macros.fats}g` },
                  ].map((m) => (
                    <div key={m.label} className="bg-card rounded-xl p-5 border border-border text-center">
                      <div className="text-2xl font-bold font-display text-gradient">{m.value}</div>
                      <div className="text-sm text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold font-display mb-3">Example Meals</h3>
                <div className="space-y-3">
                  {meals.map((meal, i) => (
                    <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="font-medium">{meal.name}</div>
                      <div className="text-sm text-muted-foreground">{meal.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
