import Position from "./Position";
import Direction from "./Direction";

class Snake {
    head: Position
    body: Position[] = []
    direction: Direction

    constructor(head: Position) {
        this.head = head
        this.direction = Direction.NORTH
    }
}

export default Snake