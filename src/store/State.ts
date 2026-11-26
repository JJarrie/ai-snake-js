import type { SimulationState } from '../sim/Simulation';

interface State {
    /** Undefined until the server sends its first update. */
    simulation?: SimulationState;
}

export default State;
