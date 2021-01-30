import { Reducer } from 'redux';
import Direction from '../rule/Direction';
import State from './State';
import GameAction from './actions';
import { generateInitialState } from './initialState';

const getNewDirection = (
    currentDirection: Direction,
    newDirection: Direction,
    oppositeDirection: Direction,
): Direction => {
    return currentDirection === oppositeDirection ? currentDirection : newDirection;
};

const getNewDirectionState = (state: State, newDirection: Direction, opppositeDirection: Direction): State => ({
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
            return getNewDirectionState(state, Direction.NORTH, Direction.SOUTH);
        case GameAction.down:
            return getNewDirectionState(state, Direction.SOUTH, Direction.NORTH);
        case GameAction.left:
            return getNewDirectionState(state, Direction.WEST, Direction.EAST);
        case GameAction.right:
            return getNewDirectionState(state, Direction.EAST, Direction.WEST);
        default:
            return { ...state };
    }
};
export default reducer;
