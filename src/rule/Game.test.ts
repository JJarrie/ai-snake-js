import { describe, expect, it } from 'vitest';
import IntelligentSnake from '../ai/IntelligentSnake';
import BoardSize from './BoardSize';
import Game from './Game';
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
