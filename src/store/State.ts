import PlayerType from "../rule/PlayerType";
import BoardSize from "../rule/BoardSize";
import Direction from "../rule/Direction";
import {GameState} from "../rule/Game";

interface State {
    playerType: PlayerType,
    games: GameState[],
    direction: Direction,
    boardSize: BoardSize
}

export default State