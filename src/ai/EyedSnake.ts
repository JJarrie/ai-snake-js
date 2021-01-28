import SnakeVision, {DistanceByDirection} from "./SnakeVision";
import Grid from "../rule/Grid";
import Snake from "../rule/Snake";
import SquareValue from "../rule/SquareValue";
import Direction from "../rule/Direction";

class EyedSnake extends Snake {
    vision: SnakeVision

    public look(grid: Grid): void {
        const food = this.lookingFor(grid, SquareValue.FOOD)
        const body = this.lookingFor(grid, SquareValue.SNAKE)
        const bounds: DistanceByDirection = {}
        bounds[Direction.NORTH] = this.head.y
        bounds[Direction.SOUTH] = grid.boardSize.height - this.head.y
        bounds[Direction.EAST] = this.head.x
        bounds[Direction.WEST] = grid.boardSize.width - this.head.x
        bounds[Direction.NORTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.NORTH])
        bounds[Direction.NORTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.NORTH])
        bounds[Direction.SOUTH_EAST] = Math.hypot(bounds[Direction.EAST], bounds[Direction.SOUTH])
        bounds[Direction.SOUTH_WEST] = Math.hypot(bounds[Direction.WEST], bounds[Direction.SOUTH])

        this.vision = new SnakeVision(food, body, bounds)
    }

    public lookingFor(grid: Grid, value: SquareValue): DistanceByDirection {
        const vision: DistanceByDirection = {}
        const squares = grid.getSquaresByValue(value)

        squares.forEach(square => {
            const distance = this.head.distanceFrom(square.position)
            const direction = this.head.directionTo(square.position)
            vision[direction] = distance
        })

        vision[Direction.NORTH] = vision[Direction.NORTH] || 0
        vision[Direction.SOUTH] = vision[Direction.SOUTH] || 0
        vision[Direction.EAST] = vision[Direction.EAST] || 0
        vision[Direction.WEST] = vision[Direction.WEST] || 0
        vision[Direction.NORTH_EAST] = vision[Direction.NORTH_EAST] || 0
        vision[Direction.NORTH_WEST] = vision[Direction.NORTH_WEST] || 0
        vision[Direction.SOUTH_EAST] = vision[Direction.SOUTH_EAST] || 0
        vision[Direction.SOUTH_WEST] = vision[Direction.SOUTH_WEST] || 0

        return vision
    }
}

export default EyedSnake