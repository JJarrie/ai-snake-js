import { describe, expect, it, vi } from 'vitest';
import IntelligentSnake from '../ai/IntelligentSnake';
import BoardSize from './BoardSize';
import Game from './Game';
import PlayerType from './PlayerType';

describe('Game', () => {
    it.each([PlayerType.HUMAN, PlayerType.AI])('grows by one square when the snake eats (%s)', (playerType) => {
        const game = new Game(new BoardSize(20, 20), playerType);

        game.food = game.snake.head.clone().addVector({ x: 0, y: 5 });
        game.nextMove();
        expect(game.snake.body).toHaveLength(1);

        game.food = game.snake.head.clone();
        game.nextMove();

        expect(game.score).toBe(1);
        expect(game.snake.body).toHaveLength(2);
    });

    it('builds a state for a human game without crashing', () => {
        const game = new Game(new BoardSize(20, 20), PlayerType.HUMAN);

        expect(() => game.toState()).not.toThrow();
    });
});

describe('Game food and cloning', () => {
    it('never puts food on the snake head', () => {
        // First draw lands on the head (10, 10), the second one on (2, 2).
        const random = vi.spyOn(Math, 'random');
        random.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5).mockReturnValueOnce(0.1).mockReturnValueOnce(0.1);

        const game = new Game(new BoardSize(20, 20), PlayerType.HUMAN);

        expect(game.food).toMatchObject({ x: 2, y: 2 });
        random.mockRestore();
    });

    it('cloneBrain keeps the network but starts a fresh game', () => {
        const game = new Game(new BoardSize(20, 20), PlayerType.AI);
        game.score = 7;

        const clone = game.cloneBrain();

        expect(clone.score).toBe(0);
        expect((clone.snake as IntelligentSnake).neuralNetwork.weights[0].matrix).toEqual(
            (game.snake as IntelligentSnake).neuralNetwork.weights[0].matrix,
        );
    });
});
