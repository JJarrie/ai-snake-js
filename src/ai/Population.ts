import BoardSize from '../rule/BoardSize';
import IntelligentSnake from './IntelligentSnake';
import Game, { type GameState } from '../rule/Game';

export interface PopulationState {
    bestScore: number;
    generation: number;
    bestFitness: number;
    fitnessSum: number;
    episode: number;
    episodes: number;
    bestGeneration: number;
    bestGame: GameState;
}

class Population {
    mutationRate: number;
    // Each snake is judged on several games (new food each time) and its fitness is the average:
    // a single lucky food layout no longer selects a snake that circles without seeking food.
    episodes: number;
    episode = 0;
    games: Game[];
    bestGame: Game;

    bestScore = 0;
    generation = 1;
    bestGeneration = 0;
    bestFitness = 0;
    fitnessSum = 0;

    private fitnessTotals: number[];
    private scoreTotals: number[];

    constructor(size: number, mutationRate: number, boardSize: BoardSize, episodes = 1) {
        this.mutationRate = mutationRate;
        this.episodes = episodes;
        this.fitnessTotals = new Array<number>(size).fill(0);
        this.scoreTotals = new Array<number>(size).fill(0);
        this.games = new Array<Game>(size);

        for (let i = 0; i < this.games.length; ++i) {
            this.games[i] = new Game(boardSize);
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
            this.bestScore = Math.round(this.scoreTotals[maxIndex] / this.episodes) || this.games[maxIndex].score;
            this.bestGame = this.games[maxIndex].cloneBrain();
        }
    }

    public pickParent(): IntelligentSnake {
        const rand = Math.floor(Math.random() * this.fitnessSum);
        let summation = 0;

        for (const game of this.games) {
            summation = summation + game.snake.fitness;
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
        games[0] = this.bestGame.cloneBrain();

        for (let i = 1; i < this.games.length; ++i) {
            const parent = this.pickParent();
            const partner = this.pickParent();
            const child = parent.crossover(partner);
            child.mutate(this.mutationRate);
            const newGame = new Game(this.games[i].boardSize, child);
            games.push(newGame);
        }

        this.games = games;
        this.generation = this.generation + 1;
    }

    /** Ends one game of every snake; after the last episode, averages the fitness and breeds the next generation. */
    public finishEpisode(): void {
        this.calculateFitness();
        this.games.forEach((game, i) => {
            this.fitnessTotals[i] += game.snake.fitness;
            this.scoreTotals[i] += game.score;
        });
        this.episode = this.episode + 1;

        if (this.episode < this.episodes) {
            this.games.forEach((game) => game.reset());
            this.bestGame.reset();
            return;
        }

        this.games.forEach((game, i) => (game.snake.fitness = this.fitnessTotals[i] / this.episodes));
        this.naturalSelection();
        this.episode = 0;
        this.fitnessTotals.fill(0);
        this.scoreTotals.fill(0);
    }

    public calculateFitness(): void {
        this.games.forEach((game) => game.snake.calculateFitness(game.score));
    }

    public toState(): PopulationState {
        return {
            bestFitness: this.bestFitness,
            bestGame: this.bestGame.toState(),
            bestScore: this.bestScore,
            fitnessSum: this.fitnessSum,
            episode: this.episode + 1,
            episodes: this.episodes,
            generation: this.generation,
            bestGeneration: this.bestGeneration,
        };
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
