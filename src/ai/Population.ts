import BoardSize from "../rule/BoardSize";
import IntelligentSnake from "./IntelligentSnake";
import SnakeRule from "../rule/SnakeRule";
import Grid from "../rule/Grid";

class Population {
    mutationRate: number
    snakes: IntelligentSnake[]
    bestSnake: IntelligentSnake
    snakeRule: SnakeRule

    bestScore: number = 0
    generation: number = 0
    bestFitness: number = 0
    fitnessSum: number = 0

    constructor(size: number, mutationRate: number, boardSize: BoardSize) {
        this.snakeRule = new SnakeRule(boardSize)
        this.snakes = new Array<IntelligentSnake>(size)
        for (let i = 0; i < this.snakes.length; ++i) {
            this.snakes[i] = new IntelligentSnake(boardSize)
        }
        this.bestSnake = this.snakes[0]
    }

    public done(): boolean {
        for (const snake of this.snakes) {
            if (this.snakeRule.isAlive(snake)) {
                return false
            }

            if (this.snakeRule.isAlive(this.bestSnake)) {
                return false
            }
        }

        return true
    }

    public update(grid: Grid): void {
        this.updateSingle(this.bestSnake)
        this.snakes.forEach(this.updateSingle)
    }

    public electBestSnake(): void {
        let max: number = 0
        let bestSnake: IntelligentSnake

        for (const snake of this.snakes) {
            if (snake.fitness > max) {
                max = snake.fitness
                bestSnake = snake
            }
        }

        if (max > this.bestFitness) {
            this.bestFitness = max
            this.bestSnake = bestSnake
            this.bestScore = bestSnake.score
        }
    }

    public pickParent(): IntelligentSnake {
        const rand = Math.random() * this.fitnessSum
        let summation = 0

        for (const snake of this.snakes) {
            summation = summation + snake.fitness
            if (summation > rand) {
                return snake
            }
        }

        return this.snakes[0]
    }
    public naturalSelection(): void {
        const snakes = new Array<IntelligentSnake>(this.snakes.length)

        this.electBestSnake()
        this.calculateFitnessSum()

        snakes[0] = this.bestSnake.clone()

        for(let i = 0; i < this.snakes.length; ++i) {
            const child = this.pickParent().crossover(this.pickParent())
            child.mutate(this.mutationRate)
            snakes[i] = child
        }

        this.snakes = snakes
        this.generation = this.generation + 1
    }

    public calculateFitness(): void {
        this.snakes.forEach(snake => snake.calculateFitness())
    }

    private calculateFitnessSum(): void {
        this.fitnessSum = this.snakes.reduce((prev, cur) => prev + cur.fitness, 0)
    }

    private updateSingle(snake: IntelligentSnake): void {
        if (this.snakeRule.isAlive(snake)) {
            snake.look()
            snake.makeDecision()
        }
    }
}

export default Population