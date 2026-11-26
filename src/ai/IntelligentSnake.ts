import BoardSize from '../rule/BoardSize';
import { turnLeft90, turnRight90 } from '../rule/Direction';
import type { SnakeState } from '../rule/Snake';
import EyedSnake, { type SeenInDirection } from './EyedSnake';
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
    /** How many times each decision (continue, left, right) was taken in this game. */
    decisions = [0, 0, 0];

    constructor(boardSize: BoardSize, neuralNetwork?: NeuralNetwork) {
        super(boardSize);
        this.neuralNetwork = neuralNetwork ?? new NeuralNetwork(24, [16], 3);
        this.resetLife();
    }

    public resetLife(): void {
        this.lifetime = 0;
        this.lifeleft = 200;
        this.decisions = [0, 0, 0];
    }

    /** Behaviour descriptor in [0, 1]^2: share of moves that turn, share of turns that go left. */
    public behavior(): number[] {
        const [straight, left, right] = this.decisions;
        const turns = left + right;
        const moves = straight + turns;

        return [moves > 0 ? turns / moves : 0, turns > 0 ? left / turns : 0.5];
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
        this.lastDecision = this.neuralNetwork.output(inputs);

        let maxIndex = 0;
        let maxValue = -Infinity;

        for (let i = 0; i < this.lastDecision.length; ++i) {
            if (this.lastDecision[i] > maxValue) {
                maxValue = this.lastDecision[i];
                maxIndex = i;
            }
        }
        this.decisions[maxIndex] = this.decisions[maxIndex] + 1;

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
        return new IntelligentSnake(this.boardSize, this.neuralNetwork.clone());
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
