import BoardSize from '../rule/BoardSize';
import IntelligentSnake from './IntelligentSnake';
import Game, { type GameState } from '../rule/Game';
import type EvolutionStrategy from './strategy/EvolutionStrategy';
import { deriveSeed, randomSeed } from '../utils/SeededRandom';

export interface PopulationState {
    name: string;
    bestScore: number;
    generation: number;
    bestFitness: number;
    fitnessSum: number;
    bestGeneration: number;
    bestGame: GameState;
    /** Best score of each finished generation. */
    history: number[];
}

class Population {
    strategy: EvolutionStrategy;
    boardSize: BoardSize;
    /** Populations sharing a base seed play the same food sequence at the same generation. */
    baseSeed: number;
    games: Game[];
    bestGame: Game;
    history: number[] = [];

    bestScore = 0;
    generation = 1;
    bestGeneration = 0;
    bestFitness = 0;
    fitnessSum = 0;

    constructor(size: number, boardSize: BoardSize, strategy: EvolutionStrategy, baseSeed = randomSeed()) {
        this.strategy = strategy;
        this.boardSize = boardSize;
        this.baseSeed = baseSeed;
        this.games = new Array<Game>(size);

        for (let i = 0; i < this.games.length; ++i) {
            this.games[i] = new Game(boardSize, undefined, this.generationSeed());
        }

        this.bestGame = this.games[0].cloneBrain();
    }

    public done(): boolean {
        for (const game of this.games) {
            if (!game.finish()) {
                return false;
            }

            if (!this.bestGame.finish()) {
                return false;
            }
        }

        return true;
    }

    public update(): void {
        Population.updateSingle(this.bestGame);
        this.games.forEach((game) => Population.updateSingle(game));
    }

    public electBestSnake(): void {
        let maxFitnessOfGeneration = 0;
        let maxIndex = 0;

        for (let i = 0; i < this.games.length; ++i) {
            const snake = this.games[i].snake;
            if (snake.fitness > maxFitnessOfGeneration) {
                maxFitnessOfGeneration = snake.fitness;
                maxIndex = i;
            }
        }

        if (maxFitnessOfGeneration > this.bestFitness) {
            this.bestGeneration = this.generation;
            this.bestFitness = maxFitnessOfGeneration;
            this.bestScore = this.games[maxIndex].score;
            // Same seed as the record game, so the displayed best replays it exactly.
            this.bestGame = this.games[maxIndex].cloneBrain();
        }
    }

    public naturalSelection(): void {
        this.electBestSnake();
        this.calculateFitnessSum();
        this.history.push(this.games.reduce((max, game) => Math.max(max, game.score), 0));

        this.bestGame.reset();

        const brains = this.strategy.nextGeneration(
            this.games.map((game) => ({ brain: game.snake.neuralNetwork, fitness: game.snake.fitness })),
            this.bestGame.snake.neuralNetwork,
        );

        this.generation = this.generation + 1;
        const seed = this.generationSeed();
        this.games = brains.map((brain) => new Game(this.boardSize, new IntelligentSnake(this.boardSize, brain), seed));
    }

    public calculateFitness(): void {
        this.games.forEach((game) => game.snake.calculateFitness(game.score));
    }

    public toState(): PopulationState {
        return {
            name: this.strategy.name,
            bestFitness: this.bestFitness,
            bestGame: this.bestGame.toState(),
            bestScore: this.bestScore,
            fitnessSum: this.fitnessSum,
            generation: this.generation,
            bestGeneration: this.bestGeneration,
            history: this.history,
        };
    }

    private generationSeed(): number {
        return deriveSeed(this.baseSeed, this.generation);
    }

    private calculateFitnessSum(): void {
        this.fitnessSum = this.games.reduce((prev, cur) => prev + cur.snake.fitness, 0);
    }

    private static updateSingle(game: Game): void {
        if (!game.finish()) {
            const intelligentSnake = game.snake;
            intelligentSnake.look(game.food);
            intelligentSnake.makeDecision();
            game.nextMove();
        }
    }
}

export default Population;
