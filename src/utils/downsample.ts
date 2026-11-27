/**
 * At most `maxPoints` values: each one is the maximum of `step` consecutive values (the last run may be
 * shorter), so peaks survive. Short series are returned as they are, with a step of 1.
 */
export const downsampleMax = (values: number[], maxPoints: number): { values: number[]; step: number } => {
    const step = Math.max(1, Math.ceil(values.length / maxPoints));
    if (step === 1) {
        return { values, step };
    }

    const sampled: number[] = [];
    for (let start = 0; start < values.length; start += step) {
        let max = -Infinity;
        for (let i = start; i < Math.min(values.length, start + step); ++i) {
            max = Math.max(max, values[i]);
        }
        sampled.push(max);
    }

    return { values: sampled, step };
};
