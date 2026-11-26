import type NeuralNetwork from '../NeuralNetwork';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

/** Canonical GA: fitness-proportionate (roulette) selection, crossover, sparse mutation, one elite. */
class ClassicGa implements EvolutionStrategy {
    readonly name = 'Classic GA';
    mutationRate: number;

    constructor(mutationRate: number) {
        this.mutationRate = mutationRate;
    }

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork): NeuralNetwork[] {
        const fitnessSum = evaluated.reduce((sum, e) => sum + e.fitness, 0);
        const next = [best.clone()];

        while (next.length < evaluated.length) {
            const child = ClassicGa.pickParent(evaluated, fitnessSum).crossover(
                ClassicGa.pickParent(evaluated, fitnessSum),
            );
            child.mutate(this.mutationRate);
            next.push(child);
        }

        return next;
    }

    private static pickParent(evaluated: Evaluated[], fitnessSum: number): NeuralNetwork {
        const rand = Math.floor(Math.random() * fitnessSum);
        let summation = 0;

        for (const e of evaluated) {
            summation = summation + e.fitness;
            if (summation > rand) {
                return e.brain;
            }
        }

        return evaluated[0].brain;
    }
}

export default ClassicGa;
