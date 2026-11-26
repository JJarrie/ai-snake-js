import * as React from 'react';
import type { GridState } from '../rule/Grid';
import SquareValue from '../rule/SquareValue';

interface BoardProps {
    grid: GridState;
    /** Board width and height in pixels, whatever the number of squares. */
    size: number;
    label: string;
}

const className = (value: SquareValue): string => {
    switch (value) {
        case SquareValue.FOOD:
            return 'food';
        case SquareValue.SNAKE:
            return 'snake';
        case SquareValue.HEAD:
            return 'head';
        case SquareValue.EMPTY:
        default:
            return 'empty';
    }
};

const Board = ({ grid, size, label }: BoardProps) => {
    const cell = Math.max(2, Math.floor(size / grid.boardSize.width));

    return (
        <table className="board" aria-label={label} style={{ '--cell': `${cell}px` } as React.CSSProperties}>
            <tbody>
                {grid.innerGrid.map((row, y) => (
                    <tr key={`row_${y}`}>
                        {row.map((square, x) => (
                            <td key={`square_${x}`} className={className(square.value)} />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Board;
