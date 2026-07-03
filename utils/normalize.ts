/**
 * Distribution-based normalization to [0, 1].
 *
 * rankNormalize maps each value to its percentile in the input's empirical
 * distribution (midrank for ties). Output is uniformly spread over [0, 1]
 * no matter how skewed the raw values are, so every band of a heatmap
 * gradient gets used and outliers can't compress the color ramp.
 *
 * With this, gradient stops read as percentiles:
 *   0.4 -> bottom 40% of scores, 0.995 -> top 0.5%, etc.
 */

const lowerBound = (sorted: number[], v: number): number => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sorted[mid] < v) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

const upperBound = (sorted: number[], v: number): number => {
    let lo = 0, hi = sorted.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sorted[mid] <= v) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

/** Percentile of each value within `values` itself. O(n log n). */
export function rankNormalize(values: number[]): number[] {
    const n = values.length;
    if (n === 0) return [];
    if (n === 1) return [0.5];

    const sorted = [...values].sort((a, b) => a - b);

    // Midrank: ties share the average of their rank range, so identical
    // scores always get identical intensities.
    return values.map((v) => {
        const first = lowerBound(sorted, v);
        const last = upperBound(sorted, v) - 1;
        return (first + last) / 2 / (n - 1);
    });
}

/**
 * Alternative: linear scaling between two percentiles of the distribution
 * (values outside get clamped to 0/1). Preserves relative *magnitudes*
 * between the clip points, unlike rankNormalize which preserves only
 * ordering. Use if "twice the score should look twice as hot" matters
 * more than full use of the color range.
 */
export function percentileClipNormalize(
    values: number[],
    loPct: number = 0.05,
    hiPct: number = 0.95,
): number[] {
    const n = values.length;
    if (n === 0) return [];
    if (n === 1) return [0.5];

    const sorted = [...values].sort((a, b) => a - b);
    const lo = sorted[Math.floor(loPct * (n - 1))];
    const hi = sorted[Math.ceil(hiPct * (n - 1))];
    const span = hi - lo;
    if (span <= 0) return values.map(() => 0.5);

    return values.map((v) => Math.min(1, Math.max(0, (v - lo) / span)));
}