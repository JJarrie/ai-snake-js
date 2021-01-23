import BoardSize from "./BoardSize";
import Direction from "./Direction";

class Position {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    public distanceFrom(position: Position): number {
        return Math.abs(Math.sqrt(Math.pow(position.x - this.x, 2) + Math.pow(position.y - this.y, 2)))
    }

    public directionTo(position: Position): Direction {
        let direction: Direction = 0

        if (this.x > position.x) {
            direction = direction | Direction.WEST
        }

        if (this.x < position.x) {
            direction = direction | Direction.EAST
        }

        if (this.y > position.y) {
            direction = direction | Direction.NORTH
        }

        if (this.y < position.y) {
            direction = direction | Direction.SOUTH
        }

        return direction
    }

    static createRandom(boardSize: BoardSize): Position {
        return new Position(
            Math.floor(Math.random() * boardSize.width),
            Math.floor(Math.random() * boardSize.height)
        )
    }
}

export default Position