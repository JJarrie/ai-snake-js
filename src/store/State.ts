import BoardSize from '../rule/BoardSize';
import type { PopulationState } from '../ai/Population';

interface State {
    population?: PopulationState;
    boardSize: BoardSize;
}

export default State;
