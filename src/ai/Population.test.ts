import { describe, expect, it } from 'vitest';
import type { Episode } from '../game/Episode';
import type SnakeEpisode from '../game/snake/SnakeEpisode';
import { createSnakeGame } from '../game/snake/SnakeEpisode';
import { heldOutScore, heldOutSeeds } from './heldOut';
import Population from './Population';
import ClassicGa from './strategy/ClassicGa';
import type EvolutionStrategy from './strategy/EvolutionStrategy';
import OpenAiEs from './strategy/OpenAiEs';
import type NeuralNetwork from './NeuralNetwork';

const snakeGame = createSnakeGame(20);
const snakeOf = (episode: Episode) => (episode as SnakeEpisode).game.snake;

describe('Population state', () => {
    it('sends a bounded history after a long run, plus the last generation best', () => {
        const population = new Population(3, snakeGame, new ClassicGa(0.1));
        population.history = [...Array(20000)].map((_, i) => i % 50);

        const state = population.toState();

        expect(state.history.length).toBeLessThanOrEqual(500);
        expect(state.historyStep).toBe(40);
        expect(state.lastBest).toBe(19999 % 50);
        // The full history stays on the server for the benchmark.
        expect(population.history).toHaveLength(20000);
    });
});

describe('Population', () => {
    it('mutates children with the strategy mutation rate', () => {
        const population = new Population(10, snakeGame, new ClassicGa(1));

        population.calculateFitness();
        const parentWeights = population.episodes.map((e) => e.brain.weights[0].matrix[0][0]);

        population.naturalSelection();

        // episodes[0] is the untouched best clone; every other child is mutated at rate 1.
        expect(parentWeights).not.toContain(population.episodes[1].brain.weights[0].matrix[0][0]);
    });

    it('records the best score of each generation and keeps its size', () => {
        const population = new Population(4, snakeGame, new ClassicGa(0.1));
        population.calculateFitness();
        population.naturalSelection();

        expect(population.history).toHaveLength(1);
        expect(population.episodes).toHaveLength(4);
        expect(population.generation).toBe(2);
    });

    it('gives every episode of a generation the same seed, shared between populations', () => {
        const a = new Population(3, snakeGame, new ClassicGa(0.1), 7);
        const b = new Population(3, snakeGame, new ClassicGa(0.1), 7);
        a.calculateFitness();
        a.naturalSelection();

        const seeds = new Set(a.episodes.map((e) => e.seed));
        expect(seeds.size).toBe(1);
        expect(b.episodes[0].seed).not.toBe(a.episodes[0].seed);
        b.calculateFitness();
        b.naturalSelection();
        expect(b.episodes[0].seed).toBe(a.episodes[0].seed);
    });
});

describe('Population network size', () => {
    it('builds the first generation with the game inputs/outputs and the requested hidden layer', () => {
        const population = new Population(4, snakeGame, new ClassicGa(0.1), 1, 8);
        const brain = population.episodes[0].brain;
        expect([brain.inputsNodes, brain.hiddenLayers, brain.outputsNodes]).toEqual([24, [8], 3]);

        population.calculateFitness();
        population.naturalSelection();

        expect(population.episodes[1].brain.hiddenLayers).toEqual([8]);
    });
});

describe('Population memory', () => {
    it('builds recurrent networks on demand, kept by every strategy generation', () => {
        const population = new Population(4, snakeGame, new ClassicGa(0.1), 1, 8, true);
        expect(population.episodes[0].brain.recurrent).toBe(true);

        population.calculateFitness();
        population.naturalSelection();

        population.episodes.forEach((e) => expect(e.brain.recurrent).toBe(true));
    });

    it('replays a recurrent record exactly: memory is cleared on reset', () => {
        const population = new Population(3, snakeGame, new ClassicGa(0.1), 5, 8, true);
        const replay = population.replay;
        while (!replay.finished()) {
            replay.step();
        }
        const { score } = replay;
        const lifetime = snakeOf(replay).lifetime;

        replay.reset();
        while (!replay.finished()) {
            replay.step();
        }

        expect([replay.score, snakeOf(replay).lifetime]).toEqual([score, lifetime]);
    });
});

