export const TIERS = {
  basic: {
    name: "Basic",
    price: 9,
    price_id: "price_1T8o5VJttvYKlxWamWvuD1rC",
    product_id: "prod_U729xC4TayQrfY",
    features: [
      "Plan de entrenamiento personalizado",
      "Plan de nutrición personalizado",
      "Actualización mensual del plan",
    ],
    excluded: [
      "Chat con entrenador",
      "Gráficos de progreso",
      "Logros y gamificación",
      "Consultas 1-a-1",
      "Actualizaciones semanales",
      "Soporte prioritario",
    ],
  },
  pro: {
    name: "Pro",
    price: 19,
    price_id: "price_1T8o5WJttvYKlxWaKGiSG26L",
    product_id: "prod_U729ZYgVubAkcE",
    popular: true,
    features: [
      "Plan de entrenamiento personalizado",
      "Plan de nutrición personalizado",
      "Actualización mensual del plan",
      "Chat directo con tu entrenador",
      "Gráficos de progreso y evolución",
      "Logros y gamificación",
    ],
    excluded: [
      "Consultas 1-a-1",
      "Actualizaciones semanales",
      "Soporte prioritario",
    ],
  },
  vip: {
    name: "VIP",
    price: 39,
    price_id: "price_1T8o5YJttvYKlxWaahu5vy7Y",
    product_id: "prod_U729GcCVSEbUhE",
    features: [
      "Plan de entrenamiento personalizado",
      "Plan de nutrición personalizado",
      "Actualización semanal del plan",
      "Chat directo con tu entrenador",
      "Gráficos de progreso y evolución",
      "Logros y gamificación",
      "Consultas 1-a-1 mensuales",
      "Soporte prioritario 24/7",
    ],
    excluded: [],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export const REFERRAL_COUPON_ID = "veaugRi2";

export function getTierByProductId(productId: string): TierKey | null {
  for (const [key, tier] of Object.entries(TIERS)) {
    if (tier.product_id === productId) return key as TierKey;
  }
  return null;
}
