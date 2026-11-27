import { describe, expect, it } from 'vitest';
import { requiresReset, validateSettings, type Settings } from './settings';

const valid: Settings = {
    populationSize: 300,
    mutationRate: 0.05,
    boardSize: 20,
    hiddenNeurons: 16,
    replayMovesPerSecond: 15,
    game: 'snake',
    obstacles: false,
    recurrent: false,
    vision: 'rays',
    visionRange: 10,
    visionFov: 180,
    visionSectors: 7,
    raceLaps: 1,
};

describe('validateSettings', () => {
    it('accepts settings within their limits and drops unknown keys', () => {
        expect(validateSettings({ ...valid, extra: 'ignored' })).toEqual(valid);
    });

    it.each<[string, unknown]>([
        ['not an object', 'populationSize=300'],
        ['null', null],
        ['a missing key', { ...valid, boardSize: undefined }],
        ['a string number', { ...valid, boardSize: '20' }],
        ['NaN', { ...valid, mutationRate: NaN }],
        ['below the minimum', { ...valid, populationSize: 9 }],
        ['above the maximum', { ...valid, hiddenNeurons: 65 }],
        ['a fraction for an integer setting', { ...valid, boardSize: 20.5 }],
        ['an unknown game', { ...valid, game: 'chess' }],
        ['a missing game', { ...valid, game: undefined }],
        ['obstacles that are not a boolean', { ...valid, obstacles: 'yes' }],
        ['missing obstacles', { ...valid, obstacles: undefined }],
        ['recurrent that is not a boolean', { ...valid, recurrent: 1 }],
        ['an unknown vision model', { ...valid, vision: 'xray' }],
        ['too many sectors', { ...valid, visionSectors: 16 }],
    ])('rejects %s', (_, input) => {
        expect(() => validateSettings(input)).toThrow();
    });
});

describe('requiresReset', () => {
    it('is false when only the replay speed changes', () => {
        expect(requiresReset(valid, { ...valid, replayMovesPerSecond: 30 })).toBe(false);
        expect(requiresReset(valid, { ...valid, hiddenNeurons: 8 })).toBe(true);
        expect(requiresReset(valid, { ...valid, game: 'cars' })).toBe(true);
        expect(requiresReset(valid, { ...valid, obstacles: true })).toBe(true);
        expect(requiresReset(valid, { ...valid, recurrent: true })).toBe(true);
        expect(requiresReset(valid, { ...valid, vision: 'cone' })).toBe(true);
        expect(requiresReset(valid, { ...valid, visionRange: 12 })).toBe(true);
    });
});
