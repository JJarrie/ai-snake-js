import Direction from "./Direction";
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
        return snake.body.filter(bodyPosition => bodyPosition.x === snake.head.x && bodyPosition.y === snake.head.y).length > 0
    }

    public isEating(headPosition: Position, foodPosition: Position): boolean {
        return headPosition.x === foodPosition.x && headPosition.y === foodPosition.y
    }

    public updateBody(snake: Snake): Snake {
        const body = snake.body
        body.pop()
        body.unshift(snake.head)

        return {...snake, body}
    }

    public updateHead(snake: Snake): Snake {
        switch (snake.direction) {
            case Direction.EAST:
                snake.head = new Position(snake.head.x + 1, snake.head.y)
                break;
            case Direction.NORTH:
                snake.head = new Position(snake.head.x, snake.head.y - 1)
                break;
            case Direction.SOUTH:
                snake.head = new Position(snake.head.x, snake.head.y + 1)
                break;
            case Direction.WEST:
                snake.head = new Position(snake.head.x - 1, snake.head.y)
                break;
        }

        return snake
    }
}

export default SnakeRule