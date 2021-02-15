import State from './State';
import BoardSize from '../rule/BoardSize';
import PlayerType from '../rule/PlayerType';
import DirectionCardinal from '../rule/DirectionCardinal';

export const generateInitialState = (playerType: PlayerType, boardSize: BoardSize): State => {
    return {
        playerType,
        direction: DirectionCardinal.NORTH,
        boardSize,
    };
};
