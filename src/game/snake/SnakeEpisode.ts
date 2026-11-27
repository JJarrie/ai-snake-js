import type { VisionRay } from '../../ai/EyedSnake';
import IntelligentSnake from '../../ai/IntelligentSnake';
import type NeuralNetwork from '../../ai/NeuralNetwork';
import BoardSize from '../../rule/BoardSize';
import Game from '../../rule/Game';
import type { GridState } from '../../rule/Grid';
import type { Episode, EpisodeState, GameDefinition } from '../Episode';

export interface SnakeView {
    kind: 'snake';
    grid: GridState;
    /** Head cell the rays start from; null once the snake is dead. */
    head: { x: number; y: number } | null;
    /** What the snake sees from its current cell: its 8 lines of sight. */
    vision: VisionRay[];
}

/** The snake rules of src/rule and src/ai, behind the generic Episode interface. */
class SnakeEpisode implements Episode {
    game: Game;

    constructor(boardSize: BoardSize, brain: NeuralNetwork, seed: number, withObstacles = false) {
        this.game = new Game(boardSize, new IntelligentSnake(boardSize, brain), seed, withObstacles);
        brain.resetState();
    }

    get brain(): NeuralNetwork {
        return this.game.snake.neuralNetwork;
    }

    get seed(): number {
        return this.game.seed;
    }

    get score(): number {
        return this.game.score;
    }

    public finished(): boolean {
        return this.game.finish();
    }

    public step(): void {
        if (this.finished()) {
            return;
        }
        this.game.snake.look(this.game.food, this.game.obstacleKeys);
        this.game.snake.makeDecision();
        this.game.nextMove();
    }

    public fitness(): number {
        this.game.snake.calculateFitness(this.game.score);
        return this.game.snake.fitness;
    }

    public behavior(): number[] {
        return this.game.snake.behavior();
    }

    public reset(): void {
        this.game.reset();
        this.brain.resetState();
    }

    public toState(): EpisodeState {
        const state = this.game.toState();
        const { snake } = this.game;
        const alive = !state.finish;
        if (alive) {
            // Look from the current cell: the last look() was taken before the move. step() looks
            // again before deciding, so this does not change the game.
            snake.look(this.game.food, this.game.obstacleKeys);
        }

        return {
            score: state.score,
            finished: state.finish,
            view: {
                kind: 'snake',
                grid: state.grid,
                head: alive ? { x: snake.head.x, y: snake.head.y } : null,
                vision: alive ? snake.visionRays() : [],
            },
        };
    }
}

/** 8 directions x (food, body, wall) in; continue, left, right out. Obstacles are seen as walls. */
export const createSnakeGame = (boardSize: number, withObstacles = false): GameDefinition => ({
    id: 'snake',
    name: 'Snake',
    inputs: 24,
    outputs: 3,
    createEpisode: (brain, seed) => new SnakeEpisode(new BoardSize(boardSize, boardSize), brain, seed, withObstacles),
});

export default SnakeEpisode;
