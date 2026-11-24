import Grid, { GridState } from './Grid';
import { SnakeState } from './Snake';
import BoardSize from './BoardSize';
import IntelligentSnake from '../ai/IntelligentSnake';
import Position from './Position';
import SquareValue from './SquareValue';

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

    constructor(boardSize: BoardSize, snake?: IntelligentSnake) {
        this.boardSize = boardSize;
        this.grid = new Grid(boardSize);
        this.score = 0;
        this.snake = snake ?? new IntelligentSnake(boardSize);

        this.generateFood();
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
        this.grid.setSquareValue(SquareValue.FOOD, this.food);
        this.grid.setSquareValue(SquareValue.HEAD, this.snake.head);
        this.snake.body.forEach((p) => this.grid.setSquareValue(SquareValue.SNAKE, p));
    }

    private generateFood(): void {
        do {
            this.food = Position.createRandom(this.boardSize);
        } while (this.food.isEqual(this.snake.head) || this.snake.body.some((p) => p.isEqual(this.food)));
    }

    /** New game with a copy of this snake's brain; score, food and grid start from scratch. */
    public cloneBrain(): Game {
        return new Game(this.boardSize, this.snake.clone());
    }

    public reset(): void {
        this.score = 0;
        this.snake.reset();
        this.snake.resetLife();
        this.generateFood();
    }
}

export default Game;
