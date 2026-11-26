import Matrix from '../utils/Matrix';

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
            matrix.randomize();
        }
    }

    /** Forgets past observations: call it at the start of every episode. */
    public resetState(): void {
        this.state = this.recurrent ? new Array<number>(this.hiddenLayers[0]).fill(0) : [];
    }

    public mutate(mutationRate: number): void {
        this.weights.forEach((w) => w.mutate(mutationRate));
    }

    public output(inputArr: number[]): number[] {
        const inputs = this.weights[0].singleColumnMatrixFromArray([...inputArr, ...this.state]);
        let currentBias = inputs.addBias();

        for (let i = 0; i < this.hiddenLayers.length; ++i) {
            const hiddenInput = this.weights[i].dot(currentBias);
            const hiddenOutput = hiddenInput.activate((x) => Activation.relu(x));
            if (i === 0 && this.recurrent) {
                this.state = hiddenOutput.toArray();
            }
            currentBias = hiddenOutput.addBias();
        }

        const outputInput = this.weights[this.weights.length - 1].dot(currentBias);

        return outputInput.toArray();
    }

    public crossover(partner: NeuralNetwork): NeuralNetwork {
        return this.withWeights(this.weights.map((w, i) => w.crossover(partner.weights[i])));
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
