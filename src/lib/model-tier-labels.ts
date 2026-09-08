// Centralized mapping for model_tier enum → display label.
// DB enum stays 'murah' | 'menengah' | 'mahal' to avoid migration risk.
export const MODEL_TIER_LABELS: Record<string, string> = {
  murah: "Standard",
  menengah: "Premium",
  mahal: "Ultra",
}

export function getModelTierLabel(tier: string): string {
  return MODEL_TIER_LABELS[tier] ?? tier
}