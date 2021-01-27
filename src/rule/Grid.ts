import SquareValue from "./SquareValue";
import Position from "./Position";
import BoardSize from "./BoardSize";
import Square from "./Square";
import Matrix from "../utils/Matrix";

export interface GridState {
    boardSize: BoardSize
    innerGrid: Square[][]
}

class Grid {
    innerGrid: Matrix<Square>
    boardSize: BoardSize

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize
        this.innerGrid = new Matrix<Square>(this.boardSize.width, this.boardSize.height)
        this.clear()
    }

    public clear(): void {
        this.innerGrid.fillWithCallback((col: number, row: number): Square => ({
            value: SquareValue.EMPTY,
            position: new Position(row, col)
        }))
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

    public toString(): string {
        let o = ''
        this.innerGrid.matrix.forEach(rows => {
            o = o + rows.map(s => s.value).join('|') + "\n"
        })
        return o
    }

    public toState(): GridState {
        return {
            innerGrid: this.innerGrid.matrix,
            boardSize: this.boardSize
        }
    }

    public clone(): Grid {
        const clone = new Grid(this.boardSize)
        clone.innerGrid = this.innerGrid.clone()

        return clone
    }
}

export default Grid