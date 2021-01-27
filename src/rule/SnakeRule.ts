import Position from "./Position";
import Snake from "./Snake";
import BoardSize from "./BoardSize";

class SnakeRule {
    boardSize: BoardSize

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize
    }

    public isAlive(snake: Snake): boolean {
        return !(this.isOutbound(snake.head) || this.isInHimself(snake))
    }

    private isOutbound(head: Position): boolean {
        return head.y < 0 || head.y >= this.boardSize.height || head.x < 0 || head.x >= this.boardSize.width
    }

    private isInHimself(snake: Snake): boolean {
        return snake.body.filter(bodyPosition => bodyPosition.isEqual(snake.head)).length > 0
    }

    public isEating(headPosition: Position, foodPosition: Position): boolean {
        return headPosition.isEqual(foodPosition)
    }
}

export default SnakeRule