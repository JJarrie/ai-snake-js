import * as React from 'react';
import type { SnakeView } from '../game/snake/SnakeEpisode';

interface SnakeConeProps {
    head: { x: number; y: number };
    cone: NonNullable<SnakeView['cone']>;
    /** Size of a board square in pixels. */
    cell: number;
    columns: number;
    rows: number;
}

/** The snake's field of view over the board: one slice per sector, tinted by what it sees. */
const SnakeCone = ({ head, cone, cell, columns, rows }: SnakeConeProps) => {
    const { range, fov, sectors, heading, sight } = cone;
    const right = { dx: -heading.dy, dy: heading.dx };
    const cx = (head.x + 0.5) * cell;
    const cy = (head.y + 0.5) * cell;
    /** Point at `distance` cells along `angle` degrees from the heading (positive = right). */
    const at = (angle: number, distance: number) => {
        const a = (angle * Math.PI) / 180;
        return {
            x: cx + (heading.dx * Math.cos(a) + right.dx * Math.sin(a)) * distance * cell,
            y: cy + (heading.dy * Math.cos(a) + right.dy * Math.sin(a)) * distance * cell,
        };
    };
    const width = fov / sectors;
    const radius = range * cell;

    return (
        <svg
            className="snake-vision"
            width={columns * cell}
            height={rows * cell}
            aria-label="Snake field of view"
            role="img"
        >
            {sight.map((seen, i) => {
                const from = -fov / 2 + i * width;
                const start = at(from, range);
                const end = at(from + width, range);
                const kind = seen.food !== null ? 'sector-food' : seen.body !== null ? 'sector-body' : 'sector';
                return (
                    <path
                        key={`sector_${i}`}
                        d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${width > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`}
                        className={kind}
                    />
                );
            })}
            {sight.map((seen, i) => {
                const middle = -fov / 2 + (i + 0.5) * width;
                const marks = [
                    seen.wall === null ? null : { at: at(middle, seen.wall - 0.5), kind: 'seen-wall' },
                    seen.body === null ? null : { at: at(middle, seen.body), kind: 'seen-body' },
                    seen.food === null ? null : { at: at(middle, seen.food), kind: 'seen-food' },
                ];
                return marks.map((mark, k) =>
                    mark === null ? null : (
                        <circle
                            key={`mark_${i}_${k}`}
                            cx={mark.at.x}
                            cy={mark.at.y}
                            r={cell * (mark.kind === 'seen-wall' ? 0.15 : 0.3)}
                            className={mark.kind}
                        />
                    ),
                );
            })}
        </svg>
    );
};

export default SnakeCone;
