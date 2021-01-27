import * as React from "react"

interface ScoreDisplayerProps {
    score: number
}

const ScoreDisplayer = ({score}: ScoreDisplayerProps) => (
    <h1>Score: {score}</h1>
)

export default ScoreDisplayer