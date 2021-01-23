import * as React from "react"
import Board from "./Board"
import ScoreDisplayer from "./ScoreDisplayer";
import GameAction from "../store/actions";
import {connect} from "react-redux";
import {Dispatch} from "react";
import GameState from "./GameState";

interface GameProps {
    changeDirection: (direction: GameAction) => void,
    newGame: () => void,
    pause: () => void
}

class Game extends React.Component<GameProps> {
    componentDidMount() {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.props.changeDirection(GameAction.up)
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.props.changeDirection(GameAction.left)
                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.props.changeDirection(GameAction.down)
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.props.changeDirection(GameAction.right)
                    break
            }
        });
    }

    render() {
        return <div className={'container'}>
            <div>
                <ScoreDisplayer/>
                <Board/>
                <button onClick={this.props.newGame}>New game</button>
                <button onClick={this.props.pause}>Pause</button>
            </div>
            <GameState />
        </div>
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    changeDirection: (direction: GameAction) => dispatch({type: direction}),
    newGame: () => dispatch({type: GameAction.newGame}),
    pause: () => dispatch({type: GameAction.pause})
})

export default connect(null, mapDispatchToProps)(Game);