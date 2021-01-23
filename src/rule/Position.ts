import BoardSize from "./BoardSize";

class Position {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    static createRandom(boardSize: BoardSize): Position {
        return new Position(
            Math.floor(Math.random() * boardSize.width),
            Math.floor(Math.random() * boardSize.height)
        )
    }
}

export default Position