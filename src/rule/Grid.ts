import SquareValue from './SquareValue';
import Position from './Position';
import BoardSize from './BoardSize';
import Square from './Square';
import Array2D from '../utils/Array2D';

export interface GridState {
    boardSize: BoardSize;
    innerGrid: Square[][];
}

class Grid {
    innerGrid: Array2D<Square>;
    boardSize: BoardSize;

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize;
        this.innerGrid = new Array2D<Square>(this.boardSize.height, this.boardSize.width);
        this.clear();
    }

    public clear(): void {
        this.innerGrid.matrix = [...Array(this.innerGrid.rows)].map((row) =>
            [...Array(this.innerGrid.cols)].map((col) => ({
                value: SquareValue.EMPTY,
                position: new Position(row, col),
            })),
        );
    }

    public setSquareValue(value: SquareValue, position: Position): void {
        this.innerGrid.set(position.y, position.x, {
            position,
            value,
        });
    }

    public getSquaresByValue(value: SquareValue): Square[] {
        let squares = new Array<Square>();

        this.innerGrid.matrix.forEach((row) => {
            squares = squares.concat(row.filter((col) => col.value === value));
        });

        return squares;
    }

    public toString(): string {
        let o = '';

        this.innerGrid.matrix.forEach((rows) => {
            o = o + rows.map((s) => s.value).join('|') + '\n';
        });

        return o;
    }

    public toState(): GridState {
        return {
            innerGrid: this.innerGrid.matrix,
            boardSize: this.boardSize,
        };
    }

    public clone(): Grid {
        const clone = new Grid(this.boardSize);
        clone.innerGrid = this.innerGrid.clone();

        return clone;
    }
}

export default Grid;
