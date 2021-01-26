import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style/app.scss";
import {createStore} from "redux";
import {Provider} from "react-redux";
import Game from "./components/Game";
import {generateInitialState} from "./store/initialState";
import rootReducer from "./store/reducers";
import GameAction from "./store/actions";
import PlayerType from "./rule/PlayerType";

const store = createStore(rootReducer, generateInitialState(PlayerType.HUMAN, {height: 25, width: 25}))


const humanLoop = () => {
    if (store.getState().alive) {
        store.dispatch({type: GameAction.nextFrame})
    }
}

const aiLoop = () => {
    const population = store.getState().population
    if (population.done()) {
        store.dispatch({type: GameAction.highscore, highscore: population.bestSnake.score})
        population.calculateFitness()
        population.naturalSelection()
    } else {
        population.update(store.getState().grid)
        store.dispatch({type: GameAction.nextFrame})
    }
}

setInterval(() => {
    switch (store.getState().playerType) {
        case PlayerType.HUMAN:
            humanLoop()
            break
        case PlayerType.AI:
            aiLoop()
            break
    }
}, 100)

ReactDOM.render(
    <Provider store={store}>
        <Game/>
    </Provider>,
    document.getElementById('app')
)