import Position from "./Position";
import Direction from "./Direction";
import BoardSize from "./BoardSize";

class Snake {
    head: Position
    body: Position[] = []
    direction: Direction
    boardSize: BoardSize

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize

        this.head = new Position(
            Math.ceil(boardSize.width / 2),
            Math.ceil(boardSize.height / 2)
        )
        this.direction = Direction.NORTH
    }

    public nextPosition(): void {
        this.nextBodyPosition()
        this.nextHeadPosition()
    }

    public clone(): Snake {
        return new Snake(this.boardSize)
    }

    private nextBodyPosition(): void {
        const body = [...this.body]
        body.pop()
        body.unshift(this.head)
        this.body = body
    }

    private nextHeadPosition(): void {
        switch (this.direction) {
            case Direction.EAST:
                this.head = new Position(this.head.x + 1, this.head.y)
                break;
            case Direction.NORTH:
                this.head = new Position(this.head.x, this.head.y - 1)
                break;
            case Direction.SOUTH:
                this.head = new Position(this.head.x, this.head.y + 1)
                break;
            case Direction.WEST:
                this.head = new Position(this.head.x - 1, this.head.y)
                break;
        }
    }
}

export default Snake