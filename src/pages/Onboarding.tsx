import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

const STEPS = ["Datos Físicos", "Sexo", "Objetivo", "Deportes", "Intensidad", "Lesiones", "Disponibilidad", "Nutrición", "Resumen"];

const GOALS = [
  { value: "lose_weight", label: "Perder grasa", emoji: "🔥" },
  { value: "gain_muscle", label: "Ganar músculo", emoji: "💪" },
  { value: "recomp", label: "Recomposición", emoji: "⚡" },
  { value: "improve_endurance", label: "Mejorar resistencia", emoji: "🏃" },
  { value: "general_health", label: "Salud general", emoji: "❤️" },
];

const SPORTS = [
  { value: "gimnasio", label: "Gimnasio", emoji: "🏋️" },
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "natacion", label: "Natación", emoji: "🏊" },
  { value: "calistenia", label: "Calistenia", emoji: "🤸" },
  { value: "boxeo", label: "Boxeo", emoji: "🥊" },
  { value: "escalada", label: "Escalada", emoji: "🧗" },
  { value: "ciclismo", label: "Ciclismo", emoji: "🚴" },
  { value: "yoga", label: "Yoga", emoji: "🧘" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    age: "",
    height: "",
    weight: "",
    sex: "",
    goal: "",
    sports: [] as string[],
    intensity_level: 5,
    injuries: "",
    availability: { days: "", hours: "" },
    nutrition_preferences: "",
    allergies: "",
  });

  const update = (field: string, value: any) => setData((d) => ({ ...d, [field]: value }));

  const toggleSport = (sport: string) => {
    setData((d) => ({
      ...d,
      sports: d.sports.includes(sport)
        ? d.sports.filter((s) => s !== sport)
        : [...d.sports, sport],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("onboarding").upsert({
      user_id: user.id,
      age: parseInt(data.age) || null,
      height: parseFloat(data.height) || null,
      weight: parseFloat(data.weight) || null,
      sex: data.sex || null,
      goal: data.goal,
      sports: data.sports.join(", "),
      intensity_level: data.intensity_level,
      injuries: data.injuries || null,
      availability: data.availability,
      nutrition_preferences: data.nutrition_preferences,
      allergies: data.allergies,
    }, { onConflict: "user_id" });

    if (!error) {
      await supabase.from("profiles").update({ plan_status: "plan_pending" }).eq("user_id", user.id);

      // Check if user already paid (free plan or already subscribed)
      const { data: profile } = await supabase.from("profiles").select("payment_status").eq("user_id", user.id).single();

      if (profile?.payment_status === "paid") {
        // Already paid (free plan) → generate plan and go to dashboard
        supabase.functions.invoke("generate-plan", { body: { user_id: user.id } });
        toast.success("¡Tu plan se está preparando! 🎉");
        navigate("/dashboard");
      } else {
        // Not paid yet → redirect to Stripe
        const { data: settings } = await supabase.from("settings").select("payment_mode, payment_link_test, payment_link_live").limit(1).single();
        const paymentLink = (settings as any)?.payment_mode === "live"
          ? (settings as any)?.payment_link_live
          : (settings as any)?.payment_link_test;

        if (paymentLink) {
          const userEmail = user.email || "";
          const separator = paymentLink.includes("?") ? "&" : "?";
          toast.success("¡Cuestionario completado! Redirigiendo al pago...");
          window.location.href = `${paymentLink}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
        } else {
          toast.success("¡Cuestionario enviado!");
          navigate("/dashboard");
        }
      }
    } else {
      toast.error("Algo salió mal. Por favor, inténtalo de nuevo.");
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return data.age && data.height && data.weight;
    if (step === 1) return data.sex;
    if (step === 2) return data.goal;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-bold text-gradient">Autopilot</span>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Cuéntanos Sobre Ti</h1>
          <p className="text-muted-foreground text-sm">Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border card-shadow">
          {/* Step 0: Physical data */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Edad</Label>
                <Input type="number" value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="25" className="mt-1.5" />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input type="number" value={data.height} onChange={(e) => update("height", e.target.value)} placeholder="175" className="mt-1.5" />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" value={data.weight} onChange={(e) => update("weight", e.target.value)} placeholder="70" className="mt-1.5" />
              </div>
            </div>
          )}

          {/* Step 1: Sex */}
          {step === 1 && (
            <div>
              <Label className="mb-3 block">Sexo biológico</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "male", label: "Hombre", emoji: "♂️" },
                  { value: "female", label: "Mujer", emoji: "♀️" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("sex", opt.value)}
                    className={`p-5 rounded-xl border-2 text-center transition-all ${
                      data.sex === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="font-medium text-sm">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div>
              <Label className="mb-3 block">¿Cuál es tu objetivo principal?</Label>
              <div className="grid grid-cols-1 gap-2">
                {GOALS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("goal", opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      data.goal === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Sports - chips */}
          {step === 3 && (
            <div>
              <Label className="mb-3 block">¿Qué deportes practicas o te interesan?</Label>
              <p className="text-xs text-muted-foreground mb-4">Selecciona todos los que quieras</p>
              <div className="grid grid-cols-2 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSport(s.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all text-sm ${
                      data.sports.includes(s.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Intensity */}
          {step === 4 && (
            <div>
              <Label className="mb-3 block">¿Qué nivel de intensidad buscas?</Label>
              <p className="text-xs text-muted-foreground mb-6">1 = suave y progresivo · 10 = máxima intensidad</p>
              <div className="px-2">
                <Slider
                  value={[data.intensity_level]}
                  onValueChange={([v]) => update("intensity_level", v)}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                  <span>Suave</span>
                  <span className="text-2xl font-bold font-display text-primary">{data.intensity_level}</span>
                  <span>Intenso</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Injuries */}
          {step === 5 && (
            <div>
              <Label className="mb-1.5 block">¿Tienes lesiones, molestias o condiciones físicas?</Label>
              <p className="text-xs text-muted-foreground mb-3">Déjalo vacío si no tienes ninguna</p>
              <Textarea
                value={data.injuries}
                onChange={(e) => update("injuries", e.target.value)}
                placeholder="Ej: Dolor lumbar, tendinitis hombro derecho, escoliosis..."
                rows={3}
              />
            </div>
          )}

          {/* Step 6: Availability */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <Label>Días por semana disponibles</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={data.availability.days}
                  onChange={(e) => setData((d) => ({ ...d, availability: { ...d.availability, days: e.target.value } }))}
                  placeholder="4"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Horas por sesión</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={data.availability.hours}
                  onChange={(e) => setData((d) => ({ ...d, availability: { ...d.availability, hours: e.target.value } }))}
                  placeholder="1.5"
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {/* Step 7: Nutrition */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <Label>Preferencias nutricionales</Label>
                <Textarea
                  value={data.nutrition_preferences}
                  onChange={(e) => update("nutrition_preferences", e.target.value)}
                  placeholder="Vegetariano, alta en proteínas, mediterránea..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>
              <div>
                <Label>Alergias o intolerancias</Label>
                <Textarea
                  value={data.allergies}
                  onChange={(e) => update("allergies", e.target.value)}
                  placeholder="Lactosa, gluten, frutos secos..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="default" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={loading}>
                <Sparkles className="w-4 h-4 mr-1" /> {loading ? "Enviando..." : "Crear mi plan"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
