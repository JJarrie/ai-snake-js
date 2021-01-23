import * as React from "react"
import State from "../store/State";
import {connect} from "react-redux";
import Position from "../rule/Position";

interface GameStateProps {
    head: Position,
    food: Position
}

const GameState = ({head, food}: GameStateProps) => (
    <div>
        <p>{`Head : { x: ${head.x}, y: ${head.y} }`}</p>
        <p>{`Food : { x: ${food.x}, y: ${food.y} }`}</p>
    </div>
)
const mapStateToProps = (state: State): GameStateProps => ({
    food: state.food,
    head: state.snake.head
})

export default connect(mapStateToProps)(GameState)