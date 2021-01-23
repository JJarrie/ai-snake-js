import SquareValue from "./SquareValue";
import Position from "./Position";
import BoardSize from "./BoardSize";

class Grid {
    innerGrid: SquareValue[][]

    constructor(boardSize: BoardSize) {
        this.innerGrid = Array.from(
            {length: boardSize.height},
            a => Array.from({length: boardSize.width}, b => SquareValue.EMPTY)
        )
    }

    public getValue(position: Position): SquareValue {
        return this.innerGrid[position.x][position.y]
    }

    public setValue(value: SquareValue, position: Position): void {
        this.innerGrid[position.x][position.y] = value
    }
}

export default Grid