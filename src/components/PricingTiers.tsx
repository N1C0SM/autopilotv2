import { TIERS, type TierKey } from "@/config/tiers";
import { CheckCircle2, X, Crown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";

interface PricingTiersProps {
  onSelectTier: (tier: TierKey) => void;
}

const tierIcons: Record<TierKey, typeof Zap> = {
  basic: Zap,
  pro: Star,
  vip: Crown,
};

const PricingTiers = ({ onSelectTier }: PricingTiersProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {(Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][]).map(([key, tier], i) => {
        const Icon = tierIcons[key];
        const isPopular = "popular" in tier && tier.popular;

        return (
          <ScrollReveal key={key} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -4 }}
              className={`bg-card rounded-3xl p-8 border-2 card-shadow relative overflow-hidden flex flex-col h-full ${
                isPopular ? "border-primary" : "border-border"
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
                  MÁS POPULAR
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPopular ? "bg-primary/20" : "bg-secondary"
                }`}>
                  <Icon className={`w-5 h-5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="text-lg font-bold font-display">{tier.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-display text-gradient">€{tier.price}</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <p className="text-xs text-primary font-medium mb-6">7 días gratis · Sin permanencia</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
                {tier.excluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/50">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isPopular ? "hero" : "outline"}
                size="lg"
                className="w-full hover-scale"
                onClick={() => onSelectTier(key)}
              >
                Empezar 7 días gratis
              </Button>
            </motion.div>
          </ScrollReveal>
        );
      })}
    </div>
  );
};

export default PricingTiers;
