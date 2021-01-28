import State from "./State"
import BoardSize from "../rule/BoardSize"
import PlayerType from "../rule/PlayerType"
import Direction from "../rule/Direction"

export const generateInitialState = (playerType: PlayerType, boardSize: BoardSize): State => {
    return {
        playerType,
        direction: Direction.NORTH,
        boardSize
    }
}
