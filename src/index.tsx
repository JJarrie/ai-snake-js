import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SocketIO from 'socket.io-client';
import type { PopulationState } from './ai/Population';
import Screen from './components/Screen';
import BoardSize from './rule/BoardSize';
import GameAction from './store/actions';
import { generateInitialState } from './store/initialState';
import rootReducer from './store/reducers';
import './style/app.scss';

const socket = SocketIO(process.env.SOCKET_URL as string);
const store = createStore(rootReducer, generateInitialState(new BoardSize(20, 20)));

socket.on('update population', (arg: { population: PopulationState }) => {
    store.dispatch({
        type: GameAction.updatePopulation,
        population: arg.population,
    });
});

createRoot(document.getElementById('app') as HTMLElement).render(
    <Provider store={store}>
        <Screen />
    </Provider>,
);
