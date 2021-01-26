import SnakeVision, {DistanceByDirection} from "./SnakeVision";
import Grid from "../rule/Grid";
import Snake from "../rule/Snake";
import SquareValue from "../rule/SquareValue";
import Direction from "../rule/Direction";
import AwareSnake from "./AwareSnake";

class EyedSnake extends AwareSnake {
    snake: Snake
    vision: SnakeVision

    public look(): void {
        const food = this.lookingFor(this.grid, SquareValue.FOOD)
        const body = this.lookingFor(this.grid, SquareValue.SNAKE)
        const bounds: DistanceByDirection = {}
        bounds[Direction.NORTH] = this.snake.head.y
        bounds[Direction.SOUTH] = this.grid.boardSize.height - this.snake.head.y
        bounds[Direction.EAST] = this.snake.head.x
        bounds[Direction.WEST] = this.grid.boardSize.width - this.snake.head.x
        bounds[Direction.NORTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.NORTH])
        bounds[Direction.NORTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.NORTH])
        bounds[Direction.SOUTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.SOUTH])
        bounds[Direction.SOUTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.SOUTH])

        this.vision = new SnakeVision(food, bounds, body)
    }

    public getVision(): SnakeVision {
        return this.vision
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

export default EyedSnake