import type { Reducer } from 'redux';
import type { PopulationState } from '../ai/Population';
import type State from './State';
import GameAction from './actions';

export interface UpdatePopulationAction {
    type: GameAction.updatePopulation;
    population: PopulationState;
}

const reducer: Reducer<State, UpdatePopulationAction> = (initialOrCurrent, action): State => {
    // createStore always receives a preloaded state, so it is never undefined here.
    const state = initialOrCurrent as State;

    switch (action.type) {
        case GameAction.updatePopulation:
            return { ...state, population: action.population };
        default:
            return { ...state };
    }
};
export default reducer;
