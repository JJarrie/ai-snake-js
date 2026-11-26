import type NeuralNetwork from '../../ai/NeuralNetwork';
import type { Episode, EpisodeState, GameDefinition } from '../Episode';
import {
    CONE_RADIUS,
    createTrack,
    projectOnSegment,
    rayCircleHit,
    rayHit,
    TRACK_SEGMENTS,
    type Point,
    type Track,
} from './track';

export interface CarsView {
    kind: 'cars';
    /** The client rebuilds the track from its seed instead of receiving it every frame. */
    seed: number;
    car: { x: number; y: number; heading: number };
    /** Length of each sensor ray, in track units. */
    rays: number[];
    crashed: boolean;
    /** Whether the track's cones are in play (and drawn). */
    obstacles: boolean;
}

/** Sensor directions relative to the heading. */
export const RAY_ANGLES = [-90, -60, -30, 0, 30, 60, 90].map((deg) => (deg * Math.PI) / 180);
export const RAY_RANGE = 50;
const MAX_SPEED = 5;
const ACCELERATION = 0.2;
const DRAG = 0.02;
const TURN_RATE = 0.12;
/** Above this speed the car turns less and less: it must brake before tight bends. */
const GRIP_SPEED = 2;
const MAX_STEPS = 1000;
/** Steps allowed without reaching further along the track before the episode ends. */
const STALL_STEPS = 100;
/** Track segments per checkpoint: 40 checkpoints per lap. */
const SEGMENTS_PER_CHECKPOINT = 3;
/** Wall segments around the car checked by the sensors, on each side; covers RAY_RANGE. */
const WALL_WINDOW = 15;
/** Radius of the car for cone collisions. */
const CAR_RADIUS = 2;

const tracks = new Map<number, Track>();
/** Every episode of a generation shares a seed, so the track is built once per generation. */
const trackFor = (seed: number): Track => {
    let track = tracks.get(seed);
    if (track === undefined) {
        // shortcut: unbounded cache, one entry per seed seen; fine for a demo run, clear it if memory grows.
        track = createTrack(seed);
        tracks.set(seed, track);
    }
    return track;
};

