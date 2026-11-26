import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import Position from '../rule/Position';
import IntelligentSnake from './IntelligentSnake';

describe('IntelligentSnake.behavior', () => {
    it('is the share of turning moves and the share of left turns, reset with the life', () => {
        const snake = new IntelligentSnake(new BoardSize(20, 20));
        expect(snake.behavior()).toEqual([0, 0.5]);

        snake.decisions = [2, 3, 1];
        expect(snake.behavior()).toEqual([4 / 6, 3 / 4]);

        snake.resetLife();
        expect(snake.decisions).toEqual([0, 0, 0]);
    });

    it('counts every decision it makes', () => {
        const snake = new IntelligentSnake(new BoardSize(20, 20));
        snake.look(new Position(0, 0));

        snake.makeDecision();
        snake.makeDecision();

        expect(snake.decisions.reduce((s, d) => s + d, 0)).toBe(2);
    });
});