describe('Population replay', () => {
    it('is not stepped by training and does not hold a generation back', () => {
        const population = new Population(3, snakeGame, new ClassicGa(0.1));
        population.episodes.forEach((e) => (snakeOf(e).alive = false));

        population.update();

        expect(snakeOf(population.replay).lifetime).toBe(0);
        expect(population.done()).toBe(true);
    });

    it('moves one step per stepReplay and restarts once over', () => {
        const population = new Population(3, snakeGame, new ClassicGa(0.1));

        population.stepReplay();
        expect(snakeOf(population.replay).lifetime).toBe(1);

        snakeOf(population.replay).alive = false;
        population.stepReplay();
        expect(population.replay.finished()).toBe(false);
        expect(snakeOf(population.replay).lifetime).toBe(1);
    });

    it('replays the record episode with its own seed', () => {
        const population = new Population(3, snakeGame, new ClassicGa(0.1));
        expect(population.replay).not.toBe(population.episodes[0]);

        population.calculateFitness();
        population.naturalSelection();

        expect(population.replay.seed).not.toBe(population.episodes[0].seed);
    });
});

describe('Population generation best', () => {
    it('keeps a copy of the fittest network of the last finished generation', () => {
        const population = new Population(4, snakeGame, new ClassicGa(0.1));
        expect(population.generationBest).toBeNull();

        population.calculateFitness();
        population.fitness = [1, 5, 2, 3];
        const fittest = population.episodes[1].brain;
        population.naturalSelection();

        expect(population.generationBest).not.toBe(fittest);
        expect(population.generationBest?.toVector()).toEqual(fittest.toVector());
    });
});

describe('Population elite', () => {
    it("hands the strategy this generation's fittest brain, not the all-time record", () => {
        const received: NeuralNetwork[] = [];
        const recorder: EvolutionStrategy = {
            name: 'recorder',
            nextGeneration: (evaluated, best) => {
                received.push(best);
                return evaluated.map((e) => e.brain);
            },
        };
        const population = new Population(3, snakeGame, recorder);

        population.fitness = [1, 5, 2];
        population.naturalSelection();
        // Below the record (5): a lucky record must not stay the elite for ever.
        population.fitness = [3, 1, 1];
        const fittest = population.episodes[0].brain;
        population.naturalSelection();

        expect(received[1].toVector()).toEqual(fittest.toVector());
        expect(received[1].toVector()).not.toEqual(population.replay.brain.toVector());
    });
});

describe('Population policy', () => {
    it('is null before the first generation, then the strategy policy or the generation best', () => {
        const ga = new Population(4, snakeGame, new ClassicGa(0.1), 3);
        const es = new Population(4, snakeGame, new OpenAiEs(), 3);
        expect(ga.policy()).toBeNull();

        [ga, es].forEach((p) => {
            p.calculateFitness();
            p.naturalSelection();
        });

        expect(ga.policy()?.toVector()).toEqual(ga.generationBest?.toVector());
        expect(es.policy()?.toVector()).toEqual((es.strategy as OpenAiEs).mean);
    });
});

describe('Population policy score', () => {
    it('measures the policy on the held-out worlds once per finished generation, and sends it', () => {
        const population = new Population(4, snakeGame, new ClassicGa(0.1), 9);
        population.measurePolicy();
        expect(population.toState().policyScore).toBeNull();

        population.calculateFitness();
        population.naturalSelection();
        population.measurePolicy();

        const expected = heldOutScore(snakeGame, population.policy() as NeuralNetwork, heldOutSeeds(9));
        expect(population.toState().policyScore).toBe(expected);
        expect(population.policyGeneration).toBe(1);
    });
});
