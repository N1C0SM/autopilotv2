import { Zap, ClipboardList, Dumbbell, Apple, Shield, TrendingUp, CheckCircle2, Star, ShieldCheck, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";
import PricingTiers from "@/components/PricingTiers";
import dashboardPreview from "@/assets/dashboard-preview.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const testimonials = [
  {
    name: "María García",
    result: "Perdió 8kg en 3 meses",
    text: "El plan se adaptó perfectamente a mi horario de trabajo. Nunca pensé que podría ser tan fácil seguir una rutina.",
    avatar: "MG",
    stars: 5,
  },
  {
    name: "Carlos Rodríguez",
    result: "Ganó 5kg de músculo",
    text: "Las rutinas de gimnasio son brutales pero muy bien estructuradas. Mi entrenador se sorprendió de los resultados.",
    avatar: "CR",
    stars: 5,
  },
  {
    name: "Laura Martínez",
    result: "Completó su primera maratón",
    text: "Combiné el plan con mi preparación de running. La nutrición marcó la diferencia en mi rendimiento.",
    avatar: "LM",
    stars: 5,
  },
];

const faqs = [
  {
    q: "¿Cuánto tarda en estar listo mi plan?",
    a: "Tu plan personalizado estará listo en un máximo de 48 horas tras completar el cuestionario. Normalmente lo tienes en menos de 24h.",
  },
  {
    q: "¿Y si no me gusta o no me funciona?",
    a: "Tienes 7 días de prueba gratis. Si no estás contento, cancelas y no se te cobra nada.",
  },
  {
    q: "¿Es para principiantes?",
    a: "¡Sí! Adaptamos el plan a tu nivel, ya seas principiante total o deportista avanzado. El cuestionario nos ayuda a calibrarlo.",
  },
  {
    q: "¿Puedo cambiar mis datos después?",
    a: "Por supuesto. Desde tu panel puedes actualizar tus datos y preferencias en cualquier momento.",
  },
  {
    q: "¿Incluye seguimiento o soporte?",
    a: "Sí, incluye chat directo con tu entrenador para dudas y ajustes de tu plan sin coste adicional.",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">Autopilot</span>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Iniciar sesión</Button>
            <Button variant="default" size="sm" onClick={() => navigate("/signup")}>Empezar gratis</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Recibe tu plan en menos de 24h</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6"
          >
            Deja de improvisar.{" "}
            <span className="text-gradient">Tu plan personalizado</span> te espera.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            Entrenamiento y nutrición 100% adaptados a ti. Creado por expertos, entregado en 48h. Por solo €19/mes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button variant="hero" size="xl" onClick={() => navigate("/signup")} className="hover-scale">
              Recibe tu plan personalizado
            </Button>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Solo tardas 2 minutos · 7 días gratis · Cancela cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-16 px-4 -mt-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="relative rounded-2xl overflow-hidden border border-border card-shadow"
            >
              <img
                src={dashboardPreview}
                alt="Vista previa del dashboard de Autopilot con plan de entrenamiento y nutrición"
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-sm font-medium text-muted-foreground">Tu panel personalizado con todo lo que necesitas</p>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-12 px-4 border-y border-border bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { end: 500, suffix: "+", label: "Planes creados" },
              { end: 4.8, suffix: "/5", label: "Valoración media", isDecimal: true },
              { end: 95, suffix: "%", label: "Clientes satisfechos" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="text-3xl sm:text-4xl font-bold font-display text-gradient">
                  {stat.isDecimal ? <span>4.8/5</span> : <CountUp end={stat.end} suffix={stat.suffix} />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-14">Así de fácil</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Regístrate", desc: "Crea tu cuenta en 30 segundos y empieza tu prueba gratuita de 7 días." },
              { step: "02", title: "Cuéntanos sobre ti", desc: "Completa un cuestionario rápido: objetivos, deportes, lesiones y preferencias." },
              { step: "03", title: "Recibe tu plan", desc: "En menos de 48h tienes tu plan de entrenamiento y nutrición 100% personalizado." },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.15}>
                <div className="bg-card rounded-2xl p-6 card-shadow border border-border hover-scale transition-all duration-300 h-full">
                  <span className="text-4xl font-bold font-display text-gradient">{item.step}</span>
                  <h3 className="text-lg font-semibold font-display mt-4 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Qué Incluye */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-14">Todo lo que necesitas</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal direction="left">
              <div className="bg-card rounded-2xl p-8 card-shadow border border-border h-full">
                <Dumbbell className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold font-display mb-3">Plan de Entrenamiento</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Rutinas semanales personalizadas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Adaptado a tus deportes y nivel</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Series, reps, pesos e intensidad</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Tiene en cuenta lesiones y condiciones</li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-card rounded-2xl p-8 card-shadow border border-border h-full">
                <Apple className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold font-display mb-3">Plan de Nutrición</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Macros diarios personalizados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Ideas de comidas según tu objetivo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Adaptado a alergias y preferencias</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Chat con tu entrenador incluido</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-4">Resultados reales</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">Personas como tú que ya tienen su plan personalizado</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.12}>
                <div className="bg-card rounded-2xl p-6 border border-border card-shadow h-full flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-primary font-medium">{t.result}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display mb-4">Un precio. Todo incluido.</h2>
            <p className="text-muted-foreground mb-12">Sin planes confusos. Sin letra pequeña. 7 días gratis para probarlo.</p>
          </ScrollReveal>
          <PricingTiers onSelect={() => navigate("/signup")} />
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-14">¿Por Qué Autopilot?</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Creado por Expertos", desc: "Planes diseñados por profesionales certificados." },
              { icon: TrendingUp, title: "100% Personalizado", desc: "Adaptado a tu cuerpo, objetivos y lesiones." },
              { icon: ClipboardList, title: "Fácil de Seguir", desc: "Planes claros, día a día. Sin complicaciones." },
              { icon: Users, title: "500+ Usuarios", desc: "Una comunidad creciente de personas transformando su cuerpo." },
              { icon: Award, title: "7 Días Gratis", desc: "Prueba sin riesgo. Si no te convence, no pagas nada." },
              { icon: Zap, title: "Listo en 48h", desc: "Tu plan personalizado entregado en menos de 2 días." },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.08}>
                <div className="bg-card rounded-2xl p-6 border border-border hover-scale transition-all duration-300 h-full">
                  <item.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-bold font-display mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-4">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground text-center mb-12">Resolvemos tus dudas</p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/40 transition-colors"
                >
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              ¿Listo para dejar de improvisar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Tu plan personalizado de entrenamiento y nutrición te espera. Empieza hoy gratis.
            </p>
            <Button variant="hero" size="xl" onClick={() => navigate("/signup")} className="hover-scale">
              Empieza gratis ahora
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <span className="font-display font-bold text-gradient">Autopilot</span> &copy; {new Date().getFullYear()}. Todos los derechos reservados.
        </div>
      </footer>

      {/* Floating CTA on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-50 md:hidden">
        <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/signup")}>
          Recibe tu plan — 2 minutos
        </Button>
      </div>
    </div>
  );
};

export default Index;
