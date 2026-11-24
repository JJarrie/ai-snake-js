import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import Position from '../rule/Position';
import Vector2D from '../utils/Vector2D';
import EyedSnake from './EyedSnake';

describe('EyedSnake.lookInDirection', () => {
    it('sees food and body at their distance and the wall as 1/distance', () => {
        const snake = new EyedSnake(new BoardSize(20, 20));
        snake.body = [new Position(10, 8)];
        const bodyKeys = new Set(['10,8']);

        const seen = snake.lookInDirection(new Vector2D(0, -1), new Position(10, 6), bodyKeys);

        expect(seen).toEqual({ food: 4, body: 2, wall: 1 / 11 });
    });
});
