import { motion } from "framer-motion";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div
      className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col"
      style={{
        paddingTop: "var(--safe-top, 0px)",
        paddingBottom: "var(--safe-bottom, 0px)",
      }}
    >
      <Helmet>
        <title>Autopilot</title>
      </Helmet>

      {/* Halo de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-10%] h-[70%]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, hsl(var(--primary) / 0.25), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-20%] h-[60%]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 70%, hsl(var(--primary) / 0.12), transparent 70%)",
        }}
      />

      {/* Contenido scroll-safe */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-10">
        <motion.div {...fade(0)} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base tracking-tight">
            Autopilot
          </span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <motion.h1
            {...fade(0.08)}
            className="font-display font-bold tracking-tight text-[clamp(2.25rem,9vw,3.25rem)] leading-[1.05]"
          >
            Tu entrenador y nutricionista,
            <br />
            <span className="text-gradient">en automático.</span>
          </motion.h1>

          <motion.p
            {...fade(0.18)}
            className="mt-5 text-base text-muted-foreground leading-relaxed"
          >
            Plan de entrenamiento y nutrición personalizado, ajustado cada semana
            por ti. <span className="text-foreground/90">7 días gratis</span>.
          </motion.p>
        </div>
      </div>

      {/* CTA sticky abajo */}
      <motion.div
        {...fade(0.28)}
        className="relative z-10 px-6 pb-4 pt-4 space-y-3"
      >
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
        >
          Crear cuenta
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full h-14 rounded-2xl border border-border bg-card/60 backdrop-blur text-foreground font-medium active:scale-[0.98] transition-transform"
        >
          Ya tengo cuenta
        </button>
        <p className="text-[11px] text-muted-foreground text-center pt-1 px-4 leading-relaxed">
          Al continuar aceptas nuestros{" "}
          <Link to="/legal/terminos" className="underline underline-offset-2">
            términos
          </Link>{" "}
          y{" "}
          <Link to="/legal/privacidad" className="underline underline-offset-2">
            privacidad
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;