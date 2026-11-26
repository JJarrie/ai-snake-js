import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SocketIO from 'socket.io-client';
import type { Commands } from './components/commands';
import Screen from './components/Screen';
import type { CommandResult, SimulationState } from './sim/Simulation';
import GameAction from './store/actions';
import { generateInitialState } from './store/initialState';
import rootReducer from './store/reducers';
import './style/app.scss';

const socket = SocketIO(process.env.SOCKET_URL as string);
const store = createStore(rootReducer, generateInitialState());

socket.on('update simulation', (simulation: SimulationState) => {
    store.dispatch({ type: GameAction.updateSimulation, simulation });
});

/** Sends a command and resolves with the server's error message, or undefined on success. */
const send = async (event: string, payload: unknown): Promise<string | undefined> => {
    try {
        const result = (await socket.timeout(5000).emitWithAck(event, payload)) as CommandResult;
        return result.error;
    } catch {
        return 'The server did not answer';
    }
};

const commands: Commands = {
    control: (action) => send('control', action),
    configure: (settings) => send('configure', settings),
    toggle: (name) => socket.emit('toggle strategy', name),
};

createRoot(document.getElementById('app') as HTMLElement).render(
    <Provider store={store}>
        <Screen commands={commands} />
    </Provider>,
);
