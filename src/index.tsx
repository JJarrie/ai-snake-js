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
const boardSize = new BoardSize(25, 25)


const store = createStore(rootReducer, generateInitialState(playerType, boardSize))
const game = new Game(boardSize, playerType)
const population = new Population(2, 0.3, boardSize)
// mainLoop(PlayerType.HUMAN, {height: 5, width: 5})

/*
const aiLoop = () => {
    const population = store.getState().population
    if (population.done()) {
        population.calculateFitness()
        population.naturalSelection()
    } else {
        population.update()
        store.dispatch({type: GameAction.nextFrame})
    }
}
*/
setInterval(() => {
    switch (store.getState().playerType) {
        case PlayerType.HUMAN:
            game.snake.direction = store.getState().direction
            if (!game.finish()) {
                game.nextMove()
                store.dispatch({
                    type: GameAction.nextFrame,
                    games: [game.toState()]
                })
            }
            break
        case PlayerType.AI:
            if (!population.done()) {
                population.update()
                store.dispatch({
                    type: GameAction.nextFrame,
                    games: population.games.map(g => g.toState())
                })
            }
            break
    }
}, 100)

ReactDOM.render(
    <Provider store={store}>
        <Screen/>
    </Provider>,
    document.getElementById('app')
)