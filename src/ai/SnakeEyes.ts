import SnakeVision, {DistanceByDirection} from "./SnakeVision";
import Grid from "../rule/Grid";
import Snake from "../rule/Snake";
import SquareValue from "../rule/SquareValue";
import Direction from "../rule/Direction";

class SnakeEyes {
    snake: Snake

    constructor(snake: Snake) {
        this.snake = snake
    }

    public look(grid: Grid): SnakeVision {
        const food = this.lookingFor(grid, SquareValue.FOOD)
        const body = this.lookingFor(grid, SquareValue.SNAKE)
        const bounds: DistanceByDirection = {}
        bounds[Direction.NORTH] = this.snake.head.y
        bounds[Direction.SOUTH] = grid.boardSize.height - this.snake.head.y
        bounds[Direction.EAST] = this.snake.head.x
        bounds[Direction.WEST] = grid.boardSize.width - this.snake.head.x
        bounds[Direction.NORTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.NORTH])
        bounds[Direction.NORTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.NORTH])
        bounds[Direction.SOUTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.SOUTH])
        bounds[Direction.SOUTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.SOUTH])

        return {food, bounds, body}
    }

    public lookingFor(grid: Grid, value: SquareValue): DistanceByDirection {
        const vision: DistanceByDirection = {}
        const squares = grid.getSquaresByValue(value)

        squares.forEach(square => {
            const distance = this.snake.head.distanceFrom(square.position)
            const direction = this.snake.head.directionTo(square.position)
            vision[direction] = distance
        })

        return vision
    }
}

export default SnakeEyes