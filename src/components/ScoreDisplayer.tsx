import * as React from "react"
import State from "../store/State";
import {connect} from "react-redux";

interface ScoreDisplayerProps {
    score: number
}

const ScoreDisplayer = ({score}: ScoreDisplayerProps) => (
    <p>Score: {score}</p>
)

const mapStateToProps = (state: State): ScoreDisplayerProps => ({
    score: state.score
})

export default connect(mapStateToProps)(ScoreDisplayer)