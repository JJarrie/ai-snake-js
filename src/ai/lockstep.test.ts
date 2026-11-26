import { describe, expect, it } from 'vitest';
import type SnakeEpisode from '../game/snake/SnakeEpisode';
import { createSnakeGame } from '../game/snake/SnakeEpisode';
import { stepInLockstep } from './lockstep';
import Population from './Population';
import ClassicGa from './strategy/ClassicGa';

const create = () => new Population(3, createSnakeGame(20), new ClassicGa(0.1), 1);
const snakes = (p: Population) => [...p.episodes, p.replay].map((e) => (e as SnakeEpisode).game.snake);
const finish = (p: Population) => snakes(p).forEach((s) => (s.alive = false));
const lifetime = (p: Population) => snakes(p)[0].lifetime;

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
        expect(lifetime(fast)).toBe(1);
    });

    it('lets a population that fell behind catch up while the others wait', () => {
        const ahead = create();
        const behind = create();
        finish(ahead);
        stepInLockstep([ahead]);
        expect(ahead.generation).toBe(2);
        const aheadLifetime = lifetime(ahead);

        stepInLockstep([ahead, behind]);

        expect(lifetime(ahead)).toBe(aheadLifetime);
        expect(lifetime(behind)).toBe(1);
    });
});
