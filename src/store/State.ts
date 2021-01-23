import Position from "../rule/Position";
import Snake from "../rule/Snake";
import BoardSize from "../rule/BoardSize";
import Grid from "../rule/Grid";

interface State {
    grid: Grid,
    food: Position,
    alive: boolean,
    score: number,
    snake: Snake
    boardSize: BoardSize
}

export default State