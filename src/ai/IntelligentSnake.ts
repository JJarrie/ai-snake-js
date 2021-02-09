import { Simulate } from 'react-dom/test-utils';
import BoardSize from '../rule/BoardSize';
import Direction from '../rule/Direction';
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
        this.neuralNetwork = new NeuralNetwork(28, [16, 16], 4);
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
        inputs.push(this.direction === Direction.NORTH ? 1 : 0);
        inputs.push(this.direction === Direction.EAST ? 1 : 0);
        inputs.push(this.direction === Direction.SOUTH ? 1 : 0);
        inputs.push(this.direction === Direction.WEST ? 1 : 0);
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
                this.direction = this.direction === Direction.SOUTH ? Direction.SOUTH : Direction.NORTH;
                break;
            case 1:
                this.direction = this.direction === Direction.WEST ? Direction.WEST : Direction.EAST;
                break;
            case 2:
                this.direction = this.direction === Direction.NORTH ? Direction.NORTH : Direction.SOUTH;
                break;
            case 3:
                this.direction = this.direction === Direction.EAST ? Direction.EAST : Direction.WEST;
                break;
        }
    }

    public nextPosition(): void {
        super.nextPosition();
        this.lifeleft = this.lifeleft - 1;
        this.lifetime = this.lifetime + 1;
    }

    public calculateFitness(score: number): void {
        const lifetimeFitness = Math.floor(Math.pow(this.lifetime - this.penalty, 2));
        this.fitness =
            score < 10 ? lifetimeFitness * Math.pow(2, score) : lifetimeFitness * Math.pow(2, 10) * (score - 9);
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
