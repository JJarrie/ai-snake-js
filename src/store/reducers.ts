import type { Reducer } from 'redux';
import type { SimulationState } from '../sim/Simulation';
import type State from './State';
import GameAction from './actions';

export interface UpdateSimulationAction {
    type: GameAction.updateSimulation;
    simulation: SimulationState;
}

const reducer: Reducer<State, UpdateSimulationAction> = (initialOrCurrent, action): State => {
    // createStore always receives a preloaded state, so it is never undefined here.
    const state = initialOrCurrent as State;

    switch (action.type) {
        case GameAction.updateSimulation:
            return { ...state, simulation: action.simulation };
        default:
            return { ...state };
    }
};
export default reducer;
