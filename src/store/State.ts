import Position from "../rule/Position";
import Snake from "../rule/Snake";
import BoardSize from "../rule/BoardSize";
import Grid from "../rule/Grid";
import SnakeAi from "../ai/SnakeAi";
import SnakeVision from "../ai/SnakeVision";

interface State {
    snake: Snake,
    grid: Grid,
    food: Position,
    alive: boolean,
    score: number,
    boardSize: BoardSize
    ai: SnakeAi,
    vision: SnakeVision
}

export default State