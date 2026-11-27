import * as React from 'react';
import type { VisionRay } from '../ai/EyedSnake';

interface SnakeVisionProps {
    head: { x: number; y: number };
    vision: VisionRay[];
    /** Size of a board square in pixels. */
    cell: number;
    columns: number;
    rows: number;
}

/** The snake's 8 lines of sight over the board: up to the wall, with what each one sees marked on it. */
const SnakeVision = ({ head, vision, cell, columns, rows }: SnakeVisionProps) => {
    const at = (ray: VisionRay, distance: number) => ({
        x: (head.x + 0.5 + ray.dx * distance) * cell,
        y: (head.y + 0.5 + ray.dy * distance) * cell,
    });
    const origin = at({ dx: 0, dy: 0, wall: 0, food: null, body: null }, 0);

    return (
        <svg
            className="snake-vision"
            width={columns * cell}
            height={rows * cell}
            aria-label="Snake lines of sight"
            role="img"
        >
            {vision.map((ray, i) => {
                // The wall distance counts the wall cell itself: stop at its edge.
                const end = at(ray, ray.wall - 0.5);
                return (
                    <line
                        key={`ray_${i}`}
                        x1={origin.x}
                        y1={origin.y}
                        x2={end.x}
                        y2={end.y}
                        className={ray.food === null ? 'sight' : 'sight sight-food'}
                    />
                );
            })}
            {vision.map((ray, i) =>
                ray.body === null ? null : (
                    <circle
                        key={`body_${i}`}
                        cx={at(ray, ray.body).x}
                        cy={at(ray, ray.body).y}
                        r={cell * 0.25}
                        className="seen-body"
                    />
                ),
            )}
            {vision.map((ray, i) =>
                ray.food === null ? null : (
                    <circle
                        key={`food_${i}`}
                        cx={at(ray, ray.food).x}
                        cy={at(ray, ray.food).y}
                        r={cell * 0.35}
                        className="seen-food"
                    />
                ),
            )}
        </svg>
    );
};

export default SnakeVision;
