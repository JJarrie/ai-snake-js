import { describe, expect, it } from 'vitest';
import { heldOutScore, heldOutSeeds } from '../ai/heldOut';
import type NeuralNetwork from '../ai/NeuralNetwork';
import Population from '../ai/Population';
import ClassicGa from '../ai/strategy/ClassicGa';
import OpenAiEs from '../ai/strategy/OpenAiEs';
import { createStrategies } from '../ai/strategy/registry';
import { createCarsGame } from '../game/cars/CarsEpisode';
import { createSnakeGame } from '../game/snake/SnakeEpisode';
import { area, checkpoints, paired, records, runOnce, summarize } from './benchmark';

describe('runOnce', () => {
    it('returns the best score of each generation and a held-out score per checkpoint', () => {
        const { history, heldOut } = runOnce(new ClassicGa(0.1), createSnakeGame(20), 4, 12, 1);

        expect(history).toHaveLength(12);
        history.forEach((score) => expect(score).toBeGreaterThanOrEqual(0));
        expect(checkpoints(12)).toEqual([10, 12]);
        expect(heldOut).toHaveLength(2);
        heldOut.forEach((score) => expect(score).toBeGreaterThanOrEqual(0));
    });

    it('measures the strategy policy on the held-out worlds, not on the training ones', () => {
        const game = createSnakeGame(12);
        const strategy = new OpenAiEs();
        const population = new Population(6, game, new OpenAiEs(), 5);
        for (let g = 0; g < 10; ++g) {
            while (!population.done()) {
                population.update();
            }
            population.calculateFitness();
            population.naturalSelection();
        }
        const expected = heldOutScore(game, population.policy() as NeuralNetwork, heldOutSeeds(5));

        expect(runOnce(strategy, game, 6, 10, 5).heldOut).toEqual([expected]);
    });
});

describe('checkpoints', () => {
    it('are round generations up to the last one, which is always measured', () => {
        expect(checkpoints(60)).toEqual([10, 25, 50, 60]);
        expect(checkpoints(5)).toEqual([5]);
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

describe('reproducibility', () => {
    it('gives the same history for the same seed, for every strategy and game', () => {
        [createSnakeGame(12), createCarsGame(true)].forEach((game) => {
            const first = createStrategies(0.2);
            const second = createStrategies(0.2);

            first.forEach((strategy, i) => {
                const a = runOnce(strategy, game, 12, 4, 77, true);
                const b = runOnce(second[i], game, 12, 4, 77, true);
                expect(b, `${game.name} / ${strategy.name}`).toEqual(a);
            });
        });
    });
});

describe('area', () => {
    it('is the mean of the held-out curve between the first and last checkpoints (trapezoids)', () => {
        expect(area([10, 20, 40], [0, 10, 10])).toBeCloseTo((5 * 10 + 10 * 20) / 30);
        expect(area([5], [3])).toBe(3);
    });
});

describe('paired', () => {
    it('compares two strategies run by run: mean difference, 95% interval, wins', () => {
        const result = paired([10, 12, 9, 15], [8, 12, 5, 11]);

        expect(result.mean).toBeCloseTo(2.5);
        expect(result.wins).toBe(3);
        expect(result.runs).toBe(4);
        // t(3) = 3.182, std of [2, 0, 4, 4] = sqrt(11/3).
        expect(result.halfWidth).toBeCloseTo((3.182 * Math.sqrt(11 / 3)) / 2);
    });

    it('has no interval with a single run', () => {
        expect(paired([3], [1]).halfWidth).toBe(Infinity);
    });
});
