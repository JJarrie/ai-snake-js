import BoardSize from '../rule/BoardSize';
import { turnLeft90, turnRight90 } from '../rule/Direction';
import DirectionCardinal from '../rule/DirectionCardinal';
import { SnakeState } from '../rule/Snake';
import EyedSnake, { SeenInDirection } from './EyedSnake';
import NeuralNetwork from './NeuralNetwork';

export interface IntelligentSnakeState extends SnakeState {
    fitness: number;
    lifetime: number;
    lifeleft: number;
    vision: SeenInDirection[];
    lastDecision: number[];
}

class IntelligentSnake extends EyedSnake {
    neuralNetwork: NeuralNetwork;
    lastDecision: number[];
    lifetime: number;
    lifeleft: number;
    fitness = 0;
    penalty = 0;

    constructor(boardSize: BoardSize) {
        super(boardSize);
        this.neuralNetwork = new NeuralNetwork(28, [16], 3);
        this.resetLife();
    }

    public resetLife(): void {
        this.lifetime = 0;
        this.lifeleft = 200;
        this.penalty = 0;
    }

    public addPenalty(): void {
        this.penalty = this.penalty + 0.5;
    }

    public addLife(): void {
        if (this.lifeleft < 500) {
            if (this.lifeleft > 400) {
                this.lifeleft = 500;
            } else {
                this.lifeleft = this.lifeleft + 100;
            }
        }
    }

    public makeDecision(): void {
        const inputs = this.getVisionAsArray();
        inputs.push(this.direction === DirectionCardinal.NORTH ? 1 : 0);
        inputs.push(this.direction === DirectionCardinal.EAST ? 1 : 0);
        inputs.push(this.direction === DirectionCardinal.SOUTH ? 1 : 0);
        inputs.push(this.direction === DirectionCardinal.WEST ? 1 : 0);
        this.lastDecision = this.neuralNetwork.output(inputs);

        let maxIndex = 0;
        let maxValue = 0;

        for (let i = 0; i < this.lastDecision.length; ++i) {
            if (this.lastDecision[i] > maxValue) {
                maxValue = this.lastDecision[i];
                maxIndex = i;
            }
        }

        switch (maxIndex) {
            case 0:
                break;
            case 1:
                this.direction = turnLeft90(this.direction);
                break;
            case 2:
                this.direction = turnRight90(this.direction);
                break;
            default:
                break;
        }
    }

    public nextPosition(): void {
        super.nextPosition();
        this.lifeleft = this.lifeleft - 1;
        this.lifetime = this.lifetime + 1;
    }

    public calculateFitness(score: number): void {
        this.fitness =
            this.lifetime +
            (Math.pow(2, score) + Math.pow(score, 2.1) * 500) -
            Math.pow(0.25 * this.lifetime, 1.3) * Math.pow(score, 1.2);
        this.fitness = Math.max(this.fitness, 0.1);
    }

    public clone(): IntelligentSnake {
        const clone = new IntelligentSnake(this.boardSize);
        clone.neuralNetwork = this.neuralNetwork.clone();

        return clone;
    }

    public crossover(parent: IntelligentSnake): IntelligentSnake {
        const child = new IntelligentSnake(this.boardSize);
        child.neuralNetwork = this.neuralNetwork.crossover(parent.neuralNetwork);

        return child;
    }

    public mutate(mutationRate: number): void {
        this.neuralNetwork.mutate(mutationRate);
    }

    public toState(): IntelligentSnakeState {
        const state = super.toState();

        return {
            ...state,
            fitness: this.fitness,
            lifeleft: this.lifeleft,
            lifetime: this.lifetime,
            vision: this.vision,
            lastDecision: this.lastDecision,
        };
    }

    public updateAlive(): void {
        super.updateAlive();
        this.alive = this.alive && this.lifeleft > 0;
    }
}

export default IntelligentSnake;
