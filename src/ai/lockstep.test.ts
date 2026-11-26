import { describe, expect, it } from 'vitest';
import BoardSize from '../rule/BoardSize';
import { stepInLockstep } from './lockstep';
import Population from './Population';
import ClassicGa from './strategy/ClassicGa';

const create = () => new Population(3, new BoardSize(20, 20), new ClassicGa(0.1), 1);
const finish = (p: Population) => [...p.games, p.bestGame].forEach((g) => (g.snake.alive = false));

describe('stepInLockstep', () => {
    it('waits for every population to finish before starting the next generation', () => {
        const fast = create();
        const slow = create();
        finish(fast);

        stepInLockstep([fast, slow]);
        expect(fast.generation).toBe(1);

        finish(slow);
        stepInLockstep([fast, slow]);
        expect([fast.generation, slow.generation]).toEqual([2, 2]);
        // The new generation already made its first move.
        expect(fast.games[0].snake.lifetime).toBe(1);
    });

    it('lets a population that fell behind catch up while the others wait', () => {
        const ahead = create();
        const behind = create();
        finish(ahead);
        stepInLockstep([ahead]);
        expect(ahead.generation).toBe(2);
        const aheadLifetime = ahead.games[0].snake.lifetime;

        stepInLockstep([ahead, behind]);

        expect(ahead.games[0].snake.lifetime).toBe(aheadLifetime);
        expect(behind.games[0].snake.lifetime).toBe(1);
    });
});
