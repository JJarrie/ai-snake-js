import { describe, expect, it } from 'vitest';
import IntelligentSnake from '../ai/IntelligentSnake';
import BoardSize from './BoardSize';
import Game from './Game';
import Direction from './Direction';
import Position from './Position';

describe('Game', () => {
    it('grows by one square when the snake eats', () => {
        const game = new Game(new BoardSize(20, 20));

        game.food = game.snake.head.clone().addVector({ x: 0, y: 5 });
        game.nextMove();
        expect(game.snake.body).toHaveLength(1);

        game.food = game.snake.head.clone();
        game.nextMove();

        expect(game.score).toBe(1);
        expect(game.snake.body).toHaveLength(2);
    });

    it('takes up one more cell right after eating, not once the meal reached the tail', () => {
        const game = new Game(new BoardSize(20, 20), undefined, 1);
        const { head } = game.snake;
        game.snake.body = [1, 2, 3, 4, 5].map((k) => new Position(head.x, head.y + k));
        const cells = () => new Set([game.snake.head, ...game.snake.body].map((p) => `${p.x},${p.y}`)).size;
        expect(cells()).toBe(6);

        game.food = game.snake.head.clone();
        game.nextMove();
        expect(cells()).toBe(7);

        game.food = new Position(0, 0);
        game.nextMove();
        expect(cells()).toBe(7);
    });

    it('ends the game when no cell is left for the food, instead of looking forever', () => {
        // 3 x 3 board, head in the middle, body on the 8 other cells.
        const board = new BoardSize(3, 3);
        const snake = new IntelligentSnake(board);
        snake.body = [0, 1, 2, 3, 5, 6, 7, 8].map((k) => new Position(k % 3, Math.floor(k / 3)));

        const game = new Game(board, snake, 1);

        expect(game.finish()).toBe(true);
    });
});

describe('Game obstacles', () => {
    const board = new BoardSize(20, 20);

    it('builds none unless asked, and the same walls for the same seed', () => {
        expect(new Game(board, undefined, 3).obstacleKeys.size).toBe(0);

        const a = new Game(board, undefined, 3, true);
        expect(a.obstacleKeys.size).toBeGreaterThan(3);
        expect([...a.obstacleKeys]).toEqual([...new Game(board, undefined, 3, true).obstacleKeys]);
        expect([...a.obstacleKeys]).not.toEqual([...new Game(board, undefined, 4, true).obstacleKeys]);
    });

    it('keeps the start area and the food off the walls', () => {
        for (let seed = 0; seed < 200; ++seed) {
            const game = new Game(board, undefined, seed, true);
            const { head } = game.snake;
            [...game.obstacleKeys].forEach((key) => {
                const x = key % 20;
                const y = Math.floor(key / 20);
                expect(Math.max(Math.abs(x - head.x), Math.abs(y - head.y))).toBeGreaterThan(3);
            });
            expect(game.obstacleKeys.has(game.keyOf(game.food))).toBe(false);
        }
    });

    it('kills the snake that runs into a wall, which its vision reports as a wall', () => {
        const game = new Game(board, undefined, 1, true);
        // A wall 2 cells ahead of the head (the snake starts heading north).
        const wall = game.snake.head.clone().addVector({ x: 0, y: -2 });
        game.obstacleKeys.add(game.keyOf(wall));
        game.food = new Position(0, 0);

        game.snake.look(game.food, game.obstacleKeys);
        expect(game.snake.vision[Direction.FRONT].wall).toBe(1 / 2);

        game.nextMove();
        expect(game.finish()).toBe(false);
        game.nextMove();
        expect(game.finish()).toBe(true);
    });
});

describe('Game food and cloning', () => {
    it('never puts food on the snake head', () => {
        for (let seed = 0; seed < 500; ++seed) {
            const game = new Game(new BoardSize(20, 20), undefined, seed);
            expect(game.food.isEqual(game.snake.head)).toBe(false);
        }
    });

    it('draws the same food sequence for the same seed, whatever the snake body', () => {
        const a = new Game(new BoardSize(20, 20), undefined, 42);
        const b = new Game(new BoardSize(20, 20), undefined, 42);
        expect(b.food).toEqual(a.food);

        // A longer body in b must not shift the next foods of b.
        b.snake.body.push(new Position(0, 0), new Position(0, 1));
        for (let i = 0; i < 5; ++i) {
            a.food = a.snake.head.clone();
            b.food = b.snake.head.clone();
            a.nextMove();
            b.nextMove();
            if (!b.snake.body.some((p) => p.isEqual(a.food))) {
                expect(b.food).toEqual(a.food);
            }
        }

        a.reset();
        expect(a.food).toEqual(new Game(new BoardSize(20, 20), undefined, 42).food);
    });

    it('cloneBrain keeps the network but starts a fresh game', () => {
        const game = new Game(new BoardSize(20, 20));
        game.score = 7;

        const clone = game.cloneBrain();

        expect(clone.score).toBe(0);
        expect((clone.snake as IntelligentSnake).neuralNetwork.weights[0].matrix).toEqual(
            (game.snake as IntelligentSnake).neuralNetwork.weights[0].matrix,
        );
    });
});
