class NeuralNetwork {
    inputsNodes: number
    hiddensNodes: number
    outputsNodes: number
    hiddenLayers: number

    constructor(inputsNodes: number, hiddensNodes: number, outputsNodes: number, hiddenLayers: number) {
        this.inputsNodes = inputsNodes
        this.hiddensNodes = hiddensNodes
        this.outputsNodes = outputsNodes
        this.hiddenLayers = hiddenLayers
    }
}

export default NeuralNetwork