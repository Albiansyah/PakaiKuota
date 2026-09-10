export type PricingModel = {
  input_price_per_1k: number;
  output_price_per_1k: number;
  markup_percent: number;
};

export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  model: PricingModel,
): number {
  const upstream =
    (inputTokens * model.input_price_per_1k) / 1000 +
    (outputTokens * model.output_price_per_1k) / 1000;

  return upstream * (1 + model.markup_percent / 100 + 0.03);
}