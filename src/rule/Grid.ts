import SquareValue from "./SquareValue";
import Position from "./Position";
import BoardSize from "./BoardSize";
import Square from "./Square";
import Matrix from "../utils/Matrix";
import Snake from "./Snake";

class Grid {
    innerGrid: Matrix<Square>
    boardSize: BoardSize

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize
        this.innerGrid = new Matrix<Square>(this.boardSize.width, this.boardSize.height)
        this.innerGrid.fillWithCallback((col: number, row: number): Square => ({
            value: SquareValue.EMPTY,
            position: new Position(row, col)
        }))
    }

    public getSquare(position: Position): Square {
        return this.innerGrid.getValue(position.x, position.y)
    }

    public setSquareValue(value: SquareValue, position: Position): void {
        const square = this.innerGrid.getValue(position.x, position.y)
        square.value = value
        this.innerGrid.setValue(position.x, position.y, square)
    }

    public getSquaresByValue(value: SquareValue): Square[] {
        return this.innerGrid.matrix.map(line => line.filter(square => square.value === value))
            .reduce((prev, cur) => prev.concat(cur), [])
    }

    public setSquareForSnake(snake: Snake) {
        snake.body.forEach(position => this.setSquareValue(SquareValue.SNAKE, position))
    }
}

export default Grid