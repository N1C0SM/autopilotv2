import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Gift } from "lucide-react";
import { TIER } from "@/config/tiers";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const referralCode = searchParams.get("ref") || "";
  const isFree = searchParams.get("free") === "true";
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      toast.success("¡Cuenta creada! Por favor verifica tu email y luego inicia sesión.");
      setLoading(false);
      return;
    }

    if (referralCode) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ referred_by: referralCode }).eq("user_id", user.id);
      }
    }

    // Free plan: skip Stripe, mark as paid directly
    if (isFree) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          payment_status: "paid",
          subscription_tier: "personal",
          subscription_status: "active",
        }).eq("user_id", user.id);
      }
      toast.success("¡Cuenta creada! Plan gratuito activado 🎉");
      window.location.href = "/onboarding";
      return;
    }

    // Paid plan: redirect to Stripe checkout
    const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
      body: { tier: "personal", referral_code: referralCode },
    });
    if (checkoutError || !data?.url) {
      toast.error("Error al iniciar el pago. Ve a tu panel para completarlo.");
      window.location.href = "/dashboard";
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-gradient">Autopilot</Link>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Crea tu cuenta</h1>
          {isFree ? (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mt-4">
              <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" /> Plan gratuito por invitación
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acceso completo sin pago</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Plan <span className="text-primary font-semibold">{TIER.name}</span> — €{TIER.price}/mes
              <span className="block text-xs mt-1">7 días gratis · Cancela cuando quieras</span>
            </p>
          )}
        </div>

        {referralCode && !isFree && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-sm text-primary font-medium">🎁 ¡20% de descuento aplicado por invitación!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border card-shadow space-y-5">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" placeholder="tu@ejemplo.com" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>

          <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
            ) : isFree ? (
              "Crear cuenta gratuita"
            ) : (
              `Empezar 7 días gratis — €${TIER.price}/mes`
            )}
          </Button>
          {!isFree && (
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> No se cobra hasta que termine la prueba gratuita
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