const wrap = (i: number) => ((i % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;

/** A car driving laps on a seeded track; the network steers and accelerates from wall-distance rays. */
class CarsEpisode implements Episode {
    readonly brain: NeuralNetwork;
    readonly seed: number;
    track: Track;

    position: Point = { x: 0, y: 0 };
    heading = 0;
    speed = 0;
    /** Index of the centre-line segment the car is on. */
    segment = 0;
    /** Whole segments driven, signed: laps * TRACK_SEGMENTS + segment. */
    driven = 0;
    /** Signed distance driven along the track, in segments: driven + position on the current segment. */
    progress = 0;
    bestProgress = 0;
    stepsSinceBest = 0;
    steps = 0;
    crashed = false;
    rays: number[] = [];
    steerSum = 0;
    speedSum = 0;
    /** Cones in play: the track's cones with obstacles on, none otherwise. */
    cones: Point[];

    constructor(brain: NeuralNetwork, seed: number, withObstacles = false) {
        this.brain = brain;
        this.seed = seed;
        this.track = trackFor(seed);
        this.cones = withObstacles ? this.track.cones : [];
        this.reset();
    }

    get score(): number {
        return Math.floor(this.bestProgress / SEGMENTS_PER_CHECKPOINT);
    }

    public reset(): void {
        this.brain.resetState();
        const [start, next] = this.track.center;
        this.position = { ...start };
        this.heading = Math.atan2(next.y - start.y, next.x - start.x);
        this.speed = 0;
        this.segment = 0;
        this.driven = 0;
        this.progress = 0;
        this.bestProgress = 0;
        this.stepsSinceBest = 0;
        this.steps = 0;
        this.crashed = false;
        this.steerSum = 0;
        this.speedSum = 0;
        this.rays = this.sense();
    }

    public finished(): boolean {
        return this.crashed || this.stepsSinceBest >= STALL_STEPS || this.steps >= MAX_STEPS;
    }

    public step(): void {
        if (this.finished()) {
            return;
        }

        const inputs = [...this.rays.map((r) => r / RAY_RANGE), this.speed / MAX_SPEED];
        const [steerOut, throttleOut] = this.brain.output(inputs);
        const steer = Math.tanh(steerOut);
        const throttle = Math.tanh(throttleOut);

        this.speed = Math.min(MAX_SPEED, Math.max(0, this.speed + throttle * ACCELERATION - this.speed * DRAG));
        this.heading = this.heading + (steer * TURN_RATE * GRIP_SPEED) / Math.max(GRIP_SPEED, this.speed);
        this.position = {
            x: this.position.x + Math.cos(this.heading) * this.speed,
            y: this.position.y + Math.sin(this.heading) * this.speed,
        };

        this.steps = this.steps + 1;
        this.steerSum = this.steerSum + Math.abs(steer);
        this.speedSum = this.speedSum + this.speed / MAX_SPEED;
        this.followTrack();
        this.rays = this.sense();
    }

    /** Grows with the distance driven along the track; squared to favour the furthest cars. */
    public fitness(): number {
        return (1 + Math.max(0, this.bestProgress)) ** 2;
    }

    /** Mean steering strength and mean speed, both in [0, 1]. */
    public behavior(): number[] {
        return this.steps > 0 ? [this.steerSum / this.steps, this.speedSum / this.steps] : [0, 0];
    }

    public toState(): EpisodeState {
        return {
            score: this.score,
            finished: this.finished(),
            view: {
                kind: 'cars',
                seed: this.seed,
                car: { x: this.position.x, y: this.position.y, heading: this.heading },
                rays: this.rays,
                crashed: this.crashed,
                obstacles: this.cones.length > 0,
            },
        };
    }

    /** Finds the nearest centre-line segment around the previous one, updates progress, detects a crash. */
    private followTrack(): void {
        const { center, halfWidth } = this.track;
        let best = { index: this.segment, distance: Infinity, t: 0 };

        for (let offset = -3; offset <= 3; ++offset) {
            const index = wrap(this.segment + offset);
            const projection = projectOnSegment(this.position, center[index], center[wrap(index + 1)]);
            if (projection.distance < best.distance) {
                best = { index, ...projection };
            }
        }

        let delta = best.index - this.segment;
        if (delta > TRACK_SEGMENTS / 2) {
            delta = delta - TRACK_SEGMENTS;
        } else if (delta < -TRACK_SEGMENTS / 2) {
            delta = delta + TRACK_SEGMENTS;
        }
        this.segment = best.index;
        this.driven = this.driven + delta;
        this.progress = this.driven + best.t;
        this.crashed =
            best.distance > halfWidth ||
            this.cones.some(
                (cone) => Math.hypot(cone.x - this.position.x, cone.y - this.position.y) < CONE_RADIUS + CAR_RADIUS,
            );

        if (this.progress > this.bestProgress) {
            this.bestProgress = this.progress;
            this.stepsSinceBest = 0;
        } else {
            this.stepsSinceBest = this.stepsSinceBest + 1;
        }
    }

    /** Distance to the nearest wall or cone along each sensor ray, capped at RAY_RANGE. */
    private sense(): number[] {
        const { left, right } = this.track;

        return RAY_ANGLES.map((angle) => {
            const dx = Math.cos(this.heading + angle);
            const dy = Math.sin(this.heading + angle);
            let nearest = this.cones.reduce(
                (min, cone) => Math.min(min, rayCircleHit(this.position, dx, dy, cone, CONE_RADIUS)),
                RAY_RANGE,
            );
            for (let offset = -WALL_WINDOW; offset <= WALL_WINDOW; ++offset) {
                const a = wrap(this.segment + offset);
                const b = wrap(a + 1);
                nearest = Math.min(
                    nearest,
                    rayHit(this.position, dx, dy, left[a], left[b]),
                    rayHit(this.position, dx, dy, right[a], right[b]),
                );
            }
            return nearest;
        });
    }
}

/** 7 wall-distance rays + speed in; steering and throttle out. The rays also see the cones. */
export const createCarsGame = (withObstacles = false): GameDefinition => ({
    id: 'cars',
    name: 'Car racing',
    inputs: RAY_ANGLES.length + 1,
    outputs: 2,
    createEpisode: (brain, seed) => new CarsEpisode(brain, seed, withObstacles),
});

export default CarsEpisode;
