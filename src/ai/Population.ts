import type { Episode, EpisodeState, GameDefinition } from '../game/Episode';
import NeuralNetwork from './NeuralNetwork';
import type EvolutionStrategy from './strategy/EvolutionStrategy';
import { deriveSeed, randomSeed } from '../utils/SeededRandom';

export interface PopulationState {
    name: string;
    bestScore: number;
    generation: number;
    bestFitness: number;
    fitnessSum: number;
    bestGeneration: number;
    /** Replay of the record episode. */
    replay: EpisodeState;
    /** Best score of each finished generation. */
    history: number[];
    archive?: (number | null)[][];
}

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

    bestScore = 0;
    generation = 1;
    bestGeneration = 0;
    bestFitness = 0;
    fitnessSum = 0;

    constructor(
        size: number,
        game: GameDefinition,
        strategy: EvolutionStrategy,
        baseSeed = randomSeed(),
        hiddenNeurons = 16,
    ) {
        this.strategy = strategy;
        this.game = game;
        this.baseSeed = baseSeed;

        const seed = this.generationSeed();
        // Later generations inherit this network shape from the strategy's brains.
        this.episodes = [...Array(size)].map(() =>
            game.createEpisode(new NeuralNetwork(game.inputs, [hiddenNeurons], game.outputs), seed),
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
        this.fitnessSum = this.fitness.reduce((sum, f) => sum + f, 0);
        this.history.push(this.episodes.reduce((max, episode) => Math.max(max, episode.score), 0));

        const brains = this.strategy.nextGeneration(
            this.episodes.map((episode, i) => ({
                brain: episode.brain,
                fitness: this.fitness[i],
                behavior: episode.behavior(),
            })),
            this.replay.brain,
        );

        this.generation = this.generation + 1;
        const seed = this.generationSeed();
        this.episodes = brains.map((brain) => this.game.createEpisode(brain, seed));
        this.fitness = [];
    }

    public calculateFitness(): void {
        this.fitness = this.episodes.map((episode) => episode.fitness());
    }

    public toState(): PopulationState {
        return {
            name: this.strategy.name,
            bestFitness: this.bestFitness,
            replay: this.replay.toState(),
            bestScore: this.bestScore,
            fitnessSum: this.fitnessSum,
            generation: this.generation,
            bestGeneration: this.bestGeneration,
            history: this.history,
            archive: this.strategy.archive?.(),
        };
    }

    private generationSeed(): number {
        return deriveSeed(this.baseSeed, this.generation);
    }
}

export default Population;
