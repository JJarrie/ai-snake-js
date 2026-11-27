import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
import type { Random } from '../../utils/SeededRandom';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

/** Fitness replaced by its centered rank in [-0.5, 0.5], ties sharing their average rank. */
export const centeredRanks = (fitness: number[]): number[] => {
    const n = fitness.length;
    const order = fitness.map((_, i) => i).sort((a, b) => fitness[a] - fitness[b]);
    const ranks = new Array<number>(n);

    for (let start = 0; start < n;) {
        let end = start;
        while (end + 1 < n && fitness[order[end + 1]] === fitness[order[start]]) {
            end = end + 1;
        }
        for (let k = start; k <= end; ++k) {
            ranks[order[k]] = n > 1 ? (start + end) / 2 / (n - 1) - 0.5 : 0;
        }
        start = end + 1;
    }

    return ranks;
};

/**
 * OpenAI-ES (Salimans et al., 2017): one mean parameter vector, the population samples Gaussian
 * perturbations around it (mirrored pairs), and the mean moves along their rank-weighted average.
 */
class OpenAiEs implements EvolutionStrategy {
    readonly name = 'OpenAI-ES';
    sigma: number;
    learningRate: number;
    mean?: number[];
    /** Perturbation of each individual of the current generation, same order as `evaluated`. */
    noise: number[][] = [];

    constructor(sigma = 0.1, learningRate = 0.1) {
        this.sigma = sigma;
        this.learningRate = learningRate;
    }

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork, random: Random): NeuralNetwork[] {
        const mean = this.updateMean(evaluated, best);

        this.noise = [];
        for (let i = 0; i < evaluated.length; ++i) {
            this.noise.push(i % 2 === 0 ? mean.map(() => Gaussian.random(random)) : this.noise[i - 1].map((e) => -e));
        }

        return this.noise.map((eps) => best.fromVector(mean.map((m, j) => m + this.sigma * eps[j])));
    }

    private updateMean(evaluated: Evaluated[], best: NeuralNetwork): number[] {
        // First generation is random networks, not perturbations: start from the best of them.
        if (this.mean === undefined || this.noise.length !== evaluated.length) {
            this.mean = best.toVector();
            return this.mean;
        }

        const utilities = centeredRanks(evaluated.map((e) => e.fitness));
        const step = this.learningRate / (evaluated.length * this.sigma);
        const mean = this.mean;

        utilities.forEach((u, i) => {
            const eps = this.noise[i];
            for (let j = 0; j < mean.length; ++j) {
                mean[j] = mean[j] + step * u * eps[j];
            }
        });

        return mean;
    }
}

export default OpenAiEs;
