import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Apple, Clock, Loader2, Crown, Camera } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { DayPlan } from "@/types/training";
import WeeklyProgress from "@/components/WeeklyProgress";
import Chat from "@/components/Chat";
import Greeting from "@/components/Greeting";
import HomeOverview from "@/components/dashboard/HomeOverview";
import TrainingPlanView from "@/components/dashboard/TrainingPlanView";
import ProgressPhotos from "@/components/dashboard/ProgressPhotos";
import UserSidebar from "@/components/UserSidebar";
import type { UserSection } from "@/components/UserSidebar";
import SettingsPanel from "@/components/SettingsPanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [planStatus, setPlanStatus] = useState<string>("onboarding");
  const [paymentStatus, setPaymentStatus] = useState<string>("unpaid");
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<UserSection>("home");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Sync subscription status with Stripe
      supabase.functions.invoke("check-subscription").catch(() => {});

      const { data: roleData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (roleData) {
        navigate("/admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_status, payment_status, name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setPlanStatus(profile.plan_status);
        setPaymentStatus(profile.payment_status);
        setProfileName((profile as any).name || "");
        setProfileAvatar((profile as any).avatar_url || "");

        if (profile.payment_status === "unpaid") { setLoading(false); return; }
        if (profile.plan_status === "onboarding") { navigate("/onboarding"); return; }

        if (profile.plan_status === "plan_ready") {
          const [{ data: tp }, { data: np }] = await Promise.all([
            supabase.from("training_plan").select("workouts_json").eq("user_id", user.id).single(),
            supabase.from("nutrition_plan").select("macros_json, meals_json").eq("user_id", user.id).single(),
          ]);

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

  const handleCompletePayment = async () => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from("settings")
        .select("payment_mode, payment_link_test, payment_link_live")
        .limit(1)
        .single();

      if (settingsError || !settings) {
        toast.error("Error al obtener la configuración de pago.");
        return;
      }

      const paymentLink = settings.payment_mode === "live"
        ? settings.payment_link_live
        : settings.payment_link_test;

      if (!paymentLink) {
        toast.error("El enlace de pago no está configurado.");
        return;
      }

      const email = user?.email || "";
      const separator = paymentLink.includes("?") ? "&" : "?";
      window.location.href = `${paymentLink}${separator}prefilled_email=${encodeURIComponent(email)}`;
    } catch {
      toast.error("Error al iniciar el pago. Inténtalo de nuevo.");
    }
  };

  const handleManageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) {
      toast.error("Error al abrir el portal de suscripción.");
      return;
    }
    window.open(data.url, "_blank");
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  const hasPlan = paymentStatus === "paid" && planStatus === "plan_ready";

  const SECTION_LABELS: Record<UserSection, string> = {
    home: "Inicio",
    training: "Entrenamiento",
    nutrition: "Nutrición",
    progress: "Progreso",
    chat: "Chat",
    settings: "Ajustes",
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <UserSidebar
          section={section}
          onNavigate={setSection}
          onSignOut={handleSignOut}
          profileName={profileName}
          profileAvatar={profileAvatar}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 gap-3">
            <SidebarTrigger />
            <h1 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground flex-1">
              {SECTION_LABELS[section]}
            </h1>
            {user && <NotificationsBell userId={user.id} />}
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Unpaid state — shown on all sections EXCEPT settings */}
            {paymentStatus === "unpaid" && section !== "settings" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-card rounded-2xl p-10 border border-border card-shadow text-center max-w-2xl mx-auto"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-display mb-2">Obtén tu plan personalizado</h2>
                <p className="text-muted-foreground mb-6">Entrenamiento y nutrición 100% adaptados a ti. Chat con tu entrenador incluido.</p>
                <Button variant="hero" size="lg" onClick={handleCompletePayment}>
                  Empezar 7 días gratis — €19/mes
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Cancela cuando quieras. Sin permanencia.</p>
              </motion.div>
            )}

            {/* Plan pending */}
            {paymentStatus === "paid" && planStatus === "plan_pending" && section === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-10 border border-border card-shadow text-center max-w-2xl mx-auto"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-display mb-2">Tu plan se está creando 🔥</h2>
                <p className="text-muted-foreground mb-2">Nuestro equipo está trabajando en tu plan personalizado.</p>
                <p className="text-sm text-primary font-medium">Recibirás una notificación en menos de 48h.</p>
              </motion.div>
            )}

            {/* Home section */}
            {hasPlan && section === "home" && (
              <div className="space-y-8 max-w-4xl">
                <Greeting name={profileName} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {user && <WeeklyProgress userId={user.id} dayPlans={dayPlans} />}
                </motion.div>
                <HomeOverview
                  dayPlans={dayPlans}
                  macros={macros}
                  meals={meals}
                  onNavigate={setSection}
                />
              </div>
            )}

            {/* Training section — clean plan view */}
            {hasPlan && section === "training" && user && (
              <TrainingPlanView dayPlans={dayPlans} />
            )}

            {/* Progress photos */}
            {hasPlan && section === "progress" && user && (
              <ProgressPhotos userId={user.id} />
            )}

            {/* Nutrition section */}
            {hasPlan && section === "nutrition" && (
              <div className="max-w-4xl space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Apple className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold font-display">Plan de Nutrición</h2>
                </div>

                {macros && (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Proteína", value: `${macros.protein}g` },
                      { label: "Carbos", value: `${macros.carbs}g` },
                      { label: "Grasas", value: `${macros.fats}g` },
                    ].map((m) => (
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

                <div className="text-center pt-4">
                  <Button variant="ghost" size="sm" onClick={handleManageSubscription} className="text-muted-foreground">
                    Gestionar suscripción
                  </Button>
                </div>
              </div>
            )}

            {/* Chat section */}
            {hasPlan && section === "chat" && (
              <div className="max-w-3xl">
                {user && <Chat conversationUserId={user.id} />}
              </div>
            )}

            {/* Settings — always accessible */}
            {section === "settings" && (
              <div className="max-w-2xl">
                <SettingsPanel />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
