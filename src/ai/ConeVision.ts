/**
 * A field-of-view vision for the snake: a cone in front of the head, split into sectors. Each sector
 * reports the nearest food, own-body cell and wall it can see, within a range. Walls (board edge and
 * obstacles) and the snake's own body block the view: only local, occludable sensing.
 */

export interface ConeConfig {
    /** How far the snake sees, in cells. */
    range: number;
    /** Width of the field of view, in degrees, centred on the heading. */
    fov: number;
    sectors: number;
}

interface Cell {
    x: number;
    y: number;
}

export interface ConeWorld {
    width: number;
    height: number;
    head: Cell;
    /** Unit grid vector of the heading. */
    heading: { dx: number; dy: number };
    food: Cell;
    body: Cell[];
    /** Obstacle cells, as y * width + x. */
    obstacleKeys: Set<number>;
}

/** What one sector sees: distances in cells, null when nothing is seen within range. */
export interface SectorSight {
    food: number | null;
    body: number | null;
    wall: number | null;
}

/** Samples per cell when checking a line of sight. */
const SIGHT_SAMPLES = 4;

const degrees = (radians: number) => (radians * 180) / Math.PI;

export const lookCone = (world: ConeWorld, config: ConeConfig): SectorSight[] => {
    const { width, height, head, heading, food, body, obstacleKeys } = world;
    const { range, fov, sectors } = config;
    const sectorWidth = fov / sectors;
    // Right of the heading, in grid coordinates (y grows downwards).
    const right = { dx: -heading.dy, dy: heading.dx };
    const bodyKeys = new Set(body.map((c) => c.y * width + c.x));
    const sight: SectorSight[] = [...Array(sectors)].map(() => ({ food: null, body: null, wall: null }));

    /** Sector of a cell and its distance, or null when out of the cone or out of range. */
    const locate = (cell: Cell): { sector: number; distance: number } | null => {
        const rx = cell.x - head.x;
        const ry = cell.y - head.y;
        const distance = Math.hypot(rx, ry);
        if (distance === 0 || distance > range) {
            return null;
        }
        const forward = rx * heading.dx + ry * heading.dy;
        const lateral = rx * right.dx + ry * right.dy;
        const angle = degrees(Math.atan2(lateral, forward));
        if (angle < -fov / 2 || angle > fov / 2) {
            return null;
        }
        return { sector: Math.min(sectors - 1, Math.floor((angle + fov / 2) / sectorWidth)), distance };
    };

    /** True when a wall or a body cell lies strictly between the head and the target cell. */
    const blocked = (target: Cell, distance: number): boolean => {
        const steps = Math.ceil(distance * SIGHT_SAMPLES);
        for (let i = 1; i < steps; ++i) {
            const t = i / steps;
            const x = Math.floor(head.x + 0.5 + (target.x - head.x) * t);
            const y = Math.floor(head.y + 0.5 + (target.y - head.y) * t);
            if ((x === head.x && y === head.y) || (x === target.x && y === target.y)) {
                continue;
            }
            const cellKey = y * width + x;
            if (obstacleKeys.has(cellKey) || bodyKeys.has(cellKey)) {
                return true;
            }
        }
        return false;
    };

    /** Keeps the nearest visible cell of a kind per sector; checks sight only when it would be nearer. */
    const see = (cells: Cell[], kind: keyof SectorSight) => {
        cells.forEach((cell) => {
            const place = locate(cell);
            if (place === null) {
                return;
            }
            const current = sight[place.sector][kind];
            if ((current === null || place.distance < current) && !blocked(cell, place.distance)) {
                sight[place.sector][kind] = place.distance;
            }
        });
    };

    see([food], 'food');
    see(body, 'body');
    see(
        [...obstacleKeys].map((k) => ({ x: k % width, y: Math.floor(k / width) })),
        'wall',
    );

    // The board edge along each sector's centre line: distance to the first cell outside.
    sight.forEach((s, i) => {
        const angle = ((-fov / 2 + (i + 0.5) * sectorWidth) * Math.PI) / 180;
        const dx = heading.dx * Math.cos(angle) + right.dx * Math.sin(angle);
        const dy = heading.dy * Math.cos(angle) + right.dy * Math.sin(angle);
        const px = head.x + 0.5;
        const py = head.y + 0.5;
        const exits = [
            dx > 1e-9 ? (width - px) / dx : dx < -1e-9 ? -px / dx : Infinity,
            dy > 1e-9 ? (height - py) / dy : dy < -1e-9 ? -py / dy : Infinity,
        ];
        const edge = Math.min(...exits) + 0.5;
        if (edge <= range && (s.wall === null || edge < s.wall)) {
            s.wall = edge;
        }
    });

    return sight;
};

/** Network inputs: per sector food, body, wall as 1 / distance, 0 when not seen. */
export const coneInputs = (sight: SectorSight[]): number[] =>
    sight.flatMap((s) => [s.food, s.body, s.wall].map((d) => (d === null ? 0 : 1 / d)));
