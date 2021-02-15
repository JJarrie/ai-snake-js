import BoardSize from '../rule/BoardSize';
import IntelligentSnake from './IntelligentSnake';
import Game, { GameState } from '../rule/Game';
import PlayerType from '../rule/PlayerType';
import Snake from '../rule/Snake';

export interface PopulationState {
    bestScore: number;
    generation: number;
    bestFitness: number;
    fitnessSum: number;
    bestGeneration: number;
    bestGame: GameState;
}

class Population {
    mutationRate: number;
    games: Game[];
    bestGame: Game;

    bestScore = 0;
    generation = 1;
    bestGeneration = 0;
    bestFitness = 0;
    fitnessSum = 0;

    constructor(size: number, mutationRate: number, boardSize: BoardSize) {
        this.games = new Array<Game>(size);

        for (let i = 0; i < this.games.length; ++i) {
            this.games[i] = new Game(boardSize, PlayerType.AI);
        }

        this.bestGame = this.games[0];
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
        this.games.forEach(Population.updateSingle);
    }

    public electBestSnake(): void {
        let maxFitnessOfGeneration = 0;
        let maxIndex = 0;

        for (let i = 0; i < this.games.length; ++i) {
            const snake = this.games[i].snake as IntelligentSnake;
            if ((i === 0 ? this.bestFitness : snake.fitness) > maxFitnessOfGeneration) {
                maxFitnessOfGeneration = snake.fitness;
                maxIndex = i;
            }
        }

        if (maxFitnessOfGeneration > this.bestFitness) {
            this.bestGeneration = this.generation;
            this.bestFitness = maxFitnessOfGeneration;
            this.bestGame = this.games[maxIndex].clone();
            this.bestScore = this.bestGame.score;
        }
    }

    public pickParent(): Snake {
        const rand = Math.floor(Math.random() * this.fitnessSum);
        let summation = 0;

        for (const game of this.games) {
            summation = summation + (game.snake as IntelligentSnake).fitness;
            if (summation > rand) {
                return game.snake;
            }
        }

        return this.games[0].snake;
    }

    public naturalSelection(): void {
        const games = new Array<Game>();

        this.electBestSnake();
        this.calculateFitnessSum();

        this.bestGame.reset();
        games[0] = this.bestGame.clone();

        for (let i = 1; i < this.games.length; ++i) {
            const parent = this.pickParent() as IntelligentSnake;
            const partner = this.pickParent() as IntelligentSnake;
            const child = parent.crossover(partner);
            child.mutate(this.mutationRate);
            const newGame = new Game(this.games[i].boardSize, this.games[i].playerType, child);
            games.push(newGame);
        }

        this.games = games;
        this.generation = this.generation + 1;
    }

    public calculateFitness(): void {
        this.games.forEach((game) => (game.snake as IntelligentSnake).calculateFitness(game.score));
    }

    public toState(): PopulationState {
        return {
            bestFitness: this.bestFitness,
            bestGame: this.bestGame.toState(),
            bestScore: this.bestScore,
            fitnessSum: this.fitnessSum,
            generation: this.generation,
            bestGeneration: this.bestGeneration,
        };
    }

    private calculateFitnessSum(): void {
        this.fitnessSum = this.bestFitness;
        this.fitnessSum =
            this.bestFitness +
            this.games.slice(1).reduce((prev, cur) => prev + (cur.snake as IntelligentSnake).fitness, 0);
    }

    private static updateSingle(game: Game): void {
        if (!game.finish()) {
            const intelligentSnake = game.snake as IntelligentSnake;
            intelligentSnake.look(game.food);
            intelligentSnake.makeDecision();
            game.nextMove();
        }
    }
}

export default Population;
