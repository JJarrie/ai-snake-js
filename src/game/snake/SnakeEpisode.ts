import { coneInputs, lookCone, type ConeConfig, type SectorSight } from '../../ai/ConeVision';
import type { VisionRay } from '../../ai/EyedSnake';
import IntelligentSnake from '../../ai/IntelligentSnake';
import type NeuralNetwork from '../../ai/NeuralNetwork';
import BoardSize from '../../rule/BoardSize';
import Game from '../../rule/Game';
import type { GridState } from '../../rule/Grid';
import type { Episode, EpisodeState, GameDefinition } from '../Episode';

/** How the snake sees: 8 unlimited lines of sight (the original), or a field of view in front of it. */
export type SnakeVisionConfig = { model: 'rays' } | ({ model: 'cone' } & ConeConfig);

export const RAYS: SnakeVisionConfig = { model: 'rays' };

export interface SnakeView {
    kind: 'snake';
    grid: GridState;
    /** Head cell the vision starts from; null once the snake is dead. */
    head: { x: number; y: number } | null;
    /** With the rays model: its 8 lines of sight from the current cell. */
    vision: VisionRay[];
    /** With the cone model: the field of view and what each sector sees from the current cell. */
    cone: (ConeConfig & { heading: { dx: number; dy: number }; sight: SectorSight[] }) | null;
}

/** The snake rules of src/rule and src/ai, behind the generic Episode interface. */
class SnakeEpisode implements Episode {
    game: Game;
    vision: SnakeVisionConfig;

    constructor(
        boardSize: BoardSize,
        brain: NeuralNetwork,
        seed: number,
        withObstacles = false,
        vision: SnakeVisionConfig = RAYS,
    ) {
        this.game = new Game(boardSize, new IntelligentSnake(boardSize, brain), seed, withObstacles);
        this.vision = vision;
        brain.resetState();
    }

    get brain(): NeuralNetwork {
        return this.game.snake.neuralNetwork;
    }

    get seed(): number {
        return this.game.seed;
    }

    get score(): number {
        return this.game.score;
    }

    public finished(): boolean {
        return this.game.finish();
    }

    public step(): void {
        if (this.finished()) {
            return;
        }
        if (this.vision.model === 'cone') {
            this.game.snake.makeDecision(coneInputs(this.lookCone(this.vision)));
        } else {
            this.game.snake.look(this.game.food, this.game.obstacleKeys);
            this.game.snake.makeDecision();
        }
        this.game.nextMove();
    }

    public fitness(): number {
        this.game.snake.calculateFitness(this.game.score);
        return this.game.snake.fitness;
    }

    public behavior(): number[] {
        return this.game.snake.behavior();
    }

    public reset(): void {
        this.game.reset();
        this.brain.resetState();
    }

    public toState(): EpisodeState {
        const state = this.game.toState();
        const { snake } = this.game;
        const alive = !state.finish;
        const view: SnakeView = {
            kind: 'snake',
            grid: state.grid,
            head: alive ? { x: snake.head.x, y: snake.head.y } : null,
            vision: [],
            cone: null,
        };

        // Seen from the current cell, the stored vision being taken before the move. step() looks
        // again before deciding, so this does not change the game.
        if (alive && this.vision.model === 'cone') {
            view.cone = { ...this.vision, heading: snake.headingVector(), sight: this.lookCone(this.vision) };
        } else if (alive) {
            snake.look(this.game.food, this.game.obstacleKeys);
            view.vision = snake.visionRays();
        }

        return { score: state.score, finished: state.finish, view };
    }

    private lookCone(config: ConeConfig): SectorSight[] {
        const { snake, boardSize, food, obstacleKeys } = this.game;

        return lookCone(
            {
                width: boardSize.width,
                height: boardSize.height,
                head: snake.head,
                heading: snake.headingVector(),
                food,
                body: snake.body,
                obstacleKeys,
            },
            config,
        );
    }
}

/**
 * Rays: 8 directions x (food, body, wall). Cone: sectors x (food, body, wall). Outputs: continue,
 * left, right. Obstacles are seen as walls.
 */
export const createSnakeGame = (
    boardSize: number,
    withObstacles = false,
    vision: SnakeVisionConfig = RAYS,
): GameDefinition => ({
    id: 'snake',
    name: 'Snake',
    inputs: vision.model === 'cone' ? vision.sectors * 3 : 24,
    outputs: 3,
    createEpisode: (brain, seed) =>
        new SnakeEpisode(new BoardSize(boardSize, boardSize), brain, seed, withObstacles, vision),
});

export default SnakeEpisode;
