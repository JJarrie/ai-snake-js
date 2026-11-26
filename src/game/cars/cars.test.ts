import { describe, expect, it } from 'vitest';
import Matrix from '../../utils/Matrix';
import NeuralNetwork from '../../ai/NeuralNetwork';
import CarsEpisode, { createCarsGame, RAY_ANGLES, RAY_RANGE } from './CarsEpisode';
import { createTrack, projectOnSegment, rayHit, TRACK_SEGMENTS } from './track';

/** A network whose outputs are always (steer, throttle) before tanh: zero weights, output biases only. */
const constantBrain = (steer: number, throttle: number): NeuralNetwork => {
    const network = new NeuralNetwork(RAY_ANGLES.length + 1, [4], 2);
    network.weights = network.weights.map((w) => new Matrix(w.rows, w.cols));
    network.weights.forEach((w) => (w.matrix = w.matrix.map((row) => row.map(() => 0))));
    const last = network.weights[network.weights.length - 1];
    last.matrix[0][last.cols - 1] = steer;
    last.matrix[1][last.cols - 1] = throttle;
    return network;
};

const play = (episode: CarsEpisode): CarsEpisode => {
    while (!episode.finished()) {
        episode.step();
    }
    return episode;
};

describe('track', () => {
    it('is the same for the same seed and differs between seeds', () => {
        expect(createTrack(3)).toEqual(createTrack(3));
        expect(createTrack(3).center).not.toEqual(createTrack(4).center);
    });

    it('puts both walls half a width away from the centre line', () => {
        const track = createTrack(1);
        expect(track.center).toHaveLength(TRACK_SEGMENTS);
        track.center.forEach((c, i) => {
            expect(Math.hypot(track.left[i].x - c.x, track.left[i].y - c.y)).toBeCloseTo(track.halfWidth);
            expect(Math.hypot(track.right[i].x - c.x, track.right[i].y - c.y)).toBeCloseTo(track.halfWidth);
        });
    });

    it('projects points on segments and casts rays on them', () => {
        const a = { x: 0, y: 0 };
        const b = { x: 10, y: 0 };
        expect(projectOnSegment({ x: 5, y: 3 }, a, b)).toEqual({ distance: 3, t: 0.5 });
        expect(projectOnSegment({ x: 15, y: 0 }, a, b).t).toBe(1);

        expect(rayHit({ x: 5, y: -4 }, 0, 1, a, b)).toBeCloseTo(4);
        expect(rayHit({ x: 5, y: -4 }, 0, -1, a, b)).toBe(Infinity);
        expect(rayHit({ x: 20, y: -4 }, 0, 1, a, b)).toBe(Infinity);
    });
});

describe('CarsEpisode', () => {
    it('declares 8 inputs and 2 outputs, and senses walls within range', () => {
        const game = createCarsGame();
        expect([game.inputs, game.outputs]).toEqual([8, 2]);

        const episode = new CarsEpisode(constantBrain(0, 0), 1);
        expect(episode.rays).toHaveLength(7);
        episode.rays.forEach((r) => expect(r).toBeGreaterThan(0));
        episode.rays.forEach((r) => expect(r).toBeLessThanOrEqual(RAY_RANGE));
        // Side rays hit the walls about half a width away.
        expect(episode.rays[0]).toBeLessThan(episode.track.halfWidth * 1.5);
    });

    it('ends with no progress when the car never accelerates', () => {
        const episode = play(new CarsEpisode(constantBrain(0, -5), 1));

        expect(episode.crashed).toBe(false);
        expect(episode.score).toBe(0);
        expect(episode.steps).toBe(100);
    });

    it('drives forward then crashes when it never steers', () => {
        const episode = play(new CarsEpisode(constantBrain(0, 5), 1));

        expect(episode.crashed).toBe(true);
        expect(episode.bestProgress).toBeGreaterThan(0);
        expect(episode.fitness()).toBeGreaterThan(1);
    });

    it('plays the same game for the same brain and seed, and reset replays it', () => {
        const brain = new NeuralNetwork(8, [6], 2);
        const a = play(new CarsEpisode(brain, 5));
        const b = play(new CarsEpisode(brain.clone(), 5));
        expect([b.steps, b.bestProgress]).toEqual([a.steps, a.bestProgress]);

        const { steps, bestProgress } = a;
        a.reset();
        play(a);
        expect([a.steps, a.bestProgress]).toEqual([steps, bestProgress]);
    });

    it('describes its behaviour in [0, 1]^2', () => {
        const episode = play(new CarsEpisode(constantBrain(0.5, 5), 2));

        episode.behavior().forEach((b) => {
            expect(b).toBeGreaterThanOrEqual(0);
            expect(b).toBeLessThanOrEqual(1);
        });
    });
});
