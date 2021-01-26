import Direction from "../rule/Direction";
import EyedSnake from "./EyedSnake";
import NeuralNetwork from "./NeuralNetwork";

class IntelligentSnake extends EyedSnake {
    neuralNetwork: NeuralNetwork
    fitness: number = 0
    lifetime: number = 0

    public makeDecision(): Direction {
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
                return Direction.NORTH;
            case 1:
                return Direction.EAST;
            case 2:
                return Direction.SOUTH;
            case 3:
                return Direction.WEST;
        }
    }

    public calculateFitness(): void {
        const lifetimeFitness = Math.floor(Math.pow(this.lifetime, 2))
        this.fitness = (this.score < 10)
            ? lifetimeFitness * Math.pow(2, this.score)
            : lifetimeFitness * Math.pow(2, 10) * (this.score - 9)
    }

    public clone(): IntelligentSnake {
        const snake = new IntelligentSnake(this.boardSize)
        snake.neuralNetwork = this.neuralNetwork

        return snake
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