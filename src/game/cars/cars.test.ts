import { describe, expect, it } from 'vitest';
import Matrix from '../../utils/Matrix';
import NeuralNetwork from '../../ai/NeuralNetwork';
import CarsEpisode, {
    createCarsGame,
    MAX_REVERSE_SPEED,
    trackFor,
    RAY_ANGLES,
    RAY_RANGE,
    THROTTLE_ACTIONS,
    type ThrottleAction,
} from './CarsEpisode';
import { CONE_RADIUS, createTrack, projectOnSegment, rayHit, TRACK_SEGMENTS } from './track';

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

    it('are seen between two rays: each ray covers its sector, up to the next one', () => {
        const episode = new CarsEpisode(constantBrain(0, 'hold'), 1, true);
        const at = (distance: number, degrees: number) => {
            const angle = episode.heading + (degrees * Math.PI) / 180;
            return {
                x: episode.position.x + Math.cos(angle) * distance,
                y: episode.position.y + Math.sin(angle) * distance,
            };
        };
        episode.cones = [];
        episode.reset();
        const walls = [...episode.rays];

        // Halfway between the 0° and 30° rays, 12 units ahead: a thin ray passes 3 units beside it.
        episode.cones = [at(12, 15)];
        episode.reset();

        const front = RAY_ANGLES.findIndex((a) => a === 0);
        [front, front + 1].forEach((i) => expect(walls[i]).toBeGreaterThan(12));
        [front, front + 1].forEach((i) => expect(episode.rays[i]).toBeCloseTo(12 - CONE_RADIUS, 5));
        // The other rays still measure the walls.
        episode.rays.forEach((r, i) => {
            if (i !== front && i !== front + 1) {
                expect(r).toBe(walls[i]);
            }
        });
    });

    it('are not seen behind a nearer wall', () => {
        const episode = new CarsEpisode(constantBrain(0, 'hold'), 1, true);
        episode.cones = [];
        episode.reset();
        const left = RAY_ANGLES.findIndex((a) => a === -Math.PI / 2);
        const wall = episode.rays[left];

        const angle = episode.heading - Math.PI / 2;
        episode.cones = [
            {
                x: episode.position.x + Math.cos(angle) * (wall + 5),
                y: episode.position.y + Math.sin(angle) * (wall + 5),
            },
        ];
        episode.reset();

        expect(episode.rays[left]).toBe(wall);
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
        const episode = play(new CarsEpisode(constantBrain(0, 'hold'), 1));

        expect(episode.crashed).toBe(false);
        expect(episode.score).toBe(0);
        expect(episode.steps).toBe(100);
    });

    it('accelerates, holds its speed or brakes, and keeps braking into reverse down to the reverse limit', () => {
        const speedAfterOneStep = (action: ThrottleAction, speed: number) => {
            const episode = new CarsEpisode(constantBrain(0, action), 1);
            episode.speed = speed;
            episode.step();
            return episode.speed;
        };

        expect(speedAfterOneStep('accelerate', 2)).toBeGreaterThan(2);
        expect(speedAfterOneStep('hold', 2)).toBe(2);
        expect(speedAfterOneStep('brake', 2)).toBeLessThan(2);
        expect(speedAfterOneStep('brake', 0.1)).toBeCloseTo(-0.3);
        expect(speedAfterOneStep('brake', -MAX_REVERSE_SPEED)).toBe(-MAX_REVERSE_SPEED);
        expect(speedAfterOneStep('accelerate', -1)).toBeGreaterThan(-1);
    });

    it('drives backwards at a negative speed and senses it', () => {
        const episode = new CarsEpisode(constantBrain(0, 'hold'), 1);
        const start = { ...episode.position };
        episode.speed = -1;
        episode.step();

        const moved =
            (episode.position.x - start.x) * Math.cos(episode.heading) +
            (episode.position.y - start.y) * Math.sin(episode.heading);
        expect(moved).toBeCloseTo(-1);
    });

    it('steers like a car: not at all when stopped, the other way round when reversing', () => {
        const turn = (speed: number) => {
            const episode = new CarsEpisode(constantBrain(1, 'hold'), 1);
            const heading = episode.heading;
            episode.speed = speed;
            episode.step();
            return episode.heading - heading;
        };

        expect(turn(0)).toBe(0);
        expect(turn(1)).toBeGreaterThan(0);
        expect(turn(-1)).toBeCloseTo(-turn(1));
        // Turning grows with speed up to the grip speed, then fades: brake before tight bends.
        expect(turn(2)).toBeGreaterThan(turn(1));
        expect(turn(5)).toBeLessThan(turn(2));
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

    it('describes its behaviour in [0, 1]^2, reversing included', () => {
        [constantBrain(0.5, 'accelerate'), constantBrain(0.5, 'brake')].forEach((brain) => {
            const episode = play(new CarsEpisode(brain, 2));

            episode.behavior().forEach((b) => {
                expect(b).toBeGreaterThanOrEqual(0);
                expect(b).toBeLessThanOrEqual(1);
            });
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
