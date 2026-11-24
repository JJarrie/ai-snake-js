import { Reducer } from 'redux';
import State from './State';
import GameAction from './actions';

const reducer: Reducer<State> = (state, action): State => {
    switch (action.type) {
        case GameAction.updatePopulation:
            return { ...state, population: action.population };
        default:
            return { ...state };
    }
};
export default reducer;
