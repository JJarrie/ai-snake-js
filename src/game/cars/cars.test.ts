import { describe, expect, it } from 'vitest';
import Matrix from '../../utils/Matrix';
import NeuralNetwork from '../../ai/NeuralNetwork';
import CarsEpisode, {
    createCarsGame,
    trackFor,
    RAY_ANGLES,
    RAY_RANGE,
    THROTTLE_ACTIONS,
    type ThrottleAction,
} from './CarsEpisode';
import { createTrack, projectOnSegment, rayCircleHit, rayHit, TRACK_SEGMENTS } from './track';

/** A network that always steers `steer` (before tanh) and picks `action`: zero weights, output biases only. */
const constantBrain = (steer: number, action: ThrottleAction): NeuralNetwork => {
    const network = new NeuralNetwork(RAY_ANGLES.length + 1, [4], 1 + THROTTLE_ACTIONS.length);
    network.weights = network.weights.map((w) => new Matrix(w.rows, w.cols));
    network.weights.forEach((w) => (w.matrix = w.matrix.map((row) => row.map(() => 0))));
    const last = network.weights[network.weights.length - 1];
    last.matrix[0][last.cols - 1] = steer;
    last.matrix[1 + THROTTLE_ACTIONS.indexOf(action)][last.cols - 1] = 1;
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

describe('cones', () => {
    it('are part of the seeded track, on the track and spread out', () => {
        const track = createTrack(7);
        expect(track.cones).toHaveLength(8);
        expect(track.cones).toEqual(createTrack(7).cones);

        track.cones.forEach((cone) => {
            const nearest = Math.min(...track.center.map((c) => Math.hypot(c.x - cone.x, c.y - cone.y)));
            expect(nearest).toBeLessThanOrEqual(4.5 + 0.5);
        });
        for (let i = 1; i < track.cones.length; ++i) {
            const [a, b] = [track.cones[i - 1], track.cones[i]];
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(6);
        }
    });

    it('stop sensor rays', () => {
        expect(rayCircleHit({ x: 0, y: 0 }, 1, 0, { x: 10, y: 0 }, 1.5)).toBeCloseTo(8.5);
        expect(rayCircleHit({ x: 0, y: 0 }, -1, 0, { x: 10, y: 0 }, 1.5)).toBe(Infinity);
        expect(rayCircleHit({ x: 0, y: 0 }, 0, 1, { x: 10, y: 0 }, 1.5)).toBe(Infinity);
        expect(rayCircleHit({ x: 10, y: 0 }, 0, 1, { x: 10, y: 0 }, 1.5)).toBe(0);
    });

    it('crash the car only when obstacles are on', () => {
        const brain = constantBrain(0, 'accelerate');
        const free = new CarsEpisode(brain, 1);
        const blocked = new CarsEpisode(brain, 1, true);
        expect(free.cones).toHaveLength(0);

        // A cone right in front of the car.
        blocked.cones = [
            {
                x: blocked.position.x + Math.cos(blocked.heading) * 1,
                y: blocked.position.y + Math.sin(blocked.heading) * 1,
            },
        ];
        blocked.step();
        free.step();

        expect(blocked.crashed).toBe(true);
        expect(free.crashed).toBe(false);
        expect(blocked.toState().view).toMatchObject({ kind: 'cars', obstacles: true });
    });
});

describe('CarsEpisode', () => {
    it('declares 8 inputs (7 rays + speed) and 4 outputs (steering + 3 actions), and senses walls', () => {
        const game = createCarsGame();
        expect([game.inputs, game.outputs]).toEqual([8, 4]);

        const episode = new CarsEpisode(constantBrain(0, 'hold'), 1);
        expect(episode.rays).toHaveLength(7);
        episode.rays.forEach((r) => expect(r).toBeGreaterThan(0));
        episode.rays.forEach((r) => expect(r).toBeLessThanOrEqual(RAY_RANGE));
        // Side rays hit the walls about half a width away.
        expect(episode.rays[0]).toBeLessThan(episode.track.halfWidth * 1.5);
    });

    it('ends with no progress when the car never accelerates', () => {
        const episode = play(new CarsEpisode(constantBrain(0, 'brake'), 1));

        expect(episode.crashed).toBe(false);
        expect(episode.score).toBe(0);
        expect(episode.steps).toBe(100);
    });

    it('accelerates, holds its speed or brakes, never below zero', () => {
        const speedAfterOneStep = (action: ThrottleAction, speed: number) => {
            const episode = new CarsEpisode(constantBrain(0, action), 1);
            episode.speed = speed;
            episode.step();
            return episode.speed;
        };

        expect(speedAfterOneStep('accelerate', 2)).toBeGreaterThan(2);
        expect(speedAfterOneStep('hold', 2)).toBe(2);
        expect(speedAfterOneStep('brake', 2)).toBeLessThan(2);
        expect(speedAfterOneStep('brake', 0.1)).toBe(0);
    });

    it('drives forward then crashes when it never steers', () => {
        const episode = play(new CarsEpisode(constantBrain(0, 'accelerate'), 1));

        expect(episode.crashed).toBe(true);
        expect(episode.bestProgress).toBeGreaterThan(0);
        expect(episode.fitness()).toBeGreaterThan(1);
    });

    it('plays the same game for the same brain and seed, and reset replays it', () => {
        const brain = new NeuralNetwork(8, [6], 4);
        const a = play(new CarsEpisode(brain, 5));
        const b = play(new CarsEpisode(brain.clone(), 5));
        expect([b.steps, b.bestProgress]).toEqual([a.steps, a.bestProgress]);

        const { steps, bestProgress } = a;
        a.reset();
        play(a);
        expect([a.steps, a.bestProgress]).toEqual([steps, bestProgress]);
    });

    it('describes its behaviour in [0, 1]^2', () => {
        const episode = play(new CarsEpisode(constantBrain(0.5, 'accelerate'), 2));

        episode.behavior().forEach((b) => {
            expect(b).toBeGreaterThanOrEqual(0);
            expect(b).toBeLessThanOrEqual(1);
        });
    });
});

describe('CarsEpisode laps', () => {
    it('records the time of each lap the first time it is completed', () => {
        const episode = new CarsEpisode(constantBrain(0, 'hold'), 1);

        episode.steps = 180;
        episode.bestProgress = TRACK_SEGMENTS + 0.5;
        episode.recordLaps();
        episode.steps = 400;
        episode.bestProgress = 2 * TRACK_SEGMENTS + 1;
        episode.recordLaps();
        episode.recordLaps();

        expect(episode.lapSteps).toEqual([180, 220]);
        expect(episode.toState().view).toMatchObject({ bestLap: 180 });
    });

    it('rewards faster laps on top of the distance driven', () => {
        const withLap = (lapSteps: number[]) => {
            const episode = new CarsEpisode(constantBrain(0, 'hold'), 1);
            episode.bestProgress = TRACK_SEGMENTS + 1;
            episode.lapSteps = lapSteps;
            return episode.fitness();
        };

        expect(withLap([150])).toBeGreaterThan(withLap([300]));
        expect(withLap([300])).toBeGreaterThan(withLap([]));
    });
});

describe('track cache', () => {
    it('reuses the track of a recent seed and forgets old ones', () => {
        const first = trackFor(1000);
        expect(trackFor(1000)).toBe(first);

        for (let seed = 1001; seed < 1020; ++seed) {
            trackFor(seed);
        }

        expect(trackFor(1000)).not.toBe(first);
        expect(trackFor(1000)).toEqual(first);
    });
});
