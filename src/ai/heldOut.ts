import type { GameDefinition } from '../game/Episode';
import { deriveSeed } from '../utils/SeededRandom';
import type NeuralNetwork from './NeuralNetwork';

/** Unseen worlds a policy is measured on. */
export const HELD_OUT_SEEDS = 10;
/** Seed index of the held-out worlds' base: training uses the generation numbers (from 1), evolution -1. */
const HELD_OUT_STREAM = -2;

/** Worlds (food, track, obstacles) never used in training or selection, derived from a run's base seed. */
export const heldOutSeeds = (baseSeed: number, count = HELD_OUT_SEEDS): number[] => {
    const base = deriveSeed(baseSeed, HELD_OUT_STREAM);
    return [...Array(count)].map((_, i) => deriveSeed(base, i));
};

/**
 * Mean score (apples, checkpoints) of `brain` over `seeds`, each world played once to the end on a copy.
 * Measures a policy without selecting on it: the opposite of the record, the best of many noisy episodes.
 */
export const heldOutScore = (game: GameDefinition, brain: NeuralNetwork, seeds: number[]): number => {
    const total = seeds.reduce((sum, seed) => {
        const episode = game.createEpisode(brain.clone(), seed);
        while (!episode.finished()) {
            episode.step();
        }
        return sum + episode.score;
    }, 0);
    return total / seeds.length;
};
