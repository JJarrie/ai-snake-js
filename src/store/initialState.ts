import SquareValue from "../rule/SquareValue";
import State from "./State";
import BoardSize from "../rule/BoardSize";
import Position from "../rule/Position";
import Grid from "../rule/Grid";
import PlayerType from "../rule/PlayerType";
import EyedSnake from "../ai/EyedSnake";

export const generateInitialState = (playerType: PlayerType, boardSize: BoardSize): State => {
    const grid = new Grid(boardSize)

    const snake = new EyedSnake(boardSize)
    grid.setSquareValue(SquareValue.SNAKE, snake.head)

    const food = Position.createRandom(boardSize)
    grid.setSquareValue(SquareValue.FOOD, food)

    return ({
        playerType,
        alive: true,
        score: 0,
        snake,
        boardSize,
        food,
        grid,
        vision: null
    })
}