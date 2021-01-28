import * as React from "react"
import State from "../store/State";
import GameAction from "../store/actions";
import {Dispatch} from "react";
import {connect} from "react-redux";
import GameDisplayer from "./GameDisplayer";
import {GameState} from "../rule/Game";

interface ScreenProps {
    changeDirection: (direction: GameAction) => void,
    games: GameState[]
}

class Screen extends React.Component<ScreenProps> {
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

    public render() {
        return (
            <div className={'container'}>
                {this.props.games.map((g, i) => (
                        <GameDisplayer game={g} key={`games_${i}`}/>
                    )
                )}
            </div>
        )
    }
}

const mapStateToProps = (state: State) => ({
    games: state.games
})

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    changeDirection: (direction: GameAction) => dispatch({type: direction})
})

export default connect(mapStateToProps, mapDispatchToProps)(Screen);