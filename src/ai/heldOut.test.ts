import { describe, expect, it } from 'vitest';
import { createSnakeGame } from '../game/snake/SnakeEpisode';
import { deriveSeed } from '../utils/SeededRandom';
import { HELD_OUT_SEEDS, heldOutScore, heldOutSeeds } from './heldOut';
import NeuralNetwork from './NeuralNetwork';

describe('heldOutSeeds', () => {
    it('gives the same distinct seeds for a run, none of them a training seed', () => {
        const seeds = heldOutSeeds(42);
        const training = new Set([...Array(5000)].map((_, g) => deriveSeed(42, g + 1)));

        expect(seeds).toEqual(heldOutSeeds(42));
        expect(new Set(seeds).size).toBe(HELD_OUT_SEEDS);
        seeds.forEach((seed) => expect(training.has(seed)).toBe(false));
        expect(heldOutSeeds(43)).not.toEqual(seeds);
    });
});

describe('heldOutScore', () => {
    it('is the mean score of one full episode per seed, played on a copy of the brain', () => {
        const game = createSnakeGame(12);
        const brain = new NeuralNetwork(game.inputs, [6], game.outputs);
        const weights = brain.toVector();
        const seeds = heldOutSeeds(7, 4);

        const expected =
            seeds.reduce((sum, seed) => {
                const episode = game.createEpisode(brain.clone(), seed);
                while (!episode.finished()) {
                    episode.step();
                }
                return sum + episode.score;
            }, 0) / seeds.length;

        expect(heldOutScore(game, brain, seeds)).toBe(expected);
        expect(heldOutScore(game, brain, seeds)).toBe(expected);
        expect(brain.toVector()).toEqual(weights);
    });
});
