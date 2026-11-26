import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
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

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork): NeuralNetwork[] {
        const ranked = [...evaluated].sort((a, b) => b.fitness - a.fitness).map((e) => e.brain);
        const parents = ranked.slice(0, Math.max(1, Math.round(ranked.length * this.truncation)));
        const next = [best.clone(), ...ranked.slice(0, this.elites - 1).map((b) => b.clone())].slice(
            0,
            evaluated.length,
        );

        while (next.length < evaluated.length) {
            const parent = parents[Math.floor(Math.random() * parents.length)];
            next.push(parent.fromVector(parent.toVector().map((w) => w + this.sigma * Gaussian.random())));
        }

        return next;
    }
}

export default DeepGa;
