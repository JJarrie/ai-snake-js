import BoardSize from './BoardSize';
import Vector2D from '../utils/Vector2D';

class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public isEqual(position: Position): boolean {
        return this.x === position.x && this.y === position.y;
    }

    public clone(): Position {
        return new Position(this.x, this.y);
    }

    public addVector(vector: Vector2D): Position {
        return new Position(this.x + vector.x, this.y + vector.y);
    }

    static createRandom(boardSize: BoardSize, random: () => number = Math.random): Position {
        return new Position(Math.floor(random() * boardSize.width), Math.floor(random() * boardSize.height));
    }
}

export default Position;
