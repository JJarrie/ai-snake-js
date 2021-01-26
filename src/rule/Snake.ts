import Position from "./Position";
import Direction from "./Direction";
import BoardSize from "./BoardSize";

class Snake {
    head: Position
    body: Position[] = []
    direction: Direction
    score: number = 0
    boardSize: BoardSize

    constructor(boardSize?: BoardSize) {
        this.boardSize = boardSize
        this.head = new Position(
            Math.ceil(boardSize.width / 2),
            Math.ceil(boardSize.height / 2)
        )
        this.direction = Direction.NORTH
    }
}

export default Snake