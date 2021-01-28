import * as React from "react"
import {GameState} from "../rule/Game";
import Board from "./Board";

interface GameDisplayerProps {
    game: GameState
}

const GameDisplayer = ({game}: GameDisplayerProps) => (
    <div>
        <h2>Score: {game.score}</h2>
        <Board grid={game.grid}/>
    </div>
)

export default GameDisplayer
