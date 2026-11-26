import type { Reducer } from 'redux';
import type State from './State';
import type { StrategyState } from './State';
import GameAction from './actions';

export interface UpdatePopulationsAction {
    type: GameAction.updatePopulations;
    populations: StrategyState[];
}

const reducer: Reducer<State, UpdatePopulationsAction> = (initialOrCurrent, action): State => {
    // createStore always receives a preloaded state, so it is never undefined here.
    const state = initialOrCurrent as State;

    switch (action.type) {
        case GameAction.updatePopulations:
            return { ...state, populations: action.populations };
        default:
            return { ...state };
    }
};
export default reducer;
