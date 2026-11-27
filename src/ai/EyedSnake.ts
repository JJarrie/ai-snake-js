import Direction, { mapCardinalToCurrentDirection } from '../rule/Direction';
import DirectionCardinal from '../rule/DirectionCardinal';
import Position from '../rule/Position';
import Snake from '../rule/Snake';
import Vector2D from '../utils/Vector2D';

export interface SeenInDirection {
    food: number;
    body: number;
    wall: number;
}

/** One line of sight for display: board direction, and distances in cells (null when not seen). */
export interface VisionRay {
    dx: number;
    dy: number;
    wall: number;
    food: number | null;
    body: number | null;
}

/** The 8 directions, clockwise from the front. */
const RAY_ORDER = [
    Direction.FRONT,
    Direction.FRONT_RIGHT,
    Direction.RIGHT,
    Direction.BACK_RIGHT,
    Direction.BACK,
    Direction.BACK_LEFT,
    Direction.LEFT,
    Direction.FRONT_LEFT,
];

class EyedSnake extends Snake {
    vision: SeenInDirection[] = [];

    /** What the last look() saw, as rays on the board; empty before the first look. */
    public visionRays(): VisionRay[] {
        if (this.vision.length === 0) {
            return [];
        }

        return RAY_ORDER.map((relative) => {
            const vector = EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, relative));
            const seen = this.vision[relative];

            return {
                dx: vector.x,
                dy: vector.y,
                wall: Math.round(1 / seen.wall),
                food: seen.food > 0 ? Math.round(1 / seen.food) : null,
                body: seen.body > 0 ? Math.round(1 / seen.body) : null,
            };
        });
    }

    /** An obstacle stops the gaze like the board edge: it is seen as a wall. */
    public lookInDirection(
        directionVector: Vector2D,
        food: Position,
        bodyKeys: Set<number>,
        obstacleKeys: Set<number> = new Set(),
    ): SeenInDirection {
        let position = this.head.clone();
        let distance = 1;
        let foodSeen = false;
        let bodySeen = false;
        // Every value is 1 / distance (0 = not seen), so closer always means a bigger input.
        const seenInDirection = { food: 0, body: 0, wall: 0 };
        position = position.addVector(directionVector);

        while (!this.positionIsOutbound(position)) {
            if (obstacleKeys.has(position.y * this.boardSize.width + position.x)) {
                break;
            }

            if (!foodSeen && position.isEqual(food)) {
                foodSeen = true;
                seenInDirection.food = 1 / distance;
            }

            if (!bodySeen && bodyKeys.has(position.y * this.boardSize.width + position.x)) {
                bodySeen = true;
                seenInDirection.body = 1 / distance;
            }

            position = position.addVector(directionVector);
            distance = distance + 1;
        }

        seenInDirection.wall = 1 / distance;

        return seenInDirection;
    }

    /** `obstacleKeys`: cells as y * width + x. */
    public look(food: Position, obstacleKeys: Set<number> = new Set()): void {
        this.vision = [];
        const bodyKeys = new Set(this.body.map((p) => p.y * this.boardSize.width + p.x));
        this.vision[Direction.FRONT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.BACK] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.LEFT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.RIGHT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.FRONT_LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT_LEFT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.FRONT_RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT_RIGHT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.BACK_LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK_LEFT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
        this.vision[Direction.BACK_RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK_RIGHT)),
            food,
            bodyKeys,
            obstacleKeys,
        );
    }

    public getVisionAsArray(): number[] {
        return [
            this.vision[Direction.FRONT].food,
            this.vision[Direction.FRONT].body,
            this.vision[Direction.FRONT].wall,
            this.vision[Direction.BACK].food,
            this.vision[Direction.BACK].body,
            this.vision[Direction.BACK].wall,
            this.vision[Direction.LEFT].food,
            this.vision[Direction.LEFT].body,
            this.vision[Direction.LEFT].wall,
            this.vision[Direction.RIGHT].food,
            this.vision[Direction.RIGHT].body,
            this.vision[Direction.RIGHT].wall,
            this.vision[Direction.FRONT_LEFT].food,
            this.vision[Direction.FRONT_LEFT].body,
            this.vision[Direction.FRONT_LEFT].wall,
            this.vision[Direction.FRONT_RIGHT].food,
            this.vision[Direction.FRONT_RIGHT].body,
            this.vision[Direction.FRONT_RIGHT].wall,
            this.vision[Direction.BACK_LEFT].food,
            this.vision[Direction.BACK_LEFT].body,
            this.vision[Direction.BACK_LEFT].wall,
            this.vision[Direction.BACK_RIGHT].food,
            this.vision[Direction.BACK_RIGHT].body,
            this.vision[Direction.BACK_RIGHT].wall,
        ];
    }

    private static mapVectorToDirection(direction: DirectionCardinal): Vector2D {
        switch (direction) {
            case DirectionCardinal.NORTH:
                return new Vector2D(0, -1);
            case DirectionCardinal.NORTH_EAST:
                return new Vector2D(1, -1);
            case DirectionCardinal.EAST:
                return new Vector2D(1, 0);
            case DirectionCardinal.SOUTH_EAST:
                return new Vector2D(1, 1);
            case DirectionCardinal.SOUTH:
                return new Vector2D(0, 1);
            case DirectionCardinal.SOUTH_WEST:
                return new Vector2D(-1, 1);
            case DirectionCardinal.WEST:
                return new Vector2D(-1, 0);
            case DirectionCardinal.NORTH_WEST:
                return new Vector2D(-1, -1);
        }
    }

    private positionIsOutbound(position: Position): boolean {
        return (
            position.y < 0 ||
            position.y >= this.boardSize.height ||
            position.x < 0 ||
            position.x >= this.boardSize.width
        );
    }
}

export default EyedSnake;
