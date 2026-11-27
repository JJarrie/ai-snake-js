import type NeuralNetwork from '../../ai/NeuralNetwork';
import type { Episode, EpisodeState, GameDefinition } from '../Episode';
import { CONE_RADIUS, createTrack, projectOnSegment, rayHit, TRACK_SEGMENTS, type Point, type Track } from './track';

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
    /** Fastest completed lap, in steps; null before the first lap. */
    bestLap: number | null;
}

/** What the driver can do with the pedals, one per step. */
export const THROTTLE_ACTIONS = ['accelerate', 'brake', 'hold'] as const;
export type ThrottleAction = (typeof THROTTLE_ACTIONS)[number];

/** Sensor directions relative to the heading. */
export const RAY_ANGLES = [-90, -60, -30, 0, 30, 60, 90].map((deg) => (deg * Math.PI) / 180);
export const RAY_RANGE = 50;
/** Each sensor sees cones within this angle of its ray: half the spacing, so the sectors tile -105° to 105°. */
const SECTOR_HALF_ANGLE = (15 * Math.PI) / 180;
const MAX_SPEED = 5;
/** Braking while stopped backs the car up, down to this speed (a negative speed is driving backwards). */
export const MAX_REVERSE_SPEED = 1.5;
const ACCELERATION = 0.2;
/** Air drag while accelerating; holding keeps the speed as it is. */
const DRAG = 0.02;
const BRAKING = 0.4;
/**
 * Fitness bonus for a lap driven at full speed all the way; a lap taking twice as long earns half.
 * About the distance part of one lap ((1 + 120)^2), so lap time matters as much as distance.
 */
const LAP_BONUS = 15000;
const TURN_RATE = 0.12;
/**
 * Like a car, it turns only while moving: more and more up to this speed, then less and less (it must
 * brake before tight bends). Backwards, the same wheel turns the other way.
 */
const GRIP_SPEED = 2;

/** Heading change per step for full steering at `speed`: TURN_RATE at the grip speed, 0 when stopped. */
const turnFactor = (speed: number): number =>
    Math.abs(speed) <= GRIP_SPEED ? speed / GRIP_SPEED : (Math.sign(speed) * GRIP_SPEED) / Math.abs(speed);
export const MAX_STEPS = 1000;
/** Steps allowed without reaching further along the track before the episode ends. */
const STALL_STEPS = 100;
/** Track segments per checkpoint: 40 checkpoints per lap. */
const SEGMENTS_PER_CHECKPOINT = 3;
/** Wall segments around the car checked by the sensors, on each side; covers RAY_RANGE. */
const WALL_WINDOW = 15;
/** Radius of the car for cone collisions. */
const CAR_RADIUS = 2;

/** Tracks kept: the generation's track, the record replays, the races and their qualifying tracks. */
const CACHED_TRACKS = 16;
const tracks = new Map<number, Track>();
/**
 * Every episode of a generation shares a seed, so the track is built once per generation. A new seed
 * comes every generation: the oldest is dropped (episodes keep their own reference to their track).
 */
export const trackFor = (seed: number): Track => {
    let track = tracks.get(seed);
    if (track === undefined) {
        track = createTrack(seed);
        tracks.set(seed, track);
        if (tracks.size > CACHED_TRACKS) {
            tracks.delete(tracks.keys().next().value as number);
        }
    }
    return track;
};

