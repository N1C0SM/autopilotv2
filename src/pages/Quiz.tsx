import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { buildPreview, saveQuiz, type QuizAnswers, loadQuiz } from "@/lib/quizPreview";

type Option<V> = { value: V; label: string; emoji?: string; desc?: string };

const STEPS: Array<{
  key: keyof QuizAnswers;
  title: string;
  subtitle?: string;
  options?: Option<any>[];
  custom?: "age_sex";
}> = [
  {
    key: "goal",
    title: "¿Cuál es tu objetivo principal?",
    options: [
      { value: "lose_fat", label: "Perder grasa", emoji: "🔥" },
      { value: "gain_muscle", label: "Ganar músculo", emoji: "💪" },
      { value: "performance", label: "Rendimiento / fuerza", emoji: "⚡" },
      { value: "health", label: "Salud y hábitos", emoji: "🌱" },
    ],
  },
  {
    key: "level",
    title: "¿Cuál es tu nivel actual?",
    options: [
      { value: "beginner", label: "Principiante", desc: "Menos de 6 meses entrenando" },
      { value: "intermediate", label: "Intermedio", desc: "Entreno regular hace 6m – 2 años" },
      { value: "advanced", label: "Avanzado", desc: "Más de 2 años de constancia" },
    ],
  },
  {
    key: "frequency",
    title: "¿Cuántos días puedes entrenar a la semana?",
    options: [
      { value: 2, label: "2 días" },
      { value: 3, label: "3 días" },
      { value: 4, label: "4 días" },
      { value: 5, label: "5 o más" },
    ],
  },
  {
    key: "equipment",
    title: "¿Con qué entrenas?",
    options: [
      { value: "gym", label: "Gimnasio", emoji: "🏋️" },
      { value: "calisthenics", label: "Calistenia", emoji: "🤸" },
      { value: "mixed", label: "Mixto", emoji: "⚡" },
    ],
  },
  {
    key: "session_minutes",
    title: "¿Cuánto tiempo tienes por sesión?",
    options: [
      { value: 30, label: "30 min" },
      { value: 45, label: "45 min" },
      { value: 60, label: "60 min" },
      { value: 90, label: "90 min" },
    ],
  },
  {
    key: "problem",
    title: "¿Cuál es tu mayor problema hoy?",
    subtitle: "Sé sincero. De aquí sale tu plan real.",
    options: [
      { value: "consistency", label: "Falta de constancia", desc: "Empiezo y abandono" },
      { value: "guidance", label: "No sé qué hacer cada día", desc: "Me pierdo entre rutinas" },
      { value: "results", label: "Entreno y no veo resultados" },
      { value: "injuries", label: "Lesiones o molestias", desc: "Necesito adaptaciones" },
    ],
  },
  {
    key: "sex",
    title: "Cuéntanos un poco más",
    custom: "age_sex",
  },
];

export default function Quiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>(() => loadQuiz() ?? {});
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    saveQuiz(answers);
  }, [answers]);

  const total = STEPS.length;
  const current = STEPS[step];

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else startGenerating();
  };
  const back = () => (step === 0 ? navigate("/") : setStep(step - 1));

  const startGenerating = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2200));
    setGenerating(false);
    setPreviewReady(true);
  };

  const select = (val: any) => {
    setAnswers((a) => ({ ...a, [current.key]: val }));
    setTimeout(() => next(), 180);
  };

  if (previewReady) return <Preview answers={answers} onContinue={() => navigate("/signup?from=quiz")} />;

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold font-display">Generando tu plan…</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <GenLine delay={0} text="Analizando tu nivel y disponibilidad" />
            <GenLine delay={700} text="Cruzando con 9 reglas de progresión" />
            <GenLine delay={1400} text="Ajustando volumen y fatiga semanal" />
          </ul>
        </div>
      </div>
    );
  }

  const value = answers[current.key];
  const canContinue = current.custom === "age_sex" ? !!answers.age && !!answers.sex : value !== undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 py-4 flex items-center gap-4 border-b border-border">
        <button onClick={back} className="text-muted-foreground hover:text-foreground" aria-label="Atrás">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <Progress value={((step + 1) / total) * 100} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {step + 1}/{total}
        </span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">{current.title}</h1>
              {current.subtitle && <p className="text-muted-foreground mb-6">{current.subtitle}</p>}

              {current.custom === "age_sex" ? (
                <AgeSexStep answers={answers} setAnswers={setAnswers} />
              ) : (
                <div className="space-y-3 mt-6">
                  {current.options!.map((opt) => {
                    const active = value === opt.value;
                    return (
                      <button
                        key={String(opt.value)}
                        onClick={() => select(opt.value)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-secondary"
                        }`}
                      >
                        {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
                        <div className="flex-1">
                          <div className="font-semibold">{opt.label}</div>
                          {opt.desc && <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>}
                        </div>
                        {active && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {current.custom === "age_sex" && (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-8"
                  onClick={next}
                  disabled={!canContinue}
                >
                  Generar mi plan <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function GenLine({ delay, text }: { delay: number; text: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <li className="flex items-center justify-center gap-2">
      {done ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Loader2 className="w-4 h-4 animate-spin" />}
      <span>{text}</span>
    </li>
  );
}

function AgeSexStep({
  answers,
  setAnswers,
}: {
  answers: QuizAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuizAnswers>>;
}) {
  return (
    <div className="space-y-6 mt-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Edad</label>
        <Input
          type="number"
          min={14}
          max={90}
          value={answers.age ?? ""}
          onChange={(e) => setAnswers((a) => ({ ...a, age: Number(e.target.value) || undefined }))}
          placeholder="28"
          className="h-12 text-lg"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Sexo</label>
        <div className="grid grid-cols-2 gap-3">
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setAnswers((a) => ({ ...a, sex: s }))}
              className={`p-4 rounded-xl border transition-all ${
                answers.sex === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              {s === "male" ? "Hombre" : "Mujer"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Preview({ answers, onContinue }: { answers: QuizAnswers; onContinue: () => void }) {
  const preview = buildPreview(answers);
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-3xl font-bold font-display">Tu plan está listo</h1>
          <p className="text-muted-foreground">Personalizado a partir de tus respuestas</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 card-shadow">
          <Row label="Enfoque" value={preview.focus} />
          <Row label="Frecuencia" value={preview.frequencyLabel} />

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Estructura semanal</div>
            <div className="space-y-1.5">
              {preview.weekStructure.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-secondary/40 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono w-5 text-muted-foreground">{d.day}</span>
                    <span className={d.locked ? "blur-[3px] select-none" : ""}>{d.title}</span>
                  </div>
                  {d.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Nutrición</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">~{preview.nutrition.kcal} kcal</span>
              <span className="text-muted-foreground">·</span>
              <span className="blur-[3px] select-none">{preview.nutrition.protein}g proteína</span>
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
          <div className="text-xs text-primary uppercase tracking-wide mb-1">Insight clave</div>
          <p className="text-sm">{preview.insight}</p>
        </div>

        <div className="space-y-3">
          <Button variant="hero" size="lg" className="w-full" onClick={onContinue}>
            Desbloquear mi plan completo
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            7 días gratis · Sin tarjeta para empezar · Cancelas cuando quieras
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}