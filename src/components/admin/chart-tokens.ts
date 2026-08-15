/**
 * Chart palette for the admin portal.
 *
 * The Ember brand palette is deliberately all-warm, which is lovely on the
 * marketing site and useless for encoding series identity — ember, clay and
 * amber collapse into one another under deuteranopia. So charts get their own
 * five-slot categorical scale, anchored on the brand ember and then stepped out
 * across the blue/yellow axis where colour-vision deficiency does the least
 * damage.
 *
 * Both sets were checked with the dataviz validator (lightness band, chroma
 * floor, CVD separation on adjacent pairs, normal-vision floor, contrast vs the
 * card surface) and pass every check in their own mode:
 *
 *   light  #e4572e #1580b8 #bf8408 #8f4aae #3d9a55   worst adjacent ΔE 19.3 (deutan)
 *   dark   #e35f2c #3593cc #bd8720 #9d74d0 #4aa25e   worst adjacent ΔE 17.4 (deutan)
 *
 * Slots are assigned in fixed order and never cycled. Everything else — grid,
 * axis, tooltip surface — is pulled straight from the existing design tokens so
 * the charts sit in the page rather than on it.
 */

export const CHART_TOKENS_CSS = `
[data-ember-charts] {
  --chart-1: #e4572e;
  --chart-2: #1580b8;
  --chart-3: #bf8408;
  --chart-4: #8f4aae;
  --chart-5: #3d9a55;
  --chart-grid: var(--border);
  --chart-axis: var(--ink-faint);
  --chart-surface: var(--surface);
  --chart-track: var(--bg-subtle);
}
.dark [data-ember-charts] {
  --chart-1: #e35f2c;
  --chart-2: #3593cc;
  --chart-3: #bd8720;
  --chart-4: #9d74d0;
  --chart-5: #4aa25e;
}
`;

/** Fixed slot order. Index 0 is the ember anchor used for single-series charts. */
export const CHART_SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** More series than slots folds into "Other" rather than inventing a hue. */
export function seriesColor(index: number) {
  return CHART_SERIES[Math.min(index, CHART_SERIES.length - 1)];
}
