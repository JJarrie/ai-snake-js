import Direction from "../rule/Direction";
import EyedSnake from "./EyedSnake";
import NeuralNetwork from "./NeuralNetwork";
import BoardSize from "../rule/BoardSize";

class IntelligentSnake extends EyedSnake {
    neuralNetwork: NeuralNetwork
    fitness: number = 0
    lifetime: number = 100
    lifeleft: number = 50

    constructor(boardSize: BoardSize) {
        super(boardSize)
        this.neuralNetwork = new NeuralNetwork(24, 16, 4, 2)
    }


    public makeDecision(): void {
        const decision = this.neuralNetwork.output(this.vision.toArray())
        let maxIndex = 0
        let maxValue = 0

        for (let i = 0; i < decision.length; ++i) {
            if (decision[i] > maxValue) {
                maxValue = decision[i]
                maxIndex = i
            }
        }

        switch (maxIndex) {
            case 0:
                this.direction = Direction.NORTH;
                break;
            case 1:
                this.direction = Direction.EAST;
                break;
            case 2:
                this.direction = Direction.SOUTH;
                break;
            case 3:
                this.direction = Direction.WEST;
                break;
        }
    }

    public nextPosition() {
        super.nextPosition();
        this.lifeleft = this.lifeleft - 1
        this.lifetime = this.lifetime + 1
    }

    public calculateFitness(score: number): void {
        const lifetimeFitness = Math.floor(Math.pow(this.lifetime, 2))
        this.fitness = (score < 10)
            ? lifetimeFitness * Math.pow(2, score)
            : lifetimeFitness * Math.pow(2, 10) * (score - 9)
    }

    public clone(): IntelligentSnake {
        const clone = new IntelligentSnake(this.boardSize)
        clone.neuralNetwork = this.neuralNetwork.clone()

        return clone
    }

    public crossover(parent: IntelligentSnake): IntelligentSnake {
        const child = new IntelligentSnake(this.boardSize)
        child.neuralNetwork = this.neuralNetwork.crossover(parent.neuralNetwork)

        return child
    }

    public mutate(mutationRate: number) {
        this.neuralNetwork.mutate(mutationRate)
    }
}

export default IntelligentSnake