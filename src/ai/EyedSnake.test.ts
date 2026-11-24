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
