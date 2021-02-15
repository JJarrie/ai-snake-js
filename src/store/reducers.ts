import { Reducer } from 'redux';
import DirectionCardinal from '../rule/DirectionCardinal';
import State from './State';
import GameAction from './actions';
import { generateInitialState } from './initialState';

const getNewDirection = (
    currentDirection: DirectionCardinal,
    newDirection: DirectionCardinal,
    oppositeDirection: DirectionCardinal,
): DirectionCardinal => {
    return currentDirection === oppositeDirection ? currentDirection : newDirection;
};

const getNewDirectionState = (state: State, newDirection: DirectionCardinal, opppositeDirection: DirectionCardinal): State => ({
    ...state,
    direction: getNewDirection(state.direction, newDirection, opppositeDirection),
});

const reducer: Reducer<State> = (state, action): State => {
    switch (action.type) {
        case GameAction.newGame:
            return generateInitialState(state.playerType, state.boardSize);
        case GameAction.nextFrame:
            return { ...state, game: action.game };
        case GameAction.updatePopulation:
            return { ...state, population: action.population };
        case GameAction.up:
            return getNewDirectionState(state, DirectionCardinal.NORTH, DirectionCardinal.SOUTH);
        case GameAction.down:
            return getNewDirectionState(state, DirectionCardinal.SOUTH, DirectionCardinal.NORTH);
        case GameAction.left:
            return getNewDirectionState(state, DirectionCardinal.WEST, DirectionCardinal.EAST);
        case GameAction.right:
            return getNewDirectionState(state, DirectionCardinal.EAST, DirectionCardinal.WEST);
        default:
            return { ...state };
    }
};
export default reducer;
