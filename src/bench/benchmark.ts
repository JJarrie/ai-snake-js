import { heldOutScore, heldOutSeeds } from '../ai/heldOut';
import Population from '../ai/Population';
import type EvolutionStrategy from '../ai/strategy/EvolutionStrategy';
import type { GameDefinition } from '../game/Episode';

/** Generations at which a run is measured: round numbers up to `generations`, which is always included. */
export const checkpoints = (generations: number): number[] =>
    [...new Set([10, 25, 50, 100, 200, 500, 1000, generations])].filter((g) => g <= generations).sort((a, b) => a - b);

export interface RunResult {
    /** Best score of each generation: one noisy episode on one world, the best of the population. */
    history: number[];
    /** Held-out score of the strategy's policy at each checkpoint, in checkpoint order. */
    heldOut: number[];
}

/** Trains one population headless; at each checkpoint, measures its policy on the run's held-out worlds. */
export const runOnce = (
    strategy: EvolutionStrategy,
    game: GameDefinition,
    populationSize: number,
    generations: number,
    seed: number,
    recurrent = false,
): RunResult => {
    const population = new Population(populationSize, game, strategy, seed, 16, recurrent);
    // Same seed for every strategy of a run: their policies face the same unseen worlds.
    const seeds = heldOutSeeds(seed);
    const measured = new Set(checkpoints(generations));
    const heldOut: number[] = [];

    while (population.history.length < generations) {
        while (!population.done()) {
            population.update();
        }
        population.calculateFitness();
        population.naturalSelection();

        const policy = population.policy();
        if (measured.has(population.history.length) && policy !== null) {
            heldOut.push(heldOutScore(game, policy, seeds));
        }
    }

    return { history: population.history, heldOut };
};

/** Best score reached so far at each generation: smoother than the per-generation best. */
export const records = (history: number[]): number[] => {
    let best = -Infinity;

    return history.map((score) => (best = Math.max(best, score)));
};

export interface Summary {
    mean: number;
    std: number;
    min: number;
    max: number;
}

/** Mean, sample standard deviation (0 for a single value), min and max. */
export const summarize = (values: number[]): Summary => {
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;

    return { mean, std: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values) };
};
