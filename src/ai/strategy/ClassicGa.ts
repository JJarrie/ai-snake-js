import type { Random } from '../../utils/SeededRandom';
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

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork, random: Random): NeuralNetwork[] {
        const fitnessSum = evaluated.reduce((sum, e) => sum + e.fitness, 0);
        const next = [best.clone()];

        while (next.length < evaluated.length) {
            const mother = ClassicGa.pickParent(evaluated, fitnessSum, random);
            const father = ClassicGa.pickParent(evaluated, fitnessSum, random);
            const child = mother.crossover(father, random);
            child.mutate(this.mutationRate, random);
            next.push(child);
        }

        return next;
    }

    private static pickParent(evaluated: Evaluated[], fitnessSum: number, random: Random): NeuralNetwork {
        const rand = Math.floor(random() * fitnessSum);
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
