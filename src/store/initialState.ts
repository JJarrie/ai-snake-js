import SquareValue from "../rule/SquareValue";
import State from "./State";
import Snake from "../rule/Snake";
import BoardSize from "../rule/BoardSize";
import Position from "../rule/Position";
import Grid from "../rule/Grid";
import SnakeAi from "../ai/SnakeAi";

export const generateInitialState = (boardSize: BoardSize): State => {
    const grid = new Grid(boardSize)

    const snake = new Snake(new Position(
        Math.ceil(boardSize.width / 2),
        Math.ceil(boardSize.height / 2)
    ))
    grid.setSquareValue(SquareValue.SNAKE, snake.head)

    const food = Position.createRandom(boardSize)
    grid.setSquareValue(SquareValue.FOOD, food)

    return ({
        alive: true,
        score: 0,
        snake,
        boardSize,
        food,
        grid,
        ai: new SnakeAi(),
        vision: null
    })
}