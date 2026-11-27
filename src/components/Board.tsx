import * as React from 'react';
import type { SnakeView } from '../game/snake/SnakeEpisode';
import type { GridState } from '../rule/Grid';
import SquareValue from '../rule/SquareValue';
import SnakeCone from './SnakeCone';
import SnakeVision from './SnakeVision';

interface BoardProps {
    grid: GridState;
    /** Board width and height in pixels, whatever the number of squares. */
    size: number;
    label: string;
    /** What the snake sees, drawn over the board; nothing when omitted or the snake is dead. */
    sight?: Pick<SnakeView, 'head' | 'vision' | 'cone'>;
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
            {sight && sight.head && sight.cone && (
                <SnakeCone
                    head={sight.head}
                    cone={sight.cone}
                    cell={cell}
                    columns={grid.boardSize.width}
                    rows={grid.boardSize.height}
                />
            )}
            {sight && sight.head && !sight.cone && (
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
