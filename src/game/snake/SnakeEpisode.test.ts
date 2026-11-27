import { describe, expect, it } from 'vitest';
import NeuralNetwork from '../../ai/NeuralNetwork';
import SnakeEpisode, { createSnakeGame } from './SnakeEpisode';

const play = (episode: SnakeEpisode, steps: number) => {
    for (let i = 0; i < steps && !episode.finished(); ++i) {
        episode.step();
    }
};

describe('SnakeEpisode view', () => {
    it('shows the 8 lines of sight from the current head, and none once dead', () => {
        const episode = createSnakeGame(20).createEpisode(new NeuralNetwork(24, [8], 3), 3) as SnakeEpisode;
        play(episode, 3);

        // 3 moves from the centre of a 20 x 20 board cannot reach a wall.
        expect(episode.finished()).toBe(false);
        const view = episode.toState().view;
        if (view.kind !== 'snake') {
            throw new Error('expected a snake view');
        }
        const { head } = episode.game.snake;
        expect(view.head).toEqual({ x: head.x, y: head.y });
        expect(view.vision).toHaveLength(8);
        // Every wall distance reaches exactly one cell past the board or onto an obstacle.
        view.vision.forEach((ray) => {
            const x = head.x + ray.dx * ray.wall;
            const y = head.y + ray.dy * ray.wall;
            expect(x < 0 || y < 0 || x >= 20 || y >= 20).toBe(true);
        });

        episode.game.snake.alive = false;
        expect(episode.toState().view).toMatchObject({ head: null, vision: [] });
    });

    it('does not change the game it shows', () => {
        const brain = new NeuralNetwork(24, [8], 3);
        const watched = createSnakeGame(20).createEpisode(brain.clone(), 9) as SnakeEpisode;
        const plain = createSnakeGame(20).createEpisode(brain.clone(), 9) as SnakeEpisode;

        while (!plain.finished()) {
            plain.step();
            watched.toState();
            watched.step();
        }

        expect([watched.score, watched.game.snake.lifetime]).toEqual([plain.score, plain.game.snake.lifetime]);
    });
});
