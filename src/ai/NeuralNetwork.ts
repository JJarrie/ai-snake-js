import Matrix from '../utils/Matrix';
import type { Random } from '../utils/SeededRandom';

/** Initial scale of the memory (state to first layer) weights, relative to the others. */
const RECURRENT_INIT_SCALE = 0.1;

class Activation {
    public static relu(x: number): number {
        return Math.max(0, x);
    }
}

/**
 * A feed-forward network, optionally recurrent (Elman): the first hidden layer's previous output is fed
 * back as extra inputs, so the network remembers past observations. Memory, not more knowledge of the world.
 */
class NeuralNetwork {
    inputsNodes: number;
    outputsNodes: number;
    hiddenLayers: number[];
    weights: Matrix[];
    recurrent: boolean;
    /** Previous output of the first hidden layer; only used when recurrent. */
    state: number[] = [];

    constructor(
        inputsNodes: number,
        hiddenLayers: number[],
        outputsNodes: number,
        weights?: Matrix[],
        recurrent = false,
        // shortcut: Math.random for networks built outside a population (tests, defaults); populations pass a seeded one.
        random: Random = Math.random,
    ) {
        this.inputsNodes = inputsNodes;
        this.outputsNodes = outputsNodes;
        this.hiddenLayers = hiddenLayers;
        this.recurrent = recurrent;
        this.resetState();

        if (weights) {
            this.weights = weights;
            return;
        }

        const memory = recurrent ? this.hiddenLayers[0] : 0;
        this.weights = new Array<Matrix>();
        this.weights.push(new Matrix(this.hiddenLayers[0], this.inputsNodes + memory + 1));

        for (let i = 1; i < this.hiddenLayers.length; ++i) {
            this.weights.push(new Matrix(this.hiddenLayers[i], this.hiddenLayers[i - 1] + 1));
        }

        this.weights.push(new Matrix(this.outputsNodes, this.hiddenLayers[this.hiddenLayers.length - 1] + 1));

        for (const matrix of this.weights) {
            matrix.randomize(random);
        }

        if (recurrent) {
            // Small initial memory weights: at full scale the looped-back state drowns the sensor inputs.
            const first = this.weights[0];
            first.matrix = first.matrix.map((row) =>
                row.map((w, col) =>
                    col >= this.inputsNodes && col < this.inputsNodes + memory ? w * RECURRENT_INIT_SCALE : w,
                ),
            );
        }
    }

    /** Forgets past observations: call it at the start of every episode. */
    public resetState(): void {
        this.state = this.recurrent ? new Array<number>(this.hiddenLayers[0]).fill(0) : [];
    }

    public mutate(mutationRate: number, random: Random): void {
        this.weights.forEach((w) => w.mutate(mutationRate, random));
    }

    /** Plain loops over the weight rows: called every step by every agent, so it allocates one array per layer. */
    public output(inputArr: number[]): number[] {
        let values = this.recurrent ? [...inputArr, ...this.state] : inputArr;

        for (let i = 0; i < this.weights.length; ++i) {
            const memoryLayer = i === 0 && this.recurrent;
            const hidden = i < this.hiddenLayers.length;
            if (values.length !== this.weights[i].cols - 1) {
                throw new Error(`Layer ${i} expects ${this.weights[i].cols - 1} inputs, got ${values.length}`);
            }
            values = this.weights[i].matrix.map((row) => {
                // The last column is the bias weight.
                let sum = row[row.length - 1];
                for (let k = 0; k < values.length; ++k) {
                    sum = sum + row[k] * values[k];
                }
                // The looped-back layer needs a bounded activation: with ReLU its state grows without limit
                // (measured: 1e6 to 1e14 after 40 steps with random weights) and saturates every decision.
                if (memoryLayer) {
                    return Math.tanh(sum);
                }
                return hidden ? Activation.relu(sum) : sum;
            });
            if (memoryLayer) {
                this.state = values;
            }
        }

        return values;
    }

    public crossover(partner: NeuralNetwork, random: Random): NeuralNetwork {
        return this.withWeights(this.weights.map((w, i) => w.crossover(partner.weights[i], random)));
    }

    /** All weights flattened, for strategies that work on a parameter vector. */
    public toVector(): number[] {
        return this.weights.flatMap((w) => w.matrix.flat());
    }

    /** Same shape as this network, with weights read from `vector` (as produced by toVector). */
    public fromVector(vector: number[]): NeuralNetwork {
        let offset = 0;
        const weights = this.weights.map((w) => {
            const m = new Matrix(w.rows, w.cols);
            m.matrix = m.matrix.map((row) => row.map(() => vector[offset++]));
            return m;
        });

        return this.withWeights(weights);
    }

    public clone(): NeuralNetwork {
        return this.withWeights(this.weights.map((w) => w.clone()));
    }

    /** Same shape and memory setting, given weights, fresh state. */
    private withWeights(weights: Matrix[]): NeuralNetwork {
        return new NeuralNetwork(this.inputsNodes, this.hiddenLayers, this.outputsNodes, weights, this.recurrent);
    }
}

export default NeuralNetwork;
