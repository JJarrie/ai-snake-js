import { describe, expect, it } from 'vitest';
import { coneInputs, lookCone, type ConeWorld } from './ConeVision';

const config = { range: 10, fov: 180, sectors: 7 };
const CENTER = 3;
/** Head at (10, 10) on a 20 x 20 board, heading north. */
const world = (overrides: Partial<ConeWorld> = {}): ConeWorld => ({
    width: 20,
    height: 20,
    head: { x: 10, y: 10 },
    heading: { dx: 0, dy: -1 },
    food: { x: 0, y: 19 },
    body: [],
    obstacleKeys: new Set(),
    ...overrides,
});
const key = (x: number, y: number) => y * 20 + x;

describe('lookCone', () => {
    it('sees food in the sector it falls in, within range and in front only', () => {
        expect(lookCone(world({ food: { x: 10, y: 5 } }), config)[CENTER].food).toBe(5);

        // Straight right is the rightmost sector; straight behind is out of a 180 degree view.
        expect(lookCone(world({ food: { x: 12, y: 10 } }), config)[6].food).toBe(2);
        expect(lookCone(world({ food: { x: 10, y: 14 } }), config).every((s) => s.food === null)).toBe(true);
        // 11 cells ahead: beyond a range of 10.
        expect(lookCone(world({ head: { x: 10, y: 15 }, food: { x: 10, y: 4 } }), config)[CENTER].food).toBe(null);
    });

    it('turns with the heading', () => {
        // Heading east: food east is straight ahead, food north is on the left edge.
        const east = { heading: { dx: 1, dy: 0 } };
        expect(lookCone(world({ ...east, food: { x: 15, y: 10 } }), config)[CENTER].food).toBe(5);
        expect(lookCone(world({ ...east, food: { x: 10, y: 7 } }), config)[0].food).toBe(3);
    });

    it('cannot see through a wall or through its own body', () => {
        const behindWall = lookCone(world({ food: { x: 10, y: 5 }, obstacleKeys: new Set([key(10, 7)]) }), config);
        expect(behindWall[CENTER]).toMatchObject({ food: null, wall: 3 });

        const behindBody = lookCone(world({ food: { x: 10, y: 5 }, body: [{ x: 10, y: 8 }] }), config);
        expect(behindBody[CENTER]).toMatchObject({ food: null, body: 2 });
    });

    it('sees the board edge only within range, as far as the first cell outside', () => {
        expect(lookCone(world(), config)[CENTER].wall).toBe(null);
        expect(lookCone(world({ head: { x: 10, y: 1 } }), config)[CENTER].wall).toBeCloseTo(2);
        expect(lookCone(world(), { ...config, range: 15 })[CENTER].wall).toBeCloseTo(11);
    });
});

describe('coneInputs', () => {
    it('gives 3 inputs per sector, 1/distance or 0 when nothing is seen', () => {
        const sight = lookCone(world({ food: { x: 10, y: 5 } }), config);
        const inputs = coneInputs(sight);

        expect(inputs).toHaveLength(21);
        expect(inputs.slice(CENTER * 3, CENTER * 3 + 3)).toEqual([1 / 5, 0, 0]);
    });
});
