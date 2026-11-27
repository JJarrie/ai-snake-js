import SquareValue from './SquareValue';
import Position from './Position';
import BoardSize from './BoardSize';
import Array2D from '../utils/Array2D';

export interface GridState {
    boardSize: BoardSize;
    /** Rows of cells: innerGrid[y][x]. */
    innerGrid: SquareValue[][];
}

class Grid {
    innerGrid: Array2D<SquareValue>;
    boardSize: BoardSize;

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize;
        this.innerGrid = new Array2D<SquareValue>(this.boardSize.height, this.boardSize.width);
        this.clear();
    }

    public clear(): void {
        this.innerGrid.matrix = [...Array(this.innerGrid.rows)].map(() =>
            new Array<SquareValue>(this.innerGrid.cols).fill(SquareValue.EMPTY),
        );
    }

    public setSquareValue(value: SquareValue, position: Position): void {
        this.innerGrid.set(position.y, position.x, value);
    }

    public toState(): GridState {
        return {
            innerGrid: this.innerGrid.matrix,
            boardSize: this.boardSize,
        };
    }
}

export default Grid;
