import Position from "../rule/Position";
import Snake from "../rule/Snake";
import BoardSize from "../rule/BoardSize";
import Grid from "../rule/Grid";
import SnakeVision from "../ai/SnakeVision";
import Population from "../ai/Population";
import PlayerType from "../rule/PlayerType";

interface State {
    playerType: PlayerType,
    population?: Population,
    snake: Snake,
    grid: Grid,
    food: Position,
    alive: boolean,
    score: number,
    boardSize: BoardSize
    vision: SnakeVision
}

export default State