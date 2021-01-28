import Grid, {GridState} from "./Grid";
import Snake, {SnakeState} from "./Snake";
import BoardSize from "./BoardSize";
import PlayerType from "./PlayerType";
import SnakeRule from "./SnakeRule";
import IntelligentSnake from "../ai/IntelligentSnake";
import Position from "./Position";
import SquareValue from "./SquareValue";

export interface GameState {
    grid: GridState
    score: number
    snake: SnakeState,
    finish: boolean
}

class Game {
    playerType: PlayerType
    boardSize: BoardSize
    grid: Grid
    snake: Snake
    rule: SnakeRule
    score: number
    food: Position

    constructor(boardSize: BoardSize, playerType: PlayerType, snake?: Snake) {
        this.playerType = playerType
        this.boardSize = boardSize
        this.grid = new Grid(boardSize)
        this.rule = new SnakeRule(boardSize)
        this.score = playerType === PlayerType.AI ? 3 : 1

        if (snake) {
            this.snake = snake
        } else {
            switch (playerType) {
                case PlayerType.AI:
                    this.snake = new IntelligentSnake(boardSize)
                    break
                case PlayerType.HUMAN:
                default:
                    this.snake = new Snake(boardSize)
            }
        }

        this.generateFood()
    }

    public finish(): boolean {
        return !this.rule.isAlive(this.snake)
    }

    public nextMove(): void {
        if (this.rule.isEating(this.snake.head, this.food)) {
            if (this.snake instanceof IntelligentSnake) {
                this.snake.addLife()
            }
            this.snake.body.unshift(this.food)
            this.score = this.score + 1
            this.generateFood()
        }

        this.snake.nextPosition()
        if (!this.finish()) {
            this.updateGrid()
        }
    }

    public toState(): GameState {
        (this.snake as IntelligentSnake).calculateFitness(this.score)
        return {
            grid: this.grid.toState(),
            score: this.score,
            snake: this.snake.toState(),
            finish: this.finish()
        }
    }

    private updateGrid(): void {
        this.grid.clear()
        this.grid.setSquareValue(SquareValue.FOOD, this.food)
        this.grid.setSquareValue(SquareValue.SNAKE, this.snake.head)
        this.snake.body.forEach(p => this.grid.setSquareValue(SquareValue.SNAKE, p))
    }

    private generateFood(): void {
        do {
            this.food = Position.createRandom(this.boardSize)
        } while (this.snake.body.filter(p => p.isEqual(this.food)).length > 0)
    }

    public clone(): Game {
        const clone = new Game(this.boardSize, this.playerType)
        clone.food = this.food.clone()
        clone.snake = this.snake.clone()
        clone.grid = this.grid.clone()
        clone.score = this.score

        return clone
    }

    public reset(): void {
        this.generateFood()
        this.score = this.playerType === PlayerType.AI ? 3 : 1
        this.snake.reset()
        if (this.snake instanceof IntelligentSnake) {
            this.snake.resetLife()
        }
        this.updateGrid()
    }
}

export default Game
