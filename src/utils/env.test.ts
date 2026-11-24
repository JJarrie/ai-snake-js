import { afterEach, describe, expect, it } from 'vitest';
import { envNumber } from './env';

describe('envNumber', () => {
    afterEach(() => {
        delete process.env.TEST_VALUE;
    });

    it('returns the fallback when the variable is unset or empty', () => {
        expect(envNumber('TEST_VALUE', 0.05, 0, 1)).toBe(0.05);
        process.env.TEST_VALUE = '';
        expect(envNumber('TEST_VALUE', 0.05, 0, 1)).toBe(0.05);
    });

    it('parses a valid value', () => {
        process.env.TEST_VALUE = '0.2';
        expect(envNumber('TEST_VALUE', 0.05, 0, 1)).toBe(0.2);
    });

    it.each(['abc', '0,05', '2', '-1'])('rejects %s', (value) => {
        process.env.TEST_VALUE = value;
        expect(() => envNumber('TEST_VALUE', 0.05, 0, 1)).toThrow('TEST_VALUE');
    });
});
