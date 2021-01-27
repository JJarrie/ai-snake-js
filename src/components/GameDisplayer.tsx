import * as React from "react"
import {GameState} from "../rule/Game";
import Board from "./Board";

interface GameDisplayerProps {
    game: GameState
}

const GameDisplayer = ({game}: GameDisplayerProps) => (
    <Board grid={game.grid}/>
)

export default GameDisplayer