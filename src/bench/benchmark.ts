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

/**
 * Mean of a learning curve between its first and last points (trapezoids over the generations), so a
 * strategy that learns early scores more than one that only catches up at the end.
 */
export const area = (generations: number[], values: number[]): number => {
    const span = generations[generations.length - 1] - generations[0];
    if (span === 0) {
        return values[0];
    }
    let sum = 0;
    for (let k = 1; k < generations.length; ++k) {
        sum = sum + ((values[k - 1] + values[k]) / 2) * (generations[k] - generations[k - 1]);
    }
    return sum / span;
};

/** Two-sided 95% Student t quantiles for 1 to 30 degrees of freedom; 1.96 beyond. */
const T95 = [
    12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11,
    2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

export interface Paired {
    /** Mean of a - b over the runs. */
    mean: number;
    /** Half-width of the 95% confidence interval of that mean; Infinity with a single run. */
    halfWidth: number;
    /** Runs where a beat b. */
    wins: number;
    runs: number;
}

/**
 * Compares two strategies run by run. Run i of every strategy faces the same training and held-out
 * worlds, so the difference per run removes the luck of the worlds: far tighter than comparing two means.
 */
export const paired = (a: number[], b: number[]): Paired => {
    const diffs = a.map((v, i) => v - b[i]);
    const { mean, std } = summarize(diffs);
    const runs = diffs.length;
    const t = T95[runs - 2] ?? 1.96;

    return {
        mean,
        halfWidth: runs > 1 ? (t * std) / Math.sqrt(runs) : Infinity,
        wins: diffs.filter((d) => d > 0).length,
        runs,
    };
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
