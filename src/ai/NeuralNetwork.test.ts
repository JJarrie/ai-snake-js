import { describe, expect, it } from 'vitest';
import Matrix from '../utils/Matrix';
import NeuralNetwork from './NeuralNetwork';

const inputs = [1, 0, 0.5, 0.2];

const matrixOf = (rows: number[][]): Matrix => {
    const m = new Matrix(rows.length, rows[0].length);
    m.matrix = rows;
    return m;
};

describe('NeuralNetwork output', () => {
    it('computes ReLU hidden layers and a linear output, bias last', () => {
        const network = new NeuralNetwork(2, [2], 1, [
            matrixOf([
                [1, -1, 0.5],
                [2, 0, -1],
            ]),
            matrixOf([[3, -2, 0.25]]),
        ]);

        // Hidden: relu(1 - 2 + 0.5) = 0, relu(2 - 1) = 1. Output: -2 + 0.25.
        expect(network.output([1, 2])).toEqual([-1.75]);
    });

    it('feeds the tanh memory layer back with the next input', () => {
        const network = new NeuralNetwork(1, [1], 1, [matrixOf([[1, 0.5, 0]]), matrixOf([[2, 1]])], true);

        const first = Math.tanh(1);
        expect(network.output([1])[0]).toBeCloseTo(2 * first + 1);
        expect(network.output([1])[0]).toBeCloseTo(2 * Math.tanh(1 + 0.5 * first) + 1);
        expect(network.state).toEqual([Math.tanh(1 + 0.5 * first)]);
    });

    it('throws when the input size does not match the first layer', () => {
        expect(() => new NeuralNetwork(3, [2], 1).output([1, 2])).toThrow();
    });
});

describe('NeuralNetwork', () => {
    it('without memory, answers the same input the same way', () => {
        const network = new NeuralNetwork(4, [6], 2);

        expect(network.output(inputs)).toEqual(network.output(inputs));
        expect(network.weights[0].cols).toBe(4 + 1);
    });
});

describe('recurrent NeuralNetwork', () => {
    it('feeds its first hidden layer back as extra inputs', () => {
        const network = new NeuralNetwork(4, [6], 2, undefined, true);

        expect(network.recurrent).toBe(true);
        expect(network.weights[0].cols).toBe(4 + 6 + 1);
        expect(network.toVector()).toHaveLength(6 * 11 + 2 * 7);
    });

    it('starts with small memory weights, so the sensors drive the first decisions', () => {
        const network = new NeuralNetwork(4, [6], 2, undefined, true);

        network.weights[0].matrix.forEach((row) => {
            row.slice(4, 10).forEach((w) => expect(Math.abs(w)).toBeLessThanOrEqual(0.1));
        });
    });

    it('keeps its memory bounded over long episodes', () => {
        for (let n = 0; n < 10; ++n) {
            const network = new NeuralNetwork(24, [16], 3, undefined, true);
            const input = [...Array(24)].map(() => Math.random());
            for (let t = 0; t < 200; ++t) {
                network.output(input);
            }
            network.state.forEach((s) => expect(Math.abs(s)).toBeLessThanOrEqual(1));
        }
    });

    it('remembers past inputs until its state is reset', () => {
        // Retry a few random networks: one whose hidden layer stays at zero has no memory to show.
        const network = [...Array(20)]
            .map(() => new NeuralNetwork(4, [6], 2, undefined, true))
            .find((n) => {
                const first = n.output(inputs);
                return n.output(inputs).some((v, i) => v !== first[i]);
            }) as NeuralNetwork;
        network.resetState();

        const first = network.output(inputs);
        const second = network.output(inputs);
        expect(second).not.toEqual(first);

        network.resetState();
        expect(network.output(inputs)).toEqual(first);
    });

    it('keeps its memory shape through clone, vector round-trip and crossover, with a fresh state', () => {
        const network = new NeuralNetwork(4, [6], 2, undefined, true);
        network.output(inputs);

        const copies = [network.clone(), network.fromVector(network.toVector()), network.crossover(network.clone())];
        network.resetState();
        const expected = network.output(inputs);

        copies.forEach((copy) => {
            expect(copy.recurrent).toBe(true);
            expect(copy.output(inputs)).toEqual(expected);
        });
    });
});
