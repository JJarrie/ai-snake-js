import BoardSize from '../rule/BoardSize';
import { PopulationState } from '../ai/Population';

interface State {
    population?: PopulationState;
    boardSize: BoardSize;
}

export default State;
