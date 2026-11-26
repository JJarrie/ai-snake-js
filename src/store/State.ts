import BoardSize from '../rule/BoardSize';
import type { PopulationState } from '../ai/Population';

export interface StrategyState extends PopulationState {
    paused: boolean;
}

interface State {
    populations?: StrategyState[];
    boardSize: BoardSize;
}

export default State;
