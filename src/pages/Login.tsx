import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let email = identifier.trim();

    if (!isEmail(email)) {
      const { data, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .ilike("name", email)
        .maybeSingle();

      if (lookupError || !data) {
        setLoading(false);
        toast.error("No se encontró ningún usuario con ese nombre");
        return;
      }
      email = data.email;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-gradient">Autopilot</Link>
          <h1 className="text-2xl font-bold font-display mt-6 mb-2">Bienvenido de vuelta</h1>
          <p className="text-muted-foreground text-sm">Inicia sesión para acceder a tu plan</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border card-shadow space-y-5">
          <div>
            <Label htmlFor="identifier">Nombre o correo electrónico</Label>
            <Input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="mt-1.5" placeholder="tu nombre o tu@ejemplo.com" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
          </div>
          <Button variant="hero" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link to="/signup" className="text-primary hover:underline">Regístrate</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
