import Position from "./Position";
import Direction from "./Direction";
import BoardSize from "./BoardSize";

export interface SnakeState {
    head: Position
    body: Position[]
    direction: Direction
    alive: boolean
}

class Snake {
    head: Position
    body: Position[]
    direction: Direction
    boardSize: BoardSize
    alive: boolean = true

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize
        this.reset()
    }

    public nextPosition(): void {
        this.nextBodyPosition()
        this.nextHeadPosition()
    }

    public reset(): void {
        this.head = new Position(
            Math.ceil(this.boardSize.width / 2),
            Math.ceil(this.boardSize.height / 2)
        )
        this.direction = Direction.NORTH
        this.body = []
        this.alive = true
    }

    public isOutbound(): boolean {
        return this.head.y < 0 || this.head.y >= this.boardSize.height || this.head.x < 0 || this.head.x >= this.boardSize.width
    }

    public isInHimself(): boolean {
        return this.body.filter(bodyPosition => bodyPosition.isEqual(this.head)).length > 0
    }

    public updateAlive(): void {
        this.alive = !(this.isOutbound() || this.isInHimself())
    }

    public isEating(food: Position): boolean {
        return this.head.isEqual(food)
    }

    public clone(): Snake {
        return new Snake(this.boardSize)
    }


    public toState(): SnakeState {
        return {
            direction: this.direction,
            head: this.head,
            body: this.body,
            alive: this.alive
        }
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
