import Gaussian from "../utils/Gaussian";
import Matrix from "../utils/Matrix";

class NeuralNetwork {
    inputsNodes: number
    hiddensNodes: number
    outputsNodes: number
    hiddenLayers: number
    weights: Matrix[]

    constructor(inputsNodes: number, hiddensNodes: number, outputsNodes: number, hiddenLayers: number) {
        this.inputsNodes = inputsNodes
        this.hiddensNodes = hiddensNodes
        this.outputsNodes = outputsNodes
        this.hiddenLayers = hiddenLayers

        this.weights = new Array<Matrix>(this.hiddenLayers + 1)
        this.weights[0] = new Matrix(this.hiddensNodes, this.inputsNodes + 1)

        for (let i: number = 1; i < this.hiddenLayers; ++i) {
            this.weights[i] = new Matrix(this.hiddensNodes, this.hiddensNodes + 1)
        }

        this.weights[this.weights.length - 1] = new Matrix(this.outputsNodes, this.hiddensNodes + 1)

        for (const matrix of this.weights) {
            matrix.randomize()
        }
    }

    public mutate(mutationRate: number): void {
        this.weights.forEach(w => w.mutate(mutationRate))
    }

    public output(inputArr: number[]): number[] {
        const inputs = this.weights[0].singleColumnMatrixFromArray(inputArr)
        let currentBias = inputs.addBias()

        for (let i = 0; i < this.hiddenLayers; ++i) {
            const hiddenInput = this.weights[i].dot(currentBias)
            const hiddenOutput = hiddenInput.activate()
            currentBias = hiddenOutput.addBias()
        }

        const outputInput = this.weights[this.weights.length - 1].dot(currentBias)

        return outputInput.activate().toArray()
    }

    public crossover(partner: NeuralNetwork): NeuralNetwork {
        const child = new NeuralNetwork(this.inputsNodes, this.hiddensNodes, this.outputsNodes, this.hiddenLayers)

        for (let i = 0; i < this.weights.length; ++i) {
            child.weights[i] = this.weights[i].crossover(partner.weights[i])
        }

        return child
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