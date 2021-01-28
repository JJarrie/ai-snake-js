import PlayerType from "../rule/PlayerType"
import BoardSize from "../rule/BoardSize"
import Direction from "../rule/Direction"
import {PopulationState} from "../ai/Population"
import {GameState} from "../rule/Game";

interface State {
    playerType: PlayerType,
    population?: PopulationState,
    game?: GameState,
    direction: Direction,
    boardSize: BoardSize
}

export default State
