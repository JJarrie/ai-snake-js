import Grid, { GridState } from './Grid';
import Snake, { SnakeState } from './Snake';
import BoardSize from './BoardSize';
import PlayerType from './PlayerType';
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
    playerType: PlayerType;
    boardSize: BoardSize;
    grid: Grid;
    snake: Snake;
    score: number;
    food: Position;

    constructor(boardSize: BoardSize, playerType: PlayerType, snake?: Snake) {
        this.playerType = playerType;
        this.boardSize = boardSize;
        this.grid = new Grid(boardSize);
        this.score = 0;

        if (snake) {
            this.snake = snake;
        } else {
            switch (playerType) {
                case PlayerType.AI:
                    this.snake = new IntelligentSnake(boardSize);
                    break;
                case PlayerType.HUMAN:
                default:
                    this.snake = new Snake(boardSize);
            }
        }

        this.generateFood();
    }

    public finish(): boolean {
        return !this.snake.alive;
    }

    public nextMove(): void {
        if (this.snake.isEating(this.food)) {
            if (this.snake instanceof IntelligentSnake) {
                this.snake.addLife();
            }
            this.snake.body.unshift(this.food);
            this.score = this.score + 1;
            this.generateFood();
        } else {
            (this.snake as IntelligentSnake).addPenalty();
        }

        this.snake.nextPosition();
        this.snake.updateAlive();

        if (!this.finish()) {
            this.updateGrid();
        }
    }

    public toState(): GameState {
        (this.snake as IntelligentSnake).calculateFitness(this.score);
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
        } while (this.snake.body.filter((p) => p.isEqual(this.food)).length > 0);
    }

    public clone(): Game {
        const clone = new Game(this.boardSize, this.playerType);
        clone.food = this.food.clone();
        clone.snake = this.snake.clone();
        clone.grid = this.grid.clone();
        clone.score = this.score;

        return clone;
    }

    public reset(): void {
        this.generateFood();
        this.score = 0;
        this.snake.reset();
        if (this.snake instanceof IntelligentSnake) {
            this.snake.resetLife();
        }
        this.updateGrid();
    }
}

export default Game;
