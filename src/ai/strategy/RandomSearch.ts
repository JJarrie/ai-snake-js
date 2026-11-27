import type { Random } from '../../utils/SeededRandom';
import type NeuralNetwork from '../NeuralNetwork';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

/**
 * Baseline that learns nothing: every generation is a new draw of random networks (weights in [-1, 1],
 * as at the start). Its policy is the luckiest draw of the last generation, so it shows how much a
 * strategy gains over picking the best of many random networks.
 */
class RandomSearch implements EvolutionStrategy {
    readonly name = 'Random search';

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork, random: Random): NeuralNetwork[] {
        return evaluated.map(() => best.fromVector(best.toVector().map(() => random() * 2 - 1)));
    }
}

export default RandomSearch;
