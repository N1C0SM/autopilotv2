import { Zap, ClipboardList, Dumbbell, Apple, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">FitPlan Pro</span>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Iniciar sesión</Button>
            <Button variant="default" size="sm" onClick={() => navigate("/signup")}>Empezar</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Personalizado para tus objetivos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Tu Plan Personalizado de Entrenamiento y Nutrición
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Obtén un plan de entrenamiento y nutrición a medida, diseñado según tus objetivos, horarios y preferencias. Creado por expertos, hecho para ti.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate("/signup")}>
            Crear Mi Plan
          </Button>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">Cómo Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Regístrate y Paga", desc: "Crea tu cuenta y desbloquea tu plan personalizado por €29." },
              { step: "02", title: "Cuéntanos Sobre Ti", desc: "Completa un breve cuestionario sobre tus objetivos, cuerpo y preferencias." },
              { step: "03", title: "Recibe Tu Plan", desc: "Recibe tu plan de entrenamiento y nutrición personalizado creado por nuestro equipo." },
            ].map((item) => (
              <div key={item.step} className="bg-card rounded-2xl p-6 card-shadow border border-border">
                <span className="text-4xl font-bold font-display text-gradient">{item.step}</span>
                <h3 className="text-lg font-semibold font-display mt-4 mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qué Incluye */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">Qué Incluye</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 card-shadow border border-border">
              <Dumbbell className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold font-display mb-3">Plan de Entrenamiento</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Planificación semanal de entrenamientos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sesiones específicas por deporte</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Intensidad y duración por día</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 card-shadow border border-border">
              <Apple className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold font-display mb-3">Plan de Nutrición</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Macros diarios personalizados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Ideas de comidas ejemplo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Adaptado a alergias y preferencias</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">¿Por Qué FitPlan Pro?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Creado por Expertos", desc: "Planes diseñados por profesionales certificados." },
              { icon: TrendingUp, title: "Orientado a Objetivos", desc: "Construido en torno a tus metas de fitness." },
              { icon: ClipboardList, title: "Fácil de Seguir", desc: "Planes claros, estructurados, día a día." },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-2xl p-6 border border-border">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold font-display mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Precio Simple</h2>
          <p className="text-muted-foreground mb-10">Un solo pago. Tu plan personalizado completo.</p>
          <div className="bg-card rounded-3xl p-10 border-2 border-primary card-shadow animate-pulse-glow">
            <div className="text-5xl font-bold font-display text-gradient mb-2">€29</div>
            <p className="text-muted-foreground mb-6">Pago único</p>
            <ul className="text-left space-y-3 mb-8 text-sm">
              {["Plan de entrenamiento personalizado", "Plan de nutrición personalizado", "Macros a medida", "Comidas adaptadas a alergias", "Planificación semanal de entrenamientos"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="hero" size="xl" className="w-full" onClick={() => navigate("/signup")}>
              Crear Mi Plan
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <span className="font-display font-bold text-gradient">FitPlan Pro</span> &copy; {new Date().getFullYear()}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
