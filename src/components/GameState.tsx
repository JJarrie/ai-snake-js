import * as React from "react"
import State from "../store/State";
import {connect} from "react-redux";
import Position from "../rule/Position";

interface GameStateProps {
    head: Position,
    food: Position
}

class GameState extends React.Component<GameStateProps> {
    public render() {
        return (
            <div>
                <p>{GameState.renderPosition('Head', this.props.head)}</p>
                <p>{GameState.renderPosition('Food', this.props.food)}</p>
            </div>
        )
    }

    private static renderPosition(label: string, position: Position): string {
        return `${label}: { x: ${position.x}, y: ${position.y} }`
    }
}

const mapStateToProps = (state: State): GameStateProps => ({
    food: state.food,
    head: state.snake.head
})

export default connect(mapStateToProps)(GameState)