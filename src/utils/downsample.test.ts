import { describe, expect, it } from 'vitest';
import { downsampleMax } from './downsample';

describe('downsampleMax', () => {
    it('keeps short series as they are', () => {
        expect(downsampleMax([1, 5, 2], 500)).toEqual({ values: [1, 5, 2], step: 1 });
        expect(downsampleMax([], 500)).toEqual({ values: [], step: 1 });
    });

    it('keeps the maximum of each run so records stay visible, last run shorter', () => {
        expect(downsampleMax([1, 9, 2, 3, 4, 8, 7], 3)).toEqual({ values: [9, 8, 7], step: 3 });
    });

    it('never returns more than the requested points, even for very long series', () => {
        const long = [...Array(120000)].map((_, i) => i % 97);
        const { values, step } = downsampleMax(long, 500);

        expect(values.length).toBeLessThanOrEqual(500);
        expect(step).toBe(240);
        expect(values[0]).toBe(96);
    });
});
