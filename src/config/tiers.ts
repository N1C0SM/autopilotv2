export const TIER = {
  name: "Personal",
  price: 19,
  price_id: "price_1T8o5WJttvYKlxWaKGiSG26L",
  product_id: "prod_U729ZYgVubAkcE",
  features: [
    "Plan de entrenamiento 100% personalizado",
    "Plan de nutrición adaptado a tus objetivos",
    "Actualización mensual del plan",
    "Chat directo con tu entrenador",
    "Soporte continuo incluido",
  ],
} as const;

// Keep backwards compat for existing code
export const TIERS = {
  personal: TIER,
} as const;

export type TierKey = "personal";

export const REFERRAL_COUPON_ID = "veaugRi2";

export function getTierByProductId(productId: string): TierKey | null {
  if (TIER.product_id === productId) return "personal";
  return null;
}
