import type NeuralNetwork from '../ai/NeuralNetwork';
import type { CarsView } from './cars/CarsEpisode';
import type { SnakeView } from './snake/SnakeEpisode';

export type GameId = 'snake' | 'cars';

/** What the UI needs to draw one episode; `kind` tells which game renderer to use. */
export type EpisodeView = SnakeView | CarsView;

export interface EpisodeState {
    score: number;
    finished: boolean;
    view: EpisodeView;
}

/**
 * One game played by one network. The evolution strategies only see networks, fitness and
 * behaviour, so any game implementing this works with every strategy unchanged.
 */
export interface Episode {
    readonly brain: NeuralNetwork;
    readonly seed: number;
    readonly score: number;
    finished(): boolean;
    /** The network decides, then the world moves one step. No-op once finished. */
    step(): void;
    fitness(): number;
    /** Behaviour descriptor in [0, 1]^2, for quality-diversity strategies. */
    behavior(): number[];
    /** Back to the start of the same game (same seed): replays it exactly. */
    reset(): void;
    toState(): EpisodeState;
}

export interface GameDefinition {
    readonly id: GameId;
    readonly name: string;
    readonly inputs: number;
    readonly outputs: number;
    /** Episodes created with the same seed face the same world (food sequence, track...). */
    createEpisode(brain: NeuralNetwork, seed: number): Episode;
}
