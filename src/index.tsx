import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style/app.scss";
import {createStore} from "redux";
import {Provider} from "react-redux";
import Game from "./components/Game";
import {generateInitialState} from "./store/initialState";
import rootReducer from "./store/reducers";
import GameAction from "./store/actions";

const store = createStore(rootReducer, generateInitialState({height: 25, width: 25}))

setInterval(() => {
    if (store.getState().alive) {
        store.dispatch({type: GameAction.nextFrame})
    }
}, 100)

ReactDOM.render(
    <Provider store={store}>
        <Game/>
    </Provider>,
    document.getElementById('app')
)