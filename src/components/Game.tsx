import * as React from "react"
import Board from "./Board"
import ScoreDisplayer from "./ScoreDisplayer";
import GameAction from "../store/actions";
import {connect} from "react-redux";
import {Dispatch} from "react";

class Game extends React.Component<{ changeDirection: (direction: GameAction) => void }> {
    componentDidMount() {
        document.addEventListener('keypress', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                    this.props.changeDirection(GameAction.up)
                    break
                case 'KeyA':
                    this.props.changeDirection(GameAction.left)
                    break
                case 'KeyS':
                    this.props.changeDirection(GameAction.down)
                    break
                case 'KeyD':
                    this.props.changeDirection(GameAction.right)
                    break
                case 'KeyE':
                    this.props.changeDirection(GameAction.nextFrame)
                    break
            }
        });
    }

    render() {
        return <>
            <Board/>
            <ScoreDisplayer/>
        </>
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    changeDirection: (direction: GameAction) => dispatch({type: direction})
})

export default connect(null, mapDispatchToProps)(Game);