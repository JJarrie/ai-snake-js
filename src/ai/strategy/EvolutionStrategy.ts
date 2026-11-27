import type NeuralNetwork from '../NeuralNetwork';

/** An evaluated individual of the current generation. */
export interface Evaluated {
    brain: NeuralNetwork;
    fitness: number;
    /** Behaviour descriptor in [0, 1]^d, for quality-diversity strategies. */
    behavior: number[];
}

interface EvolutionStrategy {
    readonly name: string;

    /** Quality-diversity archive to display: best fitness per behaviour cell, null when empty. */
    archive?(): (number | null)[][];

    /**
     * Brains of the next generation, as many as `evaluated`. `evaluated` is in the same order as the
     * brains this strategy returned for the current generation; `best` is the fittest brain of it.
     */
    nextGeneration(evaluated: Evaluated[], best: NeuralNetwork): NeuralNetwork[];
}

export default EvolutionStrategy;
