import type { Episode, EpisodeState, GameDefinition } from '../game/Episode';
import NeuralNetwork from './NeuralNetwork';
import type EvolutionStrategy from './strategy/EvolutionStrategy';
import { downsampleMax } from '../utils/downsample';
import { deriveSeed, randomSeed, seededRandom, type Random } from '../utils/SeededRandom';

export interface PopulationState {
    name: string;
    bestScore: number;
    generation: number;
    bestGeneration: number;
    /** Replay of the record episode. */
    replay: EpisodeState;
    /**
     * Best score per finished generation, reduced to at most HISTORY_POINTS values: each value is the best
     * of `historyStep` consecutive generations. The full history stays on the server.
     */
    history: number[];
    historyStep: number;
    /** Best score of the last finished generation (0 before the first). */
    lastBest: number;
    archive?: (number | null)[][];
}

/** The history grows by one value per generation: it is sent reduced, or a long run would flood the socket. */
const HISTORY_POINTS = 500;

/** Seed index of the evolution's random stream; the worlds use the generation numbers, from 1. */
const EVOLUTION_STREAM = -1;

/** One strategy training networks on one game; knows nothing of the game's rules. */
class Population {
    strategy: EvolutionStrategy;
    game: GameDefinition;
    /** Populations sharing a base seed face the same world at the same generation. */
    baseSeed: number;
    episodes: Episode[];
    /** Fitness of each episode, set by calculateFitness. */
    fitness: number[] = [];
    replay: Episode;
    history: number[] = [];
    /** Copy of the best network of the last finished generation; null before the first one. */
    generationBest: NeuralNetwork | null = null;
    /** Every draw of the evolution (first weights, selection, mutation): seeded, so a run is reproducible. */
    readonly random: Random;

    bestScore = 0;
    generation = 1;
    bestGeneration = 0;
    bestFitness = 0;

    constructor(
        size: number,
        game: GameDefinition,
        strategy: EvolutionStrategy,
        baseSeed = randomSeed(),
        hiddenNeurons = 16,
        recurrent = false,
    ) {
        this.strategy = strategy;
        this.game = game;
        this.baseSeed = baseSeed;
        // Its own stream, apart from the worlds: same base seed, same first networks and same evolution.
        this.random = seededRandom(deriveSeed(baseSeed, EVOLUTION_STREAM));

        const seed = this.generationSeed();
        // Later generations inherit this network shape (and memory setting) from the strategy's brains.
        this.episodes = [...Array(size)].map(() =>
            game.createEpisode(
                new NeuralNetwork(game.inputs, [hiddenNeurons], game.outputs, undefined, recurrent, this.random),
                seed,
            ),
        );
        this.replay = game.createEpisode(this.episodes[0].brain.clone(), seed);
    }

    public done(): boolean {
        return this.episodes.every((episode) => episode.finished());
    }

    public update(): void {
        this.episodes.forEach((episode) => episode.step());
    }

    /** One move of the record replay, which runs at display pace, apart from training; loops once over. */
    public stepReplay(): void {
        if (this.replay.finished()) {
            this.replay.reset();
        }
        this.replay.step();
    }

    public electBest(): void {
        let maxFitnessOfGeneration = 0;
        let maxIndex = 0;

        this.fitness.forEach((fitness, i) => {
            if (fitness > maxFitnessOfGeneration) {
                maxFitnessOfGeneration = fitness;
                maxIndex = i;
            }
        });

        if (maxFitnessOfGeneration > this.bestFitness) {
            const best = this.episodes[maxIndex];
            this.bestGeneration = this.generation;
            this.bestFitness = maxFitnessOfGeneration;
            this.bestScore = best.score;
            // Same seed as the record episode, so the displayed best replays it exactly.
            this.replay = this.game.createEpisode(best.brain.clone(), best.seed);
        }
    }

    public naturalSelection(): void {
        this.electBest();
        this.history.push(this.episodes.reduce((max, episode) => Math.max(max, episode.score), 0));
        // A copy: strategies may reuse or mutate this generation's networks.
        const bestIndex = this.fitness.reduce((best, f, i) => (f > this.fitness[best] ? i : best), 0);
        const generationBest = this.episodes[bestIndex].brain.clone();
        this.generationBest = generationBest;

        const brains = this.strategy.nextGeneration(
            this.episodes.map((episode, i) => ({
                brain: episode.brain,
                fitness: this.fitness[i],
                behavior: episode.behavior(),
            })),
            // Not the record: picked from one episode on one seed, it would stay the elite for ever.
            generationBest,
            this.random,
        );

        this.generation = this.generation + 1;
        const seed = this.generationSeed();
        this.episodes = brains.map((brain) => this.game.createEpisode(brain, seed));
        this.fitness = [];
    }

    public calculateFitness(): void {
        this.fitness = this.episodes.map((episode) => episode.fitness());
    }

    /**
     * The network this strategy stands for after its last finished generation, the one to measure on
     * held-out worlds: its own policy (ES mean, best MAP-Elites elite), else the generation's fittest brain.
     */
    public policy(): NeuralNetwork | null {
        if (this.generationBest === null) {
            return null;
        }
        return this.strategy.policy?.(this.generationBest) ?? this.generationBest;
    }

    public toState(): PopulationState {
        const history = downsampleMax(this.history, HISTORY_POINTS);

        return {
            name: this.strategy.name,
            replay: this.replay.toState(),
            bestScore: this.bestScore,
            generation: this.generation,
            bestGeneration: this.bestGeneration,
            history: history.values,
            historyStep: history.step,
            lastBest: this.history.length > 0 ? this.history[this.history.length - 1] : 0,
            archive: this.strategy.archive?.(),
        };
    }

    private generationSeed(): number {
        return deriveSeed(this.baseSeed, this.generation);
    }
}

export default Population;
