import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const STEPS = ["Datos Físicos", "Objetivo", "Deportes", "Disponibilidad", "Nutrición", "Alergias"];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    age: "",
    height: "",
    weight: "",
    goal: "lose_weight",
    sports: "",
    availability: { days: "", hours: "" },
    nutrition_preferences: "",
    allergies: "",
  });

  const update = (field: string, value: string) => setData((d) => ({ ...d, [field]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("onboarding").upsert({
      user_id: user.id,
      age: parseInt(data.age) || null,
      height: parseFloat(data.height) || null,
      weight: parseFloat(data.weight) || null,
      goal: data.goal,
      sports: data.sports,
      availability: data.availability,
      nutrition_preferences: data.nutrition_preferences,
      allergies: data.allergies,
    });

    if (!error) {
      await supabase.from("profiles").update({ plan_status: "plan_pending" }).eq("user_id", user.id);
      toast.success("¡Cuestionario enviado! Tu plan se está preparando.");
      navigate("/dashboard");
    } else {
      toast.error("Algo salió mal. Por favor, inténtalo de nuevo.");
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return data.age && data.height && data.weight;
    if (step === 1) return data.goal;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-bold text-gradient">FitPlan Pro</span>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Cuéntanos Sobre Ti</h1>
          <p className="text-muted-foreground text-sm">Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Barra de progreso */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border card-shadow">
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

          {step === 1 && (
            <RadioGroup value={data.goal} onValueChange={(v) => update("goal", v)} className="space-y-3">
              {[
                { value: "lose_weight", label: "Perder Peso" },
                { value: "gain_muscle", label: "Ganar Músculo" },
                { value: "improve_endurance", label: "Mejorar Resistencia" },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${data.goal === opt.value ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value={opt.value} />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          )}

          {step === 2 && (
            <div>
              <Label>¿Qué deportes practicas?</Label>
              <Textarea value={data.sports} onChange={(e) => update("sports", e.target.value)} placeholder="Running, musculación, natación..." className="mt-1.5" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Días por semana disponibles</Label>
                <Input type="number" min={1} max={7} value={data.availability.days} onChange={(e) => setData((d) => ({ ...d, availability: { ...d.availability, days: e.target.value } }))} placeholder="4" className="mt-1.5" />
              </div>
              <div>
                <Label>Horas por sesión</Label>
                <Input type="number" step="0.5" value={data.availability.hours} onChange={(e) => setData((d) => ({ ...d, availability: { ...d.availability, hours: e.target.value } }))} placeholder="1.5" className="mt-1.5" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <Label>Preferencias nutricionales</Label>
              <Textarea value={data.nutrition_preferences} onChange={(e) => update("nutrition_preferences", e.target.value)} placeholder="Vegetariano, alta en proteínas, mediterránea..." className="mt-1.5" />
            </div>
          )}

          {step === 5 && (
            <div>
              <Label>Alergias o intolerancias alimentarias</Label>
              <Textarea value={data.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="Lactosa, gluten, frutos secos..." className="mt-1.5" />
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
                <Check className="w-4 h-4 mr-1" /> {loading ? "Enviando..." : "Enviar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
