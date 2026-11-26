import { seededRandom } from '../../utils/SeededRandom';

export interface Point {
    x: number;
    y: number;
}

/** A closed loop driven counterclockwise, with walls on both sides of its centre line. */
export interface Track {
    center: Point[];
    /** Wall on the left of the driving direction (inside of the loop). */
    left: Point[];
    right: Point[];
    halfWidth: number;
}

export const TRACK_SEGMENTS = 120;
const RADIUS = 100;
const HALF_WIDTH = 7;
/**
 * Wave number and maximum relative amplitude of the bends. The centre line is a radius function of the
 * angle, so it never crosses itself; the amplitudes keep bend radii well above HALF_WIDTH.
 */
const WAVES = [
    { k: 2, amplitude: 0.25 },
    { k: 3, amplitude: 0.2 },
    { k: 5, amplitude: 0.12 },
    { k: 7, amplitude: 0.06 },
];

/** Same seed, same track: a circle deformed by a few seeded waves. */
export const createTrack = (seed: number): Track => {
    const random = seededRandom(seed);
    const waves = WAVES.map(({ k, amplitude }) => ({
        k,
        amplitude: random() * amplitude,
        phase: random() * 2 * Math.PI,
    }));

    const center = [...Array(TRACK_SEGMENTS)].map((_, i) => {
        const angle = (2 * Math.PI * i) / TRACK_SEGMENTS;
        const radius = RADIUS * (1 + waves.reduce((s, w) => s + w.amplitude * Math.sin(w.k * angle + w.phase), 0));

        return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    });

    const offset = (side: 1 | -1) =>
        center.map((c, i) => {
            const previous = center[(i - 1 + TRACK_SEGMENTS) % TRACK_SEGMENTS];
            const next = center[(i + 1) % TRACK_SEGMENTS];
            const length = Math.hypot(next.x - previous.x, next.y - previous.y);
            // Left normal of the driving direction.
            const nx = -(next.y - previous.y) / length;
            const ny = (next.x - previous.x) / length;

            return { x: c.x + side * nx * HALF_WIDTH, y: c.y + side * ny * HALF_WIDTH };
        });

    return { center, left: offset(1), right: offset(-1), halfWidth: HALF_WIDTH };
};

/** Distance from `p` to segment [a, b], and where its projection falls on it (0 at a, 1 at b). */
export const projectOnSegment = (p: Point, a: Point, b: Point): { distance: number; t: number } => {
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const t = Math.min(1, Math.max(0, ((p.x - a.x) * ex + (p.y - a.y) * ey) / (ex * ex + ey * ey)));

    return { distance: Math.hypot(p.x - (a.x + t * ex), p.y - (a.y + t * ey)), t };
};

/** Distance along the ray (origin, unit direction) to segment [a, b], or Infinity if it misses. */
export const rayHit = (origin: Point, dx: number, dy: number, a: Point, b: Point): number => {
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) < 1e-12) {
        return Infinity;
    }
    const wx = a.x - origin.x;
    const wy = a.y - origin.y;
    const distance = (wx * ey - wy * ex) / denominator;
    const along = (wx * dy - wy * dx) / denominator;

    return distance >= 0 && along >= 0 && along <= 1 ? distance : Infinity;
};
