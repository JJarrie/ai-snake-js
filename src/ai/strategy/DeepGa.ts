import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
import type { Random } from '../../utils/SeededRandom';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

/**
 * Deep GA (Such et al., 2017): truncation selection, a few elites kept unchanged,
 * Gaussian noise on every weight, no crossover.
 */
class DeepGa implements EvolutionStrategy {
    readonly name = 'Deep GA';
    truncation: number;
    elites: number;
    sigma: number;

    constructor(truncation = 0.1, elites = 5, sigma = 0.05) {
        this.truncation = truncation;
        this.elites = elites;
        this.sigma = sigma;
    }

    /** The elites are this generation's top brains, so `best` (the first of them) is not needed. */
    public nextGeneration(evaluated: Evaluated[], _best: NeuralNetwork, random: Random): NeuralNetwork[] {
        const ranked = [...evaluated].sort((a, b) => b.fitness - a.fitness).map((e) => e.brain);
        const parents = ranked.slice(0, Math.max(1, Math.round(ranked.length * this.truncation)));
        const next = ranked.slice(0, this.elites).map((b) => b.clone());

        while (next.length < evaluated.length) {
            const parent = parents[Math.floor(random() * parents.length)];
            next.push(parent.fromVector(parent.toVector().map((w) => w + this.sigma * Gaussian.random(random))));
        }

        return next;
    }
}

export default DeepGa;
