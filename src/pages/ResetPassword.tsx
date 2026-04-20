import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const errorDescription =
        url.searchParams.get("error_description") ||
        new URLSearchParams(hash.replace(/^#/, "")).get("error_description");

      if (errorDescription) {
        if (mounted) {
          setErrorMsg(decodeURIComponent(errorDescription).replace(/\+/g, " "));
          setChecking(false);
        }
        return;
      }

      // Modern PKCE flow: ?code=...
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (mounted) {
          if (error) {
            setErrorMsg("El enlace ha caducado o ya se ha usado. Solicita uno nuevo.");
          } else {
            setIsRecovery(true);
            // clean URL
            window.history.replaceState({}, document.title, "/reset-password");
          }
          setChecking(false);
        }
        return;
      }

      // Legacy implicit flow: #access_token=...&type=recovery
      if (hash.includes("type=recovery") || search.includes("type=recovery")) {
        if (mounted) {
          setIsRecovery(true);
          setChecking(false);
        }
        return;
      }

      // Fallback: check active session (some providers redirect already authed)
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        if (data.session) setIsRecovery(true);
        setChecking(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Contraseña actualizada correctamente");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground mb-2">{errorMsg || "Enlace inválido o expirado."}</p>
          <p className="text-xs text-muted-foreground mb-4">Pide un nuevo enlace de recuperación.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/forgot-password" className="text-primary hover:underline">Solicitar nuevo enlace</Link>
            <Link to="/login" className="text-muted-foreground hover:underline">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold font-display">¡Contraseña actualizada!</h1>
          <Link to="/login">
            <Button variant="hero" size="lg">Iniciar sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-gradient">Autopilot</Link>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Nueva contraseña</h1>
          <p className="text-muted-foreground text-sm">Establece tu nueva contraseña</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border card-shadow space-y-5">
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1.5" placeholder="Repite la contraseña" minLength={6} />
          </div>
          <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Actualizando...</> : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
