import { Zap, ClipboardList, Dumbbell, Apple, Shield, TrendingUp, CheckCircle2, Star, ShieldCheck, ChevronDown, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";
import PricingTiers from "@/components/PricingTiers";
import type { TierKey } from "@/config/tiers";
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
    a: "Ofrecemos garantía de satisfacción. Si no estás contento con tu plan, te devolvemos el dinero sin preguntas en los primeros 7 días.",
  },
  {
    q: "¿Es para principiantes?",
    a: "¡Sí! Adaptamos el plan a tu nivel, ya seas principiante total o deportista avanzado. El cuestionario nos ayuda a calibrarlo.",
  },
  {
    q: "¿Puedo cambiar mis datos después?",
    a: "Por supuesto. Desde tu panel de usuario puedes actualizar tus datos personales, objetivos y preferencias en cualquier momento.",
  },
  {
    q: "¿Incluye seguimiento o soporte?",
    a: "Tu plan incluye toda la planificación semanal. Si necesitas ajustes, puedes contactarnos y los revisaremos sin coste adicional.",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
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
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Personalizado para tus objetivos</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6"
          >
            Tu Plan Personalizado de{" "}
            <span className="text-gradient">Entrenamiento</span> y{" "}
            <span className="text-gradient">Nutrición</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            Obtén un plan a medida diseñado según tus objetivos, horarios y preferencias. Creado por expertos, hecho para ti.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button variant="hero" size="xl" onClick={() => navigate("/signup?tier=pro")} className="hover-scale">
              Prueba Gratis 7 Días
            </Button>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 7 días gratis · Cancela cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
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
                  {stat.isDecimal ? (
                    <span>4.8/5</span>
                  ) : (
                    <CountUp end={stat.end} suffix={stat.suffix} />
                  )}
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
            <h2 className="text-3xl font-bold font-display text-center mb-14">Cómo Funciona</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Regístrate y Paga", desc: "Crea tu cuenta y desbloquea tu plan personalizado por €29." },
              { step: "02", title: "Cuéntanos Sobre Ti", desc: "Completa un breve cuestionario sobre tus objetivos, cuerpo y preferencias." },
              { step: "03", title: "Recibe Tu Plan", desc: "Recibe tu plan de entrenamiento y nutrición personalizado creado por nuestro equipo." },
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
            <h2 className="text-3xl font-bold font-display text-center mb-14">Qué Incluye</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            <ScrollReveal direction="left">
              <div className="bg-card rounded-2xl p-8 card-shadow border border-border h-full">
                <Dumbbell className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold font-display mb-3">Plan de Entrenamiento</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Planificación semanal de entrenamientos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Sesiones específicas por deporte</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Rutinas de gimnasio con series, reps y pesos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Intensidad y duración por día</li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-card rounded-2xl p-8 card-shadow border border-border h-full">
                <Apple className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold font-display mb-3">Plan de Nutrición</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Macros diarios personalizados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Ideas de comidas ejemplo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Adaptado a alergias y preferencias</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> Guía nutricional personalizada</li>
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
            <h2 className="text-3xl font-bold font-display text-center mb-4">Lo Que Dicen Nuestros Usuarios</h2>
            <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">Resultados reales de personas como tú</p>
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

      {/* Beneficios */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display text-center mb-14">¿Por Qué FitPlan Pro?</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Creado por Expertos", desc: "Planes diseñados por profesionales certificados con años de experiencia." },
              { icon: TrendingUp, title: "Orientado a Objetivos", desc: "Construido en torno a tus metas de fitness específicas." },
              { icon: ClipboardList, title: "Fácil de Seguir", desc: "Planes claros, estructurados, día a día. Sin complicaciones." },
              { icon: Users, title: "500+ Usuarios", desc: "Una comunidad creciente de personas que ya transformaron su cuerpo." },
              { icon: Award, title: "Resultados Garantizados", desc: "7 días de garantía. Si no te convence, te devolvemos el dinero." },
              { icon: Zap, title: "Rápido y Personal", desc: "Tu plan listo en menos de 48h, 100% adaptado a ti." },
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

      {/* Precio */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold font-display mb-4">Elige Tu Plan</h2>
            <p className="text-muted-foreground mb-12">7 días gratis en todos los planes. Sin permanencia. Cancela cuando quieras.</p>
          </ScrollReveal>
          <PricingTiers onSelectTier={(tier: TierKey) => navigate(`/signup?tier=${tier}`)} />
          <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Pago seguro con Stripe · Prueba gratis 7 días
          </p>
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
              ¿Listo para transformar tu cuerpo?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Únete a más de 500 personas que ya tienen su plan personalizado. Tu mejor versión te espera.
            </p>
            <Button variant="hero" size="xl" onClick={() => navigate("/signup?tier=pro")} className="hover-scale">
              Prueba Gratis 7 Días
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <span className="font-display font-bold text-gradient">FitPlan Pro</span> &copy; {new Date().getFullYear()}. Todos los derechos reservados.
        </div>
      </footer>

      {/* Floating CTA on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-50 md:hidden">
        <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/signup?tier=pro")}>
          Prueba Gratis 7 Días
        </Button>
      </div>
    </div>
  );
};

export default Index;
