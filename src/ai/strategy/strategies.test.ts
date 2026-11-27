import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../utils/SeededRandom';
import NeuralNetwork from '../NeuralNetwork';
import ClassicGa from './ClassicGa';
import DeepGa from './DeepGa';
import type EvolutionStrategy from './EvolutionStrategy';
import MapElites, { noveltyScores, type Selection } from './MapElites';
import OpenAiEs, { centeredRanks } from './OpenAiEs';
import SepCmaEs from './SepCmaEs';

const random = seededRandom(1);
const brain = () => new NeuralNetwork(4, [3], 2);
const generation = (n: number) =>
    [...Array(n)].map((_, i) => ({ brain: brain(), fitness: i + 1, behavior: [i / n, 0.5] }));
const evaluate = (brains: NeuralNetwork[], fitness: (i: number) => number) =>
    brains.map((b, i) => ({ brain: b, fitness: fitness(i), behavior: [0.5, 0.5] }));

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
    ['SepCmaEs', () => new SepCmaEs()],
    ['MapElites', () => new MapElites()],
    ['MapElites novelty', () => new MapElites('novelty')],
])('%s', (_, create) => {
    it('returns a generation of the same size, two generations in a row', () => {
        const strategy = create();
        const best = brain();

        const first = strategy.nextGeneration(generation(9), best, random);
        const second = strategy.nextGeneration(
            evaluate(first, (i) => i),
            best,
            random,
        );

        expect(first).toHaveLength(9);
        expect(second).toHaveLength(9);
    });
});

describe('DeepGa', () => {
    it("keeps this generation's top elites unchanged, once each", () => {
        const evaluated = generation(10);

        const next = new DeepGa(0.2, 3, 0.1).nextGeneration(evaluated, brain(), random);

        expect(next).toHaveLength(10);
        expect(next[0].toVector()).toEqual(evaluated[9].brain.toVector());
        expect(next[1].toVector()).toEqual(evaluated[8].brain.toVector());
        expect(next[2].toVector()).toEqual(evaluated[7].brain.toVector());
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
        const first = es.nextGeneration(generation(2), best, random);
        const start = [...(es.mean as number[])];

        // The mirrored pair: reward the first perturbation only.
        es.nextGeneration(
            evaluate(first, (i) => (i === 0 ? 1 : 0)),
            best,
            random,
        );

        const moved = (es.mean as number[]).map((m, j) => m - start[j]);
        const towardFirst = first[0].toVector().map((w, j) => w - start[j]);
        const dot = moved.reduce((sum, m, j) => sum + m * towardFirst[j], 0);
        expect(dot).toBeGreaterThan(0);
    });
});

describe('SepCmaEs', () => {
    it('moves the mean toward the best samples and keeps a finite positive step size', () => {
        const cma = new SepCmaEs(0.2);
        const best = brain();
        const first = cma.nextGeneration(generation(10), best, random);
        const start = [...(cma.mean as number[])];

        // Only the first sample is good: the mean moves toward it.
        cma.nextGeneration(
            evaluate(first, (i) => (i === 0 ? 10 : 1)),
            best,
            random,
        );

        const moved = (cma.mean as number[]).map((m, j) => m - start[j]);
        const towardFirst = first[0].toVector().map((w, j) => w - start[j]);
        expect(moved.reduce((sum, m, j) => sum + m * towardFirst[j], 0)).toBeGreaterThan(0);
        expect(Number.isFinite(cma.sigma) && cma.sigma > 0).toBe(true);
        expect(cma.variance.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
    });
});

describe('MapElites', () => {
    it('keeps the fittest individual of each behaviour cell, edges included', () => {
        const mapElites = new MapElites('uniform', 2);
        const strong = brain();

        mapElites.nextGeneration(
            [
                { brain: brain(), fitness: 1, behavior: [0, 0] },
                { brain: strong, fitness: 5, behavior: [0.1, 0.2] },
                { brain: brain(), fitness: 3, behavior: [1, 1] },
            ],
            strong,
            random,
        );

        expect(mapElites.archive()).toEqual([
            [5, null],
            [null, 3],
        ]);
        expect(mapElites.cells[0][0]?.brain).toBe(strong);
    });

    it('scores an isolated behaviour as the most novel', () => {
        const scores = noveltyScores(
            [
                [0, 0],
                [0.1, 0],
                [0, 0.1],
                [1, 1],
            ],
            2,
        );

        expect(Math.max(...scores)).toBe(scores[3]);
        expect(noveltyScores([[0.5, 0.5]], 2)).toEqual([0]);
    });

    it('picks the isolated elite more often with novelty selection', () => {
        const isolated = brain();
        const weaker = brain();
        const evaluated = [
            { brain: brain(), fitness: 1, behavior: [0, 0] },
            { brain: brain(), fitness: 1, behavior: [0.15, 0] },
            { brain: isolated, fitness: 1, behavior: [0.95, 0.95] },
            // Padding for a large generation: less fit than the elite of their cell, so not archived.
            ...[...Array(2000)].map(() => ({ brain: weaker, fitness: 0.5, behavior: [0, 0] })),
        ];
        const shareOfIsolated = (selection: Selection) => {
            // sigma 0: children are exact copies, so each child shows its parent.
            const next = new MapElites(selection, 10, 0).nextGeneration(evaluated, brain(), random).slice(1);
            const target = isolated.toVector();

            return next.filter((b) => b.toVector().every((w, j) => w === target[j])).length / next.length;
        };
        // Uniform: 1/3 of the children. Binary tournament: it wins whenever drawn, 1 - (2/3)^2 = 5/9.
        expect(shareOfIsolated('uniform')).toBeLessThan(0.45);
        expect(shareOfIsolated('novelty')).toBeGreaterThan(0.45);
    });
});
