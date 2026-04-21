import { useState } from "react";
import { TIER } from "@/config/tiers";
import { CheckCircle2, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

interface PricingTiersProps {
  onSelect: (plan: "monthly" | "yearly") => void;
  yearlyPrice?: number; // total año
}

const PricingTiers = ({ onSelect, yearlyPrice = 190 }: PricingTiersProps) => {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const monthly = TIER.price; // 19
  const monthlyEquivalent = (yearlyPrice / 12).toFixed(2).replace(".", ",");
  const savings = monthly * 12 - yearlyPrice;

  return (
    <div className="max-w-md mx-auto">
      <ScrollReveal>
        {/* Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-secondary/50 rounded-full p-1 border border-border">
            <button
              onClick={() => setPlan("monthly")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                plan === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPlan("yearly")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                plan === "yearly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                -{Math.round((savings / (monthly * 12)) * 100)}%
              </span>
            </button>
          </div>
        </div>

        <motion.div
          key={plan}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className="bg-card rounded-3xl p-10 border-2 border-primary card-shadow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
            {plan === "monthly" ? "7 DÍAS GRATIS" : `AHORRA ${savings}€`}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold font-display">{TIER.name}</h3>
          </div>

          {plan === "monthly" ? (
            <div className="mb-6">
              <span className="text-5xl font-bold font-display text-gradient">€{monthly}</span>
              <span className="text-muted-foreground">/mes</span>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-display text-gradient">€{yearlyPrice}</span>
                <span className="text-muted-foreground">/año</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                Equivale a €{monthlyEquivalent}/mes · Ahorras {savings}€
              </div>
            </div>
          )}

          <ul className="space-y-3 mb-8">
            {TIER.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="hero"
            size="lg"
            className="w-full hover-scale"
            onClick={() => onSelect(plan)}
          >
            {plan === "monthly" ? "Empezar 7 días gratis" : "Suscribirme al plan anual"}
          </Button>

          <p className="text-xs text-muted-foreground mt-4 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Garantía 30 días · Cancela cuando quieras
          </p>
        </motion.div>
      </ScrollReveal>
    </div>
  );
};

export default PricingTiers;
