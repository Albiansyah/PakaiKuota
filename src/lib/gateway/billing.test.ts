import { describe, expect, it } from 'vitest';
import { estimateCostUsd } from './pricing';

describe('gateway billing estimate', () => {
  const model = {
    id: 'model-id',
    input_price_per_1k: 0.5,
    output_price_per_1k: 1,
    markup_percent: 0.2,
  };

  it('uses input and max output tokens plus markup and forex buffer', () => {
    // upstream=(100*0.5/1000)+(200*1/1000)=0.25;
    // markup=(0.2+0.03), total=0.3075
    expect(estimateCostUsd(100, 200, model)).toBeCloseTo(0.3075);
  });

  it('returns zero for zero-token estimate', () => {
    expect(estimateCostUsd(0, 0, model)).toBe(0);
  });
});
