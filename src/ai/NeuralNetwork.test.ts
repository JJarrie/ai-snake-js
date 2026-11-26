import { describe, expect, it } from 'vitest';
import NeuralNetwork from './NeuralNetwork';

const inputs = [1, 0, 0.5, 0.2];

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
