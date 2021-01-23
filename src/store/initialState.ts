import SquareValue from "../rule/SquareValue";
import State from "./State";
import Snake from "../rule/Snake";
import BoardSize from "../rule/BoardSize";
import Position from "../rule/Position";
import Grid from "../rule/Grid";

export const generateInitialState = (boardSize: BoardSize): State => {
    const grid = new Grid(boardSize)

    const snake = new Snake({
        x: Math.ceil(boardSize.width / 2),
        y: Math.ceil(boardSize.height / 2),
    })
    grid.setValue(SquareValue.SNAKE, snake.head)

    const food = Position.createRandom(boardSize)
    grid.setValue(SquareValue.FOOD, food)

    return ({
        alive: true,
        score: 0,
        snake,
        boardSize,
        food,
        grid
    })
}