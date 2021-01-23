import SquareValue from "./SquareValue";
import Position from "./Position";
import BoardSize from "./BoardSize";
import Square from "./Square";

class Grid {
    innerGrid: Square[][]
    boardSize: BoardSize

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize
        this.innerGrid = Array.from(
            {length: boardSize.height},
            (a, x) => Array.from(
                {length: boardSize.width},
                (b, y): Square => ({
                    value: SquareValue.EMPTY,
                    index: y * boardSize.height + x,
                    position: new Position(x, y)
                })
            )
        )
    }

    public getSquare(position: Position): Square {
        return this.innerGrid[position.x][position.y]
    }

    public setSquareValue(value: SquareValue, position: Position): void {
        this.innerGrid[position.x][position.y].value = value
    }

    public getSquaresByValue(value: SquareValue): Square[] {
        return this.innerGrid.map(line => line.filter(square => square.value === value))
            .reduce((prev, cur) => prev.concat(cur), [])
    }
}

export default Grid