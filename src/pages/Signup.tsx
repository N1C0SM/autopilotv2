import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
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

    // Save name and referral
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const updates: any = {};
      if (name.trim()) updates.name = name.trim();
      if (referralCode) updates.referred_by = referralCode;
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("user_id", user.id);
      }
    }

    // Free plan: mark as paid directly
    if (isFree) {
      if (user) {
        await supabase.from("profiles").update({
          payment_status: "paid",
          subscription_tier: "personal",
          subscription_status: "active",
        }).eq("user_id", user.id);
      }
      toast.success("¡Cuenta creada! Plan gratuito activado 🎉");
    } else {
      toast.success("¡Cuenta creada! Cuéntanos sobre ti.");
    }

    // Always go to onboarding first
    window.location.href = "/onboarding";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-gradient">Autopilot</Link>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-sm">
            {isFree ? "Acceso completo por invitación" : "Empieza tu transformación hoy"}
          </p>
        </div>

        {referralCode && !isFree && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-sm text-primary font-medium">🎁 ¡Invitación aplicada!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border card-shadow space-y-5">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Tu nombre" />
          </div>
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
            ) : (
              "Crear cuenta"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
