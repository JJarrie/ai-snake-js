import type { Reducer } from 'redux';
import type { PopulationState } from '../ai/Population';
import type State from './State';
import GameAction from './actions';

export interface UpdatePopulationAction {
    type: GameAction.updatePopulation;
    population: PopulationState;
}

const reducer: Reducer<State, UpdatePopulationAction> = (state, action): State => {
    switch (action.type) {
        case GameAction.updatePopulation:
            return { ...state, population: action.population };
        default:
            return { ...state };
    }
};
export default reducer;
