import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Dumbbell, Apple, Clock, Flame, Loader2, Crown, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Json } from "@/integrations/supabase/types";
import UserList from "@/components/admin/UserList";
import UserDetail from "@/components/admin/UserDetail";
import PaymentModeToggle from "@/components/admin/PaymentModeToggle";
import AdminStats from "@/components/admin/AdminStats";
import type { DayPlan } from "@/types/training";
import WeeklyProgress from "@/components/WeeklyProgress";
import ProgressCharts from "@/components/ProgressCharts";
import Chat from "@/components/Chat";
import MobileNav from "@/components/MobileNav";
import Achievements from "@/components/Achievements";
import Greeting from "@/components/Greeting";
import ReferralShare from "@/components/ReferralShare";
import type { TierKey } from "@/config/tiers";

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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const LockedFeature = ({ title, description, onUpgrade }: { title: string; description: string; onUpgrade: () => void }) => (
  <div className="bg-card rounded-2xl p-6 border border-border card-shadow relative overflow-hidden">
    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
      <Lock className="w-6 h-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
      <Button variant="hero" size="sm" onClick={onUpgrade}>Mejorar Plan</Button>
    </div>
    <div className="opacity-30">
      <h3 className="font-bold font-display mb-2">{title}</h3>
      <div className="h-24 bg-secondary/30 rounded-lg" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [planStatus, setPlanStatus] = useState<string>("onboarding");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [subscriptionTier, setSubscriptionTier] = useState<TierKey>("basic");
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  // Refs for scroll-to-section
  const trainingRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Admin state
  const [adminUsers, setAdminUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (roleData) {
        setIsAdmin(true);
        const [{ data: profiles }, { data: myProfile }] = await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("profiles").select("name, avatar_url").eq("user_id", user.id).single(),
        ]);
        if (profiles) setAdminUsers(profiles as unknown as Profile[]);
        if (myProfile) {
          setProfileName(myProfile.name || "");
          setProfileAvatar(myProfile.avatar_url || "");
        }
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_status, payment_status, name, avatar_url, subscription_tier")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setPlanStatus(profile.plan_status);
        setPaymentStatus(profile.payment_status);
        setProfileName((profile as any).name || "");
        setProfileAvatar((profile as any).avatar_url || "");
        setSubscriptionTier(((profile as any).subscription_tier as TierKey) || "basic");

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

  const handleNavigateSection = (section: string) => {
    setActiveSection(section);
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      training: trainingRef,
      progress: progressRef,
      chat: chatRef,
    };
    if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      refMap[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCompletePayment = async () => {
    const nextTier = subscriptionTier === "basic" ? "pro" : "vip";
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: { tier: nextTier } });
    if (error || !data?.url) {
      toast.error("Error al iniciar el pago. Inténtalo de nuevo.");
      return;
    }
    window.location.href = data.url;
  };

  const handleManageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) {
      toast.error("Error al abrir el portal de suscripción.");
      return;
    }
    window.open(data.url, "_blank");
  };

  const updateUserInList = (userId: string, updates: Partial<Profile>) => {
    setAdminUsers((u) => u.map((p) => p.user_id === userId ? { ...p, ...updates } : p));
    setSelectedUser((p) => p?.user_id === userId ? { ...p, ...updates } : p);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  // ─── Admin View ───
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <span className="font-display text-xl font-bold text-gradient">Autopilot Admin</span>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/settings")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {profileName && <span className="text-sm font-medium hidden sm:inline">{profileName}</span>}
              </button>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <AdminStats users={adminUsers} />
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">Autopilot</span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/settings")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              {profileName && <span className="text-sm font-medium hidden sm:inline">{profileName}</span>}
            </button>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {paymentStatus === "unpaid" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-2xl p-10 border border-border card-shadow text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Suscríbete a Autopilot</h2>
            <p className="text-muted-foreground mb-6">Accede a tu plan personalizado de entrenamiento y nutrición, chat con tu entrenador, gráficos de progreso y más.</p>
            <Button variant="hero" size="lg" onClick={handleCompletePayment}>
              Suscribirme — €19/mes
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Cancela cuando quieras. Sin permanencia.</p>
          </motion.div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_pending" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-10 border border-border card-shadow text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Tu plan personalizado se está creando.</h2>
            <p className="text-muted-foreground">Nuestro equipo está trabajando en tu plan. ¡Te notificaremos cuando esté listo!</p>
          </motion.div>
        )}

        {paymentStatus === "paid" && planStatus === "plan_ready" && (
          <div className="space-y-8">
            {/* Greeting */}
            <Greeting name={profileName} />

            {/* Tier badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                subscriptionTier === "vip" ? "bg-primary/20 text-primary" :
                subscriptionTier === "pro" ? "bg-primary/10 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>
                Plan {subscriptionTier.toUpperCase()}
              </span>
              {subscriptionTier !== "vip" && (
                <button
                  onClick={handleCompletePayment}
                  className="text-xs text-primary hover:underline"
                >
                  Mejorar plan →
                </button>
              )}
            </div>

            {/* Weekly Progress */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              {user && <WeeklyProgress userId={user.id} dayPlans={dayPlans} />}
            </motion.div>

            {/* Achievements - Pro & VIP */}
            {(subscriptionTier === "pro" || subscriptionTier === "vip") ? (
              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                {user && <Achievements userId={user.id} />}
              </motion.div>
            ) : (
              <LockedFeature
                title="Logros y Gamificación"
                description="Desbloquea badges, rachas y más con el plan Pro."
                onUpgrade={handleCompletePayment}
              />
            )}

            {/* Training Plan */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" ref={trainingRef}>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Plan de Entrenamiento</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {dayPlans.map((plan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="bg-card rounded-xl border border-border hover:border-primary/30 transition-all duration-200 overflow-hidden group"
                  >
                    {/* Day header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${plan.type === "gimnasio" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {plan.day.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{plan.day}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {plan.type === "gimnasio" ? "🏋️ Gimnasio" : "🏃 Actividad"}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {(plan.type === "actividad" || !plan.type) && (
                        <div>
                          <div className="font-semibold text-sm mb-2">{plan.sport || (plan as any).sport}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-secondary/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Flame className="w-3 h-3 text-primary" />{plan.intensity || (plan as any).intensity}
                            </span>
                            <span className="text-xs bg-secondary/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" />{plan.duration || (plan as any).duration}
                            </span>
                          </div>
                        </div>
                      )}

                      {plan.type === "gimnasio" && (
                        <div>
                          {plan.routine_name && (
                            <div className="font-semibold text-sm mb-3">{plan.routine_name}</div>
                          )}
                          <div className="space-y-1.5">
                            {(plan.exercises || []).map((ex, j) => (
                              <div key={j} className="flex items-center gap-3 text-xs bg-secondary/30 rounded-lg px-3 py-2">
                                <span className="font-medium flex-1 truncate">{ex.name}</span>
                                <span className="text-muted-foreground font-mono">{ex.series}×{ex.reps}</span>
                                {ex.weight && <span className="text-muted-foreground font-mono">{ex.weight}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Nutrition Plan */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
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
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      whileHover={{ scale: 1.03 }}
                      className="bg-card rounded-xl p-5 border border-border text-center hover:border-primary/30 transition-colors duration-200"
                    >
                      <div className="text-2xl font-bold font-display text-gradient">{m.value}</div>
                      <div className="text-sm text-muted-foreground">{m.label}</div>
                    </motion.div>
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
            </motion.div>

            {/* Progress Charts - Pro & VIP */}
            {(subscriptionTier === "pro" || subscriptionTier === "vip") ? (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" ref={progressRef}>
                {user && <ProgressCharts userId={user.id} />}
              </motion.div>
            ) : (
              <div ref={progressRef}>
                <LockedFeature
                  title="Gráficos de Progreso"
                  description="Visualiza tu evolución de peso y medidas con el plan Pro."
                  onUpgrade={handleCompletePayment}
                />
              </div>
            )}

            {/* Chat - Pro & VIP */}
            {(subscriptionTier === "pro" || subscriptionTier === "vip") ? (
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" ref={chatRef}>
                {user && <Chat conversationUserId={user.id} />}
              </motion.div>
            ) : (
              <div ref={chatRef}>
                <LockedFeature
                  title="Chat con Entrenador"
                  description="Habla directamente con tu entrenador con el plan Pro."
                  onUpgrade={handleCompletePayment}
                />
              </div>
            )}

            {/* Referral Share */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
              <ReferralShare />
            </motion.div>

            {/* Manage subscription */}
            <div className="text-center pt-4">
              <Button variant="ghost" size="sm" onClick={handleManageSubscription} className="text-muted-foreground">
                Gestionar suscripción
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {paymentStatus === "paid" && planStatus === "plan_ready" && (
        <MobileNav activeSection={activeSection} onNavigateSection={handleNavigateSection} />
      )}
    </div>
  );
};

export default Dashboard;
