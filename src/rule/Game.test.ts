import { describe, expect, it } from 'vitest';
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
