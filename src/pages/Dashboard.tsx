import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Dumbbell, Apple, Clock, Flame, Loader2, CreditCard, Users } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import UserList from "@/components/admin/UserList";
import UserDetail from "@/components/admin/UserDetail";
import PaymentModeToggle from "@/components/admin/PaymentModeToggle";
import type { DayPlan } from "@/types/training";

export interface Profile {
  user_id: string;
  email: string;
  plan_status: string;
  payment_status: string;
  created_at: string;
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
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [adminUsers, setAdminUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (roleData) {
        setIsAdmin(true);
        const { data: profiles } = await supabase.from("profiles").select("*");
        if (profiles) setAdminUsers(profiles as unknown as Profile[]);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_status, payment_status")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setPlanStatus(profile.plan_status);
        setPaymentStatus(profile.payment_status);

        if (profile.payment_status === "unpaid") { setLoading(false); return; }
        if (profile.plan_status === "onboarding") { navigate("/onboarding"); return; }

        if (profile.plan_status === "plan_ready") {
          const { data: tp } = await supabase.from("training_plan").select("workouts_json").eq("user_id", user.id).single();
          const { data: np } = await supabase.from("nutrition_plan").select("macros_json, meals_json").eq("user_id", user.id).single();

          if (tp) setDayPlans(tp.workouts_json as unknown as DayPlan[]);
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
              <LogOut className="w-4 h-4 mr-1" /> Cerrar sesión
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
            <LogOut className="w-4 h-4 mr-1" /> Cerrar sesión
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-bold font-display mb-8">Tu Panel</h1>

        {paymentStatus === "unpaid" && (
          <div className="bg-card rounded-2xl p-10 border border-border card-shadow text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Completa tu pago</h2>
            <p className="text-muted-foreground mb-6">Necesitas completar el pago de €29 para acceder a tu plan personalizado de entrenamiento y nutrición.</p>
            <Button variant="hero" size="lg" onClick={handleCompletePayment}>
              Completar Pago — €29
            </Button>
          </div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_pending" && (
          <div className="bg-card rounded-2xl p-10 border border-border card-shadow text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Tu plan personalizado se está creando.</h2>
            <p className="text-muted-foreground">Nuestro equipo está trabajando en tu plan. ¡Te notificaremos cuando esté listo!</p>
          </div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_ready" && (
          <div className="space-y-8">
            {/* Training Plan */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Plan de Entrenamiento</h2>
              </div>
              <div className="space-y-4">
                {dayPlans.map((plan, i) => (
                  <div key={i} className="bg-card rounded-xl p-5 border border-border">
                    <div className="text-sm text-primary font-bold font-display mb-2">{plan.day}</div>

                    {plan.type === "actividad" && (
                      <div>
                        <div className="font-semibold mb-1">{plan.sport}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{plan.intensity}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.duration}</span>
                        </div>
                      </div>
                    )}

                    {plan.type === "gimnasio" && (
                      <div>
                        {plan.routine_name && (
                          <div className="font-semibold mb-3">{plan.routine_name}</div>
                        )}
                        <div className="space-y-2">
                          {(plan.exercises || []).map((ex, j) => (
                            <div key={j} className="flex items-center gap-4 text-sm bg-secondary/30 rounded-lg px-3 py-2">
                              <span className="font-medium flex-1">{ex.name}</span>
                              <span className="text-muted-foreground">{ex.series}×{ex.reps}</span>
                              {ex.weight && <span className="text-muted-foreground">{ex.weight}</span>}
                              {ex.rest && <span className="text-xs text-muted-foreground">⏱ {ex.rest}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback for old format */}
                    {!plan.type && (
                      <div>
                        <div className="font-semibold mb-1">{(plan as any).sport}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{(plan as any).intensity}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{(plan as any).duration}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Plan */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Apple className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Plan de Nutrición</h2>
              </div>

              {macros && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Proteína", value: `${macros.protein}g` },
                    { label: "Carbos", value: `${macros.carbs}g` },
                    { label: "Grasas", value: `${macros.fats}g` },
                  ].map((m) => (
                    <div key={m.label} className="bg-card rounded-xl p-5 border border-border text-center">
                      <div className="text-2xl font-bold font-display text-gradient">{m.value}</div>
                      <div className="text-sm text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold font-display mb-3">Comidas</h3>
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
