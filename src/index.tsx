import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SocketIO from 'socket.io-client';
import Screen from './components/Screen';
import BoardSize from './rule/BoardSize';
import GameAction from './store/actions';
import { generateInitialState } from './store/initialState';
import rootReducer from './store/reducers';
import type { StrategyState } from './store/State';
import './style/app.scss';

const socket = SocketIO(process.env.SOCKET_URL as string);
const store = createStore(rootReducer, generateInitialState(new BoardSize(20, 20)));

socket.on('update populations', (arg: { populations: StrategyState[] }) => {
    store.dispatch({
        type: GameAction.updatePopulations,
        populations: arg.populations,
    });
});

createRoot(document.getElementById('app') as HTMLElement).render(
    <Provider store={store}>
        <Screen onToggle={(name) => socket.emit('toggle strategy', name)} />
    </Provider>,
);
