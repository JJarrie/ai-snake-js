import Matrix from '../utils/Matrix';

class Activation {
    public static sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    public static relu(x: number): number {
        return Math.max(0, x);
    }
}

class NeuralNetwork {
    inputsNodes: number;
    outputsNodes: number;
    hiddenLayers: number[];
    weights: Matrix[];

    constructor(inputsNodes: number, hiddenLayers: number[], outputsNodes: number, weights?: Matrix[]) {
        this.inputsNodes = inputsNodes;
        this.outputsNodes = outputsNodes;
        this.hiddenLayers = hiddenLayers;

        if (weights) {
            this.weights = weights;
            return;
        }

        this.weights = new Array<Matrix>();
        this.weights.push(new Matrix(this.hiddenLayers[0], this.inputsNodes + 1));

        for (let i = 1; i < this.hiddenLayers.length; ++i) {
            this.weights.push(new Matrix(this.hiddenLayers[i], this.hiddenLayers[i - 1] + 1));
        }

        this.weights.push(new Matrix(this.outputsNodes, this.hiddenLayers[this.hiddenLayers.length - 1] + 1));

        for (const matrix of this.weights) {
            matrix.randomize();
        }
    }

    public mutate(mutationRate: number): void {
        this.weights.forEach((w) => w.mutate(mutationRate));
    }

    public output(inputArr: number[]): number[] {
        const inputs = this.weights[0].singleColumnMatrixFromArray(inputArr);
        let currentBias = inputs.addBias();

        for (let i = 0; i < this.hiddenLayers.length; ++i) {
            const hiddenInput = this.weights[i].dot(currentBias);
            const hiddenOutput = hiddenInput.activate(Activation.relu);
            currentBias = hiddenOutput.addBias();
        }

        const outputInput = this.weights[this.weights.length - 1].dot(currentBias);

        return outputInput.toArray();
    }

    public crossover(partner: NeuralNetwork): NeuralNetwork {
        return new NeuralNetwork(
            this.inputsNodes,
            this.hiddenLayers,
            this.outputsNodes,
            this.weights.map((w, i) => w.crossover(partner.weights[i])),
        );
    }

    public clone(): NeuralNetwork {
        return new NeuralNetwork(
            this.inputsNodes,
            this.hiddenLayers,
            this.outputsNodes,
            this.weights.map((w) => w.clone()),
        );
    }
}

export default NeuralNetwork;
