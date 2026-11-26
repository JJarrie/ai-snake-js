import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import Population from './Population';
import ClassicGa from './strategy/ClassicGa';

const boardSize = new BoardSize(20, 20);

describe('Population', () => {
    it('mutates children with the strategy mutation rate', () => {
        const population = new Population(10, boardSize, new ClassicGa(1));

        population.calculateFitness();
        const parentWeights = population.games.map((g) => g.snake.neuralNetwork.weights[0].matrix[0][0]);

        population.naturalSelection();

        // games[0] is the untouched best clone; every other child is mutated at rate 1.
        const child = population.games[1].snake;
        expect(parentWeights).not.toContain(child.neuralNetwork.weights[0].matrix[0][0]);
    });

    it('sums fitness over every game of the generation', () => {
        const population = new Population(5, boardSize, new ClassicGa(0));
        population.calculateFitness();
        population.naturalSelection();
        population.calculateFitness();
        const expected = population.games.reduce((sum, g) => sum + g.snake.fitness, 0);

        population.naturalSelection();

        expect(population.fitnessSum).toBeCloseTo(expected);
    });

    it('records the best score of each generation and keeps its size', () => {
        const population = new Population(4, boardSize, new ClassicGa(0.1));
        population.calculateFitness();
        population.naturalSelection();

        expect(population.history).toHaveLength(1);
        expect(population.games).toHaveLength(4);
        expect(population.generation).toBe(2);
    });

    it('gives every game of a generation the same seed, shared between populations', () => {
        const a = new Population(3, boardSize, new ClassicGa(0.1), 7);
        const b = new Population(3, boardSize, new ClassicGa(0.1), 7);
        a.calculateFitness();
        a.naturalSelection();

        const seeds = new Set(a.games.map((g) => g.seed));
        expect(seeds.size).toBe(1);
        expect(b.games[0].seed).not.toBe(a.games[0].seed);
        b.calculateFitness();
        b.naturalSelection();
        expect(b.games[0].seed).toBe(a.games[0].seed);
    });
});

describe('Population first generation', () => {
    it('replays the best game separately from games[0]', () => {
        const population = new Population(3, boardSize, new ClassicGa(0));

        expect(population.bestGame).not.toBe(population.games[0]);
    });
});
