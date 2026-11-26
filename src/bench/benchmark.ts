import Population from '../ai/Population';
import type EvolutionStrategy from '../ai/strategy/EvolutionStrategy';
import type { GameDefinition } from '../game/Episode';

/** Trains one population headless and returns the best score of each generation. */
export const runOnce = (
    strategy: EvolutionStrategy,
    game: GameDefinition,
    populationSize: number,
    generations: number,
    seed: number,
): number[] => {
    const population = new Population(populationSize, game, strategy, seed);

    while (population.history.length < generations) {
        while (!population.done()) {
            population.update();
        }
        population.calculateFitness();
        population.naturalSelection();
    }

    return population.history;
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
