import PlayerType from '../rule/PlayerType';
import BoardSize from '../rule/BoardSize';
import DirectionCardinal from '../rule/DirectionCardinal';
import { PopulationState } from '../ai/Population';
import { GameState } from '../rule/Game';

interface State {
    playerType: PlayerType;
    population?: PopulationState;
    game?: GameState;
    direction: DirectionCardinal;
    boardSize: BoardSize;
}

export default State;