const wrap = (i: number) => ((i % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;

/**
 * A car driving laps on a seeded track. From wall-distance rays and its own speed, the network steers
 * and picks a pedal action (accelerate, brake or hold) that changes the speed; braking past zero reverses.
 */
class CarsEpisode implements Episode {
    readonly brain: NeuralNetwork;
    readonly seed: number;
    track: Track;
    /** Steps for a lap at full speed on this track: the reference for the lap bonus. */
    idealLapSteps: number;
    /** Steps taken by each completed lap, in order. */
    lapSteps: number[] = [];
    /** Step at which the current lap started. */
    lapStart = 0;

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

    /** Steps before the episode ends: one lap at most in training, more in a race. */
    maxSteps: number;

    constructor(brain: NeuralNetwork, seed: number, withObstacles = false, maxSteps = MAX_STEPS) {
        this.maxSteps = maxSteps;
        this.brain = brain;
        this.seed = seed;
        this.track = trackFor(seed);
        this.cones = withObstacles ? this.track.cones : [];
        const { center } = this.track;
        const lapLength = center.reduce((sum, c, i) => {
            const next = center[wrap(i + 1)];
            return sum + Math.hypot(next.x - c.x, next.y - c.y);
        }, 0);
        this.idealLapSteps = lapLength / MAX_SPEED;
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
        this.lapSteps = [];
        this.lapStart = 0;
        this.rays = this.sense();
    }

    public finished(): boolean {
        return this.crashed || this.stepsSinceBest >= STALL_STEPS || this.steps >= this.maxSteps;
    }

    public step(): void {
        if (this.finished()) {
            return;
        }

        const inputs = [...this.rays.map((r) => r / RAY_RANGE), this.speed / MAX_SPEED];
        const [steerOut, ...actionOuts] = this.brain.output(inputs);
        const steer = Math.tanh(steerOut);
        const action = THROTTLE_ACTIONS[actionOuts.indexOf(Math.max(...actionOuts))];

        this.speed = Math.min(MAX_SPEED, Math.max(-MAX_REVERSE_SPEED, this.nextSpeed(action)));
        this.heading = this.heading + steer * TURN_RATE * turnFactor(this.speed);
        this.position = {
            x: this.position.x + Math.cos(this.heading) * this.speed,
            y: this.position.y + Math.sin(this.heading) * this.speed,
        };

        this.steps = this.steps + 1;
        this.steerSum = this.steerSum + Math.abs(steer);
        // Forward speed only: the behaviour descriptor must stay in [0, 1] for MAP-Elites' grid.
        this.speedSum = this.speedSum + Math.max(0, this.speed) / MAX_SPEED;
        this.followTrack();
        this.rays = this.sense();
    }

    /**
     * Distance driven along the track (squared, to favour the furthest cars), plus a bonus per completed
     * lap that grows with its speed: LAP_BONUS for a lap at full speed, half for a lap twice as long.
     */
    public fitness(): number {
        const lapBonus = this.lapSteps.reduce((sum, steps) => sum + (LAP_BONUS * this.idealLapSteps) / steps, 0);
        return (1 + Math.max(0, this.bestProgress)) ** 2 + lapBonus;
    }

    /** Records the time of every lap newly completed, counted on the furthest point reached. */
    public recordLaps(): void {
        const laps = Math.floor(Math.max(0, this.bestProgress) / TRACK_SEGMENTS);
        while (this.lapSteps.length < laps) {
            this.lapSteps.push(this.steps - this.lapStart);
            this.lapStart = this.steps;
        }
    }

    private nextSpeed(action: ThrottleAction): number {
        switch (action) {
            case 'accelerate':
                return this.speed + ACCELERATION - this.speed * DRAG;
            case 'brake':
                return this.speed - BRAKING;
            case 'hold':
                return this.speed;
        }
    }

    /** Mean steering strength and mean forward speed, both in [0, 1]. */
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
                bestLap: this.lapSteps.length > 0 ? Math.min(...this.lapSteps) : null,
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
            this.recordLaps();
        } else {
            this.stepsSinceBest = this.stepsSinceBest + 1;
        }
    }

    /**
     * Per sensor, distance to the nearest wall along its ray, or to the nearest cone in its sector when
     * closer, capped at RAY_RANGE. Walls are continuous, so a thin ray always meets them; a cone is small
     * and would slip between two rays 30° apart until about 5 units away, one step at full speed.
     */
    private sense(): number[] {
        const { left, right } = this.track;

        return RAY_ANGLES.map((angle) => {
            const dx = Math.cos(this.heading + angle);
            const dy = Math.sin(this.heading + angle);
            let wall = RAY_RANGE;
            for (let offset = -WALL_WINDOW; offset <= WALL_WINDOW; ++offset) {
                const a = wrap(this.segment + offset);
                const b = wrap(a + 1);
                wall = Math.min(
                    wall,
                    rayHit(this.position, dx, dy, left[a], left[b]),
                    rayHit(this.position, dx, dy, right[a], right[b]),
                );
            }
            // shortcut: a cone behind the wall this ray meets counts as hidden, even when the wall is
            // nearer only along the ray; exact per-direction occlusion if cones show through bends.
            return this.cones.reduce((nearest, cone) => Math.min(nearest, this.coneInSector(cone, angle)), wall);
        });
    }

    /** Distance to the edge of `cone` if any part of it lies in the sector of the ray at `angle`, else Infinity. */
    private coneInSector(cone: Point, angle: number): number {
        const ox = cone.x - this.position.x;
        const oy = cone.y - this.position.y;
        const distance = Math.hypot(ox, oy);
        if (distance <= CONE_RADIUS) {
            return 0;
        }
        const off = Math.atan2(oy, ox) - (this.heading + angle);
        const gap = Math.abs(Math.atan2(Math.sin(off), Math.cos(off)));
        const halfWidth = Math.asin(CONE_RADIUS / distance);

        return gap - halfWidth <= SECTOR_HALF_ANGLE ? distance - CONE_RADIUS : Infinity;
    }
}

/**
 * In: 7 wall-distance rays (they also see the cones) + current speed (negative backwards). Out: steering, then one output per
 * pedal action, the highest one wins.
 */
export const createCarsGame = (withObstacles = false): GameDefinition => ({
    id: 'cars',
    name: 'Car racing',
    inputs: RAY_ANGLES.length + 1,
    outputs: 1 + THROTTLE_ACTIONS.length,
    createEpisode: (brain, seed) => new CarsEpisode(brain, seed, withObstacles),
});

export default CarsEpisode;
