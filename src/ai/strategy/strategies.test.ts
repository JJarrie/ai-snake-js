import { describe, expect, it } from 'vitest';
import NeuralNetwork from '../NeuralNetwork';
import ClassicGa from './ClassicGa';
import DeepGa from './DeepGa';
import type EvolutionStrategy from './EvolutionStrategy';
import OpenAiEs, { centeredRanks } from './OpenAiEs';

const brain = () => new NeuralNetwork(4, [3], 2);
const generation = (n: number) => [...Array(n)].map((_, i) => ({ brain: brain(), fitness: i + 1 }));

describe('NeuralNetwork vector', () => {
    it('round-trips its weights through a vector', () => {
        const network = brain();
        const copy = network.fromVector(network.toVector());

        expect(copy.toVector()).toEqual(network.toVector());
        expect(copy.output([1, 0, 1, 0])).toEqual(network.output([1, 0, 1, 0]));
    });
});

describe.each<[string, () => EvolutionStrategy]>([
    ['ClassicGa', () => new ClassicGa(0.1)],
    ['DeepGa', () => new DeepGa()],
    ['OpenAiEs', () => new OpenAiEs()],
])('%s', (_, create) => {
    it('returns a generation of the same size, two generations in a row', () => {
        const strategy = create();
        const best = brain();

        const first = strategy.nextGeneration(generation(9), best);
        const second = strategy.nextGeneration(
            first.map((b, i) => ({ brain: b, fitness: i })),
            best,
        );

        expect(first).toHaveLength(9);
        expect(second).toHaveLength(9);
    });
});

describe('DeepGa', () => {
    it('keeps the best brain and the top elites unchanged', () => {
        const evaluated = generation(10);
        const best = brain();

        const next = new DeepGa(0.2, 3, 0.1).nextGeneration(evaluated, best);

        expect(next[0].toVector()).toEqual(best.toVector());
        expect(next[1].toVector()).toEqual(evaluated[9].brain.toVector());
        expect(next[2].toVector()).toEqual(evaluated[8].brain.toVector());
        expect(next[3].toVector()).not.toEqual(evaluated[9].brain.toVector());
    });
});

describe('OpenAiEs', () => {
    it('ranks fitness into [-0.5, 0.5], ties sharing their rank', () => {
        const expected = [0.5, -1 / 3, -1 / 3, 1 / 6];
        centeredRanks([10, 0.1, 0.1, 3]).forEach((r, i) => expect(r).toBeCloseTo(expected[i]));
    });

    it('moves the mean toward the perturbation that scored best', () => {
        const es = new OpenAiEs(0.1, 0.1);
        const best = brain();
        const first = es.nextGeneration(generation(2), best);
        const start = [...(es.mean as number[])];

        // The mirrored pair: reward the first perturbation only.
        es.nextGeneration(
            first.map((b, i) => ({ brain: b, fitness: i === 0 ? 1 : 0 })),
            best,
        );

        const moved = (es.mean as number[]).map((m, j) => m - start[j]);
        const towardFirst = first[0].toVector().map((w, j) => w - start[j]);
        const dot = moved.reduce((sum, m, j) => sum + m * towardFirst[j], 0);
        expect(dot).toBeGreaterThan(0);
    });
});
