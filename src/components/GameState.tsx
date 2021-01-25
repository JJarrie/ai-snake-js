import * as React from "react"
import State from "../store/State";
import {connect} from "react-redux";
import Position from "../rule/Position";
import SnakeVision from "../ai/SnakeVision";

interface GameStateProps {
    head: Position,
    food: Position,
    vision: SnakeVision
}

const GameState = ({head, food}: GameStateProps) => (
    <div>
        <p>{`Head : { x: ${head.x}, y: ${head.y} }`}</p>
        <p>{`Food : { x: ${food.x}, y: ${food.y} }`}</p>
    </div>
)
const mapStateToProps = (state: State): GameStateProps => ({
    food: state.food,
    head: state.snake.head,
    vision: state.vision
})

export default connect(mapStateToProps)(GameState)