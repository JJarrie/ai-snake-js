import * as React from "react";
import * as ReactDOM from "react-dom";
import "./style/app.scss";
import {createStore} from "redux";
import {Provider} from "react-redux";
import {generateInitialState} from "./store/initialState";
import rootReducer from "./store/reducers";
import GameAction from "./store/actions";
import PlayerType from "./rule/PlayerType";
import Screen from "./components/Screen"
import BoardSize from "./rule/BoardSize";
import Game from "./rule/Game";
import Population from "./ai/Population";

const playerType = PlayerType.AI
const boardSize = new BoardSize(20, 20)


const store = createStore(rootReducer, generateInitialState(playerType, boardSize))
const game = new Game(boardSize, playerType)
const population = new Population(store, 2000, 0.05, boardSize)

setInterval(() => {
    switch (store.getState().playerType) {
        case PlayerType.HUMAN:
            game.snake.direction = store.getState().direction
            if (!game.finish()) {
                game.nextMove()
                store.dispatch({type: GameAction.nextFrame, game: game.toState()})
            }
            break
        case PlayerType.AI:
            if (!population.done()) {
                population.update()
                store.dispatch({type: GameAction.updatePopulation, population: population.toState()})
            } else {
                population.calculateFitness()
                population.naturalSelection()
            }
            break
    }
}, 4)

ReactDOM.render(
    <Provider store={store}>
        <Screen/>
    </Provider>,
    document.getElementById('app')
)
