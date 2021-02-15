import BoardSize from './BoardSize';
import DirectionCardinal from './DirectionCardinal';
import Vector2D from '../utils/Vector2D';

class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public distanceFrom(position: Position): number {
        return Math.abs(Math.sqrt(Math.pow(position.x - this.x, 2) + Math.pow(position.y - this.y, 2)));
    }

    public directionTo(position: Position): DirectionCardinal {
        let direction: DirectionCardinal = 0;

        if (this.x > position.x) {
            direction = direction | DirectionCardinal.WEST;
        }

        if (this.x < position.x) {
            direction = direction | DirectionCardinal.EAST;
        }

        if (this.y > position.y) {
            direction = direction | DirectionCardinal.NORTH;
        }

        if (this.y < position.y) {
            direction = direction | DirectionCardinal.SOUTH;
        }

        return direction;
    }

    public isEqual(position: Position): boolean {
        return this.x === position.x && this.y === position.y;
    }

    public clone(): Position {
        return new Position(this.x, this.y);
    }

    public toString(): string {
        return `{ x: ${this.x}, y: ${this.y} }`;
    }

    public addVector(vector: Vector2D): Position {
        return new Position(this.x + vector.x, this.y + vector.y);
    }

    static createRandom(boardSize: BoardSize): Position {
        return new Position(Math.floor(Math.random() * boardSize.width), Math.floor(Math.random() * boardSize.height));
    }
}

export default Position;
