import * as React from 'react';
import type { VisionRay } from '../ai/EyedSnake';
import type { GridState } from '../rule/Grid';
import SquareValue from '../rule/SquareValue';
import SnakeVision from './SnakeVision';

interface BoardProps {
    grid: GridState;
    /** Board width and height in pixels, whatever the number of squares. */
    size: number;
    label: string;
    /** Lines of sight to draw over the board; none when omitted or the snake is dead. */
    sight?: { head: { x: number; y: number } | null; vision: VisionRay[] };
}

const className = (value: SquareValue): string => {
    switch (value) {
        case SquareValue.FOOD:
            return 'food';
        case SquareValue.SNAKE:
            return 'snake';
        case SquareValue.HEAD:
            return 'head';
        case SquareValue.WALL:
            return 'wall';
        case SquareValue.EMPTY:
        default:
            return 'empty';
    }
};

const Board = ({ grid, size, label, sight }: BoardProps) => {
    const cell = Math.max(2, Math.floor(size / grid.boardSize.width));

    return (
        <div className="board-wrap">
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
            {sight && sight.head && (
                <SnakeVision
                    head={sight.head}
                    vision={sight.vision}
                    cell={cell}
                    columns={grid.boardSize.width}
                    rows={grid.boardSize.height}
                />
            )}
        </div>
    );
};

export default Board;
