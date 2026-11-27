import SquareValue from './SquareValue';
import Position from './Position';
import BoardSize from './BoardSize';
import type Square from './Square';
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

    public toState(): GridState {
        return {
            innerGrid: this.innerGrid.matrix,
            boardSize: this.boardSize,
        };
    }
}

export default Grid;
