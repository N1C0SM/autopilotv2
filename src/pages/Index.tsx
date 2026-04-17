import {
  MessageCircle,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Star,
  Dumbbell,
  Apple,
  HeartPulse,
  RefreshCw,
  TrendingUp,
  X,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const problems = [
  "No sé qué hacer cuando llego al gym",
  "Sigo dietas que no funcionan o no puedo mantener",
  "Los planes genéricos no se adaptan a mi vida",
  "Me falta constancia porque nadie me guía",
];

const testimonials = [
  {
    name: "María G.",
    result: "−8 kg en 3 meses",
    text: "Lo que marcó la diferencia fue poder escribir a mi entrenador cuando algo no iba. Ajustó la dieta dos veces hasta que encajó con mi trabajo.",
    avatar: "MG",
  },
  {
    name: "Carlos R.",
    result: "+5 kg de músculo",
    text: "No es un PDF que olvidas. Cada semana revisamos cómo va, cambiamos lo que no funciona. Por fin un plan vivo.",
    avatar: "CR",
  },
  {
    name: "Laura M.",
    result: "Mejoró su maratón",
    text: "Tuve una molestia en la rodilla y al día siguiente ya tenía el plan reajustado. Eso no te lo da ninguna app.",
    avatar: "LM",
  },
];

const faqs = [
  {
    q: "¿Y si soy principiante total?",
    a: "Perfecto. El plan se calibra a tu nivel desde cero y, lo más importante, tienes el chat para preguntar cualquier duda — desde cómo hacer un ejercicio hasta qué comer antes de entrenar.",
  },
  {
    q: "¿Y si entreno en casa o sin material?",
    a: "Sin problema. Indicas tu equipamiento en el cuestionario (gym, casa, calistenia, mancuernas, etc.) y el plan se construye sobre lo que tienes.",
  },
  {
    q: "¿Y si no me funciona o no veo resultados?",
    a: "Por eso existe el chat. Si en 2-3 semanas no progresas, lo detectamos juntos y ajustamos volumen, intensidad o nutrición. Y si aun así no estás contento, cancelas dentro de los 7 días gratis sin pagar nada.",
  },
  {
    q: "¿Puedo cambiar el plan cuando quiera?",
    a: "Sí. Cambios en tu rutina, lesiones, viajes, nuevas metas… me escribes y lo ajusto. No hay límites de cambios.",
  },
  {
    q: "¿Qué diferencia hay con una app de fitness?",
    a: "Las apps te dan un plan automático y te dejan solo. Aquí hay una persona detrás (yo) revisando tu progreso y respondiéndote. Es entrenamiento personal real, a precio de app.",
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
          <div className="flex gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Iniciar sesión
            </Button>
            <Button variant="default" size="sm" onClick={() => navigate("/signup")}>
              Empezar gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
          >
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Plan + chat directo con tu entrenador
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6"
          >
            Tu entrenamiento y nutrición,{" "}
            <span className="text-gradient">ajustados contigo en tiempo real</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            No es una app automática ni un PDF. Recibes tu plan personalizado y un chat
            directo conmigo para ajustarlo cada vez que tu cuerpo, rutina o sensaciones
            cambien.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/signup")}
              className="hover-scale"
            >
              Quiero mi plan personalizado
            </Button>
            <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Solo 2 minutos · 7 días gratis · Cancela
              cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-20 px-4 border-y border-border bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-4">
              ¿Te suena alguno de estos?
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              La mayoría no falla por falta de ganas. Falla porque nadie le dice qué
              hacer hoy, mañana y la semana que viene.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <ScrollReveal key={p} delay={i * 0.08}>
                <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-5">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground/90 pt-1">{p}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                La solución
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                Un plan que <span className="text-gradient">vive contigo</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Empezamos con un plan diseñado para ti. Y lo más importante: lo seguimos
                ajustando cada semana según cómo respondas.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Plan inicial personalizado",
                desc: "Construido a partir de tu nivel, objetivos, lesiones, equipamiento y horarios reales.",
              },
              {
                icon: MessageCircle,
                title: "Chat directo conmigo",
                desc: "Cuando tengas dudas, una molestia o cambie tu semana, me escribes. Te respondo personalmente.",
              },
              {
                icon: RefreshCw,
                title: "Ajustes continuos",
                desc: "Reviso tu progreso y modifico volumen, intensidad o comidas para que avances de verdad.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="bg-card rounded-2xl p-6 border border-border card-shadow h-full hover-scale transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIADOR */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-4">
              Esto <span className="text-gradient">no es otro plan más</span>
            </h2>
            <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
              Comparado con lo que sueles encontrar por ahí.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal direction="left">
              <div className="bg-background/50 rounded-2xl p-6 border border-border h-full">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                  Lo de siempre
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "PDF fijo que no cambia nunca",
                    "App automática sin nadie detrás",
                    "Plantillas genéricas para todos",
                    "Sin nadie que responda tus dudas",
                    "Te dejan solo a la primera duda",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-card rounded-2xl p-6 border border-primary/40 card-shadow glow-shadow h-full">
                <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
                  Autopilot
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    "Plan que se reescribe contigo cada semana",
                    "Una persona real (yo) detrás del chat",
                    "Diseñado a tu nivel, lesiones y rutina",
                    "Respuesta directa cuando lo necesites",
                    "Acompañamiento continuo sin extras",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-14">
              Así de fácil empezar
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Te registras",
                desc: "2 minutos. Cuéntame tus objetivos, nivel, lesiones y disponibilidad.",
                time: "2 min",
              },
              {
                step: "02",
                title: "Recibes tu plan",
                desc: "En menos de 48h tienes tu plan completo de entrenamiento y nutrición.",
                time: "48 h",
              },
              {
                step: "03",
                title: "Lo ajustamos juntos",
                desc: "Por chat. Cada semana, cada cambio, cada duda. Tu plan evoluciona contigo.",
                time: "Continuo",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.12}>
                <div className="bg-card rounded-2xl p-6 card-shadow border border-border h-full hover-scale transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold font-display text-gradient">
                      {item.step}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold font-display mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-14">
              Todo lo que incluye
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal direction="left">
              <div className="bg-card rounded-2xl p-6 card-shadow border border-border h-full">
                <Dumbbell className="w-9 h-9 text-primary mb-4" />
                <h3 className="text-lg font-bold font-display mb-3">Entrenamiento</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Rutinas semanales adaptadas
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Adaptado a tu nivel y lesiones
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Series, reps, descansos y técnica
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="bg-card rounded-2xl p-6 card-shadow border border-border h-full">
                <Apple className="w-9 h-9 text-primary mb-4" />
                <h3 className="text-lg font-bold font-display mb-3">Nutrición</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Macros calculados para ti
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Ideas de comidas reales
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Adaptado a alergias y gustos
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="bg-card rounded-2xl p-6 border border-primary/40 card-shadow glow-shadow h-full relative">
                <span className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Lo que cambia todo
                </span>
                <MessageCircle className="w-9 h-9 text-primary mb-4" />
                <h3 className="text-lg font-bold font-display mb-3">Acompañamiento</h3>
                <ul className="space-y-2 text-foreground/90 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Chat directo conmigo
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Ajustes continuos del plan
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{" "}
                    Resolución de dudas reales
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* BENEFICIO CLAVE */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-14">
              <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                Por qué funciona
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                El plan <span className="text-gradient">evoluciona contigo</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tu cuerpo cambia, tu vida cambia, tus sensaciones cambian. Tu plan también.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Si no progresas",
                desc: "Subimos volumen, bajamos volumen, cambiamos el estímulo.",
              },
              {
                icon: RefreshCw,
                title: "Si cambia tu rutina",
                desc: "Viajas, cambias horarios o equipamiento. Lo adaptamos.",
              },
              {
                icon: HeartPulse,
                title: "Si aparece fatiga o lesión",
                desc: "Reescribimos sobre la marcha para que sigas avanzando seguro.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="bg-card rounded-2xl p-6 border border-border h-full">
                  <item.icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-bold font-display mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-4">
              Resultados reales
            </h2>
            <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">
              Personas que dejaron de improvisar.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.12}>
                <div className="bg-card rounded-2xl p-6 border border-border card-shadow h-full flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
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

      {/* PRECIO */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-md">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                Un precio. Todo incluido.
              </h2>
              <p className="text-muted-foreground">
                Más barato que un entrenador personal. Con acompañamiento real.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="bg-card rounded-3xl p-8 border border-primary/40 card-shadow glow-shadow text-center">
              <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
                <Zap className="w-3 h-3" /> 7 DÍAS GRATIS
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-5xl font-bold font-display">€19</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-xs text-muted-foreground mb-8">Sin permanencia</p>

              <ul className="space-y-3 text-left text-sm mb-8">
                {[
                  "Plan de entrenamiento personalizado",
                  "Plan de nutrición personalizado",
                  "Chat directo conmigo (lo más importante)",
                  "Ajustes continuos del plan",
                  "Soporte para dudas reales",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="hero"
                size="lg"
                className="w-full hover-scale"
                onClick={() => navigate("/signup")}
              >
                Empezar mis 7 días gratis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Cancela cuando quieras. Sin coste si cancelas en 7 días.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-2xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-center mb-4">
              Resolvemos tus dudas
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Las preguntas que más me hacen antes de empezar.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/40 transition-colors"
                >
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 text-left">
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

      {/* CTA FINAL */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-5xl font-bold font-display mb-6 leading-tight">
              Deja de improvisar.{" "}
              <span className="text-gradient">Empieza con un plan que se adapta a ti.</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              7 días gratis. Sin permanencia. Y un entrenador real al otro lado.
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/signup")}
              className="hover-scale"
            >
              Quiero mi plan personalizado
            </Button>
            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> 2 minutos · 7 días gratis · Cancela cuando
              quieras
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <span className="font-display font-bold text-gradient">Autopilot</span> &copy;{" "}
          {new Date().getFullYear()}. Todos los derechos reservados.
        </div>
      </footer>

      {/* Floating CTA mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-50 md:hidden">
        <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/signup")}>
          Empezar mis 7 días gratis
        </Button>
      </div>
    </div>
  );
};

export default Index;
