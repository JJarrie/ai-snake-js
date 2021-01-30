import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import SocketIO from 'socket.io-client';
import { PopulationState } from './ai/Population';
import Screen from './components/Screen';
import BoardSize from './rule/BoardSize';
import PlayerType from './rule/PlayerType';
import GameAction from './store/actions';
import { generateInitialState } from './store/initialState';
import rootReducer from './store/reducers';
import './style/app.scss';

const socket = SocketIO('http://localhost:3000');
const store = createStore(rootReducer, generateInitialState(PlayerType.AI, new BoardSize(20, 20)));

socket.on('update population', (arg: { population: PopulationState }) => {
    store.dispatch({
        type: GameAction.updatePopulation,
        population: arg.population,
    });
});

ReactDOM.render(
    <Provider store={store}>
        <Screen />
    </Provider>,
    document.getElementById('app'),
);
