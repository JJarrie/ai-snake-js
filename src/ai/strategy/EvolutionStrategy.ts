import type NeuralNetwork from '../NeuralNetwork';

/** An evaluated individual of the current generation. */
export interface Evaluated {
    brain: NeuralNetwork;
    fitness: number;
}

interface EvolutionStrategy {
    readonly name: string;

    /**
     * Brains of the next generation, as many as `evaluated`. `evaluated` is in the same order as the
     * brains this strategy returned for the current generation; `best` is the best brain seen so far.
     */
    nextGeneration(evaluated: Evaluated[], best: NeuralNetwork): NeuralNetwork[];
}

export default EvolutionStrategy;
