import Position from './Position';
import DirectionCardinal from './DirectionCardinal';
import BoardSize from './BoardSize';

export interface SnakeState {
    head: Position;
    body: Position[];
    direction: DirectionCardinal;
    alive: boolean;
}

class Snake {
    head: Position;
    body: Position[];
    direction: DirectionCardinal;
    boardSize: BoardSize;
    alive = true;

    constructor(boardSize: BoardSize) {
        this.boardSize = boardSize;
        this.reset();
    }

    /** Moves one cell ahead; when `grow` is true (it just ate), the tail stays where it is. */
    public nextPosition(grow = false): void {
        this.nextBodyPosition(grow);
        this.nextHeadPosition();
    }

    public reset(): void {
        this.head = new Position(Math.floor(this.boardSize.width / 2), Math.floor(this.boardSize.height / 2));
        this.direction = DirectionCardinal.NORTH;
        this.body = [];
        this.alive = true;
    }

    public isOutbound(): boolean {
        return (
            this.head.y < 0 ||
            this.head.y >= this.boardSize.height ||
            this.head.x < 0 ||
            this.head.x >= this.boardSize.width
        );
    }

    public isInHimself(): boolean {
        return this.body.some((bodyPosition) => bodyPosition.isEqual(this.head));
    }

    public updateAlive(): void {
        this.alive = !(this.isOutbound() || this.isInHimself());
    }

    public isEating(food: Position): boolean {
        return this.head.isEqual(food);
    }

    public toState(): SnakeState {
        return {
            direction: this.direction,
            head: this.head,
            body: this.body,
            alive: this.alive,
        };
    }

    private nextBodyPosition(grow: boolean): void {
        const body = [...this.body];
        if (!grow) {
            body.pop();
        }
        body.unshift(this.head);
        this.body = body;
    }

    private nextHeadPosition(): void {
        switch (this.direction) {
            case DirectionCardinal.EAST:
                this.head = new Position(this.head.x + 1, this.head.y);
                break;
            case DirectionCardinal.NORTH:
                this.head = new Position(this.head.x, this.head.y - 1);
                break;
            case DirectionCardinal.SOUTH:
                this.head = new Position(this.head.x, this.head.y + 1);
                break;
            case DirectionCardinal.WEST:
                this.head = new Position(this.head.x - 1, this.head.y);
                break;
        }
    }
}

export default Snake;
