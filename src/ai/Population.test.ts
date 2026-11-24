import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import IntelligentSnake from './IntelligentSnake';
import Population from './Population';

describe('Population', () => {
    it('keeps the mutation rate and mutates children with it', () => {
        const population = new Population(10, 1, new BoardSize(20, 20));
        expect(population.mutationRate).toBe(1);

        population.calculateFitness();
        const parentWeights = population.games.map(
            (g) => (g.snake as IntelligentSnake).neuralNetwork.weights[0].matrix[0][0],
        );

        population.naturalSelection();

        // games[0] is the untouched best clone; every other child is mutated at rate 1.
        const child = population.games[1].snake as IntelligentSnake;
        expect(parentWeights).not.toContain(child.neuralNetwork.weights[0].matrix[0][0]);
    });

    it('sums fitness over every game that pickParent can choose', () => {
        const population = new Population(5, 0, new BoardSize(20, 20));
        population.calculateFitness();
        population.naturalSelection();
        population.calculateFitness();
        const expected = population.games.reduce((sum, g) => sum + (g.snake as IntelligentSnake).fitness, 0);

        population.naturalSelection();

        expect(population.fitnessSum).toBeCloseTo(expected);
    });
});

describe('Population first generation', () => {
    it('replays the best game separately from games[0]', () => {
        const population = new Population(3, 0, new BoardSize(20, 20));

        expect(population.bestGame).not.toBe(population.games[0]);
    });
});
