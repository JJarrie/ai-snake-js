import { describe, expect, it } from 'vitest';
import IntelligentSnake from '../ai/IntelligentSnake';
import BoardSize from './BoardSize';
import Position from './Position';
import Snake from './Snake';

describe('Snake.updateAlive', () => {
    it('dies when the head leaves the board', () => {
        const snake = new Snake(new BoardSize(20, 20));
        snake.head = new Position(10, -1);

        snake.updateAlive();

        expect(snake.alive).toBe(false);
    });

    it('dies when the head hits its own body', () => {
        const snake = new Snake(new BoardSize(20, 20));
        snake.body = [new Position(3, 3), snake.head.clone()];

        snake.updateAlive();

        expect(snake.alive).toBe(false);
    });
});

describe('IntelligentSnake life', () => {
    it('dies when it runs out of life', () => {
        const snake = new IntelligentSnake(new BoardSize(20, 20));
        snake.lifeleft = 0;

        snake.updateAlive();

        expect(snake.alive).toBe(false);
    });

    it('addLife gives 100 and caps at 500', () => {
        const snake = new IntelligentSnake(new BoardSize(20, 20));
        snake.lifeleft = 200;
        snake.addLife();
        expect(snake.lifeleft).toBe(300);

        snake.lifeleft = 450;
        snake.addLife();
        expect(snake.lifeleft).toBe(500);

        snake.addLife();
        expect(snake.lifeleft).toBe(500);
    });
});
