import Gaussian from "../utils/Gaussian";
import Matrix from "../utils/Matrix";

class NeuralNetwork {
    inputsNodes: number
    hiddensNodes: number
    outputsNodes: number
    hiddenLayers: number
    weights: Matrix<number>[]

    constructor(inputsNodes: number, hiddensNodes: number, outputsNodes: number, hiddenLayers: number) {
        this.inputsNodes = inputsNodes
        this.hiddensNodes = hiddensNodes
        this.outputsNodes = outputsNodes
        this.hiddenLayers = hiddenLayers

        this.weights = new Array<Matrix<number>>(this.hiddenLayers + 1)
        this.weights[0] = new Matrix<number>(this.hiddensNodes, this.inputsNodes + 1)

        for (let i: number = 1; i < this.hiddenLayers; ++i) {
            this.weights[i] = new Matrix<number>(this.hiddensNodes, this.hiddensNodes + 1)
        }

        this.weights[this.weights.length - 1] = new Matrix<number>(this.outputsNodes, this.hiddensNodes + 1)

        for (const matrix of this.weights) {
            matrix.fillWithCallback(() => (Math.round(Math.random()) * 2 - 1) * Math.random());
        }
    }

    public output(inputArr: number[]): number[] {
        const inputs = this.weights[0].singleColumnMatrixFromArray(inputArr)
        let currentBias = inputs.addBias(() => 1)
        const dotFunction = (curRes: number, a: number, b: number): number => curRes + a * b
        const activationFunction = (v: number) => Math.max(0, v)
        for (let i = 0; i < this.hiddenLayers; ++i) {
            const hiddenInput = this.weights[i].dot(currentBias, 0, dotFunction)
            const hiddenOutput = hiddenInput.activate(activationFunction)
            currentBias = hiddenOutput.addBias(() => 1)
        }

        const outputInput = this.weights[this.weights.length - 1].dot(currentBias, 0, dotFunction)

        return outputInput.activate(activationFunction).toArray()
    }

    public crossover(partner: NeuralNetwork): NeuralNetwork {
        const child = new NeuralNetwork(this.inputsNodes, this.hiddensNodes, this.outputsNodes, this.hiddenLayers)

        for (let i = 0; i < this.weights.length; ++i) {
            child.weights[i] = this.weights[i].crossover(partner.weights[i])
        }

        return child
    }

    public mutate(mutationRate: number): void {
        this.weights.forEach(w => w.mutate(mutationRate, (value: number) => value + Gaussian.random() / 5))
    }

    public clone(): NeuralNetwork {
        const clone = new NeuralNetwork(this.inputsNodes, this.hiddensNodes, this.outputsNodes, this.hiddenLayers)

        for (let i: number = 0; i < this.weights.length; ++i) {
            clone.weights[i] = this.weights[i].clone()
        }

        return clone
    }
}

export default NeuralNetwork