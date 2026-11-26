import { describe, expect, it } from 'vitest';
import ClassicGa from '../ai/strategy/ClassicGa';
import { records, runOnce, summarize } from './benchmark';

describe('runOnce', () => {
    it('returns the best score of each of the requested generations', () => {
        const history = runOnce(new ClassicGa(0.1), 4, 3, 1);

        expect(history).toHaveLength(3);
        history.forEach((score) => expect(score).toBeGreaterThanOrEqual(0));
    });
});

describe('records', () => {
    it('is the best score reached so far at each generation', () => {
        expect(records([2, 1, 5, 3])).toEqual([2, 2, 5, 5]);
    });
});

describe('summarize', () => {
    it('gives mean, sample standard deviation, min and max', () => {
        expect(summarize([2, 4, 4, 4, 5, 5, 7, 9])).toEqual({
            mean: 5,
            std: Math.sqrt(32 / 7),
            min: 2,
            max: 9,
        });
        expect(summarize([3])).toEqual({ mean: 3, std: 0, min: 3, max: 3 });
    });
});
