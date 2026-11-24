import { describe, expect, it } from 'vitest';
import Matrix from './Matrix';

describe('Matrix.dot', () => {
    it('throws when dimensions do not match', () => {
        expect(() => new Matrix(2, 3).dot(new Matrix(2, 1))).toThrow();
    });
});
