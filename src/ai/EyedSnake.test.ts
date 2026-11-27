import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import Position from '../rule/Position';
import Vector2D from '../utils/Vector2D';
import EyedSnake from './EyedSnake';

describe('EyedSnake.lookInDirection', () => {
    it('encodes food, body and wall as 1/distance, 0 when not seen', () => {
        const snake = new EyedSnake(new BoardSize(20, 20));
        snake.body = [new Position(10, 8)];
        const bodyKeys = new Set([8 * 20 + 10]);

        const seen = snake.lookInDirection(new Vector2D(0, -1), new Position(10, 6), bodyKeys);

        expect(seen).toEqual({ food: 1 / 4, body: 1 / 2, wall: 1 / 11 });
        expect(snake.lookInDirection(new Vector2D(0, 1), new Position(10, 6), bodyKeys)).toMatchObject({
            food: 0,
            body: 0,
        });
    });
});

describe('EyedSnake.visionRays', () => {
    it('is empty before the snake has looked', () => {
        expect(new EyedSnake(new BoardSize(20, 20)).visionRays()).toEqual([]);
    });

    it('turns the last look into 8 board-space rays with distances in cells', () => {
        // Head at (10, 10) heading north; food straight ahead, a body cell to the right.
        const snake = new EyedSnake(new BoardSize(20, 20));
        snake.body = [new Position(13, 10)];
        snake.look(new Position(10, 4));

        const rays = snake.visionRays();

        expect(rays).toHaveLength(8);
        expect(rays[0]).toEqual({ dx: 0, dy: -1, wall: 11, food: 6, body: null });
        const right = rays.find((r) => r.dx === 1 && r.dy === 0);
        expect(right).toEqual({ dx: 1, dy: 0, wall: 10, food: null, body: 3 });
    });
});
