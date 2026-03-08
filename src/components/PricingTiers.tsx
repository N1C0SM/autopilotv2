import { TIER } from "@/config/tiers";
import { CheckCircle2, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

interface PricingTiersProps {
  onSelect: () => void;
}

const PricingTiers = ({ onSelect }: PricingTiersProps) => {
  return (
    <div className="max-w-md mx-auto">
      <ScrollReveal>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-card rounded-3xl p-10 border-2 border-primary card-shadow relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
            7 DÍAS GRATIS
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold font-display">{TIER.name}</h3>
          </div>

          <div className="mb-6">
            <span className="text-5xl font-bold font-display text-gradient">€{TIER.price}</span>
            <span className="text-muted-foreground">/mes</span>
          </div>

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
            onClick={onSelect}
          >
            Empezar 7 días gratis
          </Button>

          <p className="text-xs text-muted-foreground mt-4 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Sin permanencia · Cancela cuando quieras
          </p>
        </motion.div>
      </ScrollReveal>
    </div>
  );
};

export default PricingTiers;
