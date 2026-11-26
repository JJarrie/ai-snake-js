import Grid, { type GridState } from './Grid';
import type { SnakeState } from './Snake';
import BoardSize from './BoardSize';
import IntelligentSnake from '../ai/IntelligentSnake';
import Position from './Position';
import SquareValue from './SquareValue';
import { deriveSeed, randomSeed, seededRandom } from '../utils/SeededRandom';

/** One wall segment (2 to 4 cells) per this many cells: 8 segments on a 20 x 20 board. */
const OBSTACLE_CELLS_PER_SEGMENT = 50;
/** No wall within this many cells of the snake's start. */
const SAFE_RADIUS = 3;

export interface GameState {
    grid: GridState;
    score: number;
    snake: SnakeState;
    finish: boolean;
}

class Game {
    boardSize: BoardSize;
    grid: Grid;
    snake: IntelligentSnake;
    score: number;
    food: Position;
    /** Same seed, same food sequence: games sharing a seed are compared on equal terms. */
    seed: number;
    foodCount = 0;
    withObstacles: boolean;
    /** Wall cells inside the board, as y * width + x; empty without obstacles. */
    obstacleKeys = new Set<number>();

    constructor(boardSize: BoardSize, snake?: IntelligentSnake, seed = randomSeed(), withObstacles = false) {
        this.boardSize = boardSize;
        this.grid = new Grid(boardSize);
        this.score = 0;
        this.snake = snake ?? new IntelligentSnake(boardSize);
        this.seed = seed;
        this.withObstacles = withObstacles;

        if (withObstacles) {
            this.generateObstacles();
        }
        this.generateFood();
    }

    public keyOf(position: Position): number {
        return position.y * this.boardSize.width + position.x;
    }

    public finish(): boolean {
        return !this.snake.alive;
    }

    public nextMove(): void {
        if (this.snake.isEating(this.food)) {
            this.snake.addLife();
            this.snake.body.unshift(this.food);
            this.score = this.score + 1;
            this.generateFood();
        }

        this.snake.nextPosition();
        this.snake.updateAlive();
        if (this.obstacleKeys.has(this.keyOf(this.snake.head))) {
            this.snake.alive = false;
        }
    }

    public toState(): GameState {
        this.snake.calculateFitness(this.score);
        // Grid is built only for displayed games; a dead snake keeps its last drawn frame.
        if (!this.finish()) {
            this.updateGrid();
        }
        return {
            grid: this.grid.toState(),
            score: this.score,
            snake: this.snake.toState(),
            finish: this.finish(),
        };
    }

    private updateGrid(): void {
        this.grid.clear();
        this.obstacleKeys.forEach((key) =>
            this.grid.setSquareValue(
                SquareValue.WALL,
                new Position(key % this.boardSize.width, Math.floor(key / this.boardSize.width)),
            ),
        );
        this.grid.setSquareValue(SquareValue.FOOD, this.food);
        this.grid.setSquareValue(SquareValue.HEAD, this.snake.head);
        this.snake.body.forEach((p) => this.grid.setSquareValue(SquareValue.SNAKE, p));
    }

    private generateFood(): void {
        // One stream per food index, so a redraw (food on the body) does not shift the following foods.
        const random = seededRandom(deriveSeed(this.seed, this.foodCount));
        this.foodCount = this.foodCount + 1;
        do {
            this.food = Position.createRandom(this.boardSize, random);
        } while (
            this.food.isEqual(this.snake.head) ||
            this.snake.body.some((p) => p.isEqual(this.food)) ||
            this.obstacleKeys.has(this.keyOf(this.food))
        );
    }

    /**
     * Short wall segments drawn from the seed (its own stream, apart from the food), so every game
     * of a generation gets the same map. Cells near the snake's start stay free.
     */
    private generateObstacles(): void {
        const random = seededRandom(this.seed);
        const { width, height } = this.boardSize;
        const start = this.snake.head;
        const segments = Math.round((width * height) / OBSTACLE_CELLS_PER_SEGMENT);

        for (let i = 0; i < segments; ++i) {
            const x = Math.floor(random() * width);
            const y = Math.floor(random() * height);
            const horizontal = random() < 0.5;
            const length = 2 + Math.floor(random() * 3);

            for (let k = 0; k < length; ++k) {
                const cell = new Position(horizontal ? x + k : x, horizontal ? y : y + k);
                const nearStart = Math.max(Math.abs(cell.x - start.x), Math.abs(cell.y - start.y)) <= SAFE_RADIUS;
                if (cell.x < width && cell.y < height && !nearStart) {
                    this.obstacleKeys.add(this.keyOf(cell));
                }
            }
        }
    }

    /** New game with a copy of this snake's brain; same seed by default, so it replays this game exactly. */
    public cloneBrain(seed = this.seed): Game {
        return new Game(this.boardSize, this.snake.clone(), seed, this.withObstacles);
    }

    public reset(): void {
        this.score = 0;
        this.foodCount = 0;
        this.snake.reset();
        this.snake.resetLife();
        this.generateFood();
    }
}

export default Game;
